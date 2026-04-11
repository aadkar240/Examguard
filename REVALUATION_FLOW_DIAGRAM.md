# Faculty Re-Evaluation - Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                       FACULTY RE-EVALUATION FLOW                     │
└─────────────────────────────────────────────────────────────────────┘


STEP 1: STUDENT CREATES GRIEVANCE
═══════════════════════════════════════════════════════════════════════

    Student Dashboard
         │
         ├─→ Create Grievance
         │       ├── Select Problem Type: "Marks Discrepancy"
         │       ├── Select Evaluated Paper: [Radio Button Cards]
         │       │       ┌────────────────────────────────────┐
         │       │       │ ○ End Sem Exam - OOP               │
         │       │       │   Marks: 15/20 | Grade: B          │
         │       │       │   Evaluated on: Jan 15, 2026       │
         │       │       └────────────────────────────────────┘
         │       ├── Description: "Q3 deserves more marks"
         │       └── Submit → Grievance Created ✓
         │
         └─→ Notification sent to Faculty


STEP 2: FACULTY SEES GRIEVANCE (NEW FEATURE!)
═══════════════════════════════════════════════════════════════════════

    Faculty Dashboard
         │
         ├─→ Manage Grievances (Auto-refreshes every 5s)
         │       
         │   ┌──────────────────────────────────────────────────┐
         │   │ GRV20260200001              [Open] [Medium]      │
         │   │ Marks Discrepancy - End Sem Exam OOP             │
         │   │ John Doe (CS2021001)                             │
         │   │ Dept: Computer Science | Sem: 5                  │
         │   │                                                   │
         │   │ ▼ Click to expand                                │
         │   └──────────────────────────────────────────────────┘
         │
         ├─→ Faculty Clicks to Expand
         │
         │   EXPANDED VIEW:
         │   ┌───────────────────────────────────────────────────┐
         │   │ Description:                                      │
         │   │ "I believe Q3 deserves more marks because..."     │
         │   │                                                    │
         │   │ ╔══════════════════════════════════════════════╗  │
         │   │ ║ Related Evaluation    [📄 View Student Ans..] ║ │ ← NEW!
         │   │ ║ Current Marks: 15/20                         ║  │
         │   │ ║ Grade: B                                     ║  │
         │   │ ║ Status: evaluated                            ║  │
         │   │ ╚══════════════════════════════════════════════╝  │
         │   │                                                    │
         │   │ [Review & Update Marks]                           │
         │   └───────────────────────────────────────────────────┘
         │
         └─→ Faculty Clicks "📄 View Student Answers" Button


