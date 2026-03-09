from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    llm_provider: str = "openai"
    openai_api_key: str = ""
    openai_model: str = "gpt-4.1-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    watsonx_api_key: str = ""
    watsonx_project_id: str = ""
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"
    watsonx_model_id: str = "ibm/granite-3-8b-instruct"
    watsonx_embedding_model_id: str = ""

    milvus_uri: str = ""
    milvus_token: str = ""
    milvus_db_name: str = "default"
    milvus_collection: str = "uniplace_knowledge"

    embedding_provider: str = "openai"
    top_k: int = 5
    similarity_threshold: float = 0.2
    default_model: str = "gpt-4.1-mini"
    voice_input_dir: str = str(BASE_DIR / "runtime" / "voice" / "in")
    voice_output_dir: str = str(BASE_DIR / "runtime" / "voice" / "out")
    rag_source_dir: str = str(BASE_DIR / "data" / "rag")
    rag_manifest_path: str = str(BASE_DIR / "runtime" / "rag" / "index_manifest.json")
    rag_auto_reindex_enabled: bool = True
    rag_reindex_interval_seconds: int = 300
    rag_chunk_size: int = 1200


settings = Settings()
