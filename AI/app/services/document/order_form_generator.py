from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from openpyxl import load_workbook
from openpyxl.worksheet.worksheet import Worksheet

from app.config.settings import settings
from app.schemas.ai_request import AiRequest
from app.services.actions.event_sink import publish_action_event


def create_order_form_from_suggestion(req: AiRequest) -> tuple[str, dict[str, Any]]:
    if req.get_slot("approved") is False:
        return "Order form generation skipped because admin approval is false.", {"approved": False}

    items = _collect_items(req)
    if not items:
        return "No approved items were provided for order form generation.", {"approved": True, "items": []}

    template_path = Path(settings.payment_order_template_path).resolve()
    if not template_path.exists():
        return f"Order template not found: {template_path}", {"approved": True, "items": items}

    output_path = _build_output_path(req)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    wb = load_workbook(template_path)
    try:
        ws = _select_sheet(wb.worksheets)
        _fill_header(ws, req)
        _fill_items(ws, items)
        wb.save(output_path)
    finally:
        wb.close()

    payload = {
        "approved": True,
        "building_id": _to_int(req.get_slot("building_id")),
        "month": str(req.get_slot("month") or req.get_slot("billing_month") or ""),
        "item_count": len(items),
        "order_form_path": str(output_path),
        "file_name": output_path.name,
    }
    event = publish_action_event("payment_order_form_created", {"user_id": req.user_id, **payload})
    payload["event_status"] = event
    return f"Order form generated: {output_path.name}", payload


def _build_output_path(req: AiRequest) -> Path:
    base = Path(settings.payment_order_output_dir)
    ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    user = _safe(req.user_id or "admin")
    building = _safe(str(req.get_slot("building_id") or "all"))
    name = f"purchase_order_{building}_{user}_{ts}_{uuid4().hex[:8]}.xlsx"
    return base / name


def _select_sheet(sheets: list[Worksheet]) -> Worksheet:
    if not sheets:
        raise ValueError("No worksheet in template")
    best = sheets[0]
    best_score = -1
    for ws in sheets:
        score = 0
        for row in ws.iter_rows(min_row=1, max_row=25, max_col=40, values_only=True):
            for value in row:
                text = str(value or "").replace(" ", "")
                if "발주서" in text:
                    score += 2
                if text in {"품명", "수량", "단가", "공급가액"}:
                    score += 1
        if score > best_score:
            best = ws
            best_score = score
    return best


def _fill_header(ws: Worksheet, req: AiRequest) -> None:
    today = str(req.get_slot("order_date") or datetime.now().date().isoformat())
    order_no = str(req.get_slot("order_no") or req.get_slot("payment_id") or uuid4().hex[:8].upper())
    buyer_name = str(req.get_slot("buyer_name") or "유니플레이스")
    buyer_tel = str(req.get_slot("buyer_tel") or req.get_slot("contact") or "")
    supplier_name = str(req.get_slot("supplier_name") or req.get_slot("affiliate_name") or "")
    supplier_tel = str(req.get_slot("supplier_contact") or req.get_slot("supplier_tel") or "")

    _put_after_label(ws, {"발 주 일", "발주일", "발주일자"}, today)
    _put_after_label(ws, {"NO.", "NO", "NO. "}, order_no)
    _put_after_label(ws, {"상 호 명", "상호명", "외주처"}, supplier_name)
    _put_after_label(ws, {"연 락 처", "연락처", "전화번호"}, supplier_tel or buyer_tel)
    _put_after_label(ws, {"발 주 자", "발주자"}, buyer_name)


