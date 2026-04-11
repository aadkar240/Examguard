from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Enum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class ExamType(str, enum.Enum):
    INTERNAL = "Internal"
    SEMESTER = "Semester"
    MCQ = "MCQ"
    PRACTICAL = "Practical"

class ExamStatus(str, enum.Enum):
    DRAFT = "Draft"
    PUBLISHED = "Published"
    ARCHIVED = "Archived"

class QuestionType(str, enum.Enum):
    MCQ = "MCQ"
    SHORT = "Short Answer"
    LONG = "Long Answer"

class DifficultyLevel(str, enum.Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String)  # Admin, Faculty, Student
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    created_exams = relationship("Exam", back_populates="creator", foreign_keys="Exam.created_by")

class Exam(Base):
    __tablename__ = "exams"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    subject = Column(String, index=True)
    total_marks = Column(Integer)
    duration = Column(Integer)  # in minutes
    exam_type = Column(Enum(ExamType))
    topics = Column(JSON)  # List of topics
    difficulty_distribution = Column(JSON)  # {"easy": 30, "medium": 50, "hard": 20}
    marks_structure = Column(JSON)  # {"mcq": 20, "short": 30, "long": 50}
    created_by = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(ExamStatus), default=ExamStatus.DRAFT)
    is_ai_generated = Column(Integer, default=0)  # 0: Manual, 1: AI Generated
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)
    
    # Relationships
    creator = relationship("User", back_populates="created_exams", foreign_keys=[created_by])
    questions = relationship("Question", back_populates="exam", cascade="all, delete-orphan")
    ai_logs = relationship("AIGenerationLog", back_populates="exam", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="exam", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    question_number = Column(Integer)
    question_text = Column(Text)
    question_type = Column(Enum(QuestionType))
    marks = Column(Integer)
    difficulty_level = Column(Enum(DifficultyLevel))
    
    # For MCQ
    options = Column(JSON, nullable=True)  # ["Option A", "Option B", "Option C", "Option D"]
    correct_answer = Column(String, nullable=True)  # "A" or index
    
    # For all question types
    explanation = Column(Text, nullable=True)
    model_answer = Column(Text, nullable=True)
    marking_scheme = Column(JSON, nullable=True)  # Detailed marking criteria
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    exam = relationship("Exam", back_populates="questions")

class AIGenerationLog(Base):
    __tablename__ = "ai_generation_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    prompt_text = Column(Text)
    ai_response = Column(JSON)  # Full AI response
    model_used = Column(String)  # Groq model name
    tokens_used = Column(Integer, nullable=True)
    generation_time = Column(Float, nullable=True)  # in seconds
    version = Column(Integer, default=1)
    status = Column(String)  # Success, Failed, Pending
    error_message = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    exam = relationship("Exam", back_populates="ai_logs")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)  # Created, Updated, Published, Deleted
    details = Column(JSON)  # Additional details about the action
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    exam = relationship("Exam", back_populates="audit_logs")
    user = relationship("User")
