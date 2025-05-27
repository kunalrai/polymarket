from datetime import datetime
from flask import Flask, jsonify, render_template, redirect, url_for, flash, session,request
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
import os
from flask_cors import CORS
import requests
from utils.supabase_client import get_supabase_client
from models.models import Market, Trade
from functools import wraps
from models.models import db

load_dotenv()

app = Flask(__name__)
app.secret_key = "secret_key"  # Change this to a secure key in production
supabase = get_supabase_client()
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///markets.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app) 
db.init_app(app)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        admin_email = os.getenv("ADMIN_EMAIL")
        if 'user' not in session or session['user']['email'] != admin_email:
            flash("Unauthorized access", "error")
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function


@app.route('/')
def home():
  
    featured_markets = Market.query \
        .filter(Market.status == 'active') \
        .filter(Market.end_date > datetime.utcnow()) \
        .order_by(Market.created_at.desc()) \
        .limit(6) \
        .all()
    
    return render_template('home.html', featured_markets=featured_markets)


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        # Check if it's the admin
        admin_email = os.getenv("ADMIN_EMAIL")
        admin_password = os.getenv("ADMIN_PASSWORD")

        if email == admin_email and password == admin_password:
            session['user'] = {"email": email, "is_admin": True}
            flash('Logged in as Admin!', 'success')
            return redirect(url_for('admin'))

        # Else try Supabase auth
        try:
            response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            session['user'] = {"email": email, "is_admin": False}
            flash('Successfully logged in!', 'success')
            return redirect(url_for('home'))
        except Exception as e:
            flash('Invalid credentials', 'error')

    return render_template('auth/login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Input validation
        if not email or not password:
            flash('Email and password are required', 'error')
            return render_template('auth/register.html')
        
        if len(password) < 6:
            flash('Password must be at least 6 characters long', 'error')
            return render_template('auth/register.html')
        
        try:
            # Validate Supabase configuration first
            from utils.supabase_client import validate_supabase_config
            is_valid, error_message = validate_supabase_config()
            
            if not is_valid:
                app.logger.error(f"Supabase configuration error: {error_message}")
                flash('Server configuration error. Please try again later.', 'error')
                return render_template('auth/register.html')
            
            # Get Supabase client
            client = get_supabase_client()
            if not client:
                flash('Unable to connect to authentication service', 'error')
                return render_template('auth/register.html')
            
            # Attempt to register with retry
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    response = client.auth.sign_up({
                        "email": email,
                        "password": password,
                        "options": {
                            "data": {
                                "email": email
                            }
                        }
                    })
                    
                    if hasattr(response.user, 'id'):
                        flash('Registration successful! Please check your email to confirm your account.', 'success')
                        return redirect(url_for('login'))
                    break
                except Exception as e:
                    if "User already registered" in str(e):
                        flash('This email is already registered. Please login instead.', 'error')
                        return redirect(url_for('login'))
                    elif attempt < max_retries - 1:
                        app.logger.warning(f"Registration attempt {attempt + 1} failed: {str(e)}")
                        continue
                    else:
                        raise
                        
        except Exception as e:
            app.logger.error(f"Registration error: {str(e)}")
            flash('Registration failed. Please try again later.', 'error')
    
    return render_template('auth/register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/session', methods=['POST'])
def create_session():
    data = request.get_json()
    access_token = data.get('access_token')
    refresh_token = data.get('refresh_token')

    # Decode JWT to extract user info if needed
    session['user'] = {
        'access_token': access_token,
        'refresh_token': refresh_token
    }
    return '', 204

@app.route('/admin', methods=['GET', 'POST'])
@admin_required
def admin():
    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description')
        end_date = request.form.get('end_date')
        price_yes = float(request.form.get('price_yes'))
        price_no = float(request.form.get('price_no'))

        new_market = Market(
            title=title,
            description=description,
            end_date=end_date,
            price_yes=price_yes,
            price_no=price_no
        )
        db.session.add(new_market)
        db.session.commit()
        flash("Market created successfully!", "success")
        return redirect(url_for('admin'))

    markets = Market.query.order_by(Market.end_date.desc()).all()
    return render_template('admin.html', markets=markets)

@app.route('/admin/create-btc-market',methods=['GET', 'POST'])
@admin_required

def create_btc_market():
    try:
        # 1. Fetch BTC price from CoinGecko
        url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
        response = requests.get(url, verify=False)
        response.raise_for_status()
        price = float(response.json()['bitcoin']['usd'])

        # 2. Generate dynamic question
        rounded_price = round(price, -2)  # round to nearest hundred
        threshold = rounded_price + 2000 if price < 70000 else rounded_price - 2000
        trend = "cross" if price < threshold else "fall below"
        title = f"Will BTC {trend} ${threshold:,.0f} by June 2025?"
        description = f"Live market based on current BTC price (${price:,.2f}) using CoinGecko data."

        # 3. Create Market
        end_date = datetime(2025, 6, 30)
        market = Market(
            title=title,
            description=description,
            end_date=end_date
        )
        db.session.add(market)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "BTC market created",
            "market": {
                "title": market.title,
                "description": market.description,
                "end_date": end_date.strftime('%Y-%m-%d'),
                "price_yes": 0.58 if price < threshold else 0.35,
                "price_no": 1 - (0.58 if price < threshold else 0.35)
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
    
@app.route("/market/<string:market_id>")
def market_detail(market_id):
    market = Market.query.get(market_id)
    if not market:
        flash("Market not found", "error")
        return redirect(url_for('home'))

    trades = Trade.query.filter_by(market_id=market_id).order_by(Trade.created_at.desc()).all()

    return render_template("market.html", market=market, trades=trades)


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)