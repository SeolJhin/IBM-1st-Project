# app/services/tools/tool_result_formatter.py
"""
tool 실행 결과를 LLM이 읽기 좋은 텍스트로 변환.

query_database / query_my_data 결과는 컬럼명 기반 자동 포맷.
전용 tool 결과는 각각 맞는 포맷 적용.
"""
from typing import Any


def format_tool_result(tool_name: str, result: dict[str, Any]) -> list[str]:
    """tool 실행 결과 → LLM 컨텍스트 문자열 리스트 변환."""
    if not result.get("success"):
        error = result.get("error", "알 수 없는 오류")
        if error == "AUTH_REQUIRED":
            return ["[인증 필요] 이 정보는 로그인 후 조회할 수 있습니다."]
        return [f"[오류] {error}"]

    data = result.get("data") or []
    meta = result.get("meta") or {}

    # ── RAG 검색 결과 포맷 ─────────────────────────────────────────────────────
    if tool_name == "rag_search":
        if result.get("rag"):
            results = result.get("data", [])
            if not results:
                return ["[RAG] 관련 문서를 찾지 못했습니다."]
            lines = [f"[RAG 검색 결과 {len(results)}건]"]
            for i, r in enumerate(results, 1):
                lines.append(f"{i}. [{r.get('source','')}] (관련도: {r.get('relevance', r.get('score', 0)):.2f})")
                lines.append(f"   {r.get('content', '')[:300]}")
            return lines

    # query_database / query_my_data / query_database_admin — 범용 자동 포맷
    if tool_name in ("query_database", "query_my_data", "query_database_admin"):
        return _fmt_query_result(data, meta)

    # 전용 tool 포맷
    formatters = {
        "get_tour_available_slots":    _fmt_tour_slots,
        "classify_complain_priority":  _fmt_complain_priority,
    }
    formatter = formatters.get(tool_name)
    if formatter:
        return formatter(data, meta)

    # 알 수 없는 tool — 그냥 출력
    return [str(item) for item in data[:30]]


# ── 범용 쿼리 결과 포맷 ────────────────────────────────────────────────────────

def _fmt_query_result(data: list, meta: dict) -> list[str]:
    """
    SELECT 결과를 자동으로 읽기 좋은 형태로 변환.
    컬럼명을 한국어로 매핑해서 LLM이 더 잘 이해하도록 합니다.
    """
    if not data:
        return ["조회된 데이터가 없습니다."]

    description = meta.get("description", "")
    total = meta.get("total", len(data))

    # 집계 결과 (COUNT, AVG 등) — 단일 행
    if len(data) == 1 and len(data[0]) <= 3:
        row = data[0]
        # COUNT(*) 같은 집계 결과
        parts = []
        for k, v in row.items():
            label = _col_label(k)
            parts.append(f"{label}: {_format_value(k, v)}")
        header = f"[{description}]" if description else "[조회 결과]"
        return [header, " | ".join(parts)]

    # 목록 결과
    header = f"[{description} — 총 {total}건]" if description else f"[조회 결과 총 {total}건]"
    docs = [header]

    for row in data:
        parts = []
        for k, v in row.items():
            if v is None:
                continue
            label = _col_label(k)
            parts.append(f"{label}: {_format_value(k, v)}")
        if parts:
            docs.append(" | ".join(parts))

    return docs


def _col_label(col: str) -> str:
    """컬럼명 → 한국어 레이블 매핑."""
    mapping = {
        # building
        "building_nm": "빌딩명", "building_addr": "주소", "building_desc": "설명",
        "exist_elv": "엘리베이터", "parking_capacity": "주차",
        "build_size": "규모",
        # room
        "room_no": "호수", "floor": "층", "room_size": "면적",
        "room_type": "방타입", "pet_allowed_yn": "반려동물",
        "rent_price": "월세", "deposit": "보증금", "manage_fee": "관리비",
        "room_st": "상태", "room_capacity": "수용인원",
        # review
        "rating": "별점", "review_title": "제목", "read_count": "조회수", "like_count": "좋아요",
        # contract
        "contract_st": "계약상태", "contract_start": "계약시작", "contract_end": "계약종료",
        "payment_day": "납부일",
        # complain
        "comp_title": "민원제목", "comp_st": "처리상태", "importance": "중요도",
        # reservation
        "sr_start_at": "시작", "sr_end_at": "종료", "sr_no_people": "인원", "sr_st": "예약상태",
        # payment
        "total_price": "결제금액", "payment_st": "결제상태", "paid_at": "결제일",
        # stock
        "prod_nm": "상품명", "prod_stock": "재고",
        # common
        "space_nm": "시설명", "space_capacity": "수용인원",
        # faq / notice / board
        "faq_title": "질문", "faq_ctnt": "답변",
        "notice_title": "제목", "notice_ctnt": "내용",
        "board_title": "제목",
        # company
        "company_nm": "회사명", "company_ceo": "대표자",
        "company_tel": "전화번호", "company_email": "이메일", "company_addr": "주소",
        # aggregate
        "cnt": "개수", "count": "개수", "avg_rating": "평균별점",
        "total": "합계", "max_price": "최고가", "min_price": "최저가",
    }
    return mapping.get(col, col)


