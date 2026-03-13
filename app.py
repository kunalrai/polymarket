from datetime import datetime, timedelta
from flask import Flask, jsonify, session, request, send_from_directory
from dotenv import load_dotenv
from flask_cors import CORS
import os
import requests
import bcrypt
import secrets
from functools import wraps
from utils.convex_client import get_convex_client

load_dotenv()

app = Flask(__name__, static_folder=None)
app.secret_key = os.getenv("SECRET_KEY", "change-me-in-production")
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True

CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

convex = get_convex_client()

FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "frontend", "dist")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def convex_to_json(d):
    """Recursively convert a Convex result dict to a JSON-serialisable dict.
    Maps _id -> id and converts millisecond timestamps to ISO-8601 strings."""
    TIMESTAMP_FIELDS = {"end_date", "created_at", "timestamp", "resolved_at", "expires_at"}
    if isinstance(d, dict):
        obj = {}
        for k, v in d.items():
            key = "id" if k == "_id" else k
            if k in TIMESTAMP_FIELDS and isinstance(v, (int, float)):
                obj[key] = datetime.utcfromtimestamp(v / 1000).isoformat() + "Z"
            else:
                obj[key] = convex_to_json(v)
        return obj
    if isinstance(d, list):
        return [convex_to_json(item) for item in d]
    return d


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user" not in session:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        admin_email = os.getenv("ADMIN_EMAIL")
        user = session.get("user")
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        if not user.get("is_admin") and user.get("email") != admin_email:
            return jsonify({"error": "Forbidden"}), 403
        return f(*args, **kwargs)
    return decorated


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

@app.route("/api/me")
def me():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify({"email": user["email"], "is_admin": user.get("is_admin", False)})


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if email == admin_email and password == admin_password:
        session["user"] = {"email": email, "is_admin": True}
        return jsonify({"email": email, "is_admin": True})

    user = convex.query("users:getByEmail", {"email": email})
    if user and bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        session["user"] = {"email": email, "is_admin": False}
        return jsonify({"email": email, "is_admin": False})

    return jsonify({"error": "Invalid credentials"}), 401


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400

    try:
        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        convex.mutation("users:create", {"email": email, "password_hash": password_hash})
        return jsonify({"message": "Registration successful! You can now log in."})
    except Exception as e:
        if "already registered" in str(e).lower():
            return jsonify({"error": "This email is already registered. Please login instead."}), 409
        app.logger.error(f"Registration error: {e}")
        return jsonify({"error": "Registration failed. Please try again later."}), 500


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"})


# ---------------------------------------------------------------------------
# Market routes
# ---------------------------------------------------------------------------

@app.route("/api/markets/featured")
def featured_markets():
    results = convex.query("markets:getActive")
    markets = [convex_to_json(m) for m in (results or [])]
    return jsonify(markets)


@app.route("/api/markets")
def explore_markets():
    category = request.args.get("category", "all")
    sort_by = request.args.get("sort", "created_at")
    search = request.args.get("search", "")

    results = convex.query("markets:searchActive", {
        "search": search if search else None,
        "category": category if category and category != "all" else None,
        "sort_by": sort_by if sort_by else None,
    })
    markets = [convex_to_json(m) for m in (results or [])]

    db_categories = convex.query("markets:getCategories") or []
    default_categories = ["Crypto", "Politics", "Sports", "Technology", "Entertainment"]
    categories = sorted(set(default_categories + list(db_categories)))

    return jsonify({"markets": markets, "categories": categories})


@app.route("/api/markets/<string:market_id>")
def market_detail(market_id):
    market_data = convex.query("markets:getById", {"id": market_id})
    if not market_data:
        return jsonify({"error": "Market not found"}), 404

    market = convex_to_json(market_data)
    trades_data = convex.query("trades:getByMarket", {"market_id": market_id})
    trades = [convex_to_json(t) for t in (trades_data or [])]

    return jsonify({"market": market, "trades": trades})


# ---------------------------------------------------------------------------
# Trade routes
# ---------------------------------------------------------------------------

