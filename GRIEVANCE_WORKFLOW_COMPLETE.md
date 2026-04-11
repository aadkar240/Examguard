# Grievance Management System - Complete Implementation

## Overview
Comprehensive grievance workflow implementation allowing students to submit grievances with specific problem types, linked evaluations, and enabling faculty to review and update marks, with full admin oversight.

---

## Architecture & Components

### 1. **Database Schema Extensions** (Backend)

#### Grievance Model
New fields added to `backend/models/Grievance.js`:
- **department** (String, required) - Student's department
- **semester** (Number 1-8, required) - Academic semester
- **problemType** (Enum, required):
  - `marks-calculation-error` - Incorrect marks calculation
  - `question-not-evaluated` - Question left unevaluated  
  - `partiality-issue` - Unfair or biased evaluation
  - `answer-key-dispute` - Disagreement with answer key/rubric
  - `technical-upload-issue` - Technical submission issues
  - `attendance-issue` - Attendance marking discrepancies
  - `other` - Custom problem description
- **otherProblemText** (String, optional) - Free-text for type='other'
- **relatedEvaluation** (ObjectId ref, optional) - Link to contested Evaluation record
- **evaluationReview** (Object) - Review summary after faculty marks update:
  - `previousTotalMarks` - Original marks
  - `updatedTotalMarks` - Corrected marks
  - `previousGrade` - Original grade
  - `updatedGrade` - New grade
  - `previousPercentage` - Original percentage
  - `updatedPercentage` - New percentage
  - `reviewedBy` (ObjectId ref User) - Faculty who reviewed
  - `reviewedAt` (Date) - Review timestamp
  - `remarks` (String) - Review notes

### 2. **API Endpoints** (Backend)

#### New Endpoint
**POST** `/api/grievances/:id/review-evaluation`
- **Authorization**: Faculty/Admin
- **Purpose**: Faculty reviews grievance and updates linked evaluation marks
- **Request Body**:
  ```json
  {
    "updatedTotalMarks": 85.5,
    "remarks": "Rechecked answer to question 3, valid points awarded"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "grievance": { /* Updated grievance object with evaluationReview */ },
    "evaluation": { /* Updated evaluation with new marks */ }
  }
  ```
- **Side Effects**:
  - Updates linked Evaluation with new totalMarks, grade, percentage
  - Sets Evaluation.status to 're-evaluated'
  - Populates evaluationReview with before/after comparison
  - Emits Socket.IO event: `evaluation-updated-after-grievance` to student
  - Emits Socket.IO event: `grievance-resolved` to student

#### Existing Endpoints Enhanced
- **POST** `/api/grievances` 
  - Now validates: department, semester, problemType (required)
  - Validates otherProblemText if problemType='other'
- **GET** `/api/grievances`
  - Faculty receives only grievances in their department
  - Admin receives all grievances
  - Responses populated with evaluationReview data

---

## Frontend Implementation

### 1. **Student: Create Grievance Form**
File: `frontend/src/pages/student/CreateGrievance.jsx`

**Form Fields**:
1. **Department** (text input, auto-filled from user.department, required)
2. **Semester** (dropdown 1-8, auto-filled from user.semester, required)
3. **Problem Type** (dropdown, required):
   - Marks Calculation Error
   - Question Not Evaluated
   - Partiality / Unfair Checking
   - Answer Key / Rubric Dispute
   - Technical Upload Issue
   - Attendance Issue
   - Other (opens otherProblemText textarea)
4. **Other Problem Text** (textarea, conditional for type='other')
5. **Related Evaluation** (dropdown, optional)
   - Fetches student's completed evaluations (status='evaluated' or 're-evaluated')
   - Shows exam name, marks, grade
6. **Priority** (Low/Medium/High/Urgent)
7. **Subject** (text)
8. **Description** (textarea)

**Auto-Behaviors**:
- On problemType change: Auto-sets category field (e.g., marks-calculation-error → marks-discrepancy)
- Fetches student's evaluated exams on form mount
- If SMTP fallback returns OTP: Auto-fills OTP field

**Validations**:
- All required fields enforced
- relatedEvaluation required if problemType='other'

---

### 2. **Faculty: Manage Grievances Dashboard**
File: `frontend/src/pages/faculty/ManageGrievances.jsx`

**Features**:

#### List View
- Filter by status: All / Open / In-Progress / Resolved
- Shows counts per status
- Displays: Ticket ID | Status badge | Priority badge | Subject | Student name | Department | Semester | Problem type

#### Expandable Grievance Details
- Description text
- Other problem text (if applicable)
- Related Evaluation info:
  - Current marks / max marks
  - Current grade
  - Status
