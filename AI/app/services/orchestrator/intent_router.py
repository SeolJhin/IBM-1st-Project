# app/services/orchestrator/intent_router.py
import logging

from app.schemas.ai_request import AiRequest
from app.schemas.ai_response import AiResponse
from app.services.rag.retriever import retrieve_context
from app.services.rag.generator import generate_answer
from app.services.recommendation.contract_recommend import recommend_contract_rooms
from app.services.recommendation.room_recommend import recommend_rooms
from app.services.recommendation.common_space_recommend import recommend_common_space
from app.services.anomaly.contract_anomaly import detect_contract_anomaly
from app.services.classify.complain_priority import classify_complain_priority
from app.services.monitor.roomservice_stock import monitor_roomservice_stock
from app.services.document.payment_summary_doc import make_payment_summary
from app.services.document.payment_order_suggestion import suggest_order_from_payment
from app.services.document.order_form_generator import create_order_form_from_suggestion

logger = logging.getLogger(__name__)


class IntentRouter:
    def route(self, req: AiRequest) -> AiResponse:
        intent = req.intent
        items  = req.get_slot("items")
        logger.warning(f"[IntentRouter] intent={intent}, items_count={len(items) if isinstance(items, list) else 'N/A'}")

        # ── RAG 기반 QA ──────────────────────────────────────────────
        if intent in {"GENERAL_QA", "AI_AGENT_CHATBOT", "VOICE_CHATBOT",
                      "COMMUNITY_CONTENT_SEARCH", "AI_AGENT_RAG_SEARCH"}:
            docs   = retrieve_context(req)
            answer = generate_answer(req, docs)
            return AiResponse(answer=answer, confidence=_conf_docs(docs), metadata={"docs": len(docs)})

        # ── 리뷰 정보 ────────────────────────────────────────────────
        if intent == "REVIEW_INFO":
            items = req.get_slot("items") or []
            if items:
                sort_by = req.get_slot("sort_by") or "created_at"
                sort_label = {"rating": "별점", "read_count": "조회수",
                              "like_count": "좋아요", "created_at": "최신"}.get(sort_by, sort_by)
                docs = [f"[{sort_label}순 정렬 결과 총 {len(items)}건]"]
                for r in items:
                    stars = "★" * int(r.get("rating") or 0) + "☆" * (5 - int(r.get("rating") or 0))
                    docs.append(
                        f"{r.get('building_nm','?')} {r.get('room_no','?')}호 | "
                        f"별점: {r.get('rating','?')}/5점 {stars} | "
                        f"제목: {r.get('title','')} | "
                        f"조회수: {r.get('read_count',0)} | 좋아요: {r.get('like_count',0)}"
                    )
                answer = generate_answer(req, docs)
            else:
                answer = "리뷰 데이터를 찾을 수 없습니다."
            return AiResponse(answer=answer, confidence=0.85, metadata={"count": len(items)})

        # ── 방 가용성 검색 ────────────────────────────────────────────
        if intent == "ROOM_AVAILABILITY_SEARCH":
            items = req.get_slot("items") or []
            available_building_names = req.get_slot("available_building_names") or []
            if items:
                sort_by = req.get_slot("sort_by")
                available = [r for r in items if r.get("room_st") == "available"] or items
                sort_label = {"rent_price": "월세", "room_size": "평수",
                              "floor": "층수", "rating": "평점"}.get(sort_by, None)
                docs = []
                if sort_label:
                    docs.append(f"[{sort_label}순 정렬 결과 총 {len(available)}건]")
                for r in available:
                    pet  = "가능" if r.get("pet_allowed_yn") == "Y" else "불가"
                    park = "가능" if r.get("parking") else "불가"
                    docs.append(
                        f"빌딩: {r.get('building_nm','?')} {r.get('room_no','')}호"
                        f" | 타입: {_room_type_ko(r.get('room_type',''))}"
                        f" | 월세: {_fmt_price(r.get('rent_price'))}원"
                        f" | {r.get('room_capacity','?')}인"
                        f" | 반려동물: {pet} | 주차: {park}"
                        f" | {r.get('floor','')}층"
                    )
                answer = generate_answer(req, docs)
            elif available_building_names:
                docs = [f"현재 등록된 빌딩: {', '.join(available_building_names)}",
                        "입주 가능한 방은 조건을 더 구체적으로 알려주시면 찾아드릴게요."]
                answer = generate_answer(req, docs)
            else:
                answer = recommend_rooms(req)
            return AiResponse(answer=answer, confidence=0.92)

        # ── 계약 만료 기반 방 추천 ────────────────────────────────────
        if intent == "CONTRACT_RENEWAL_RECOMMEND":
            items = req.get_slot("items") or []
            answer = generate_answer(req, _items_to_docs(items)) if items else recommend_contract_rooms(req)
            return AiResponse(answer=answer, confidence=_conf_result(answer, 0.80))

        # ── 공용시설 추천 ─────────────────────────────────────────────
        if intent == "COMMON_SPACE_RECOMMEND":
            items = req.get_slot("items") or []
            answer = generate_answer(req, _items_to_docs(items)) if items else recommend_common_space(req)
            return AiResponse(answer=answer, confidence=_conf_result(answer, 0.78))

        # ── 결제 ──────────────────────────────────────────────────────
        if intent in {"PAYMENT_SUMMARY_DOCUMENT", "PAYMENT_STATUS_SUMMARY"}:
            answer, metadata = make_payment_summary(req)
            return AiResponse(answer=answer, confidence=_conf_result(answer, 0.85), metadata=metadata)

        if intent == "PAYMENT_ORDER_SUGGESTION":
            answer, metadata = suggest_order_from_payment(req)
            return AiResponse(answer=answer, confidence=_conf_result(answer, 0.85), metadata=metadata)

        if intent == "PAYMENT_ORDER_FORM_CREATE":
            answer, metadata = create_order_form_from_suggestion(req)
            return AiResponse(answer=answer, confidence=_conf_result(answer, 0.85), metadata=metadata)

        # ── 계약 이상 탐지 ────────────────────────────────────────────
        if intent == "CONTRACT_ANOMALY_DETECTION":
            score, msg = detect_contract_anomaly(req)
            return AiResponse(answer=msg, confidence=score)

        # ── 민원 우선순위 ─────────────────────────────────────────────
        if intent == "COMPLAIN_PRIORITY_CLASSIFY":
            priority, msg = classify_complain_priority(req)
            return AiResponse(answer=msg, confidence=min(0.95, 0.45 + priority * 0.15),
                              metadata={"priority": priority})

        # ── 룸서비스 재고 ─────────────────────────────────────────────
        if intent == "ROOMSERVICE_STOCK_MONITOR":
            score, msg, metadata = monitor_roomservice_stock(req)
            return AiResponse(answer=msg, confidence=score, metadata=metadata)

        # ── 투어 예약 안내 ────────────────────────────────────────────
        if intent == "TOUR_INFO":
            guide      = req.get_slot("tour_guide") or "투어 예약은 원하는 방 선택 후 날짜/시간을 선택하면 됩니다."
            slots_data = req.get_slot("items") or []
            available  = [s for s in slots_data if s.get("available")]
            docs = [f"{s.get('date')} {s.get('start_time','').split('T')[-1][:5]} 예약 가능" for s in available[:6]]
            docs.insert(0, guide)
            answer = generate_answer(req, docs)
            return AiResponse(answer=answer, confidence=0.88, metadata={"available_slots": len(available)})

        # ── 회사 정보/연락처 ──────────────────────────────────────────
        if intent == "COMPANY_INFO":
            info = req.get_slot("company_info") or {}
            if info and not info.get("error"):
                docs = [
                    f"회사명: {info.get('company_nm', '미등록')}",
                    f"대표자: {info.get('company_ceo', '미등록')}",
                    f"전화번호: {info.get('company_tel', '미등록')}",
                    f"이메일: {info.get('company_email', '미등록')}",
                    f"주소: {info.get('company_addr', '미등록')}",
                ]
            else:
                docs = ["회사 정보를 불러오는 중 오류가 발생했습니다."]
            answer = generate_answer(req, docs)
            return AiResponse(answer=answer, confidence=0.95)

        # ── 전체 빌딩 목록 ────────────────────────────────────────────
        if intent == "BUILDING_LIST":
            items = req.get_slot("items") or []
            available_building_names = req.get_slot("available_building_names") or []

            if not items:
                # items가 비어도 available_building_names가 있으면
                # LLM이 사용자 질문과 건물 목록을 보고 직접 안내
                if available_building_names:
                    docs = [
                        f"[등록된 빌딩 목록 — 총 {len(available_building_names)}개]",
                        *[f"빌딩명: {nm}" for nm in available_building_names],
                    ]
                    answer = generate_answer(req, docs)
                    return AiResponse(answer=answer, confidence=0.7,
                                      metadata={"building_count": len(available_building_names)})
                return AiResponse(answer="등록된 빌딩 정보를 찾을 수 없습니다.", confidence=0.5)

            applied = req.get_slot("applied_filters") or {}
            docs = []

            # 필터 헤더
            if applied:
                filter_desc = []
                if applied.get("elv") == "Y":   filter_desc.append("엘리베이터 있는 빌딩만")
                if applied.get("elv") == "N":   filter_desc.append("엘리베이터 없는 빌딩만")
                if applied.get("min_parking"):  filter_desc.append("주차 가능 빌딩만")
                if filter_desc:
                    docs.append(f"[적용된 필터: {', '.join(filter_desc)}] 검색 결과 총 {len(items)}개")

            for b in items:
                elv     = b.get("elv_text") or ("있음" if b.get("elv") else "없음")
                parking = "가능" if b.get("parking") else "불가"
                cap     = b.get("parking_capacity", 0)
                line = (
                    f"빌딩명: {b.get('building_nm','?')}"
                    f" | 주소: {b.get('building_addr','')}"
                    f" | 엘리베이터: {elv}"
                    f" | 주차: {parking}({cap}대)"
                )
                if b.get("build_size"):
                    line += f" | 규모: {b.get('build_size')}"
                if b.get("building_desc"):
                    line += f" | 설명: {b.get('building_desc')}"
                docs.append(line)

            # 전체 빌딩명 목록 — LLM이 건물명 표기 차이를 이해하는 데 활용
            if available_building_names:
                docs.append(f"[전체 등록 빌딩명: {', '.join(available_building_names)}]")

            answer = generate_answer(req, docs)
            return AiResponse(answer=answer, confidence=0.95, metadata={"building_count": len(items)})

        # ── 내 계약 조회 ──────────────────────────────────────────────
        if intent == "MY_CONTRACT":
            if req.get_slot("auth_required"):
                return AiResponse(answer="계약 정보를 조회하려면 로그인이 필요합니다.", confidence=1.0)
            items = req.get_slot("items") or []
            if not items:
                return AiResponse(answer="현재 진행 중인 계약 내역이 없습니다.", confidence=0.9)
            sort_by = req.get_slot("sort_by")
            sort_label = {"rent_price": "월세", "contract_end": "만료일", "contract_start": "시작일"}.get(sort_by, "")
            docs = []
            if sort_label:
                docs.append(f"[{sort_label}순 정렬 결과 총 {len(items)}건]")
            for i in items:
                docs.append(
                    f"계약 #{i.get('contract_id')}: {i.get('building_nm','')} {i.get('room_no','')}호"
                    f" | 상태: {_contract_st_ko(i.get('contract_st',''))}"
                    f" | 기간: {i.get('contract_start','')}~{i.get('contract_end','')}"
                    f" | 월세: {_fmt_price(i.get('rent_price'))}원"
                    f" | 관리비: {_fmt_price(i.get('manage_fee'))}원"
                    f" | 납부일: {i.get('payment_day','')}일"
                )
            answer = generate_answer(req, docs)
            return AiResponse(answer=answer, confidence=0.92, metadata={"count": len(items)})

        # ── 내 공용시설 예약 ──────────────────────────────────────────
        if intent == "MY_RESERVATION":
            if req.get_slot("auth_required"):
                return AiResponse(answer="예약 내역을 조회하려면 로그인이 필요합니다.", confidence=1.0)
            items = req.get_slot("items") or []
            if not items:
                return AiResponse(answer="공용시설 예약 내역이 없습니다.", confidence=0.9)
            docs = [
                f"{i.get('building_nm','')} {i.get('space_nm','공간')}"
                f" | {i.get('start_at','')}~{i.get('end_at','')}"
                f" | 인원: {i.get('people','')}명"
                f" | 상태: {_reservation_st_ko(i.get('status',''))}"
                for i in items
            ]
            answer = generate_answer(req, docs)
            return AiResponse(answer=answer, confidence=0.92, metadata={"count": len(items)})

        # ── 내 투어 예약 ──────────────────────────────────────────────
        if intent == "MY_TOUR":
            guide = req.get_slot("guide")
            if guide:
                return AiResponse(answer=guide, confidence=1.0)
            items = req.get_slot("items") or []
            if not items:
                return AiResponse(answer="투어 예약 내역이 없습니다.", confidence=0.9)
            docs = [
                f"{i.get('building_nm','')} {i.get('room_no','')}호 투어"
                f" | {i.get('start_at','')} ~ {i.get('end_at','')}"
                f" | 상태: {_tour_st_ko(i.get('tour_st',''))}"
                for i in items
            ]
            answer = generate_answer(req, docs)
            return AiResponse(answer=answer, confidence=0.92, metadata={"count": len(items)})

        # ── 내 민원 현황 ──────────────────────────────────────────────
        if intent == "MY_COMPLAIN":
            if req.get_slot("auth_required"):
                return AiResponse(answer="민원 내역을 조회하려면 로그인이 필요합니다.", confidence=1.0)
            items = req.get_slot("items") or []
            if not items:
                return AiResponse(answer="접수된 민원 내역이 없습니다.", confidence=0.9)
            sort_by = req.get_slot("sort_by")
            sort_label = {"importance": "중요도", "created_at": "최신"}.get(sort_by, "")
            docs = []
            if sort_label:
                docs.append(f"[{sort_label}순 정렬 결과 총 {len(items)}건]")
            for i in items:
                docs.append(
                    f"민원 #{i.get('comp_id')}: {i.get('title','')}"
                    f" | 상태: {_complain_st_ko(i.get('status',''))}"
                    f" | 중요도: {_importance_ko(i.get('importance',''))}"
                    f" | 접수일: {i.get('created_at','')[:10] if i.get('created_at') else ''}"
                )
            answer = generate_answer(req, docs)
            return AiResponse(answer=answer, confidence=0.92, metadata={"count": len(items)})

        # ── 커뮤니티 콘텐츠 모더레이션 ───────────────────────────────
        if intent == "COMMUNITY_CONTENT_MODERATION":
            docs   = retrieve_context(req)
            answer = generate_answer(req, docs)
            return AiResponse(answer=answer, confidence=_conf_docs(docs))

        return AiResponse(answer="Unsupported intent.", confidence=0.0)


