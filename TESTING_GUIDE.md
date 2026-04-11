🧪 TESTING GUIDE - Demo Credentials Ready
═══════════════════════════════════════════════════════════

✅ Demo credentials have been automatically seeded!

📋 AVAILABLE TEST ACCOUNTS:
───────────────────────────────────────────────────────────

🎓 STUDENT ACCOUNT
   Email:    student@demo.com
   Password: Student@123
   
👨‍🏫 FACULTY ACCOUNT
   Email:    faculty@demo.com
   Password: Faculty@123
   
👨‍💼 ADMIN ACCOUNT
   Email:    admin@demo.com
   Password: Admin@123

═══════════════════════════════════════════════════════════

🚀 QUICK START:

1. Open http://localhost:5174 in your browser
2. Click "Login"
3. Use any of the credentials above
4. Explore the respective dashboards!

═══════════════════════════════════════════════════════════

📌 WHAT EACH ROLE CAN DO:

🎓 STUDENT DASHBOARD:
   ✓ View exam schedule
   ✓ Take exams
   ✓ View results
   ✓ Submit and track grievances
   ✓ Update profile

👨‍🏫 FACULTY DASHBOARD:
   ✓ Create exams (traditional & AI-powered)
   ✓ View exam results
   ✓ Evaluate student answers
   ✓ Manage evaluations
   ✓ View grievances assigned to them
   ✓ Update profile

👨‍💼 ADMIN DASHBOARD:
   ✓ Manage all users
   ✓ View all grievances
   ✓ Generate system analytics
   ✓ Manage system settings
   ✓ Update profile

═══════════════════════════════════════════════════════════

🤖 AI EXAM GENERATION (Faculty Only):

1. Login as Faculty: faculty@demo.com / Faculty@123
2. Go to "Create Exam" → "AI Generate Exam"
3. Fill in exam details:
   - Subject: e.g., "Data Structures"
   - Topics: e.g., "Arrays, Linked Lists, Trees"
   - Total Marks: e.g., 100
   - Exam Duration: e.g., 120 (minutes)
   - Difficulty Distribution: Easy:30%, Medium:50%, Hard:20%
4. Click "Generate with AI"
5. Wait for Groq AI to generate questions
6. Review and edit questions if needed
7. Click "Publish Exam"
8. Students can now take the exam!

═══════════════════════════════════════════════════════════

🔄 REseed DATA (if needed):

To refresh demo credentials at any time:

Backend:
   cd backend
   npm run seed

Exam Module:
   cd exam-module
   python seed.py

═══════════════════════════════════════════════════════════

🛠️ SYSTEM COMPONENTS:

Backend:     http://localhost:5000/api
Frontend:    http://localhost:5174
Exam API:    http://localhost:8000
Exam Docs:   http://localhost:8000/docs

═══════════════════════════════════════════════════════════

💡 TESTING TIPS:

1. Open multiple browser windows with different accounts
2. Create an exam as faculty, take it as student
3. Test grievance submission from student account
4. Try AI exam generation (requires Groq API key)
5. Check profile updates work across all roles

═══════════════════════════════════════════════════════════
