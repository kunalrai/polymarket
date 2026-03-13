from datetime import datetime, timedelta
from flask import Flask, jsonify, render_template, redirect, url_for, flash, session, request
from dotenv import load_dotenv
from flask_cors import CORS
import os
import requests
import bcrypt
import secrets
from functools import wraps
from types import SimpleNamespace
from utils.convex_client import get_convex_client

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "change-me-in-production")
CORS(app)

convex = get_convex_client()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _to_obj(d):
    """Recursively convert a Convex result dict to an object with attribute access.
    Maps _id -> id and converts millisecond timestamps to datetime objects."""
    TIMESTAMP_FIELDS = {"end_date", "created_at", "timestamp", "resolved_at", "expires_at"}
    if isinstance(d, dict):
        obj = {}
        for k, v in d.items():
            attr = "id" if k == "_id" else k
            if k in TIMESTAMP_FIELDS and isinstance(v, (int, float)):
                obj[attr] = datetime.utcfromtimestamp(v / 1000)
            else:
                obj[attr] = _to_obj(v)
        return SimpleNamespace(**obj)
    if isinstance(d, list):
        return [_to_obj(item) for item in d]
    return d


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        admin_email = os.getenv("ADMIN_EMAIL")
        if "user" not in session or session["user"].get("email") != admin_email:
            flash("Unauthorized access", "error")
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def home():
    results = convex.query("markets:getActive")
    featured_markets = [_to_obj(m) for m in (results or [])]
    return render_template("home.html", featured_markets=featured_markets)


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")

        admin_email = os.getenv("ADMIN_EMAIL")
        admin_password = os.getenv("ADMIN_PASSWORD")

        if email == admin_email and password == admin_password:
            session["user"] = {"email": email, "is_admin": True}
            flash("Logged in as Admin!", "success")
            return redirect(url_for("admin"))

        # Look up user in Convex
        user = convex.query("users:getByEmail", {"email": email})
        if user and bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
            session["user"] = {"email": email, "is_admin": False}
            flash("Successfully logged in!", "success")
            return redirect(url_for("home"))

        flash("Invalid credentials", "error")

    return render_template("auth/login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")

        if not email or not password:
            flash("Email and password are required", "error")
            return render_template("auth/register.html")

        if len(password) < 6:
            flash("Password must be at least 6 characters long", "error")
            return render_template("auth/register.html")

        try:
            password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            convex.mutation("users:create", {"email": email, "password_hash": password_hash})
            flash("Registration successful! You can now log in.", "success")
            return redirect(url_for("login"))
        except Exception as e:
            if "already registered" in str(e).lower():
                flash("This email is already registered. Please login instead.", "error")
                return redirect(url_for("login"))
            app.logger.error(f"Registration error: {e}")
            flash("Registration failed. Please try again later.", "error")

    return render_template("auth/register.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/admin", methods=["GET", "POST"])
@admin_required
def admin():
    if request.method == "POST":
        title = request.form.get("title")
        description = request.form.get("description")
        end_date_str = request.form.get("end_date")
        price_yes = float(request.form.get("price_yes"))
        price_no = float(request.form.get("price_no"))

        end_date_ms = int(datetime.strptime(end_date_str, "%Y-%m-%d").timestamp() * 1000)
        convex.mutation("markets:create", {
            "title": title,
            "description": description,
            "end_date": end_date_ms,
            "price_yes": price_yes,
            "price_no": price_no,
        })
        flash("Market created successfully!", "success")
        return redirect(url_for("admin"))

    results = convex.query("markets:getAll")
    markets = [_to_obj(m) for m in (results or [])]
    return render_template("admin.html", markets=markets)


@app.route("/admin/create-btc-market", methods=["GET", "POST"])
@admin_required
def create_btc_market():
    try:
        url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
        response = requests.get(url, verify=False)
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
        return jsonify({"success": False, "message": str(e)})


@app.route("/market/<string:market_id>")
def market_detail(market_id):
    market_data = convex.query("markets:getById", {"id": market_id})
    if not market_data:
        flash("Market not found", "error")
        return redirect(url_for("home"))

    market = _to_obj(market_data)
    trades_data = convex.query("trades:getByMarket", {"market_id": market_id})
    trades = [_to_obj(t) for t in (trades_data or [])]

    return render_template("market.html", market=market, trades=trades)


