# Transparent Exam & Grievance Management System

A comprehensive digital platform for managing exams, evaluations, and student grievances with complete transparency.

## Features

### 1. Exam Management
- Digital exam scheduling and notifications
- Online exam portal (MCQ, Subjective, Hybrid)
- Secure authentication and anti-cheating measures
- Real-time exam monitoring

### 2. Evaluation System
- Digital answer sheet evaluation
- Automated grading for objective questions
- Transparent marking with rubrics
- Score breakdown and detailed feedback
- Re-evaluation request tracking

### 3. Grievance Management
- Student complaint submission portal
- Ticket tracking with real-time status updates
- Complete communication history
- Escalation mechanism
- Resolution documentation

### 4. Transparency Features
- Complete audit trail of all actions
- View evaluated answer sheets
- Marking schemes visibility
- Grievance resolution timeline
- Public anonymized statistics

## Tech Stack

### Frontend
- React 18 with Vite
- React Router for navigation
- Axios for API calls
- Tailwind CSS for styling
- Chart.js for analytics

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT authentication
- Bcrypt for password hashing
- Socket.io for real-time notifications

## Project Structure

```
├── frontend/          # React frontend application
├── backend/           # Node.js backend API
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Configure environment variables (see .env.example files)

5. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

6. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

## User Roles

- **Student**: Take exams, view results, submit grievances
- **Faculty**: Create exams, evaluate answers, respond to grievances
- **Admin**: System oversight, user management, analytics

## License

MIT
