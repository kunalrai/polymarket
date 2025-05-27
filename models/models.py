from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
import enum

db = SQLAlchemy()

# Enums
class MarketStatus(enum.Enum):
    active = 'active'
    resolved = 'resolved'

class Outcome(enum.Enum):
    yes = 'yes'
    no = 'no'

class ShareType(enum.Enum):
    yes = 'yes'
    no = 'no'


# Market Table
class Market(db.Model):
    __tablename__ = 'markets'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    end_date = db.Column(db.DateTime)
    is_featured = db.Column(db.Boolean, default=False)
    status = db.Column(db.Enum(MarketStatus), default=MarketStatus.active)
    outcome = db.Column(db.Enum(Outcome), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    price_yes = db.Column(db.Float, nullable=False, default=0.5)
    price_no = db.Column(db.Float, nullable=False, default=0.5)


# Trade Table
class Trade(db.Model):
    __tablename__ = 'trades'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String, nullable=False)  # Supabase UID
    market_id = db.Column(db.String, db.ForeignKey('markets.id'), nullable=False)
    share_type = db.Column(db.Enum(ShareType), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    price_at_trade = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# Market Price History
class MarketPrice(db.Model):
    __tablename__ = 'market_prices'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    market_id = db.Column(db.String, db.ForeignKey('markets.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    price_yes = db.Column(db.Float)
    price_no = db.Column(db.Float)


# Holdings Table
class Holding(db.Model):
    __tablename__ = 'holdings'
    user_id = db.Column(db.String, primary_key=True)  # Supabase UID
    market_id = db.Column(db.String, db.ForeignKey('markets.id'), primary_key=True)
    share_type = db.Column(db.Enum(ShareType), primary_key=True)
    quantity = db.Column(db.Float, nullable=False)


# Admin Resolution Log
class MarketResolutionLog(db.Model):
    __tablename__ = 'market_resolution_log'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    market_id = db.Column(db.String, db.ForeignKey('markets.id'), nullable=False)
    resolved_by = db.Column(db.String, nullable=False)  # Supabase admin UID
    outcome = db.Column(db.Enum(Outcome), nullable=False)
    resolved_at = db.Column(db.DateTime, default=datetime.utcnow)
