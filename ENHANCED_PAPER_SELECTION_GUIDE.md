# Enhanced Evaluated Paper Selection - Test Guide

## Overview
The student grievance form now displays evaluated papers/exams in an interactive, user-friendly format with detailed information about each exam.

---

## What Changed

### Before
```
Select Evaluated Paper (Optional)
[Dropdown] ▼
- "DSA Exam (65/100)"
- "Database Exam (78/100)"
```
**Issues**: Limited information, harder to choose

### After
```
Select Evaluated Paper (Optional)
Select an exam/paper you've already completed if your grievance is related to marks or evaluation

[Radio] Not linked to any paper

[Radio] DSA Exam                              [Status: evaluated]
        Marks: 65/100          Grade: D       Date: 11/02/2026

[Radio] Database Exam                         [Status: evaluated]
        Marks: 78/100          Grade: B+      Date: 12/02/2026

[Radio] Web Dev Exam                          [Status: re-evaluated]
        Marks: 85/100          Grade: A       Date: 13/02/2026
```
**Benefits**: More information, better visual feedback, clear status

---

## Features Implemented

### 1. **Clear Instructions**
- Helpful description above the field explains its purpose
- Students know when to select a paper

### 2. **Radio Button Selection**
- Better than dropdown for clarity
- Visual feedback when selecting
- Can deselect by choosing "Not linked"

### 3. **Detailed Exam Cards**
Each card displays:
- **Exam Title** - Name of the exam
- **Status Badge** - Shows if exam is "evaluated" or "re-evaluated"
- **Marks** - Current marks and maximum possible marks
- **Grade** - Current grade letter (A+, B+, C, etc.)
- **Date** - When the exam was evaluated

### 4. **No Exams Message**
If student has no evaluated papers:
```
📚 No evaluated papers found yet. You can still submit a 
   grievance without linking to a paper.
```
Helpful message instead of blank dropdown

### 5. **Scrollable List**
- `max-h-72 overflow-y-auto` - Handles many exams gracefully
- Never clutters the form
- Smooth scrolling through all options

### 6. **Hover Effects**
- Cards highlight on hover (blue background)
- Border color changes
- Cursor shows it's clickable
- Smooth transitions for better UX

---

## Student Workflow

### Scenario 1: Student with Marks Grievance
1. Student logs in and navigates to **Create Grievance**
2. Fills department, semester, problem type
3. **Sees evaluated papers section** with their completed exams listed
4. **Clicks on DSA Exam card** (shows 65/100, Grade D)
5. Form remembers selection, can see marks clearly
6. Writes grievance: "Question 4 should have more marks based on logic shown"
7. **Submits** → Faculty can now review the linked exam

### Scenario 2: General Grievance (No Exam Link)
1. Student creates grievance for attendance issue
2. Problem Type = "Attendance / Administrative Issue"
3. **Doesn't select any paper** (useful when not exam-related)
4. Submits without linking evaluation

### Scenario 3: Multiple Exams
1. Student has 5 completed exams
2. Scrolls through the **scrollable list** to find the relevant one
3. Each card clearly shows marks and grades
4. Easy to pick the correct exam even with many options

---

## Technical Details

### Frontend Implementation
**File**: `frontend/src/pages/student/CreateGrievance.jsx`

**Data Fetched from Backend**:
```javascript
// On component mount, fetches from /api/evaluations/my-evaluations
GET /evaluations/my-evaluations
Response: [
  {
    _id: "ObjectId",
    exam: { 
      _id: "...",
      title: "DSA Exam"
    },
    totalMarks: 65,
    maxMarks: 100,
    grade: "D",
    status: "evaluated",
    evaluatedAt: "2026-02-11T10:00:00Z"
  },
  ...
]
```

**Form Field**:
- Radio buttons instead of `<select>`
- Each card is a label with embedded input
- Value stored in `formData.relatedEvaluation`

### Backend Validation
**Endpoint**: `POST /api/grievances`
```json
{
  "department": "CSE",
  "semester": 3,
  "problemType": "marks-calculation-error",
  "relatedEvaluation": "ObjectId of evaluation (optional)",
  "subject": "...",
  "description": "..."
}
```

**Validation**:
- If `problemType = 'other'`, then `otherProblemText` required
- `relatedEvaluation` is optional
- If provided, backend verifies it belongs to the student and is evaluated

---

## Testing Checklist

### Setup
- [ ] Backend running (port 5000)
- [ ] Frontend running (port 5174)
- [ ] Student logged in with completed exams in database

### Feature Tests

#### Test 1: Displays Evaluated Exams
- [ ] Navigate to Create Grievance page
- [ ] See "Select Evaluated Paper" section
- [ ] Evaluated exams listed as cards
- [ ] Each exam shows: title, marks, grade, date, status badge

#### Test 2: No Exams Available
- [ ] Login as student with no evaluated exams
- [ ] Navigate to Create Grievance
- [ ] See blue message: "No evaluated papers found yet"
- [ ] Can still submit grievance

#### Test 3: Radio Button Selection
- [ ] Click on an exam card
- [ ] Radio button gets selected (filled circle)
- [ ] Form stores the evaluation ID in `relatedEvaluation`
- [ ] Click another exam → previous deselected, new selected

