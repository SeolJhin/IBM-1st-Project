# app/services/monitor/stock_alert_service.py
"""
재고 부족 알림 서비스.
- 매일 오전 9시 1회 자동 체크 (백그라운드 스레드)
- 마지막 알림을 메모리에 캐시 → 챗봇 열릴 때 반환
- 오늘 이미 확인한 경우 재알림 없음 (STOCK_ALERT_SEEN_KEY per adminId)
"""
from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, date
from typing import Optional

from app.services.tools.tool_executor import execute_tool

logger = logging.getLogger(__name__)

_LOW_STOCK_THRESHOLD = 5
_CHECK_HOUR = 9

_lock = threading.Lock()
_last_alert: Optional[dict] = None   # {"date": date, "rows": [...], "message": str}
_started = False

_STOCK_SQL = """
SELECT b.building_nm, p.prod_nm, pbs.stock
FROM product_building_stock pbs
JOIN building b ON pbs.building_id = b.building_id
JOIN product p ON pbs.prod_id = p.prod_id
WHERE b.delete_yn = 'N'
  AND pbs.stock < {threshold}
ORDER BY b.building_nm, pbs.stock ASC
""".strip()


def _query_low_stock() -> list[dict]:
    sql = _STOCK_SQL.format(threshold=_LOW_STOCK_THRESHOLD)
    result = execute_tool(
        tool_name="query_database_admin",
        tool_args={"sql": sql, "description": "재고 부족 자동 체크"},
        user_id="system",
    )
    if not result.get("success"):
        logger.warning("[StockAlert] 재고 조회 실패: %s", result.get("error"))
        return []
    return result.get("data") or []


def _format_message(rows: list[dict]) -> str:
    if not rows:
        return ""   # 부족 없으면 빈 문자열 → 챗봇 알림 없음

    lines = [f"⚠️ **재고 부족 알림** ({date.today().strftime('%Y-%m-%d')} 기준, {_LOW_STOCK_THRESHOLD}개 미만)\n"]
    current_building = None
    for row in rows:
        building = row.get("building_nm", "알 수 없음")
        prod = row.get("prod_nm", "-")
        stock = row.get("stock", 0)
        if building != current_building:
            lines.append(f"\n🏢 **{building}**")
            current_building = building
        stock_str = "⛔ 품절" if int(stock) == 0 else f"⚠️ {stock}개"
        lines.append(f"  • {prod}: {stock_str}")

    lines.append(f"\n📦 총 {len(rows)}개 상품 재고 부족")
    return "\n".join(lines)


def run_check_now() -> dict:
    """즉시 재고 체크 실행 후 결과 반환."""
    global _last_alert
    rows = _query_low_stock()
    message = _format_message(rows)
    alert = {"date": date.today(), "rows": rows, "message": message}
    with _lock:
        _last_alert = alert
    logger.info("[StockAlert] 체크 완료: %d개 부족", len(rows))
    return alert


def get_pending_alert(admin_id: str) -> Optional[str]:
    """
    챗봇 open 시 호출.
    오늘 아직 안 읽은 알림이 있으면 메시지 반환, 없으면 None.
    """
    with _lock:
        alert = _last_alert

    if not alert or not alert.get("message"):
        return None

    # 오늘 날짜 알림인지 확인
    if alert.get("date") != date.today():
        return None

    return alert["message"]


# ── 백그라운드 데몬 ──────────────────────────────────────────────────────────

def _loop() -> None:
    last_checked: Optional[date] = None
    # 시작 직후 한 번 체크 (서버 재시작 시 즉시 알림 갱신)
    try:
        run_check_now()
        last_checked = date.today()
    except Exception as exc:
        logger.warning("[StockAlert] 초기 체크 실패: %s", exc)

    while True:
        now = datetime.now()
        today = now.date()
        if now.hour >= _CHECK_HOUR and last_checked != today:
            try:
                run_check_now()
                last_checked = today
            except Exception as exc:
                logger.warning("[StockAlert] 체크 실패: %s", exc)
        time.sleep(60 * 10)   # 10분마다 조건 확인


def start_stock_alert_daemon() -> None:
    global _started
    if _started:
        return
    _started = True
    t = threading.Thread(target=_loop, name="stock-alert-daemon", daemon=True)
    t.start()
    logger.info("[StockAlert] 데몬 시작 (매일 %d시, 임계값 %d개)", _CHECK_HOUR, _LOW_STOCK_THRESHOLD)
