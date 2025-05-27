from supabase import create_client, Client
import os
import logging
from typing import Optional
import requests
from requests.exceptions import RequestException

def validate_supabase_config() -> tuple[bool, str]:
    """Validate Supabase configuration."""
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_KEY')
    
    if not url or not key:
        return False, "Supabase URL or Key not configured"
    
    try:
        # Try to make a simple request to verify the connection
        headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}'
        }
        response = requests.get(f"{url}/rest/v1/", headers=headers, timeout=5)
        response.raise_for_status()
        return True, "Configuration valid"
    except RequestException as e:
        logging.error(f"Supabase connection error: {str(e)}")
        return False, f"Connection error: {str(e)}"

def get_supabase_client() -> Optional[Client]:
    """Get a configured Supabase client with error handling."""
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_KEY')
    
    if not url or not key:
        logging.error("Supabase configuration missing")
        return None
        
    try:
        client = create_client(url, key)
        return client
    except Exception as e:
        logging.error(f"Failed to create Supabase client: {str(e)}")
        return None