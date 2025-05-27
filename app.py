from flask import Flask, render_template, redirect, url_for, flash, session,request
from dotenv import load_dotenv
import os
from utils.supabase_client import get_supabase_client

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')
supabase = get_supabase_client()

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
        
        try:
            response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            session['user'] = response.user
            flash('Successfully logged in!', 'success')
            return redirect(url_for('markets'))
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
            flash('Registration failed', {e})
    
    return render_template('auth/register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)