@app.route("/api/trade/<string:market_id>/<string:share_type>", methods=["POST"])
@login_required
def trade(market_id, share_type):
    if share_type not in ["yes", "no"]:
        return jsonify({"error": "Invalid share type"}), 400

    market_data = convex.query("markets:getById", {"id": market_id})
    if not market_data:
        return jsonify({"error": "Market not found"}), 404

    data = request.get_json() or {}
    try:
        amount = float(data.get("amount", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid amount"}), 400

    if amount <= 0:
        return jsonify({"error": "Amount must be greater than 0"}), 400

    user_id = session["user"]["email"]
    price = market_data["price_yes"] if share_type == "yes" else market_data["price_no"]

    convex.mutation("trades:create", {
        "user_id": user_id,
        "market_id": market_id,
        "share_type": share_type,
        "amount": amount,
        "price_at_trade": price,
    })

    return jsonify({"message": f"Bought {amount} {share_type.upper()} shares at ${price}"})


# ---------------------------------------------------------------------------
# Admin routes
# ---------------------------------------------------------------------------

@app.route("/api/admin/markets", methods=["GET"])
@admin_required
def admin_get_markets():
    results = convex.query("markets:getAll")
    markets = [convex_to_json(m) for m in (results or [])]
    return jsonify(markets)


@app.route("/api/admin/markets", methods=["POST"])
@admin_required
def admin_create_market():
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    end_date_str = data.get("end_date", "")
    price_yes = data.get("price_yes")
    price_no = data.get("price_no")

    if not title or not description or not end_date_str or price_yes is None or price_no is None:
        return jsonify({"error": "All fields are required"}), 400

    try:
        end_date_ms = int(datetime.strptime(end_date_str, "%Y-%m-%d").timestamp() * 1000)
        price_yes = float(price_yes)
        price_no = float(price_no)
    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid data: {e}"}), 400

    convex.mutation("markets:create", {
        "title": title,
        "description": description,
        "end_date": end_date_ms,
        "price_yes": price_yes,
        "price_no": price_no,
    })

    return jsonify({"message": "Market created successfully!"})


@app.route("/api/admin/btc-market", methods=["POST"])
@admin_required
def create_btc_market():
    try:
        url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
        response = requests.get(url, verify=False, timeout=10)
        response.raise_for_status()
        price = float(response.json()["bitcoin"]["usd"])

        rounded_price = round(price, -2)
        threshold = rounded_price + 2000 if price < 70000 else rounded_price - 2000
        trend = "cross" if price < threshold else "fall below"
        title = f"Will BTC {trend} ${threshold:,.0f} by June 2025?"
        description = f"Live market based on current BTC price (${price:,.2f}) using CoinGecko data."

        end_date_ms = int(datetime(2025, 6, 30).timestamp() * 1000)
        price_yes = 0.58 if price < threshold else 0.35
        price_no = round(1 - price_yes, 2)

        convex.mutation("markets:create", {
            "title": title,
            "description": description,
            "end_date": end_date_ms,
            "price_yes": price_yes,
            "price_no": price_no,
        })

        return jsonify({
            "success": True,
            "message": "BTC market created",
            "market": {
                "title": title,
                "description": description,
                "end_date": "2025-06-30",
                "price_yes": price_yes,
                "price_no": price_no,
            },
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ---------------------------------------------------------------------------
# Password reset routes
# ---------------------------------------------------------------------------

@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = data.get("email", "").strip()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = convex.query("users:getByEmail", {"email": email})
    if user:
        token = secrets.token_urlsafe(32)
        expires_at = int((datetime.utcnow() + timedelta(hours=1)).timestamp() * 1000)
        convex.mutation("users:createResetToken", {
            "email": email,
            "token": token,
            "expires_at": expires_at,
        })
        reset_url = f"/set-new-password?token={token}"
        app.logger.info(f"Password reset link for {email}: {reset_url}")

    return jsonify({
        "message": "If that email is registered, a reset link has been generated. Check server logs."
    })


@app.route("/api/set-new-password", methods=["POST"])
def set_new_password():
    data = request.get_json() or {}
    token = data.get("token", "").strip()
    new_password = data.get("new_password", "")

    if not token:
        return jsonify({"error": "Token is required"}), 400

    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    record = convex.query("users:getResetToken", {"token": token})
    if not record:
        return jsonify({"error": "Reset token is invalid or expired"}), 400

    expires_at = datetime.utcfromtimestamp(record["expires_at"] / 1000)
    if datetime.utcnow() > expires_at:
        convex.mutation("users:deleteResetToken", {"token": token})
        return jsonify({"error": "Reset token has expired. Please request a new one."}), 400

    password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    convex.mutation("users:updatePassword", {
        "email": record["email"],
        "password_hash": password_hash,
    })
    convex.mutation("users:deleteResetToken", {"token": token})

    return jsonify({"message": "Password updated successfully. You can now log in."})


# ---------------------------------------------------------------------------
# Serve React in production
# ---------------------------------------------------------------------------

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    dist = FRONTEND_DIST
    if path and os.path.exists(os.path.join(dist, path)):
        return send_from_directory(dist, path)
    index = os.path.join(dist, "index.html")
    if os.path.exists(index):
        return send_from_directory(dist, "index.html")
    return jsonify({"error": "Frontend not built. Run `npm run build` in the frontend/ directory."}), 404


if __name__ == "__main__":
    app.run(debug=True)