def _fill_items(ws: Worksheet, items: list[dict[str, Any]]) -> None:
    header_row, cols = _find_item_header(ws)
    if header_row == 0:
        return

    row_idx = header_row + 1
    total_supply = 0
    total_tax = 0
    total_amount = 0
    for idx, item in enumerate(items, start=1):
        qty = _to_int(item.get("order_qty") or item.get("qty")) or _suggest_order_qty(item)
        unit_price = _to_int(item.get("unit_price") or item.get("paid_amount")) or 0
        supply = _to_int(item.get("supply_amount") or item.get("amount"))
        if supply is None:
            supply = qty * unit_price
        tax = _to_int(item.get("tax_amount"))
        if tax is None:
            tax = int(supply * 0.1)
        amount = supply + tax

        _set_cell(ws, row_idx, cols.get("no"), idx)
        _set_cell(ws, row_idx, cols.get("name"), item.get("prod_nm") or "")
        _set_cell(ws, row_idx, cols.get("spec"), item.get("spec") or "")
        _set_cell(ws, row_idx, cols.get("qty"), qty)
        _set_cell(ws, row_idx, cols.get("unit_price"), unit_price)
        _set_cell(ws, row_idx, cols.get("supply_amount") or cols.get("amount"), supply)
        _set_cell(ws, row_idx, cols.get("tax_amount"), tax)
        _set_cell(ws, row_idx, cols.get("note"), item.get("note") or "")

        total_supply += supply
        total_tax += tax
        total_amount += amount
        row_idx += 1

    _put_after_label(ws, {"합계", "합 계", "합      계"}, total_supply)
    _put_after_label(ws, {"발주금액", "총액", "합계금액"}, total_amount)


def _collect_items(req: AiRequest) -> list[dict[str, Any]]:
    raw_items = req.get_slot("approved_items") or req.get_slot("items") or []
    if not isinstance(raw_items, list):
        return []
    items: list[dict[str, Any]] = []
    for raw in raw_items:
        if not isinstance(raw, dict):
            continue
        if not str(raw.get("prod_nm") or "").strip():
            continue
        item = dict(raw)
        item["prod_stock"] = _to_int(raw.get("prod_stock"))
        item["order_qty"] = _to_int(raw.get("order_qty"))
        item["qty"] = _to_int(raw.get("qty"))
        item["paid_amount"] = _to_int(raw.get("paid_amount"))
        item["unit_price"] = _to_int(raw.get("unit_price"))
        item["amount"] = _to_int(raw.get("amount"))
        item["supply_amount"] = _to_int(raw.get("supply_amount"))
        item["tax_amount"] = _to_int(raw.get("tax_amount"))
        items.append(item)
    return items


def _find_item_header(ws: Worksheet) -> tuple[int, dict[str, int]]:
    for row in range(1, min(ws.max_row, 120) + 1):
        values = [str(ws.cell(row, col).value or "").replace(" ", "") for col in range(1, min(ws.max_column, 70) + 1)]
        if "품명" not in values:
            continue
        if "수량" not in values and "단가" not in values:
            continue
        mapping: dict[str, int] = {}
        for col, val in enumerate(values, start=1):
            if val in {"NO", "NO.", "번호"}:
                mapping["no"] = col
            elif val == "품명":
                mapping["name"] = col
            elif val == "규격":
                mapping["spec"] = col
            elif val == "수량":
                mapping["qty"] = col
            elif val == "단가":
                mapping["unit_price"] = col
            elif val == "공급가액":
                mapping["supply_amount"] = col
            elif val == "세액":
                mapping["tax_amount"] = col
            elif val == "금액":
                mapping["amount"] = col
            elif val == "비고":
                mapping["note"] = col
        return row, mapping
    return 0, {}


def _put_after_label(ws: Worksheet, labels: set[str], value: Any) -> None:
    normalized_labels = {label.replace(" ", "") for label in labels}
    for row in range(1, min(ws.max_row, 80) + 1):
        for col in range(1, min(ws.max_column, 80) + 1):
            cell_value = str(ws.cell(row, col).value or "").replace(" ", "")
            if cell_value not in normalized_labels:
                continue
            for step in range(1, 8):
                target_col = col + step
                if target_col > ws.max_column:
                    break
                target = ws.cell(row, target_col)
                # Skip merged/title labels and write to first writable cell.
                if step == 1 or target.value in (None, "", "(", ")"):
                    target.value = value
                    return


def _set_cell(ws: Worksheet, row: int, col: int | None, value: Any) -> None:
    if col is None:
        return
    ws.cell(row=row, column=col).value = value


def _suggest_order_qty(item: dict[str, Any]) -> int:
    stock = _to_int(item.get("prod_stock")) or 0
    target_stock = _to_int(item.get("target_stock")) or 12
    qty = target_stock - stock
    return qty if qty > 0 else 1


def _to_int(value: Any) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        try:
            return int(float(str(value).replace(",", "").strip()))
        except (TypeError, ValueError):
            return None


def _safe(value: str) -> str:
    text = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "_" for ch in value.strip().lower())
    return text.strip("_") or "unknown"