# ── 한국어 변환 헬퍼 ──────────────────────────────────────────────────────────

def _room_type_ko(value: str) -> str:
    return {
        "one_room": "원룸", "SINGLE": "원룸",
        "two_room": "투룸", "DOUBLE": "투룸",
        "three_room": "쓰리룸", "TRIPLE": "쓰리룸",
        "loft": "복층", "LOFT": "복층",
        "share": "쉐어", "SHARE": "쉐어",
    }.get(value or "", value or "")

def _contract_st_ko(v: str) -> str:
    return {"requested": "신청됨", "active": "활성", "in_progress": "진행중",
            "expired": "만료", "terminated": "해지"}.get((v or "").lower(), v or "")

def _reservation_st_ko(v: str) -> str:
    return {"requested": "신청", "confirmed": "확정", "cancelled": "취소"}.get((v or "").lower(), v or "")

def _tour_st_ko(v: str) -> str:
    return {"pending": "대기", "confirmed": "확정", "cancelled": "취소",
            "completed": "완료", "no_show": "노쇼", "ended": "종료"}.get((v or "").lower(), v or "")

def _complain_st_ko(v: str) -> str:
    return {"pending": "접수대기", "received": "접수완료", "in_progress": "처리중",
            "resolved": "해결됨", "closed": "종료"}.get((v or "").lower(), v or "")

def _importance_ko(v: str) -> str:
    return {"high": "높음", "medium": "보통", "low": "낮음"}.get((v or "").lower(), v or "")

def _fmt_price(value) -> str:
    """숫자를 한국어 금액 포맷으로 변환: 500000 → 50만"""
    if value is None:
        return "?"
    try:
        n = int(value)
        if n >= 10000:
            man = n // 10000
            rem = n % 10000
            return f"{man}만{rem:,}" if rem else f"{man}만"
        return f"{n:,}"
    except (ValueError, TypeError):
        return str(value)

def _items_to_docs(items: list) -> list[str]:
    return [", ".join(f"{k}: {v}" for k, v in item.items() if v is not None)
            for item in items[:50] if isinstance(item, dict)]

def _conf_docs(docs: list[str]) -> float:
    return min(0.9, 0.6 + 0.1 * len(docs))

def _conf_result(answer: str, base: float) -> float:
    if any(w in answer.lower() for w in ["not found", "no match", "no room", "없습니다"]):
        return max(0.5, base - 0.25)
    return base
