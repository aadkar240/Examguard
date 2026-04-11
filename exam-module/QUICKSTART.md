# ⚡ Quick Start Guide - 10 Minutes to AI Exam Generation

## Step 1: Get Groq API Key (2 minutes)
1. Visit https://console.groq.com
2. Sign up (free)
3. Go to API Keys
4. Create new key
5. Copy the generated key and keep it secure

## Step 2: Setup Database (2 minutes)
```bash
# Open PowerShell as Administrator
# Start PostgreSQL (if not running)
net start postgresql-x64-13

# Create database
psql -U postgres
CREATE DATABASE exam_db;
\q
```

## Step 3: Backend Setup (3 minutes)
```bash
cd exam-module\backend

# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Edit .env file - Add your Groq API key
notepad .env

# Initialize database
python init_db.py

# Start server
uvicorn app.main:app --reload --port 8000
```

✅ Backend running at http://localhost:8000

## Step 4: Frontend Setup (3 minutes)
```bash
# Open NEW terminal
cd exam-module\frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

✅ Frontend running at http://localhost:3001

## Step 5: Test It! (1 minute)
1. Open browser: http://localhost:3001
2. Click **"AI Generate"** button
3. Fill in:
   - Subject: **Data Structures**
   - Topics: **Arrays, Trees, Graphs**
   - Keep default values
4. Click **"Generate Exam"**
5. Wait 10-15 seconds
6. See AI-generated exam with complete questions!

## 🎉 You're Done!

### What You Can Do Now:
- ✅ Generate exams with AI
- ✅ Create exams manually
- ✅ View exam statistics
- ✅ Publish exams
- ✅ View audit logs

### API Documentation:
Visit http://localhost:8000/docs for interactive API documentation

### Troubleshooting:

**Port 8000 in use?**
```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Database error?**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify exam_db exists

**Groq API error?**
- Verify API key in .env
- Check internet connection
- Visit console.groq.com for usage limits

## Next Steps:
- Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed documentation
- Check [README.md](README.md) for features overview
- Explore API at http://localhost:8000/docs

---

Need help? Check the guides or review error messages in the terminal!
