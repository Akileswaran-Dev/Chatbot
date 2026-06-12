import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENV: str = "development"
    PROJECT_NAME: str = "Gemini Chatbot SaaS"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str
    JWT_SECRET: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GEMINI_API_KEY: str
    CORS_ORIGINS: str = '["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]'

    # Load environment configuration from .env file
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
