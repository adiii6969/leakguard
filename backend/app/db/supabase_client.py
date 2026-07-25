from functools import lru_cache

from supabase import create_client, Client

from app.core.config import get_settings

settings = get_settings()


@lru_cache
def get_service_client() -> Client:
    """
    Privileged client using the service role key. Bypasses RLS —
    used only for trusted backend operations (e.g. purging temp
    storage, writing rows on behalf of an already-authenticated user
    whose identity we've verified via JWT ourselves).
    """
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_user_client(access_token: str) -> Client:
    """
    Client scoped to a specific user's access token, so Postgres RLS
    policies (auth.uid() = user_id) are enforced naturally. Prefer
    this over the service client wherever possible.
    """
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.postgrest.auth(access_token)
    return client