#### Test 4: Deselect Paper
- [ ] Select an exam
- [ ] Click "Not linked to any paper" option
- [ ] Selection cleared, form value is empty string

#### Test 5: Submit with Paper Link
- [ ] Select an exam from the list
- [ ] Fill other required fields
- [ ] Click "Submit Grievance"
- [ ] Check database: grievance has `relatedEvaluation` ObjectId

#### Test 6: Submit without Paper Link
- [ ] Don't select any paper (or select "Not linked")
- [ ] Fill other fields
- [ ] Submit
- [ ] Database shows grievance with empty `relatedEvaluation`

#### Test 7: Display Multiple Exams
- [ ] Create test data with 5+ evaluated exams for student
- [ ] Navigate to Create Grievance
- [ ] All exams visible and scrollable
- [ ] Can select any one

#### Test 8: Hover Effects
- [ ] Hover over exam card
- [ ] See blue background highlight
- [ ] Border color changes
- [ ] Visual feedback smooth

#### Test 9: Faculty Can See Linked Exam
- [ ] Student submits grievance linked to exam with 65/100
- [ ] Faculty opens ManageGrievances
- [ ] Expands grievance
- [ ] Sees "Related Evaluation" box showing current marks
- [ ] Can click "Review & Update Marks" button

#### Test 10: Date Format
- [ ] Exams display in format: DD/MM/YYYY
- [ ] Dates are correct from `evaluatedAt` field
- [ ] Works with different date locales

---

## Sample Test Data

**Add to database for testing**:
```javascript
// Student with 3 evaluated exams
{
  _id: ObjectId,
  exam: ObjectId,
  student: ObjectId,
  totalMarks: 65,
  maxMarks: 100,
  grade: "D",
  status: "evaluated",
  evaluatedAt: new Date("2026-02-11"),
  percentage: 65
}

{
  _id: ObjectId,
  exam: ObjectId,
  student: ObjectId,
  totalMarks: 78,
  maxMarks: 100,
  grade: "B+",
  status: "evaluated",
  evaluatedAt: new Date("2026-02-12"),
  percentage: 78
}

{
  _id: ObjectId,
  exam: ObjectId,
  student: ObjectId,
  totalMarks: 85,
  maxMarks: 100,
  grade: "A",
  status: "re-evaluated",
  evaluatedAt: new Date("2026-02-13"),
  percentage: 85
}
```

---

## Browser Rendering

### Desktop View (1200px+)
```
[Section Label: Select Evaluated Paper]
[Helpful text description]
[Radio] Not linked to any paper

[Radio card] DSA Exam [evaluated] badge
          Marks: 65/100        Grade: D        Date: 11/02/2026

[Radio card] Database Exam [evaluated] badge
          Marks: 78/100        Grade: B+       Date: 12/02/2026

[Radio card] Web Dev [re-evaluated] badge
          Marks: 85/100        Grade: A        Date: 13/02/2026
```

### Mobile View (375px)
```
[Section Label]
[Helpful text]

[Radio card - full width]
  Title
  Marks | Grade | Date

[Radio card - full width]
  Title
  Marks | Grade | Date
```
Cards stack vertically, fully responsive

---

## Related Components

### Student Pages Using Similar Data
- `frontend/src/pages/student/ViewResults.jsx` - Also fetches `/my-evaluations`
- Consistent data structure across pages
- Reusable evaluation display logic

### Faculty Components
- `frontend/src/pages/faculty/ManageGrievances.jsx` - Shows linked evaluations in detail
- `frontend/src/pages/faculty/EvaluateExam.jsx` - Updates these evaluation records

### Backend Endpoints
- `GET /api/evaluations/my-evaluations` - Fetches student's evals
- `POST /api/grievances/:id/review-evaluation` - Faculty updates linked eval marks

---

## Performance Considerations

### Optimization
- ✅ `overflow-auto` with `max-h-72` - Limits DOM rendering of long lists
- ✅ Fetch on component mount only (once) - Not on every render
- ✅ Filter on frontend - No extra API calls for filtering
- ✅ Radio buttons instead of dropdown - Lighter than select options

### Scalability
- Can handle 50+ exams without performance issues
- Scrollable list prevents page bloat
- Backend populate() keeps data minimal (only needed fields)

---

## Future Enhancements

1. **Search/Filter**: Add search box to find exam by name/date
2. **Sort Options**: Sort by date, marks, grade
3. **Exam Preview**: Click exam to see questions/answers before linking
4. **Suggestion**: Auto-suggest most recent exam
5. **Bulk Actions**: Select multiple exams (if needed)
6. **Inline Details**: Expand card to show question breakdown

---

## Accessibility

✅ **Features Implemented**:
- Radio buttons with proper labels
- Clear text descriptions
- Color not only indicator (badges have text labels)
- Keyboard navigable
- Touch-friendly card sizes (48px minimum height)
- Sufficient contrast ratios

---

## Summary

The enhanced "Select Evaluated Paper" field provides:
- **Better Information** - Students see exam details before selecting
- **Clearer UI** - Radio buttons and cards are more intuitive than dropdowns
- **Better Feedback** - Helpful message when no papers available
- **Mobile Friendly** - Responsive design works on all screens
- **Consistent** - Matches design patterns in rest of application
- **Accessible** - Keyboard and screen reader friendly

**Status**: ✅ Ready for production testing
