from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    openai_api_key: str = ""
    watsonx_api_key: str = ""
    milvus_uri: str = "http://localhost:19530"
    default_model: str = "gpt-4.1-mini"


settings = Settings()
