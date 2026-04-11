from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import exams_router
from app.core.config import get_settings
from app.core.database import engine
from app.models import exam

# Create database tables
exam.Base.metadata.create_all(bind=engine)

settings = get_settings()

app = FastAPI(
    title="Transparent Exam Management System",
    description="AI-Powered Exam Generation using Groq API with complete transparency and audit trails",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(exams_router, prefix="/api")

@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "message": "Transparent Exam Management API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
def health_check():
    """Health check for monitoring"""
    return {
        "status": "healthy",
        "database": "connected",
        "ai_service": "groq"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
