# Local Setup Guide - ExamGuard

Follow these steps to clone and run the project locally on your machine.

## Prerequisites

Before you start, make sure you have installed:

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **MongoDB** (either local installation or MongoDB Atlas cloud account)
- **npm** (comes with Node.js)

## Step 1: Clone the Repository

```bash
git clone https://github.com/aadkar240/Examguard.git
cd Examguard
```

## Step 2: Set Up MongoDB

**Option A: Using MongoDB Atlas (Cloud - Recommended)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/examguard`

**Option B: Local MongoDB**
1. Install [MongoDB Community Edition](https://docs.mongodb.com/manual/installation/)
2. Start MongoDB service
3. Connection string: `mongodb://localhost:27017/examguard`

## Step 3: Configure Backend Environment Variables

1. Navigate to backend folder:
```bash
cd backend
```

2. Create a `.env` file (copy from `.env.example` if available):
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/examguard
JWT_SECRET=your_secret_key_here
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Email Configuration (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Groq AI Configuration (Optional - for AI evaluation)
GROQ_API_KEY=your_groq_api_key
```

3. Install backend dependencies:
```bash
npm install
```

4. (Optional) Seed the database with test data:
```bash
npm run seed
```

## Step 4: Configure Frontend Environment Variables

1. Navigate to frontend folder:
```bash
cd ../frontend
```

2. Create a `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

3. Install frontend dependencies:
```bash
npm install
```

## Step 5: Run the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```
Backend will run on: `http://localhost:5000`

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on: `http://localhost:5173`

## Step 6: Access the Application

Open your browser and go to: **http://localhost:5173**

## Test Credentials

After seeding (Step 3.4), use these credentials:

### Admin Account
- **Email:** admin@examguard.com
- **Password:** admin123

### Faculty Account
- **Email:** faculty@examguard.com
- **Password:** faculty123

### Student Account
- **Email:** student@examguard.com
- **Password:** student123

## Troubleshooting

### MongoDB Connection Error
- Check your connection string in `.env`
- Ensure MongoDB is running
- Verify username/password for Atlas

### Port 5000 Already in Use
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### CORS Errors
- Ensure backend is running on `http://localhost:5000`
- Check `FRONTEND_URL` in backend `.env` matches your frontend URL

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Project Structure

```
Examguard/
├── frontend/               # React application
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/               # Node.js API server
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── config/
│   └── package.json
└── README.md
```

## Features Overview

- 📝 **Exam Management** - Create and manage exams
- ✅ **Evaluation System** - Grade answers with transparency
- 📢 **Grievance System** - Student complaints and tracking
- 📊 **Analytics Dashboard** - Real-time statistics
- 🔒 **Secure Authentication** - JWT-based auth

## Support

If you encounter issues:
1. Check all prerequisites are installed
2. Verify `.env` files are properly configured
3. Ensure MongoDB is accessible
4. Check console/terminal for error messages

Happy testing! 🚀