@app.route("/trade/<string:market_id>/<string:share_type>", methods=["GET", "POST"])
def trade(market_id, share_type):
    if "user" not in session:
        flash("Please log in to trade", "error")
        return redirect(url_for("login"))

    if share_type not in ["yes", "no"]:
        flash("Invalid share type", "error")
        return redirect(url_for("market_detail", market_id=market_id))

    market_data = convex.query("markets:getById", {"id": market_id})
    if not market_data:
        flash("Market not found", "error")
        return redirect(url_for("home"))

    market = _to_obj(market_data)

    if request.method == "POST":
        amount = float(request.form.get("amount", 0))
        user_id = session["user"]["email"]
        price = market_data["price_yes"] if share_type == "yes" else market_data["price_no"]

        if amount <= 0:
            flash("Amount must be greater than 0", "error")
            return redirect(request.url)

        convex.mutation("trades:create", {
            "user_id": user_id,
            "market_id": market_id,
            "share_type": share_type,
            "amount": amount,
            "price_at_trade": price,
        })
        flash(f"Bought {amount} {share_type.upper()} shares at ${price}", "success")
        return redirect(url_for("market_detail", market_id=market_id))

    return render_template("trade.html", market=market, share_type=share_type)


@app.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():
    if request.method == "POST":
        email = request.form.get("email")
        user = convex.query("users:getByEmail", {"email": email})
        if user:
            token = secrets.token_urlsafe(32)
            expires_at = int((datetime.utcnow() + timedelta(hours=1)).timestamp() * 1000)
            convex.mutation("users:createResetToken", {
                "email": email,
                "token": token,
                "expires_at": expires_at,
            })
            reset_url = url_for("set_new_password", token=token, _external=True)
            # TODO: send reset_url via email. For now, log it.
            app.logger.info(f"Password reset link for {email}: {reset_url}")
            flash(
                f"Password reset link generated. Check server logs (configure email sending to deliver it automatically).",
                "success",
            )
        else:
            # Don't reveal whether the email exists
            flash("If that email is registered, a reset link has been generated.", "success")

    return render_template("auth/forgot_password.html")


@app.route("/set-new-password", methods=["GET", "POST"])
def set_new_password():
    token = request.args.get("token")
    if not token:
        flash("Invalid or missing token", "error")
        return redirect(url_for("login"))

    if request.method == "POST":
        new_password = request.form.get("new_password")
        if len(new_password) < 6:
            flash("Password must be at least 6 characters", "error")
            return render_template("auth/set_new_password.html", token=token)

        record = convex.query("users:getResetToken", {"token": token})
        if not record:
            flash("Reset token is invalid or expired", "error")
            return redirect(url_for("login"))

        expires_at = datetime.utcfromtimestamp(record["expires_at"] / 1000)
        if datetime.utcnow() > expires_at:
            convex.mutation("users:deleteResetToken", {"token": token})
            flash("Reset token has expired. Please request a new one.", "error")
            return redirect(url_for("forgot_password"))

        password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
        convex.mutation("users:updatePassword", {
            "email": record["email"],
            "password_hash": password_hash,
        })
        convex.mutation("users:deleteResetToken", {"token": token})
        flash("Password updated successfully. You can now log in.", "success")
        return redirect(url_for("login"))

    return render_template("auth/set_new_password.html", token=token)


@app.route("/markets")
def explore_markets():
    category = request.args.get("category", "all")
    sort_by = request.args.get("sort", "created_at")
    search = request.args.get("search", "")

    results = convex.query("markets:searchActive", {
        "search": search or None,
        "category": category or None,
        "sort_by": sort_by or None,
    })
    markets = [_to_obj(m) for m in (results or [])]

    db_categories = convex.query("markets:getCategories") or []
    default_categories = ["Crypto", "Politics", "Sports", "Technology", "Entertainment"]
    categories = sorted(set(default_categories + list(db_categories)))

    return render_template(
        "explore_markets.html",
        markets=markets,
        categories=categories,
        current_category=category,
        current_sort=sort_by,
        search_query=search,
    )


if __name__ == "__main__":
    app.run(debug=True)