STEP 3: VIEW COMPLETE EXAM (NEW MODAL!)
═══════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────┐
    │ ✖ Checked Exam Paper                                            │
    │ Object Oriented Programming • Computer Science                  │
    │ Score: 15/20 (75.0%) • Grade: B                                 │
    ├─────────────────────────────────────────────────────────────────┤
    │                                                                  │
    │ ┌───────────────────────────────────────────────────────────┐   │
    │ │ Q1. Define encapsulation with example      8/10  [✓ Check] │   │
    │ │ Type: short-answer • Marks: 10                             │   │
    │ │ ┌──────────────────────┬────────────────────────────────┐  │   │
    │ │ │ Your Answer          │ Marking Rubric                 │  │   │
    │ │ │                      │                                │  │   │
    │ │ │ Encapsulation is the │ Must define: Data hiding (3pt)│  │   │
    │ │ │ process of hiding    │ Access control (2pt)          │  │   │
    │ │ │ internal data and    │ Methods for access (2pt)      │  │   │
    │ │ │ providing public     │ Example code (3pt)            │  │   │
    │ │ │ methods to access it.│                                │  │   │
    │ │ │                      │                                │  │   │
    │ │ │ Example:             │                                │  │   │
    │ │ │ class Account {      │                                │  │   │
    │ │ │   private balance;   │                                │  │   │
    │ │ │   getBalance()...    │                                │  │   │
    │ │ │ }                    │                                │  │   │
    │ │ └──────────────────────┴────────────────────────────────┘  │   │
    │ │ Faculty Feedback: Good explanation and example. Missing    │   │
    │ │                   some details about access modifiers.     │   │
    │ └───────────────────────────────────────────────────────────┘   │
    │                                                                  │
    │ ┌───────────────────────────────────────────────────────────┐   │
    │ │ Q2. Explain method overloading vs overriding  5/5  [✓]    │   │
    │ │ Type: short-answer • Marks: 5                              │   │
    │ │ ┌──────────────────────┬────────────────────────────────┐  │   │
    │ │ │ Your Answer          │ Marking Rubric                 │  │   │
    │ │ │                      │                                │  │   │
    │ │ │ Overloading: Same    │ Define overloading (2pt)       │  │   │
    │ │ │ method name,         │ Define overriding (2pt)        │  │   │
    │ │ │ different params.    │ Key difference (1pt)           │  │   │
    │ │ │                      │                                │  │   │
    │ │ │ Overriding: Subclass │                                │  │   │
    │ │ │ redefines parent     │                                │  │   │
    │ │ │ method.              │                                │  │   │
    │ │ └──────────────────────┴────────────────────────────────┘  │   │
    │ │ Faculty Feedback: Perfect answer, covers all points!       │   │
    │ └───────────────────────────────────────────────────────────┘   │
    │                                                                  │
    │ ┌───────────────────────────────────────────────────────────┐   │
    │ │ Q3. Write code demonstrating inheritance   2/5  [⚠ Part]  │   │ ← Student disputes this!
    │ │ Type: code • Marks: 5                                      │   │
    │ │ ┌──────────────────────┬────────────────────────────────┐  │   │
    │ │ │ Your Answer          │ Marking Rubric                 │  │   │
    │ │ │                      │                                │  │   │
    │ │ │ class Animal {       │ Parent class (1pt)             │  │   │
    │ │ │   void eat() {       │ Child class (1pt)              │  │   │
    │ │ │     //code           │ Use of 'extends' (1pt)         │  │   │
    │ │ │   }                  │ Inherited method call (1pt)    │  │   │
    │ │ │ }                    │ Override example (1pt)         │  │   │
    │ │ │                      │                                │  │   │
    │ │ │ class Dog extends    │                                │  │   │
    │ │ │   Animal {           │                                │  │   │
    │ │ │   void bark() {      │                                │  │   │
    │ │ │     //code           │                                │  │   │
    │ │ │   }                  │                                │  │   │
    │ │ │ }                    │                                │  │   │
    │ │ └──────────────────────┴────────────────────────────────┘  │   │
    │ │ Faculty Feedback: Shows parent & child class. Missing      │   │
    │ │                   inherited method call & override example.│   │
    │ └───────────────────────────────────────────────────────────┘   │
    │                                                                  │
    │                     ( Scroll for more questions )                │
    │                                                                  │
    └─────────────────────────────────────────────────────────────────┘
                                      │
                                      │
                    Faculty Reviews Q3 & Thinks:
                    "Actually, student did show inheritance
                     with extends keyword and has parent/child.
                     Code is valid. Let me give 3/5 instead."
                                      │
                                      ├─→ Close Modal
                                      │


STEP 4: UPDATE MARKS WITH REMARKS
═══════════════════════════════════════════════════════════════════════

    Back to Grievance View
         │
         ├─→ Faculty Clicks "Review & Update Marks"
         │
         │   ┌───────────────────────────────────────────────────────┐
         │   │ Update Marks                                          │
         │   │                                                        │
         │   │ Updated Total Marks (Max: 20)                         │
         │   │ ┌──────────┐                                          │
         │   │ │ 18       │  (was 15, Q3: 2→5 means +3)              │
         │   │ └──────────┘                                          │
         │   │                                                        │
         │   │ Remarks (Optional)                                    │
         │   │ ┌─────────────────────────────────────────────────┐   │
         │   │ │ Re-evaluated Q3 after viewing student's code.   │   │
         │   │ │ Code correctly demonstrates inheritance with    │   │
         │   │ │ parent/child classes and extends keyword.       │   │
         │   │ │ Increased from 2 to 5 marks.                    │   │
         │   │ └─────────────────────────────────────────────────┘   │
         │   │                                                        │
         │   │ [✓ Confirm & Update]  [Cancel]                        │
         │   └───────────────────────────────────────────────────────┘
         │
         └─→ Faculty Clicks "Confirm & Update"