- **Review & Update Marks button** (if evaluation linked)

#### Marks Review Form (modal)
- Input field: Updated Total Marks (0 to maxMarks, step 0.5)
- Textarea: Remarks (optional, e.g., "Rechecked answer to question 3")
- Buttons: Confirm & Update | Cancel

#### Evaluation Review Result (post-update)
- Shows before/after comparison
- Marks: X → Y
- Grade: A → B
- Notes from faculty remarks

#### Response Management
- List existing responses with respondent name, timestamp
- Response input textarea for faculty
- Send Response button

#### Status Actions
- Mark In Progress button
- Resolve button
- Hidden once status is resolved/closed

---

### 3. **Admin: Grievance Dashboard Section**
File: `frontend/src/pages/admin/Dashboard.jsx`

**New Section**: "All Grievances" (inserted after Grievance Resolution Stats)

**Features**:

#### Summary Stats
- Total grievances count
- Filter tabs: All / Open / In-Progress / Resolved

#### Grievances List
- Collapsible grievance cards
- Shows: Ticket ID | Status | Subject | Student | Department | Semester | Assigned Faculty
- Expandable to show full details:
  - Description
  - Related Evaluation details (if linked)
  - Marks update summary (before/after)
  - Response conversation thread

#### Admin Capabilities
- View all grievances across all departments
- Deep-link to review details
- See evaluation review audit trail
- Track response history

---

## Workflow: Complete End-to-End

### Step 1: Student Creates Grievance
1. Student logs in → Student Dashboard → Create Grievance
2. **Fills form**:
   - Department: Auto-filled (e.g., "CSE")
   - Semester: Auto-filled or selected (e.g., "3")
   - Problem Type: Selected (e.g., "marks-calculation-error")
   - Related Evaluation: Optional dropdown selection
   - Subject: "Marks discrepancy in DSA exam"
   - Description: "Question 4 answer was correct but marked wrong"
3. **Submits** → API creates grievance with status='open'
4. Student sees grievance in "My Grievances" list with ticket ID

### Step 2: Faculty Reviews Grievance
1. Faculty logs in → Faculty Dashboard → Manage Grievances
2. Sees grievance in "Open" filter with high priority
3. **Clicks to expand** → Reviews:
   - Student complaint details
   - Related evaluation (if linked): current marks, grade
   - Previous responses (if any)
4. **Marks review**:
   - Clicks "Review & Update Marks"
   - Changes marks from 65 → 80
   - Adds remark: "Rechecked question 4, valid approach, full marks awarded"
   - Clicks "Confirm & Update"
5. **Backend updates**:
   - Evaluation.totalMarks: 65 → 80
   - Evaluation.grade: recalculated (e.g., D → A)
   - Evaluation.percentage: recalculated
   - Evaluation.status: 're-evaluated'
   - Grievance.evaluationReview: populated with audit trail
   - Socket event sent to student: "evaluation-updated-after-grievance"
6. **Faculty marks as resolved** → Status changes, student notified

### Step 3: Student Sees Updated Marks
1. Student logs in (or receives real-time notification)
2. Views "My Evaluations" / "Results"
3. Sees exam now shows updated marks (80/100)
4. Sees grievance status updated to "resolved"
5. Can view faculty's remarks in grievance response thread

### Step 4: Admin Tracks All Grievances
1. Admin logs in → Admin Dashboard → Scrolls to "All Grievances" section
2. Sees summary:
   - Total: 142 grievances
   - Open: 3 | In-Progress: 5 | Resolved: 134
3. **Views by status**, filter available
4. **Expands grievance** to see:
   - Student, department, problem type
   - Related evaluation and mark updates
   - Faculty's remarks and approval trail
5. Can escalate or reopen if needed

---

## Testing Checklist

### Setup
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5174
- [ ] Database seeded with demo users (student@demo.com, faculty@demo.com, admin@demo.com)
- [ ] SMTP configured (examguard38@gmail.com) or fallback OTP enabled

### Student Flow
- [ ] Login as student@demo.com → Dashboard accessible
- [ ] Navigate to Create Grievance page
- [ ] Form fields present: department, semester, problemType, otherProblemText, relatedEvaluation
- [ ] Department/semester auto-filled from user profile
- [ ] Selecting problemType='other' shows otherProblemText textarea
- [ ] relatedEvaluation dropdown fetches completed evaluations
- [ ] Submit grievance → Ticket ID generated
- [ ] Grievance appears in "My Grievances" with status='open'

