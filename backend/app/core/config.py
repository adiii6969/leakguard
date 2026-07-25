from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str

    # Gemini
    gemini_api_key: str
    gemini_model: str = "gemini-2.0-flash"

    # App
    environment: str = "development"
    allowed_origins: str = "http://localhost:3000"
    max_upload_size_mb: int = 10

    # Detection thresholds
    recurring_min_occurrences: int = 2
    duplicate_match_threshold: int = 90
    merchant_match_threshold: int = 82
    price_hike_threshold_pct: float = 5.0

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