STEP 5: SYSTEM UPDATES & NOTIFIES
═══════════════════════════════════════════════════════════════════════

    Backend Processing:
         │
         ├─→ Update Evaluation.totalMarks: 15 → 18
         │
         ├─→ Recalculate grade: B (75%) → B+ (90%)
         │
         ├─→ Update Evaluation.status: 'evaluated' → 're-evaluated'
         │
         ├─→ Create Audit Log:
         │       {
         │         action: 'marks-updated-after-grievance',
         │         performedBy: Faculty ID,
         │         timestamp: 2026-02-01T10:30:00Z,
         │         details: {
         │           previousMarks: 15,
         │           updatedMarks: 18,
         │           previousGrade: 'B',
         │           updatedGrade: 'B+',
         │           remarks: '...'
         │         }
         │       }
         │
         ├─→ Update Grievance.evaluationReview
         │
         ├─→ Update Grievance.status: 'open' → 'resolved'
         │
         ├─→ Send Email to Student:
         │       Subject: "Your grievance has been resolved"
         │       Body: "Your marks have been updated from 15/20
         │              to 18/20. Grade changed from B to B+."
         │
         └─→ Emit Socket.IO Events:
                 - 'evaluation-updated-after-grievance'
                 - 'grievance-resolved'


STEP 6: STUDENT SEES UPDATE
═══════════════════════════════════════════════════════════════════════

    Student Dashboard
         │
         ├─→ Receives Notification (Real-time via Socket.IO)
         │       "Your grievance GRV20260200001 has been resolved!"
         │
         ├─→ Receives Email
         │       "Marks updated: 15/20 → 18/20"
         │
         ├─→ Checks Grievance Status:
         │   ┌───────────────────────────────────────────────────────┐
         │   │ GRV20260200001                          [Resolved]    │
         │   │ Marks Discrepancy - End Sem Exam OOP                  │
         │   │                                                        │
         │   │ ╔═══════════════════════════════════════════════════╗ │
         │   │ ║ Marks Update Summary                              ║ │
         │   │ ║                                                   ║ │
         │   │ ║ Before: 15/20 (B)                                 ║ │
         │   │ ║ After:  18/20 (B+)                                ║ │
         │   │ ║                                                   ║ │
         │   │ ║ Faculty Remarks:                                  ║ │
         │   │ ║ "Re-evaluated Q3 after viewing student's code..." ║ │
         │   │ ╚═══════════════════════════════════════════════════╝ │
         │   └───────────────────────────────────────────────────────┘
         │
         └─→ Student views updated exam result:
                 ┌────────────────────────────────────────┐
                 │ End Sem Exam - OOP                     │
                 │ Marks: 18/20 | Grade: B+ ✓ Updated!   │
                 │ Status: re-evaluated                   │
                 └────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════
                            PROCESS COMPLETE! ✓
═══════════════════════════════════════════════════════════════════════


KEY IMPROVEMENTS:
═══════════════════════════════════════════════════════════════════════

BEFORE (❌):
    Faculty sees: "15/20, Grade B"
    Faculty thinks: "Should I increase? Can't remember..."
    Faculty updates: Blind guess ❌

AFTER (✅):
    Faculty sees: "15/20, Grade B"
    Faculty clicks: [📄 View Student Answers] ✓
    Faculty reviews: Complete exam with Q1, Q2, Q3... ✓
    Faculty analyzes: "Q3 actually deserves more marks" ✓
    Faculty updates: 15 → 18 with detailed remarks ✓
    Student receives: Fair evaluation + transparent reasoning ✓


TECHNICAL FLOW:
═══════════════════════════════════════════════════════════════════════

Frontend:                          Backend:
    
ManageGrievances.jsx               
     │                             
     ├─ [View Student Answers]     
     │   onClick()                 
     │   ↓                         
     ├─ handleViewStudentAnswers() 
     │   ↓                         
     ├─ api.get('/evaluations/:id')────────→ GET /api/evaluations/:id
     │                                          ↓
     │                                       Evaluation.findById()
     │                                          .populate('exam')
     │                                          .populate('student')
     │                                          ↓
     │   ←────────────────────────────────── response: {
     │                                         evaluation: {
     │                                           exam: { questions: [...] },
     │                                           answers: [...],
     │                                           totalMarks, grade, ...
     │                                         }
     │                                       }
     ├─ setViewingEvaluation()    
     │   ↓                         
     └─ CheckedExamReviewModal    
         ├─ Shows: Questions       
         ├─ Shows: Student Answers 
         ├─ Shows: Marks & Feedback
         └─ Close button          


═══════════════════════════════════════════════════════════════════════
                      END OF VISUAL FLOW DIAGRAM
═══════════════════════════════════════════════════════════════════════
```
