from datetime import datetime
from app.schemas.ai_request import AiRequest

HIGH_PRIORITY_WORDS  = {"urgent", "asap", "immediately", "critical", "emergency", "help",
                         "긴급", "즉시", "당장", "위험", "화재", "누수", "비상"}
MEDIUM_PRIORITY_WORDS = {"fast", "quick", "soon", "problem", "issue", "noise", "contract",
                          "빨리", "소음", "하자", "수리", "고장", "불편"}

def classify_complain_priority(req: AiRequest) -> tuple[int, str]:
    source_item = _resolve_source_item(req)
    comp_id   = _to_int(req.get_slot("comp_id") or req.get_slot("compId"))
    title     = str(req.get_slot("comp_title")  or req.get_slot("compTitle")  or "")
    content   = str(req.get_slot("comp_ctnt")   or req.get_slot("compCtnt")   or "")
    comp_st   = str(req.get_slot("comp_st")     or req.get_slot("compSt")     or "")
    keyword   = str(req.get_slot("keyword")     or "")
    override_score = _to_float(req.get_slot("priority_score"))

    if source_item is not None:
        comp_id = comp_id or _to_int(_item_value(source_item, "comp_id", "compId"))
        title   = title   or str(_item_value(source_item, "comp_title",  "compTitle")  or "")
        content = content or str(_item_value(source_item, "comp_ctnt",   "compCtnt")   or "")
        comp_st = comp_st or str(_item_value(source_item, "comp_st",     "compSt")     or "")
        keyword = keyword or str(_item_value(source_item, "code", "keyword")           or "")
        if override_score is None:
            override_score = _to_float(_item_value(source_item, "priority_score", "priorityScore"))

    priority = (_priority_from_override(override_score) if override_score is not None
                else max(_priority_from_text(" ".join([title, content, keyword, comp_st])),
                         _history_floor(req)))

    priority_label = {1: "낮음", 2: "보통", 3: "높음"}.get(priority, "보통")
    status_map = {
        "received": "접수됨", "in_progress": "처리중", "requested": "요청됨",
        "completed": "완료", "closed": "종료"
    }
    status_text = status_map.get(comp_st.lower(), comp_st or "접수됨")
    created_at = _resolve_created_date(source_item)
    comp_id_text = str(comp_id) if comp_id is not None else "-"

    message = (
        f"민원 #{comp_id_text} 처리 현황\n"
        f"제목: {title or '(제목 없음)'}\n"
        f"상태: {status_text}\n"
        f"접수일: {created_at}\n"
        f"우선순위: {priority_label} (★{'★' * (priority-1)}{'☆' * (3-priority)})"
    )
    return priority, message


def _priority_from_override(value: float) -> int:
    if value >= 2.5: return 3
    if value >= 1.5: return 2
    return 1

def _priority_from_text(text: str) -> int:
    lowered = text.lower()
    high   = sum(1 for w in HIGH_PRIORITY_WORDS  if w in lowered)
    medium = sum(1 for w in MEDIUM_PRIORITY_WORDS if w in lowered)
    bonus  = 1 if "!" in text else 0
    score  = high * 2 + medium + bonus
    if score >= 4: return 3
    if score >= 2: return 2
    return 1

def _to_float(value) -> float | None:
    try: return float(value) if value not in (None, "") else None
    except: return None

def _to_int(value) -> int | None:
    try: return int(value) if value not in (None, "") else None
    except: return None

def _resolve_source_item(req: AiRequest) -> dict | None:
    items = req.get_slot("items")
    if not isinstance(items, list): return None
    comp_id = _to_int(req.get_slot("comp_id") or req.get_slot("compId"))
    if comp_id is not None:
        for item in items:
            if isinstance(item, dict) and _to_int(_item_value(item, "comp_id", "compId")) == comp_id:
                return item
    sorted_items = [i for i in items if isinstance(i, dict)]
    if not sorted_items: return None
    sorted_items.sort(key=lambda i: _item_datetime(i) or datetime.min, reverse=True)
    return sorted_items[0]

def _history_floor(req: AiRequest) -> int:
    items = req.get_slot("items")
    if not isinstance(items, list): return 1
    unresolved = sum(1 for i in items if isinstance(i, dict) and
                     str(_item_value(i, "comp_st", "compSt") or "").lower()
                     in {"received", "in_progress", "requested"})
    if unresolved >= 3: return 3
    if unresolved >= 2: return 2
    return 1

def _resolve_created_date(source_item) -> str:
    if source_item is None: return datetime.now().date().isoformat()
    dt = _item_datetime(source_item)
    return dt.date().isoformat() if dt else datetime.now().date().isoformat()

def _item_value(item: dict, *keys):
    for k in keys:
        if k in item: return item[k]
    return None

def _item_datetime(item: dict) -> datetime | None:
    value = _item_value(item, "created_at", "createdAt")
    if not value: return None
    try: return datetime.fromisoformat(str(value).strip().replace("Z", "+00:00").replace(" ", "T"))
    except: return None
