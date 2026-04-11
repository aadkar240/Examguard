from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

class ExamTypeEnum(str, Enum):
    INTERNAL = "Internal"
    SEMESTER = "Semester"
    MCQ = "MCQ"
    PRACTICAL = "Practical"

class ExamStatusEnum(str, Enum):
    DRAFT = "Draft"
    PUBLISHED = "Published"
    ARCHIVED = "Archived"

class QuestionTypeEnum(str, Enum):
    MCQ = "MCQ"
    SHORT = "Short Answer"
    LONG = "Long Answer"

class DifficultyLevelEnum(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"

# Difficulty Distribution Schema
class DifficultyDistribution(BaseModel):
    easy: int = Field(..., ge=0, le=100)
    medium: int = Field(..., ge=0, le=100)
    hard: int = Field(..., ge=0, le=100)
    
    @validator('hard')
    def check_total_is_100(cls, v, values):
        total = values.get('easy', 0) + values.get('medium', 0) + v
        if total != 100:
            raise ValueError('Total difficulty percentage must equal 100')
        return v

# Marks Structure Schema
class MarksStructure(BaseModel):
    mcq: int = Field(default=0, ge=0)
    short: int = Field(default=0, ge=0)
    long: int = Field(default=0, ge=0)

# Question Schemas
class QuestionBase(BaseModel):
    question_text: str
    question_type: QuestionTypeEnum
    marks: int = Field(..., gt=0)
    difficulty_level: DifficultyLevelEnum
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    model_answer: Optional[str] = None
    marking_scheme: Optional[Dict] = None

class QuestionCreate(QuestionBase):
    question_number: int

class QuestionResponse(QuestionBase):
    id: int
    exam_id: int
    question_number: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Exam Schemas
class ExamBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    subject: str = Field(..., min_length=2, max_length=100)
    duration: int = Field(..., gt=0, description="Duration in minutes")
    exam_type: ExamTypeEnum
    topics: List[str] = Field(..., min_items=1)
    difficulty_distribution: DifficultyDistribution
    marks_structure: MarksStructure

class ExamCreate(ExamBase):
    questions: Optional[List[QuestionCreate]] = None

class ExamUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    duration: Optional[int] = None
    exam_type: Optional[ExamTypeEnum] = None
    topics: Optional[List[str]] = None
    difficulty_distribution: Optional[DifficultyDistribution] = None
    marks_structure: Optional[MarksStructure] = None

class ExamResponse(ExamBase):
    id: int
    total_marks: int
    status: ExamStatusEnum
    is_ai_generated: bool
    created_by: int
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    question_count: int = 0
    
    class Config:
        from_attributes = True

class ExamDetailResponse(ExamResponse):
    questions: List[QuestionResponse] = []

# AI Generation Schemas
class AIGenerationRequest(BaseModel):
    subject: str = Field(..., min_length=2)
    topics: List[str] = Field(..., min_items=1)
    total_marks: int = Field(..., gt=0)
    duration: int = Field(..., gt=0)
    exam_type: ExamTypeEnum
    difficulty_distribution: DifficultyDistribution
    marks_structure: MarksStructure
    additional_instructions: Optional[str] = None

class AIGenerationResponse(BaseModel):
    exam_id: int
    title: str
    subject: str
    duration: int
    questions_generated: int
    total_marks: int
    questions: List[Dict] = []
    generation_time: float
    tokens_used: Optional[int] = None
    status: str
    message: str

# AI Log Schema
class AILogResponse(BaseModel):
    id: int
    exam_id: int
    prompt_text: str
    model_used: str
    tokens_used: Optional[int]
    generation_time: Optional[float]
    version: int
    status: str
    generated_at: datetime
    
    class Config:
        from_attributes = True

# Audit Log Schema
class AuditLogResponse(BaseModel):
    id: int
    exam_id: int
    user_id: int
    action: str
    details: Optional[Dict]
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Statistics Schema
class ExamStatistics(BaseModel):
    total_exams: int
    draft_exams: int
    published_exams: int
    ai_generated_exams: int
    total_questions: int
    avg_marks: float

# User Schema (simplified)
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    
    class Config:
        from_attributes = True
