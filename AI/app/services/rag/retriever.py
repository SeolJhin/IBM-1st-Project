from app.integrations.milvus_client import search_vectors
from app.schemas.ai_request import AiRequest
from app.services.moderation.policy import detect_policy_matches, item_policy_text
from app.services.rag.reranker import rerank
import pymysql
import os
import re

FAQ_CONTEXT: dict[str, str] = {
    "tour": "Tour reservation is available after selecting a room and entering the visit date.",
    "reservation": "Tour reservation is available after selecting a room and entering the visit date.",
    "move-in": "Move-in process is application review, contract confirmation, payment, and move-in scheduling.",
    "contract": "Contract support is available from the contract page with renewal and policy guidance.",
    "payment": "Payment details can be checked by billing month and payment status in the payment menu.",
    "service": "Uniplace service guide includes room search, contract flow, payment, and support options.",
    "default": "General service guide is available for reservation, contract, and payment topics.",
}

COMMUNITY_CONTEXT: dict[str, str] = {
    "popular": "Popular posts are ranked by recent view and engagement signals.",
    "notice": "Move-in and resident notices are pinned in the announcement board.",
    "noise": "Noise-related posts include reporting flow, response status, and resident tips.",
    "review": "Resident reviews are grouped by building with recent highlights.",
    "default": "Top community updates include notices, reviews, and resident Q&A posts.",
}


def retrieve_context(req: AiRequest) -> list[str]:
    query = _build_query(req)
    candidates: list[str] = []
    candidates.extend(_extract_slot_context(req))
    is_popular = any(word in query for word in ["인기", "조회수", "많이 본"])
    if req.intent in {"COMMUNITY_CONTENT_SEARCH", "AI_AGENT_CHATBOT"}:
        candidates.extend(_search_community_db(query))
        if is_popular:
            candidates.extend(_search_popular_posts())
    if not is_popular:
        # Milvus RAG 검색
        candidates.extend(search_vectors(req))
        candidates.extend(_lookup_static_context(req, query))
    unique_docs: list[str] = []
    for doc in candidates:
        normalized = str(doc).strip()
        if normalized and normalized not in unique_docs:
            unique_docs.append(normalized)

    return rerank(unique_docs, query=query, limit=5)


def _extract_slot_context(req: AiRequest) -> list[str]:
    raw_items = req.get_slot("items")
    if not isinstance(raw_items, list):
        return []

    docs: list[str] = []
    for item in raw_items:
        if not isinstance(item, dict):
            continue
        policy_text = item_policy_text(item)
        if policy_text and detect_policy_matches(policy_text):
            continue

        text = _item_text(item)
        if text and text not in docs:
            docs.append(text)
    return docs


def _item_text(item: dict) -> str:
    for key in ("content", "text", "chunk", "summary", "answer", "message"):
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            title = item.get("title")
            if isinstance(title, str) and title.strip():
                return f"{title.strip()}: {value.strip()}"
            return value.strip()

    fallbacks: list[str] = []
    for key in (
        "prod_nm",
        "name",
        "payment_st",
        "target_type",
        "comp_title",
        "comp_ctnt",
        "board_title",
        "board_ctnt",
        "space_name",
    ):
        value = item.get(key)
        if value is None:
            continue
        text = str(value).strip()
        if text:
            fallbacks.append(text)

    if fallbacks:
        return " | ".join(fallbacks)
    return ""


def _build_query(req: AiRequest) -> str:
    prompt = req.prompt or ""
    topic = str(req.get_slot("topic") or "")
    keyword = str(req.get_slot("keyword") or "")
    return " ".join(part for part in (prompt, topic, keyword) if part).strip()


def _lookup_static_context(req: AiRequest, query: str) -> list[str]:
    source = _context_source(req.intent)
    if not source:
        return []

    lowered = query.lower()
    matched: list[str] = []
    for key, context in source.items():
        if key == "default":
            continue
        if key in lowered:
            matched.append(context)

    if matched:
        return matched

    fallback = source.get("default")
    return [fallback] if fallback else []


def _context_source(intent: str) -> dict[str, str]:
    if intent == "GENERAL_QA":
        return FAQ_CONTEXT
    if intent == "COMMUNITY_CONTENT_SEARCH":
        return COMMUNITY_CONTEXT
    return {}

def _extract_keyword(query: str) -> str:

    q = re.sub(r"[^\w\s가-힣]", "", query)

    return q.strip()



def _search_community_db(query: str) -> list[str]:

    docs: list[str] = []

    try:
        conn = pymysql.connect(
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            db=os.getenv("DB_NAME"),
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor
        )

        with conn.cursor() as cur:

            sql = """
            SELECT board_title, board_ctnt, created_at
            FROM board
            WHERE board_title LIKE %s
               OR board_ctnt LIKE %s
            ORDER BY created_at DESC
            LIMIT 5
            """
            keyword = _extract_keyword(query)

            cur.execute(
                sql,
                (f"%{keyword}%", f"%{keyword}%")
            )
            
            rows = cur.fetchall()
            
            if not rows:

                cur.execute("""
                    SELECT board_title, board_ctnt
                    FROM board
                    ORDER BY created_at DESC
                    LIMIT 3
                """)

                rows = cur.fetchall()

            for r in rows:
                title = r.get("board_title", "")
                content = r.get("board_ctnt", "")
                docs.append(f"{title}: {content}")

    except Exception as e:
        print("community search error:", e)

    finally:
        try:
            conn.close()
        except:
            pass

    return docs

def _search_popular_posts():

    docs = []

    conn = pymysql.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        db=os.getenv("DB_NAME"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )

    with conn.cursor() as cur:

        cur.execute("""
        SELECT board_title, read_count
        FROM board
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY read_count DESC
        LIMIT 3
        """)

        rows = cur.fetchall()

        for r in rows:
            docs.append(
                f"제목: {r['board_title']} (조회수 {r['read_count']})"
            )

    conn.close()

    return docs