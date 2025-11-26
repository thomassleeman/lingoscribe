from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

# Get Supabase credentials from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Debug prints
print(f"DEBUG - URL: {SUPABASE_URL}")
print(f"DEBUG - Key length: {len(SUPABASE_SERVICE_KEY) if SUPABASE_SERVICE_KEY else 0}")
print(f"DEBUG - Key starts with: {SUPABASE_SERVICE_KEY[:20] if SUPABASE_SERVICE_KEY else None}")
print(f"DEBUG - Key repr: {repr(SUPABASE_SERVICE_KEY[:30]) if SUPABASE_SERVICE_KEY else None}")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Missing Supabase environment variables")

# Create Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)