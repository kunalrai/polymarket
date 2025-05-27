from utils.supabase_client import get_supabase_client
from dotenv import load_dotenv
import os
import requests
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE")

headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

sql = """
create table if not exists markets (
    id serial primary key,
    title text not null,
    description text,
    end_date timestamp not null,
    price_yes float default 0.5,
    price_no float default 0.5,
    is_resolved boolean default false,
    outcome text check (outcome in ('yes', 'no'))
);

create table if not exists trades (
    id serial primary key,
    user_id uuid references auth.users(id) on delete cascade,
    market_id int references markets(id) on delete cascade,
    share_type text check (share_type in ('yes', 'no')) not null,
    amount float not null,
    timestamp timestamp default now()
);

create table if not exists payouts (
    id serial primary key,
    user_id uuid references auth.users(id) on delete cascade,
    market_id int references markets(id) on delete cascade,
    winning_shares float not null,
    payout_amount float not null,
    timestamp timestamp default now()
);
"""

# Make sure you have a Supabase edge function called `execute_sql` that runs SQL
resp = requests.post(
    f"{SUPABASE_URL}/rest/v1/rpc/execute_sql",
    headers=headers,
    json={"query": sql}
)

print("Status Code:", resp.status_code)
print("Response:", resp.text)