"""
Seed script for populating demo data in the AI Exam Module database
"""
import sys
from datetime import datetime
from pathlib import Path

# Add the parent directory to the path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from app.core.database import engine, SessionLocal
from app.models.exam import Base, User, Exam
from sqlalchemy.orm import Session

# Create all tables
Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()
    
    try:
        # Check if demo users already exist
        existing_faculty = db.query(User).filter(User.email == "faculty@demo.com").first()
        if existing_faculty:
            print("✓ Demo users already exist in the database")
            return
        
        # Create demo faculty user for AI exam module
        demo_faculty = User(
            username="faculty_demo",
            email="faculty@demo.com",
            full_name="Demo Faculty",
            role="faculty"
        )
        
        db.add(demo_faculty)
        db.commit()
        
        print("✓ Seeded AI Exam Module database with demo faculty user")
        print("\n✅ AI Exam Module database is ready!\n")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
