from convex import ConvexClient
import os

def get_convex_client() -> ConvexClient:
    url = os.getenv("CONVEX_URL")
    if not url:
        raise ValueError("CONVEX_URL environment variable is not set")
    return ConvexClient(url)
