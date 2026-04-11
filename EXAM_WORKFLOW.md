# 📋 Complete Exam Workflow - Faculty to Student

This document describes the complete end-to-end exam creation, publishing, and taking workflow.

---

## 🎓 **WORKFLOW OVERVIEW**

```
Faculty Creates Exam → AI Generates Questions → Exam Published
                              ↓
                    Questions Stored
                              ↓
                    Students See in Dashboard
                              ↓
                    Student Takes Exam
                              ↓
                    Answers Submitted & Evaluated
                              ↓
                    Results Displayed to Student
```

---

## 👨‍🏫 **FACULTY WORKFLOW**

### Step 1: Create Exam
1. Login as Faculty: `faculty@demo.com` / `Faculty@123`
2. Go to **Faculty Dashboard** → **Create Exam**
3. Two options:
   - **Traditional Exam**: Manually add questions
   - **AI Generate Exam**: Let AI create questions

### Step 2: AI Generate Questions (Recommended)
Click "AI Generate Exam" and fill:

```
Subject:              Data Structures
Topics:              Arrays, Linked Lists, Trees, Graphs
Total Marks:         100
Duration:            120 minutes
Exam Type:           Midterm
Difficulty Dist:     Easy (30%), Medium (50%), Hard (20%)
Marks Structure:     MCQ (30), Short Answer (40), Long Answer (30)
Extra Instructions:  (Optional) Focus on practical applications
```

### Step 3: Review Generated Questions
- AI generates questions based on specifications
- Review each question for accuracy
- Edit if needed
- System auto-evaluates MCQ answers

### Step 4: Publish Exam
- Click **"Publish Exam"** button
- Exam becomes available to students in their department/semester
- Set Start & End Times:
  - Students can only take exam during this window
  - Exam auto-closes after end time

### Step 5: Monitor Submissions
- **Faculty Dashboard** → **Evaluate Exam**
- View submitted answers
- Grade subjective questions
- Provide feedback to students

---

## 🎓 **STUDENT WORKFLOW**

### Step 1: View Available Exams
1. Login as Student: `student@demo.com` / `Student@123`
2. Go to **Student Dashboard**
3. See upcoming exams in:
   - **Dashboard Widget**: Quick view of upcoming exams
   - **My Exams Page**: Full list of available exams

### Step 2: Take Exam
Click **"Take Exam"** button to enter exam interface:

```
┌─────────────────────────────────────────────────────────────┐
│  Exam Title                              Time Remaining: 2:00│
│                                                              │
│  Question 1 of 50                                  5 marks   │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  What is a data structure?                                  │
│                                                              │
│  Type: Multiple Choice                                       │
│  O A) An organized collection of data                        │
│  O B) A programming language                                 │
│  O C) A type of database                                     │
│  O D) None of the above                                      │
│                                                              │
│  [Previous]              Question Scale        [Next]        │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐
│  │ Questions: 1  2  3  4  5  6  7  8  9 10                 │
│  │            ✓  ✓  □  □  ✓  □  □  □  □  □             │
│  │            Answered: 3/50                                │
│  │                                                          │
│  │                [Submit Exam]                            │
│  └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Answer Different Question Types

#### **MCQ (Multiple Choice)**
- Select one option from A, B, C, D
- Selection is instant
- Auto-evaluated on submission

#### **True/False**
- Select True or False
- Auto-evaluated on submission

#### **Short Answer**
- Type answer in text box
- Max 500 characters typical
- Faculty reviews and grades manually

#### **Long Answer**
- Type detailed answer in large text area
- Max 5000 characters
- Faculty provides comprehensive feedback

### Step 4: Navigate Questions
- Use **Previous/Next buttons** to move between questions
- Click **question numbers** in sidebar for quick access
- Questions show:
  - ✅ Green: Already answered
  - ⬜ Gray: Not answered yet
  - 🔵 Blue: Currently viewing

### Step 5: Monitor Time
- **Timer** shown in top-right
- Warning when <5 minutes remaining (turns red)
- Auto-submission when time expires
- Time taken is recorded

### Step 6: Submit Exam
- Click **"Submit Exam"** button
- Confirmation required
- Cannot reopen after submission
- Answers sent to server

### Step 7: View Results
After exam is evaluated:
1. Go to **My Results** page
2. See:
   - **Total Score**: marks/totalmarks
   - **Percentage**: %
   - **Grade**: A+, A, B+, B, C, D, F
   - **Status**: Submitted → Under Evaluation → Evaluated
   - **Detailed Answers**: View correct answers, feedback

---

## 📊 **QUESTION TYPES EXPLAINED**

### **MCQ (Multiple Choice Questions)**
```javascript
{
  questionType: "mcq",
  questionText: "Which data structure uses LIFO?",
  options: ["Queue", "Stack", "Array", "Linked List"],
  correctAnswer: "Stack",
  marks: 1
}
```
**Evaluation**: Automatic (instant)
**Time to answer**: Fastest

### **True/False**
```javascript
{
  questionType: "true-false",
  questionText: "Arrays are dynamic in size.",
  correctAnswer: "False",
  marks: 1
}
```
**Evaluation**: Automatic (instant)
**Time to answer**: Fastest

### **Short Answer**
```javascript
{
  questionType: "subjective",
  questionText: "Explain what a stack is.",
  rubric: "Should mention LIFO, push/pop operations",
  marks: 5
}
```
**Evaluation**: Manual by faculty
**Time to answer**: Medium
**Grading Criteria**: Rubric provided

### **Long Answer**
```javascript
{
  questionType: "subjective",
  questionText: "Design an algorithm to find shortest path in a graph.",
  rubric: "Should discuss algorithm, complexity, code example",
  marks: 10
}
```
**Evaluation**: Manual by faculty
**Time to answer**: Slow
**Grading Criteria**: Detailed rubric

---

## 🔧 **BACKEND API ENDPOINTS**

### **Faculty Endpoints**

**Create Exam**
```
POST /api/exams
Headers: Authorization: Bearer <token>
Body: {
  title: "DSA Mid Exam",
  subject: "Data Structures",
  department: "CSE",
  semester: 4,
  totalMarks: 100,
  passingMarks: 40,
  duration: 120,
  startTime: "2026-02-20T10:00:00Z",
  endTime: "2026-02-20T12:00:00Z",
  questions: [...]
}
```

**Publish Exam**
```
PATCH /api/exams/:id/publish
Headers: Authorization: Bearer <token>
Response: { success: true, exam: {...} }
```

**Get My Exams (Faculty)**
```
GET /api/exams
Headers: Authorization: Bearer <token>
Response: { exams: [...faculty's exams] }
```

### **Student Endpoints**

**Get My Exams (Student)**
```
GET /api/exams/my-exams
Headers: Authorization: Bearer <token>
Response: {
  exams: [
    {
      _id: "...",
      title: "DSA Mid Exam",
      hasSubmitted: false,
      status: "scheduled",
      startTime: "...",
      endTime: "...",
      questions: [...]
    }
  ]
}
```

**Get Exam Detail**
```
GET /api/exams/:id
Headers: Authorization: Bearer <token>
Response: { exam: {...with questions} }
```

**Submit Exam Answers**
```
POST /api/exams/:id/submit
Headers: Authorization: Bearer <token>
Body: {
  answers: [
    {
      questionNumber: 1,
      answer: "Stack",
      maxMarks: 1
    },
    ...
  ],
  timeTaken: 45 (minutes)
}
Response: { 
  evaluation: {
    totalMarks: 45,
    grade: "A",
    status: "evaluated"
  }
}
```

**View Results**
```
GET /api/evaluations/my-results
Headers: Authorization: Bearer <token>
Response: {
  evaluations: [
    {
      exam: {...},
      totalMarks: 45,
      maxMarks: 50,
      percentage: 90,
      grade: "A",
      answers: [...]
    }
  ]
}
```

---

## 💾 **DATA MODELS**

### **Exam Model**
```javascript
{
  _id: ObjectId,
  title: String,
  subject: String,
  department: String,
  semester: Number,
  totalMarks: Number,
  duration: Number (minutes),
  startTime: Date,
  endTime: Date,
  questions: [{
    questionText: String,
    questionType: enum["mcq", "subjective", "true-false"],
    marks: Number,
    options: [String], // for MCQ
    correctAnswer: String // for MCQ/TF
  }],
  isPublished: Boolean,
  status: enum["draft", "scheduled", "ongoing", "completed"],
  createdBy: ObjectId (Faculty ID)
}
```

### **Evaluation Model**
```javascript
{
  _id: ObjectId,
  exam: ObjectId,
  student: ObjectId,
  answers: [{
    questionNumber: Number,
    answer: String,
    marksObtained: Number,
    isCorrect: Boolean
  }],
  totalMarks: Number,
  maxMarks: Number,
  percentage: Number,
  grade: String,
  status: enum["submitted", "under-evaluation", "evaluated"],
  timeTaken: Number (minutes),
  submittedAt: Date
}
```

---

## ✨ **FEATURES**

✅ **Faculty**
- AI-powered question generation using Groq Mixtral
- Manual question creation
- Question bank management
- Exam publishing with scheduled availability
- Answer evaluation (automatic for MCQ, manual for subjective)
- Student submission monitoring
- Feedback provision

✅ **Student**
- View available exams in dashboard
- Take exams with timer
- Different question type interfaces
- Auto-submit on time expiry
- Answer review before submission
- Question navigation
- Results with grades
- Feedback viewing
- Re-evaluation request support

✅ **Admin**
- Monitor all exams
- User management
- System analytics

---

## 🧪 **TEST SCENARIOS**

### **Scenario 1: Create and Take an Exam**
1. **Faculty Step**:
   - Login as `faculty@demo.com`
   - Click "Create Exam" → "AI Generate Exam"
   - Fill subject, topics, marks, duration
   - Click "Generate"
   - Review questions
   - Click "Publish"

2. **Student Step**:
   - Logout and login as `student@demo.com`
   - Go to "My Exams"
   - See published exam
   - Click "Take Exam"
   - Answer all questions
   - Click "Submit"
   - View score

### **Scenario 2: Mixed Question Types**
- MCQ: Select option
- Short Answer: Type brief response
- Long Answer: Write detailed answer

### **Scenario 3: Time Management**
- Check timer counts down
- Verify warning at <5 minutes
- Test auto-submit on expiry

---

## 🚀 **QUICK START COMMANDS**

```bash
# Start all servers
cd backend && node server.js      # Port 5000
cd exam-module/backend && python -m uvicorn app.main:app --port 8000
cd frontend && npm run dev         # Port 5173

# Reseed demo credentials
cd backend && npm run seed

# Login Credentials
Faculty:  faculty@demo.com / Faculty@123
Student:  student@demo.com / Student@123
```

---

## 📝 **NOTES**

- MCQ answers are auto-evaluated immediately
- Subjective answers await faculty evaluation
- Timer is server-side synced to prevent cheating
- Students cannot view other students' answers
- Faculty can request re-evaluation
- Detailed audit logs maintained for transparency
