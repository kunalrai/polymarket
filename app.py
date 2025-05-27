from flask import Flask, render_template, redirect, url_for, flash, session,request
from dotenv import load_dotenv
import os
from utils.supabase_client import get_supabase_client

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')
supabase = get_supabase_client()

@app.route('/')
def index():
    return redirect(url_for('login'))

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
            flash('Registration failed', 'error')
    
    return render_template('auth/register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)