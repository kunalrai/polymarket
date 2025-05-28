from app import app, db
from models.models import Market
from sqlalchemy import text

def migrate_database():
    with app.app_context():
        # Add the new columns using the correct SQLAlchemy syntax
        with db.engine.connect() as conn:
            try:
                # Add category column
                conn.execute(text('ALTER TABLE markets ADD COLUMN category VARCHAR(255)'))
                # Add volume column
                conn.execute(text('ALTER TABLE markets ADD COLUMN volume FLOAT DEFAULT 0.0'))
                # Commit the changes
                conn.commit()
                print("Migration completed successfully!")
            except Exception as e:
                if "duplicate column" in str(e).lower():
                    print("Columns already exist, skipping migration")
                else:
                    print(f"Error during migration: {str(e)}")
                return

if __name__ == '__main__':
    migrate_database()
