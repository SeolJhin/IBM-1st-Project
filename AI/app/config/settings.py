# app/config/settings.py
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

def _find_env_file() -> str:
    """여러 경로에서 .env 파일 탐색."""
    candidates = [
        BASE_DIR / ".env",
        BASE_DIR.parent / ".env",
        Path.home() / ".env",
        Path("/app/.env"),
        Path("/home/ubuntu/app/.env"),
        Path("/opt/app/.env"),
    ]
    for p in candidates:
        if p.exists():
            return str(p)
    return str(BASE_DIR / ".env")  # fallback


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_find_env_file(), env_file_encoding="utf-8", extra="ignore")

    # ── LLM Provider ──────────────────────────────────────────────
    llm_provider: str = "gemini"

    # ── Gemini (OpenAI 호환 엔드포인트) ───────────────────────────
    gemini_api_key: str = ""
    gemini_api_key_2: str = ""   # 키 로테이션용 (RPM 한도 2배 확장)
    gemini_api_key_3: str = ""   # 키 로테이션용 (RPM 한도 3배 확장)
    gemini_model: str = "gemini-2.5-flash-lite"
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"

    # ── Groq ──────────────────────────────────────────────────────
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_base_url: str = "https://api.groq.com/openai/v1"

    # ── OpenAI ────────────────────────────────────────────────────
    openai_api_key: str = ""
    openai_model: str = "gpt-4.1-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    # ── WatsonX ───────────────────────────────────────────────────
    watsonx_api_key: str = ""
    watsonx_project_id: str = ""
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"
    watsonx_model_id: str = "ibm/granite-3-8b-instruct"
    watsonx_embedding_model_id: str = "ibm/slate-125m-english-rtrvr"

    # ── Spring Boot (Tool Calling 역방향 호출) ────────────────────
    spring_base_url: str = "http://localhost:8080"

    # ── Milvus (RAG 벡터DB - 유료, 기존 설정 유지) ───────────────
    milvus_uri: str = "http://localhost:19530"
    milvus_token: str = ""
    milvus_db_name: str = "default"
    milvus_collection: str = "uniplace_knowledge"

    # ── ChromaDB (RAG 벡터DB - 무료 로컬, Milvus 대체) ───────────
    # rag_engine: "chroma" (무료 로컬) | "milvus" (유료)
    rag_engine: str = "chroma"
    chroma_persist_dir: str = str(BASE_DIR / "chroma_db")
    chroma_collection: str = "uniplace_knowledge"

    # ── Embedding ─────────────────────────────────────────────────
    embedding_provider: str = "watsonx"
    top_k: int = 5
    similarity_threshold: float = 0.2
    default_model: str = "ibm/granite-3-8b-instruct"

    # ── RAG 파이프라인 ────────────────────────────────────────────
    rag_source_dir: str = str(BASE_DIR / "rag_docs")
    rag_manifest_path: str = str(BASE_DIR / "rag_docs" / ".manifest.json")
    rag_chunk_size: int = 500

    # ── 주변 부동산 매물 조회 (가격 추천 AI) ──────────────────────
    # data.go.kr에서 '오피스텔 전월세 실거래 자료' 신청 후 발급 (무료)
    molit_api_key: str = ""
    # 카카오 지도 API (주소→위경도 변환, 더 정확). 없으면 Nominatim 사용
    kakao_map_api_key: str = ""
    rag_auto_reindex_enabled: bool = False
    rag_reindex_interval_seconds: int = 3600
    rag_reindex_strategy: str = "incremental"

    # ── 웹 검색 (Tavily — 무료 1000회/월) ────────────────────────
    # 발급: https://tavily.com → 대시보드 → API Keys
    # .env에 추가: TAVILY_API_KEY=tvly-xxxx
    tavily_api_key: str = ""
    tavily_max_results: int = 5          # 검색당 최대 결과 수
    tavily_search_depth: str = "basic"   # "basic" (무료) | "advanced" (유료)

    # ── 문서 출력 ─────────────────────────────────────────────────
    document_output_dir: str = str(BASE_DIR / "output_docs")
    payment_input_dir: str = str(BASE_DIR / "data" / "payments" / "raw")
    payment_order_template_path: str = str(BASE_DIR / "data" / "payments" / "raw" / "purchase_order_form.xlsx")
    payment_order_output_dir: str = str(BASE_DIR / "output_docs" / "order_forms")

    # ── 음성 ──────────────────────────────────────────────────────
    voice_input_dir: str = str(BASE_DIR / "voice_input")
    voice_output_dir: str = str(BASE_DIR / "voice_output")

    # ── 모더레이션 ────────────────────────────────────────────────
    moderation_terms_path: str = str(BASE_DIR / "app" / "services" / "moderation" / "terms.json")

    # ── 액션 웹훅 ─────────────────────────────────────────────────
    action_webhook_url: str = ""
    action_webhook_timeout_seconds: int = 5

    # ── 관리자 API ────────────────────────────────────────────────
    ai_admin_api_key: str = ""

    # ── 기타 ──────────────────────────────────────────────────────
    legacy_execute_enabled: bool = True


settings = Settings()