### Faculty Flow
- [ ] Login as faculty@demo.com → Dashboard accessible
- [ ] Navigate to Manage Grievances
- [ ] Grievances filtered by faculty's department
- [ ] Grievance list shows: ticket, status, priority, subject, student name
- [ ] Click to expand → Shows full details
- [ ] If evaluation linked: "Review & Update Marks" button visible
- [ ] Click button → Form to input new marks appears
- [ ] Enter marks → Backend validates (0 ≤ marks ≤ maxMarks)
- [ ] Submit → Gets success message
- [ ] Grievance shows evaluationReview summary (before/after)
- [ ] Can add response → Saved and displayed
- [ ] Can mark as "In Progress" or "Resolved"

### Admin Flow
- [ ] Login as admin@demo.com → Admin Dashboard loads
- [ ] Scroll down to "All Grievances" section
- [ ] See summary stats and filter tabs
- [ ] Filter by status (all/open/in-progress/resolved)
- [ ] Click grievance to expand → Shows full details
- [ ] See evaluationReview audit trail if marks updated
- [ ] Can see all departments' grievances

### Backend Validation
- [ ] GET /api/grievances returns correct list for role (faculty filtered by dept, admin all)
- [ ] POST /api/grievances/:id/review-evaluation updates evaluation correctly
- [ ] Socket.IO event "evaluation-updated-after-grievance" emitted to student
- [ ] Grievance.evaluationReview populated with before/after marks
- [ ] Evaluation.status changed to 're-evaluated'
- [ ] Evaluation grade/percentage recalculated

---

## Database Queries & Stats

### Count Grievances by Status
```javascript
db.grievances.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

### Find Grievances by Department
```javascript
db.grievances.find({ department: "CSE" }).count()
```

### Find Grievances with Mark Updates
```javascript
db.grievances.find({ "evaluationReview": { $exists: true } }).count()
```

---

## Error Handling

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Grievance form missing department/semester | Schema not updated | Verify Grievance.js has new fields |
| Faculty sees all departments | Authorization not checked | Verify getGrievances filters by user.department |
| Marks update fails | Evaluation not linked | Ensure relatedEvaluation populated during create |
| Socket event not received | Socket.IO not configured | Check server.js socketio setup, student on socket |
| Admin section not showing grievances | API endpoint error | Check /api/grievances response for admin role |

---

## Files Modified Summary

```
backend/
  ├── models/Grievance.js                    [+department, +semester, +problemType, +evaluationReview]
  ├── controllers/grievanceController.js     [Enhanced createGrievance, +reviewGrievanceEvaluation]
  └── routes/grievanceRoutes.js              [+POST /:id/review-evaluation route]

frontend/
  ├── src/pages/student/CreateGrievance.jsx  [Complete redesign: +dept, +sem, +problemType, +evaluation linking]
  ├── src/pages/faculty/ManageGrievances.jsx [Full implementation: list, expand, review form, mark update]
  └── src/pages/admin/Dashboard.jsx          [+New section: All Grievances with filtering, audit trail]
```

---

## Next Steps & Enhancements

1. **Email Notifications**: Send email to student when marks updated (leverage existing emailService)
2. **Bulk Operations**: Allow admin to bulk assign, escalate, or close grievances
3. **Analytics Dashboard**: Charts showing grievance trends, resolution time, department stats
4. **SLA Tracking**: Flag grievances exceeding resolution SLA (e.g., 7 days)
5. **Grievance Templates**: Pre-filled categories for common issues
6. **Feedback Survey**: Student feedback after resolution for quality metrics
7. **Escalation to HOD**: Auto-escalate unresolved grievances after X days
8. **Multi-level Approval**: Dean/Director review before final mark change

---

## Deployment Notes

- Ensure `AUTO_APPROVE_FACULTY=true` for immediate faculty dashboard access
- SMTP credentials must be valid for email notifications to work
- Socket.IO namespace `/` configured in backend for real-time events
- Frontend CORS configured to accept localhost:* ports dynamically
- JWT tokens valid for 7 days (configurable via JWT_EXPIRE)

---

## Support & Debugging

### Enable Verbose Logging
```bash
# Backend
NODE_ENV=development npm run start

# Frontend
VITE_DEBUG=true npm run dev
```

### Check Real-Time Events
```javascript
// Browser console
io('http://localhost:5000').on('evaluation-updated-after-grievance', (data) => {
  console.log('Update received:', data)
})
```

### Validate Schema
```bash
mongosh
use exam-grievance-system
db.grievances.findOne()
```

---

**Implementation Status**: ✅ Complete & Ready for Testing
**Last Updated**: [Current Date]
