from flask import Flask, render_template, redirect, url_for, flash, session,request
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
import os
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
    # Sample static data — replace with Supabase query for real-time
    featured_markets = [
        {
            "id": 1,
            "title": "Will BTC cross $70K by June?",
            "description": "Predict if Bitcoin will break the $70K barrier.",
            "end_date": "2025-06-30",
            "price_yes": "0.58",
            "price_no": "0.42"
        },
        {
            "id": 2,
            "title": "Will the next US president be Democrat?",
            "description": "Trade on the outcome of the 2024 US election.",
            "end_date": "2025-11-08",
            "price_yes": "0.64",
            "price_no": "0.36"
        }
    ]
    return render_template("home.html", featured_markets=featured_markets)


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
        
        try:
            response = supabase.auth.sign_up({
                "email": email,
                "password": password
            })
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            flash(f'Registration failed: {e}', 'error')
    
    return render_template('auth/register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))



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

@app.route("/market/<int:market_id>")
def market_detail(market_id):
    market = Market.query.get(market_id)
    if not market:
        flash("Market not found", "error")
        return redirect(url_for('home'))

    trades = Trade.query.filter_by(market_id=market_id).order_by(Trade.timestamp.desc()).all()

    return render_template("market.html", market=market, trades=trades)


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)