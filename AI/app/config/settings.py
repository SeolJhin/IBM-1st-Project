# app/config/settings.py
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ── LLM Provider ──────────────────────────────────────────────
    llm_provider: str = "groq"

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
    watsonx_embedding_model_id: str = ""

    # ── Spring Boot (Tool Calling 역방향 호출) ★ 추가 ─────────────
    spring_base_url: str = "http://localhost:8080"

    # ── Milvus (RAG 벡터DB) ───────────────────────────────────────
    milvus_uri: str = ""
    milvus_token: str = ""
    milvus_db_name: str = "default"
    milvus_collection: str = "uniplace_knowledge"

    # ── Embedding ─────────────────────────────────────────────────
    embedding_provider: str = "openai"
    top_k: int = 5
    similarity_threshold: float = 0.2
    default_model: str = "llama-3.3-70b-versatile"

    # ── RAG 파이프라인 ────────────────────────────────────────────
    rag_source_dir: str = str(BASE_DIR / "rag_docs")
    rag_manifest_path: str = str(BASE_DIR / "rag_docs" / ".manifest.json")
    rag_chunk_size: int = 500
    rag_auto_reindex_enabled: bool = False
    rag_reindex_interval_seconds: int = 3600
    rag_reindex_strategy: str = "incremental"

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
