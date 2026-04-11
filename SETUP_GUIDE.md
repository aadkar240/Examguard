# Setup Guide - Transparent Exam & Grievance Management System

## Quick Start Guide

### Prerequisites
Before you begin, ensure you have the following installed:
- Node.js (v18 or higher) - [Download here](https://nodejs.org/)
- MongoDB (Community Edition) - [Download here](https://www.mongodb.com/try/download/community)
- Git (optional) - [Download here](https://git-scm.com/)

### Installation Steps

#### 1. Install MongoDB
1. Download and install MongoDB Community Server
2. Start MongoDB service:
   - Windows: MongoDB should start automatically as a service
   - To verify: Open Command Prompt and run `mongosh`

#### 2. Setup Backend

Open PowerShell/Terminal in the project root directory:

```powershell
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file from example
Copy-Item .env.example .env

# Edit .env file with your preferred text editor
notepad .env
```

Update the following in `.env`:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/exam-grievance-system
JWT_SECRET=your_secure_random_string_change_this_in_production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

#### 3. Setup Frontend

Open a NEW PowerShell/Terminal window:

```powershell
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create .env file from example
Copy-Item .env.example .env
```

#### 4. Start the Application

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```
You should see:
```
Server running on port 5000
MongoDB Connected: localhost
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```
You should see:
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

#### 5. Access the Application

Open your browser and go to: **http://localhost:5173**

### Default Test Accounts

You'll need to register accounts first. Use these details:

**Student Account:**
- Name: Test Student
- Email: student@test.com
- Password: password123
- Role: Student
- Student ID: STU001
- Department: Computer Science
- Semester: 5

**Faculty Account:**
- Name: Test Faculty
- Email: faculty@test.com
- Password: password123
- Role: Faculty
- Department: Computer Science

**Admin Account:**
- Name: Test Admin
- Email: admin@test.com
- Password: password123
- Role: Admin
- Department: Administration

## Features Overview

### For Students:
1. **Dashboard** - View upcoming exams, recent results, and grievance status
2. **Exams** - View and take scheduled exams
3. **Results** - Check evaluated exam results with detailed breakdown
4. **Grievances** - Submit and track complaints/issues

### For Faculty:
1. **Dashboard** - Overview of exams and pending evaluations
2. **Create Exam** - Design and schedule new exams
3. **Evaluate** - Grade student submissions
4. **Manage Grievances** - Respond to student complaints

### For Admin:
1. **Dashboard** - System-wide statistics and health monitoring
2. **User Management** - Add/edit/remove users
3. **System Oversight** - Monitor all activities

## Transparency Features

✅ **Complete Audit Trail** - Every action is logged with timestamp
✅ **Answer Sheet Viewing** - Students can view evaluated papers
✅ **Marking Scheme** - Transparent grading rubrics
✅ **Grievance Tracking** - Real-time status updates with full history
✅ **Re-evaluation Requests** - Students can request paper re-checking
✅ **Communication History** - All grievance responses are stored

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB service is running
- Check if the port 27017 is available
- Try: `mongosh` in terminal to test connection

### Backend Port Already in Use
- Change PORT in backend/.env to another port (e.g., 5001)
- Update VITE_API_URL in frontend/.env accordingly

### Frontend Build Errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Clear browser cache

### CORS Errors
- Ensure FRONTEND_URL in backend/.env matches your frontend URL
- Restart the backend server after changing .env

## Development Workflow

### Adding New Features
1. Backend: Add routes in `backend/routes/`
2. Backend: Add controllers in `backend/controllers/`
3. Frontend: Add pages in `frontend/src/pages/`
4. Frontend: Update routes in `frontend/src/App.jsx`

### Database Models
Located in `backend/models/`:
- User.js - User accounts (students, faculty, admin)
- Exam.js - Exam details and questions
- Evaluation.js - Student submissions and grades
- Grievance.js - Complaints and resolutions

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user

### Exams
- GET `/api/exams` - Get all exams
- POST `/api/exams` - Create exam (Faculty)
- GET `/api/exams/:id` - Get exam details
- POST `/api/exams/:id/submit` - Submit exam (Student)

### Evaluations
- GET `/api/evaluations/my-evaluations` - Get student results
- PUT `/api/evaluations/:id/evaluate` - Grade submission (Faculty)
- POST `/api/evaluations/:id/request-reevaluation` - Request re-check

### Grievances
- POST `/api/grievances` - Submit grievance
- GET `/api/grievances/my-grievances` - Get student grievances
- POST `/api/grievances/:id/respond` - Respond to grievance (Faculty)

## Next Steps for Your Hackathon

### Essential Enhancements:
1. **Complete Exam Taking Interface** - Add timer, question navigation
2. **File Upload** - For subjective answers and grievance attachments
3. **Real-time Notifications** - Socket.io integration (already set up)
4. **Advanced Analytics** - Charts and performance trends
5. **Email Notifications** - For exam schedules and grievance updates

### Optional Advanced Features:
1. **Blockchain Integration** - For tamper-proof record keeping
2. **AI-powered Proctoring** - For exam monitoring
3. **Automatic Plagiarism Detection** - For subjective answers
4. **Mobile App** - React Native version
5. **Biometric Authentication** - For secure exam access

## Support

For issues or questions during development:
1. Check the console for error messages
2. Review the API documentation
3. Check MongoDB connection status
4. Verify all environment variables are set

## License
MIT License - Feel free to use and modify for your hackathon!

Good luck with your hackathon! 🚀