def _format_value(col: str, value: Any) -> str:
    """값 포맷팅 — 금액, enum 한국어 변환 등."""
    if value is None:
        return "-"

    # 금액 컬럼
    price_cols = {"rent_price", "deposit", "manage_fee", "total_price", "captured_price"}
    if col in price_cols:
        try:
            return _fmt_price(int(float(str(value))))
        except (ValueError, TypeError):
            pass

    # enum 한국어
    str_val = str(value)
    ko = _enum_ko(col, str_val)
    if ko != str_val:
        return ko

    # 날짜 축약
    if "at" in col or "start" in col or "end" in col:
        if len(str_val) > 10:
            return str_val[:16].replace("T", " ")

    return str_val


def _enum_ko(col: str, val: str) -> str:
    """enum 값 → 한국어."""
    maps = {
        "room_type":   {"one_room": "원룸", "two_room": "투룸", "three_room": "쓰리룸", "loft": "복층", "share": "쉐어"},
        "room_st":     {"available": "입주가능", "reserved": "예약됨", "contracted": "계약중", "repair": "수리중", "cleaning": "청소중"},
        "pet_allowed_yn": {"Y": "허용", "N": "불가"},
        "exist_elv":   {"Y": "있음", "N": "없음"},
        "contract_st": {"requested": "신청됨", "approved": "승인됨", "active": "진행중", "ended": "완료", "cancelled": "해지"},
        "comp_st":     {"pending": "접수대기", "received": "접수완료", "in_progress": "처리중", "resolved": "해결됨", "closed": "종료"},
        "importance":  {"high": "높음", "medium": "보통", "low": "낮음"},
        "sr_st":       {"requested": "신청", "confirmed": "확정", "cancelled": "취소"},
        "tour_st":     {"pending": "대기", "confirmed": "확정", "cancelled": "취소", "completed": "완료", "ended": "종료"},
        "payment_st":  {"paid": "결제완료", "ready": "결제대기", "cancelled": "취소", "pending": "처리중"},
    }
    return maps.get(col, {}).get(val, val)


def _fmt_price(n: int) -> str:
    if n >= 10000:
        man = n // 10000
        rem = n % 10000
        return f"{man}만{rem:,}원" if rem else f"{man}만원"
    return f"{n:,}원"


# ── 전용 tool 포맷터 ───────────────────────────────────────────────────────────

def _fmt_tour_slots(data: list, meta: dict) -> list[str]:
    guide = meta.get("guide", "투어 예약은 원하는 방 선택 후 날짜/시간을 선택하면 됩니다.")
    docs = [guide]
    available = [s for s in data if s.get("available")]
    if available:
        docs.append(f"[예약 가능 시간대 {len(available)}개]")
        for s in available[:9]:
            date = s.get("date", "")
            time = (s.get("start_time") or "").split("T")[-1][:5]
            docs.append(f"  • {date} {time}")
    else:
        docs.append("현재 예약 가능한 시간대가 없습니다.")
    return docs


def _fmt_complain_priority(data: list, meta: dict) -> list[str]:
    priority = meta.get("priority", 0)
    label = {3: "높음 🔴", 2: "보통 🟡", 1: "낮음 🟢"}.get(priority, "보통")
    reason = meta.get("reason", "")
    docs = [f"[민원 우선순위: {label}]"]
    if reason:
        docs.append(f"분석: {reason}")
    return docs