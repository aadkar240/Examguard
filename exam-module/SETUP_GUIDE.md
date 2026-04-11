# 🎓 AI-Powered Exam Management Module

A comprehensive exam management system with AI-powered question generation using **Groq API** for transparent and efficient examination processes.

## ✨ Features

### 🤖 AI-Powered Generation
- **Intelligent Question Generation** using Groq Mixtral-8x7b model
- Customizable difficulty distribution (Easy/Medium/Hard)
- Support for multiple question types (MCQ, Short Answer, Long Answer)
- Topic-based question generation
- Automated model answers and marking schemes

### 📋 Exam Management
- Create exams manually or with AI assistance
- Draft → Published → Archived workflow
- Comprehensive exam statistics
- Subject and topic categorization
- Flexible marks distribution

### 🔍 Transparency Features
- Complete audit trail for all actions
- AI generation logs with token usage
- Timestamp tracking for all operations
- User action history

### 📊 Dashboard Analytics
- Total exams overview
- Published vs Draft statistics
- AI generation metrics
- Average marks tracking

## 🏗️ Architecture

```
exam-module/
├── backend/          # FastAPI + PostgreSQL + Groq
│   ├── app/
│   │   ├── api/      # API routes
│   │   ├── core/     # Configuration & Database
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   └── services/ # Business logic & Groq integration
└── frontend/         # React + Tailwind CSS
    └── src/
        └── components/
```

## 🚀 Backend Setup (FastAPI)

### Prerequisites
- Python 3.9+
- PostgreSQL 13+
- Groq API Key (Get from [console.groq.com](https://console.groq.com))

### Installation

1. **Navigate to backend directory**
```bash
cd exam-module/backend
```

2. **Create virtual environment**
```bash
python -m venv venv
```

3. **Activate virtual environment**
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. **Install dependencies**
```bash
pip install -r requirements.txt
```

5. **Configure environment variables**

Edit `.env` file:
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/exam_db
GROQ_API_KEY=your_groq_api_key_here
APP_NAME=Transparent Exam Management
DEBUG=True
```

6. **Setup PostgreSQL Database**
```bash
# Create database
psql -U postgres
CREATE DATABASE exam_db;
\q
```

7. **Initialize database tables**
```bash
python init_db.py
```

8. **Run the FastAPI server**
```bash
uvicorn app.main:app --reload --port 8000
```

API will be available at: `http://localhost:8000`
API Documentation: `http://localhost:8000/docs`

## 🎨 Frontend Setup (React + Vite)

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Navigate to frontend directory**
```bash
cd exam-module/frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

Frontend will be available at: `http://localhost:3001`

## 📡 API Endpoints

### Exams
- `POST /api/exams/` - Create exam manually
- `POST /api/exams/generate` - Generate exam with AI
- `GET /api/exams/` - List all exams
- `GET /api/exams/my-exams` - Get user's exams
- `GET /api/exams/{id}` - Get exam details
- `PUT /api/exams/{id}` - Update exam
- `POST /api/exams/{id}/publish` - Publish exam
- `POST /api/exams/{id}/archive` - Archive exam
- `DELETE /api/exams/{id}` - Delete exam
- `GET /api/exams/statistics` - Get statistics
- `GET /api/exams/{id}/audit-logs` - Get audit logs

## 🧪 Testing the System

### 1. Generate an AI Exam

**Request:**
```bash
curl -X POST "http://localhost:8000/api/exams/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Data Structures",
    "topics": ["Arrays", "Linked Lists", "Trees", "Graphs"],
    "total_marks": 100,
    "duration": 180,
    "exam_type": "Semester",
    "difficulty_distribution": {
      "easy": 30,
      "medium": 50,
      "hard": 20
    },
    "marks_structure": {
      "mcq": 30,
      "short": 40,
      "long": 30
    },
    "additional_instructions": "Focus on practical implementation questions"
  }'
```

**Response:**
```json
{
  "exam_id": 1,
  "title": "Data Structures - AI Generated Exam",
  "questions_generated": 15,
  "total_marks": 100,
  "generation_time": 8.5,
  "status": "Draft",
  "message": "Exam generated successfully"
}
```

### 2. View Exam Details

```bash
curl -X GET "http://localhost:8000/api/exams/1"
```

### 3. Publish Exam

```bash
curl -X POST "http://localhost:8000/api/exams/1/publish"
```

## 🔑 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@host:port/database
GROQ_API_KEY=your_groq_api_key_here
APP_NAME=Transparent Exam Management
DEBUG=True
```

### Getting Groq API Key
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste into `.env` file

## 📦 Database Schema

### Tables
- **exams** - Exam metadata
- **questions** - Question details with answers
- **ai_generation_logs** - AI generation history and metrics
- **audit_logs** - Complete audit trail
- **users** - User information

### Key Features
- Automatic timestamps
- JSON fields for flexible data storage
- Foreign key relationships
- Enums for type safety

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern async web framework
- **SQLAlchemy** - ORM for PostgreSQL
- **Pydantic** - Data validation
- **Groq SDK** - AI integration
- **PostgreSQL** - Relational database

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 🎯 Key Components

### Backend Services
1. **GroqService** - AI generation logic
2. **ExamService** - Business logic for CRUD operations

### Frontend Components
1. **ExamDashboard** - Main dashboard
2. **AIGenerateModal** - AI generation interface
3. **CreateExamModal** - Manual exam creation
4. **ExamCard** - Exam display card

## 🔒 Security Notes

- TODO: Implement JWT authentication
- TODO: Add role-based access control (Student/Faculty/Admin)
- TODO: Implement rate limiting for AI generation
- TODO: Add input sanitization
- Keep API keys secure and never commit to version control

## 📈 Future Enhancements

- [ ] PDF export for exams
- [ ] Question bank management
- [ ] Automated grading for MCQs
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Integration with existing Node.js backend
- [ ] Mobile app support

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
# Windows
net start postgresql-x64-13

# Verify connection
psql -U postgres -d exam_db
```

### Groq API Error
- Verify API key is correct
- Check internet connection
- Review API usage limits at console.groq.com

### Port Already in Use
```bash
# Backend (8000)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Frontend (3001)
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

## 📄 License

MIT License - Feel free to use this for your hackathon!

## 🤝 Contributing

This is a hackathon project. Fork and customize as needed!

## 📞 Support

For issues or questions:
1. Check the API documentation at `/docs`
2. Review audit logs for transparency
3. Check Groq API status

---

**Built with ❤️ for Transparent Examination Systems**
