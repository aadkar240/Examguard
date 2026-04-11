# 🎓 AI-Powered Exam Management Module

> **Built for Transparent Examination Systems using Groq AI**

## 🚀 Quick Start

### 1️⃣ Backend Setup (5 minutes)
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Edit .env file with your DATABASE_URL and GROQ_API_KEY
python init_db.py
uvicorn app.main:app --reload --port 8000
```

### 2️⃣ Frontend Setup (3 minutes)
```bash
cd frontend
npm install
npm run dev
```

## 🎯 Key Features

- ✅ **AI Exam Generation** - Generate complete exams using Groq Mixtral
- ✅ **Multiple Question Types** - MCQ, Short Answer, Long Answer
- ✅ **Difficulty Control** - Custom distribution (Easy/Medium/Hard)
- ✅ **Transparency** - Complete audit trails and AI generation logs
- ✅ **Modern Stack** - FastAPI + React + PostgreSQL + Groq

## 🔑 Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 13+
- Groq API Key ([Get one free](https://console.groq.com))

## 📚 Documentation

- [Complete Setup Guide](SETUP_GUIDE.md) - Detailed installation and configuration
- [API Documentation](http://localhost:8000/docs) - Interactive API docs (after starting backend)

## 🛠️ Tech Stack

**Backend:**
- FastAPI - High-performance async API framework
- SQLAlchemy - ORM for PostgreSQL
- Groq SDK - AI-powered question generation
- PostgreSQL - Robust relational database

**Frontend:**
- React 18 - Modern UI library
- Vite - Lightning-fast build tool
- Tailwind CSS - Utility-first styling
- Lucide Icons - Beautiful icon set

## 📊 Project Structure

```
exam-module/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── core/        # Config & database
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic validation
│   │   └── services/    # Business logic
│   ├── requirements.txt
│   └── .env
└── frontend/            # React application
    ├── src/
    │   └── components/  # React components
    ├── package.json
    └── vite.config.js
```

## 🔬 Testing

### Test AI Generation
```bash
curl -X POST "http://localhost:8000/api/exams/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Data Structures",
    "topics": ["Arrays", "Trees", "Graphs"],
    "total_marks": 100,
    "duration": 180,
    "exam_type": "Semester",
    "difficulty_distribution": {"easy": 30, "medium": 50, "hard": 20},
    "marks_structure": {"mcq": 30, "short": 40, "long": 30}
  }'
```

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Ensure PostgreSQL is running
net start postgresql-x64-13

# Create database if not exists
psql -U postgres
CREATE DATABASE exam_db;
```

### Groq API Error
- Get API key from [console.groq.com](https://console.groq.com)
- Add to `.env` as `GROQ_API_KEY=your_key_here`

### Port Already in Use
```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

## 🎯 Usage Example

1. **Start both servers** (backend on 8000, frontend on 3001)
2. **Open browser** to http://localhost:3001
3. **Click "AI Generate"** button
4. **Fill in exam details** and generate complete exam in seconds
5. **Review and publish** exam

## 📄 License

MIT License - Free to use and modify

---

**Built with ❤️ for AISSMSHACK Hackathon**

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)
