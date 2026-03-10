# AI/app/integrations/llm_client_groq.py
import logging

from openai import OpenAI

from app.config.settings import settings
from app.schemas.ai_request import AiRequest

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """당신은 UNI PLACE의 AI 어시스턴트입니다.
항상 친절하고 자연스러운 한국어로 답변하세요.
UNI PLACE는 주거 플랫폼으로 계약, 공용공간, 결제, 룸서비스, 방 탐색 등을 지원합니다.
제공된 데이터(items/참고 정보)가 있으면 그것을 최우선으로 활용해 구체적으로 답변하세요.

[건물명 표기 규칙]
- 사용자가 "유니플레이스B", "유니플레이스 비", "B빌딩" 등 다양하게 표기해도 동일한 건물을 의미할 수 있습니다.
- [전체 등록 빌딩명] 목록이 있으면 그 목록에서 가장 비슷한 건물명을 찾아 답변하세요.
- available_building_names에 없는 건물 정보는 "해당 건물 정보를 찾을 수 없습니다"라고 안내하세요.

[응답 규칙]
1. 이전 대화 내용을 반드시 기억하고 맥락에 맞게 이어서 답변하세요.
2. 금액은 "50만원", "100만원" 형식으로 표기하세요.
3. 날짜는 "YYYY년 MM월 DD일" 형식으로 표기하세요.
4. 로그인이 필요한 기능은 로그인 여부를 먼저 확인하세요.
5. 확실하지 않은 내용은 "정확한 안내는 고객센터(앱 내 QnA)를 이용해 주세요"라고 안내하세요."""

INTENT_GUIDE = {
    "GENERAL_QA": "사용자의 질문에 친절하게 답변하세요. FAQ/공지사항 데이터를 참고하세요.",
    "BUILDING_LIST": (
        "사용자의 질문 의도에 맞게 빌딩 정보를 자연스럽게 안내하세요. "
        "사용자가 '유니플레이스B', '유니플레이스 비', 'B건물' 등으로 표기해도 [전체 등록 빌딩명] 목록에서 "
        "가장 가까운 빌딩을 찾아 해당 빌딩 정보를 답변하세요. "
        "특정 빌딩을 물어봤다면 그 빌딩 정보만 집중해서 답변하고, 전체 목록 조회라면 모두 안내하세요."
    ),
    "ROOM_AVAILABILITY_SEARCH": (
        "사용자의 조건(반려동물, 월세, 인원 등)에 맞는 방을 친절하게 추천하세요. "
        "'강아지를 키우신다면' 같이 사용자 상황을 언급하며 맞춤 추천 형식으로 답변하세요."
    ),
    "CONTRACT_RENEWAL_RECOMMEND": "계약 만료 예정자에게 맞는 방을 추천하세요. 현재 월세와 비교해서 설명하세요.",
    "COMMON_SPACE_RECOMMEND": "공용시설 예약을 도와주세요. 이용 가능한 시간대와 시설을 안내하세요.",
    "COMMUNITY_CONTENT_SEARCH": "커뮤니티 게시물을 요약해서 안내하세요.",
    "PAYMENT_SUMMARY_DOCUMENT": "결제 내역을 정리해서 알려주세요.",
    "PAYMENT_STATUS_SUMMARY": "결제 상태를 명확하게 안내하세요.",
    "COMPLAIN_PRIORITY_CLASSIFY": "민원 내용을 파악하고 처리 우선순위를 안내하세요.",
    "ROOMSERVICE_STOCK_MONITOR": "재고 현황을 알기 쉽게 정리해서 알려주세요.",
    "REVIEW_INFO": "리뷰 데이터를 바탕으로 별점과 내용을 정리해서 알려주세요.",
    "TOUR_INFO": "투어 예약 안내를 친절하게 설명하세요.",
    "COMPANY_INFO": "회사 정보를 정확하게 안내하세요.",
    "MY_CONTRACT": "사용자의 계약 내역을 항목별로 상세히 안내하세요.",
    "MY_RESERVATION": "사용자의 예약 내역을 항목별로 상세히 안내하세요.",
    "MY_TOUR": "사용자의 투어 예약 내역을 안내하세요.",
    "MY_COMPLAIN": "사용자의 민원 접수 현황을 안내하세요.",
}

LIST_INTENTS = {
    "BUILDING_LIST", "ROOM_AVAILABILITY_SEARCH", "MY_CONTRACT",
    "MY_RESERVATION", "MY_TOUR", "MY_COMPLAIN", "REVIEW_INFO",
}


def chat_with_groq(req: AiRequest, docs: list[str]) -> str:
    api_key = settings.groq_api_key
    if not api_key:
        logger.warning("GROQ_API_KEY 미설정")
        return ""

    question = (req.prompt or "").strip()
    if not question:
        return ""

    intent = req.intent or "GENERAL_QA"
    intent_guide = INTENT_GUIDE.get(intent, "사용자 질문에 한국어로 답변하세요.")

    # ── items 블록 (목록형 intent는 docs에 이미 포함) ─────────────
    items_block = ""
    if intent not in LIST_INTENTS:
        items = req.get_slot("items")
        if isinstance(items, list) and items:
            items_block = "\n[데이터]\n"
            for i, item in enumerate(items[:10], 1):
                if isinstance(item, dict):
                    parts = [f"{k}: {v}" for k, v in item.items()
                             if not k.startswith("_") and v is not None]
                    items_block += f"{i}. {', '.join(parts)}\n"

    # ── context (RAG docs) ────────────────────────────────────────
    context_block = ""
    if docs:
        limit = len(docs) if intent in LIST_INTENTS else 5
        context_block = "\n[참고 정보 — 아래 내용을 빠짐없이 사용하세요]\n" + \
                        "\n".join(f"- {doc}" for doc in docs[:limit])

    # ── 대화 히스토리 (멀티턴 맥락 유지) ─────────────────────────
    history = req.get_history()
    history_messages = []
    if history:
        # 최근 8개 대화를 LLM 메시지로 변환
        for msg in history[-8:]:
            role    = msg.get("role", "")
            content = (msg.get("content") or "").strip()
            if role in ("user", "assistant") and content:
                history_messages.append({"role": role, "content": content})

    # ── 최종 user content ─────────────────────────────────────────
    user_content = (
        f"[Intent: {intent}]\n"
        f"[가이드: {intent_guide}]"
        f"{items_block}"
        f"{context_block}\n\n"
        f"[질문]\n{question}"
    )

    # ── 메시지 구성: system → history → user ─────────────────────
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(history_messages)
    messages.append({"role": "user", "content": user_content})

    try:
        client = OpenAI(
            api_key=api_key,
            base_url=settings.groq_base_url,
            timeout=20.0,
        )
        response = client.chat.completions.create(
            model=settings.groq_model,
            temperature=0.4,
            max_tokens=1024,
            messages=messages,
        )
        content = response.choices[0].message.content if response.choices else None
        if isinstance(content, str):
            return content.strip()
        return ""
    except Exception as exc:
        logger.warning("Groq 호출 실패: %s", exc.__class__.__name__)
        return ""