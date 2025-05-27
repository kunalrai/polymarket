# Polymarket - Prediction Markets Platform

A modern, decentralized prediction markets platform built with Flask and Supabase, featuring real-time market data and cryptocurrency integration.

## Features

- 🔐 Secure Authentication with Supabase
- 📊 Real-time Market Creation and Management
- 💰 Cryptocurrency Price Integration
- 👑 Admin Dashboard with Market Controls
- 🎨 Modern, Responsive UI with Three.js Animations
- 📱 Mobile-Friendly Design

## Tech Stack

- **Backend**: Flask (Python)
- **Database**: SQLite, Supabase
- **Frontend**: HTML, CSS, JavaScript
- **UI Framework**: Tailwind CSS
- **Authentication**: Supabase Auth
- **3D Graphics**: Three.js
- **API Integration**: CoinGecko/CoinDCX

## Prerequisites

- Python 3.8+
- Node.js (for Tailwind CSS)
- Supabase Account
- Git

## Installation

1. Clone the repository:
   ```cmd
   git clone https://github.com/yourusername/polymarket.git
   cd polymarket
   ```

2. Create and activate a virtual environment:
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```

3. Install dependencies:
   ```cmd
   pip install -r requirements.txt
   ```

4. Set up environment variables in `.env`:
   ```plaintext
   FLASK_APP=app.py
   FLASK_ENV=development
   FLASK_DEBUG=1
   ADMIN_EMAIL=your-admin-email@example.com
   ADMIN_PASSWORD=your-admin-password
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-anon-key
   SECRET_KEY=your-flask-secret-key
   ```

5. Initialize the database:
   ```cmd
   python
   >>> from app import app, db
   >>> app.app_context().push()
   >>> db.create_all()
   >>> exit()
   ```

## Running the Application

1. Start the Flask server:
   ```cmd
   python app.py
   ```

2. Visit http://localhost:5000 in your browser

## Project Structure

```
polymarket/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── setup_supabase.py  # Supabase configuration
├── instance/          # SQLite database
├── models/            # Database models
├── templates/         # HTML templates
│   ├── auth/         # Authentication templates
│   └── ...           # Other templates
├── utils/            # Utility functions
└── static/           # Static assets
```

## Features in Detail

### Authentication

- User registration and login via Supabase
- Admin authentication
- Session management

### Market Management

- Create prediction markets
- Real-time BTC market creation
- Market resolution
- Price updates

### Admin Features

- Market creation and management
- BTC market automation
- User management
- Market resolution controls

### UI/UX

- Animated 3D background
- Responsive design
- Interactive market cards
- Real-time updates

## API Integration

The platform integrates with:

- Supabase for authentication and data storage
- CoinGecko/CoinDCX for cryptocurrency price data

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Flask team for the excellent web framework
- Supabase team for the authentication and database services
- Three.js team for 3D graphics capabilities
- Tailwind CSS team for the UI framework

## Contact

Your Name - [@yourusername](https://twitter.com/yourusername) Project Link: [https://github.com/yourusername/polymarket](https://github.com/yourusername/polymarket)