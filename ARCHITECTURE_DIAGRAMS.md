# System Architecture Diagrams - AI Subjective Evaluation

## 1. High-Level System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      FACULTY INTERFACE                   │
│                                                          │
│  EvaluateExam.jsx                                        │
│  ├─ List pending evaluations                            │
│  ├─ Display questions & answers                         │
│  └─ Show SubjectiveAnswerEvaluation for subjective Qs   │
│                                                          │
│  SubjectiveAnswerEvaluation.jsx                         │
│  ├─ Analyze with AI button                              │
│  ├─ Display keyword analysis                            │
│  ├─ Accept/Manual Review buttons                        │
│  └─ Manual marks entry form                             │
└──────────────────────────────────────────────────────────┘
                           |
                    (REST API)
                           |
┌──────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES                      │
│                                                          │
│  evaluationRoutes.js                                     │
│  ├─ POST /evaluate-subjective                           │
│  └─ POST /subjective-manual-review                      │
│           |                                              │
│  evaluationController.js                                │
│  ├─ evaluateSubjectiveAnswer()                          │
│  ├─ submitSubjectiveManualReview()                      │
│  └─ Authorization & Validation                          │
│           |                                              │
│  aiSubjectiveEvaluationService.js                       │
│  ├─ extractKeywords()                                    │
│  ├─ calculateKeywordMatchScore()                        │
│  ├─ calculateAutoMarks()                                │
│  ├─ shouldFlagForManualReview()                         │
│  └─ evaluateSubjectiveAnswer()                          │
└──────────────────────────────────────────────────────────┘
                           |
              ┌────────────┼────────────┐
              |            |            |
         Groq API      MongoDB      Backend
         (Keyword)    (Storage)      Logic
              |            |            |
```

---

## 2. API Request/Response Flow

```
FACULTY CLICKS "ANALYZE WITH AI"
│
├─ Request: POST /api/evaluations/:id/evaluate-subjective
│  ├─ Body:
│  │  ├─ answerIndex: 2
│  │  ├─ studentAnswer: "Student's answer text..."
│  │  └─ actionType: "pending"
│  │
│  └─ Response:
│     ├─ success: true
│     ├─ studentAnswerKeywords: ["kw1", "kw2", ...]
│     ├─ aiAnswerKeywords: ["kw1", "kw2", "kw3", ...]
│     ├─ keywordMatchScore: 67%
│     ├─ aiAutoMarks: 6.7
│     ├─ aiConfidenceScore: 72%
│     ├─ requiresManualReview: false
│     └─ recommendation: "Review recommended"
│
├─ UI displays results
│  ├─ Keyword comparison (student vs AI)
│  ├─ Match score bar (67%)
│  ├─ Confidence badge (yellow)
│  └─ Auto-assigned marks (6.7/10)
│
└─ FACULTY CHOOSES ACTION
   │
   ├─ Path A: ACCEPT AI MARKS
   │  ├─ Marks updated in UI
   │  └─ Saved to Evaluation on submit
   │
   └─ Path B: MANUAL REVIEW
      ├─ Manual Review form appears
      │  ├─ Marks input (0-10)
      │  └─ Feedback textarea
      │
      ├─ Request: POST /api/evaluations/:id/subjective-manual-review
      │  ├─ Body:
      │  │  ├─ answerIndex: 2
      │  │  ├─ manualMarks: 7.5
      │  │  └─ feedback: "Good but missed..."
      │  │
      │  └─ Response:
      │     ├─ success: true
      │     ├─ marksObtained: 7.5
      │     ├─ manualFeedback: "Good but missed..."
      │     └─ manualReviewStatus: "reviewed"
      │
      └─ Marks updated in UI
         └─ Saved to Evaluation on submit
```

---

## 3. AI Evaluation Algorithm Flow

```
STUDENT ANSWER: "Photosynthesis converts light to glucose"
AI ANSWER:      "Photosynthesis uses light to make glucose from CO2"

        │
        ├─ STEP 1: EXTRACT KEYWORDS
        │
        ├─ Groq API Call 1: Extract from Student Answer
        │  └─ ["photosynthesis", "light", "glucose"]
        │
        ├─ Groq API Call 2: Extract from AI Answer
        │  └─ ["photosynthesis", "light", "glucose", "CO2", "conversion"]
        │
        ├─ STEP 2: MATCH KEYWORDS
        │
        ├─ Check Exact Matches:
        │  ├─ "photosynthesis" vs ["photosynthesis"...] = MATCH ✓
        │  ├─ "light" vs [...] = MATCH ✓
        │  └─ "glucose" vs [...] = MATCH ✓
        │  └─ Exact Matches: 3
        │
        ├─ Check Partial Matches:
        │  ├─ "photo" in "photosynthesis"? NO (already counted)
        │  └─ No new partial matches
        │  └─ Partial Matches: 0
        │
        ├─ STEP 3: CALCULATE MATCH SCORE
        │
        │  Match Score = (matches / total_ai_keywords) × 100
        │  Match Score = (3 / 5) × 100 = 60%
        │
        ├─ STEP 4: CALCULATE AUTO MARKS
        │
        │  Auto Marks = (matchScore / 100) × maxMarks
        │  Auto Marks = (60 / 100) × 10 = 6.0
        │
        │  Apply Scale (if matchScore < 40):
        │    6.0 × 0.95 = 5.7
        │  (Not applied here since 60% > 40%)
        │  Final: 6.0 marks
        │
        ├─ STEP 5: CALCULATE CONFIDENCE
        │
        │  Base Confidence = matchScore (60%)
        │  
        │  If match > 70: Add 10 bonus
        │  If match < 30: Reduce by 20%
        │  
        │  Final Confidence = 60%
        │
        ├─ STEP 6: DETERMINE IF MANUAL REVIEW NEEDED
        │
        │  Flag if any of:
        │  ├─ Confidence < 60% → NO (60% >= 60%)
        │  ├─ Match Score 30-60% → YES (60% is borderline)
        │  └─ Match Score < 20% → NO (60% > 20%)
        │
        │  Requires Manual Review? → YES
        │
        └─ RETURN RESULTS
           ├─ studentAnswerKeywords: ["photosynthesis", "light", "glucose"]
           ├─ aiAnswerKeywords: ["photosynthesis", "light", "glucose", "CO2", "conversion"]
           ├─ keywordMatchScore: 60%
           ├─ aiAutoMarks: 6.0
           ├─ aiConfidenceScore: 60%
           ├─ requiresManualReview: true
           └─ recommendation: "Review recommended"
```

---

## 4. Database Schema Relationship

```
Evaluation Document
├─ _id: ObjectId
├─ exam: ObjectId → Exam
├─ student: ObjectId → User
├─ submittedAt: Date
├─ answers: [
│  │
│  ├─ Answer 1 (MCQ - Auto-graded)
│  │  ├─ questionNumber: 1
│  │  ├─ answer: "B"
│  │  ├─ questionType: "mcq"
│  │  ├─ marksObtained: 1
│  │  ├─ maxMarks: 1
│  │  └─ isCorrect: true
│  │
│  ├─ Answer 2 (Subjective - AI+ Manual)
│  │  ├─ questionNumber: 2
│  │  ├─ question: ObjectId → Question
│  │  ├─ answer: "Student's long answer..."
│  │  ├─ questionType: "subjective"
│  │  ├─ maxMarks: 10
│  │  │
│  │  ├─ AI FIELDS:
│  │  ├─ aiGeneratedAnswer: "AI reference answer..."
│  │  ├─ studentAnswerKeywords: ["kw1", "kw2", "kw3"]
│  │  ├─ aiAnswerKeywords: ["kw1", "kw2", "kw3", "kw4", "kw5"]
│  │  ├─ keywordMatchScore: 60
│  │  ├─ aiAutoMarks: 6.0
│  │  ├─ aiConfidenceScore: 60
│  │  ├─ requiresManualReview: true
│  │  │
│  │  ├─ MANUAL REVIEW FIELDS:
│  │  ├─ manualReviewStatus: "reviewed"
│  │  ├─ manualMarksAssigned: 7.0
│  │  ├─ manualFeedback: "Good but missed key point..."
│  │  ├─ manualReviewBy: ObjectId → User (Faculty)
│  │  ├─ manualReviewedAt: Date
│  │  │
│  │  └─ FINAL VALUE:
│  │     └─ marksObtained: 7.0 (Faculty override)
│  │
│  └─ Answer 3, 4, ... (more answers)
│
├─ totalMarks: 27
├─ evaluatedBy: ObjectId → User (Faculty)
├─ status: "evaluated"
└─ auditLog: [
   ├─ { action: "AI evaluation performed", timestamp: ..., details: "..." }
   ├─ { action: "Manual review submitted", timestamp: ..., details: "..." }
   └─ { action: "Evaluation completed", timestamp: ..., details: "..." }
]
```

---

## 5. Component State Management Flow

```
EvaluateExam.jsx (Parent)
├─ State:
│  ├─ selectedSubmission: Evaluation object
│  ├─ marks: { qNum: value, ... }
│  └─ feedback: { qNum: text, ... }
│
└─ Renders for each subjective question:
   │
   └─ SubjectiveAnswerEvaluation.jsx (Child)
      │
      ├─ Props Received:
      │  ├─ answer: Answer object
      │  ├─ question: Question object
      │  ├─ evaluationId: UUID
      │  ├─ answerIndex: number
      │  └─ onEvaluationComplete: callback
      │
      ├─ Local State:
      │  ├─ evaluating: boolean
      │  ├─ evaluation: object or null
      │  ├─ manualMarks: string (input value)
      │  ├─ manualFeedback: string
      │  ├─ showManualReview: boolean
      │  └─ submittingReview: boolean
      │
      ├─ User Interaction:
      │  │
      │  ├─ Click "Analyze with AI"
      │  │  ├─ runAiEvaluation()
      │  │  ├─ evaluating = true
      │  │  ├─ POST /evaluate-subjective
      │  │  ├─ evaluation = response
      │  │  └─ evaluating = false
      │  │
      │  ├─ Click "Accept AI Marks"
      │  │  ├─ acceptAiMarks()
      │  │  ├─ POST /evaluate-subjective (actionType: "accept")
      │  │  ├─ evaluation updated
      │  │  └─ onEvaluationComplete(index, marks)
      │  │     └─ Parent updates marks[qNum]
      │  │
      │  └─ Click "Manual Review" > Submit:
      │     ├─ submitManualReview()
      │     ├─ Validate marks in range
      │     ├─ POST /subjective-manual-review
      │     ├─ showManualReview = false
      │     └─ onEvaluationComplete(index, marksValue)
      │        └─ Parent updates marks[qNum]
      │
      └─ Conditional Rendering:
         ├─ No evaluation? → Show "Analyze with AI" button
         ├─ Has evaluation? → Show:
         │  ├─ Keyword pills (student vs AI)
         │  ├─ Match score bar
         │  ├─ Confidence badge
         │  └─ Accept button (if high confidence)
         └─ Manual review form (if clicked)
```

---

## 6. Authorization & Security Flow

```
User Clicks Evaluate
│
├─ Request: POST /api/evaluations/:id/evaluate-subjective
│  ├─ Middleware: protect
│  │  ├─ Extract JWT token from headers
│  │  ├─ Verify token signature
│  │  ├─ Extract user ID and role
│  │  └─ Attach user to req object
│  │
│  ├─ Middleware: authorize('faculty', 'admin')
│  │  ├─ Check req.user.role in ['faculty', 'admin']
│  │  ├─ If not authorized → 403 Forbidden
│  │  └─ If authorized → Continue
│  │
│  └─ Controller: evaluateSubjectiveAnswer()
│     ├─ Fetch Evaluation by ID
│     ├─ Fetch Exam by ID
│     ├─ Check Authorization:
│     │  ├─ Is exam.createdBy === req.user.id? OR admin?
│     │  └─ If not → 403 Forbidden
│     ├─ Call AI service
│     ├─ Update database
│     ├─ Update auditLog with faculty ID
│     └─ Return results
│
└─ Response: 200 OK with evaluation data
   └─ Student can't access this endpoint
      (Would fail authorization check)
```

---

## 7. Data Flow: From Question Creation to Student Viewing Results

```
STEP 1: FACULTY CREATES EXAM
├─ Creates question with:
│  ├─ Question text
│  ├─ Question type: "subjective"
│  ├─ Max marks: 10
│  └─ AI-generated answer: "Reference answer from AI..."
│
STEP 2: STUDENT TAKES EXAM
├─ Views question
├─ Submits answer
├─ Submission stored in:
│  └─ Evaluation.answers[2]
│     ├─ answer: "Student's answer"
│     ├─ questionType: "subjective"
│     └─ marksObtained: null (not yet evaluated)
│
STEP 3: FACULTY EVALUATES
├─ Opens evaluation in UI
├─ Clicks "Analyze with AI"
│  ├─ AI extracts keywords
│  ├─ Calculates match
│  ├─ Creates confidence score
│  └─ Returns results
├─ Reviews results
├─ Takes action:
│  ├─ Accept marks: Marks auto-set
│  └─ Manual review: Enters custom marks + feedback
├─ Clicks "Submit Evaluation"
│  └─ All answers saved to database:
│     ├─ marksObtained: updated
│     ├─ AI fields: populated
│     ├─ Manual fields: if applicable
│     └─ auditLog: entry added
│
STEP 4: STUDENT VIEWS RESULTS
├─ Navigates to "Evaluations"
├─ Sees evaluated exam
├─ Can view:
│  ├─ Final marks
│  ├─ Keyword analysis
│  ├─ AI confidence score
│  ├─ Faculty feedback
│  └─ Comparison with AI answer
│
STEP 5: GENERATE RESULT TRANSCRIPT
├─ If 5 exams completed
├─ System generates result with:
│  ├─ Total marks
│  ├─ CGPA
│  ├─ Grade
│  └─ Can download as PDF
```

---

## 8. Groq API Integration

```
Backend Service
│
├─ Import: import Groq from 'groq-sdk'
├─ Initialize: const groq = new Groq({ apiKey })
│
├─ extractKeywords() function
│  ├─ Message to Groq:
│  │  ├─ Model: "mixtral-8x7b-32768"
│  │  ├─ Max Tokens: 500
│  │  ├─ Task: "Extract 5-10 keywords from answer"
│  │  └─ Input: Answer + Question text
│  │
│  ├─ Groq processes via API
│  │  └─ Natural Language Processing
│  │
│  └─ Response:
│     └─ Keywords: "keyword1, keyword2, keyword3, ..."
│
├─ Error Handling:
│  ├─ API timeout → Return empty keywords
│  ├─ Invalid API key → Process fails gracefully
│  └─ Network error → Fall back to manual review
│
└─ Cost:
   └─ ~0.0001 credits per 2-call evaluation
      (Very cheap)
```

---

## 9. Complete User Workflow Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                      FACULTY WORKFLOW                           │
└─────────────────────────────────────────────────────────────────┘

1. OPEN EVALUATION
   ├─ Navigate to "Evaluate Submissions"
   ├─ See list of pending exams
   └─ Click exam to evaluate

2. VIEW QUESTIONS
   ├─ See all questions
   ├─ For MCQ/TF: Auto-graded (green/red)
   └─ For Subjective: Manual fields

3. SUBJECTIVE QUESTIONS
   ├─ See student answer
   ├─ See "Analyze with AI" button
   └─ Click button

4. AI ANALYSIS (2-3 seconds)
   ├─ Groq extracts keywords
   ├─ Algorithms calculate match
   ├─ Confidence determined
   └─ Results displayed:
      ├─ Keywords comparison (pill groups)
      ├─ Match score bar chart
      ├─ Auto marks value
      └─ Confidence badge

5A. HIGH CONFIDENCE PATH (match ≥ 80%)
    ├─ Click "Accept AI Marks"
    ├─ Marks field auto-filled
    └─ Ready to submit

5B. MANUAL REVIEW PATH (match < 80%)
    ├─ Click "Manual Review"
    ├─ Enter marks (0-10)
    ├─ Enter feedback
    └─ Click "Submit Review"

6. SUBMIT EVALUATION
   ├─ Click "Submit Evaluation"
   ├─ All answers saved
   ├─ Status → "Evaluated"
   └─ Audit log updated

7. STUDENT VIEWS
   ├─ Navigates to evaluated exam
   ├─ Sees final marks
   ├─ Reads feedback
   └─ Views keyword analysis

┌─────────────────────────────────────────────────────────────────┐
│                    STUDENT WORKFLOW                             │
└─────────────────────────────────────────────────────────────────┘

1. TAKE EXAM
   ├─ See questions
   ├─ For MCQ: Select option
   └─ For Subjective: Write answer

2. SUBMIT EXAM
   ├─ Click "Submit"
   ├─ Exam saved with answers
   └─ Status → "Under Evaluation"

3. WAIT FOR EVALUATION
   ├─ View exam status
   ├─ Status eventually → "Evaluated"
   └─ Notification received

4. VIEW RESULTS
   ├─ Go to "Evaluations"
   ├─ Click evaluated exam
   ├─ See marks for each question
   ├─ For subjective: View
   │  ├─ Final marks
   │  ├─ Keyword analysis
   │  ├─ Faculty feedback
   │  └─ Confidence indicator
   └─ Overall marks + feedback

5. REQUEST RE-EVALUATION
   ├─ If unsatisfied with marks
   ├─ Click "Request Re-evaluation"
   ├─ Provide reason
   └─ Faculty reviews again
```

---

## 10. Error Handling Flow

```
POST /evaluate-subjective
│
├─ Input Validation:
│  ├─ answerIndex valid? → NO → 404 "Answer not found"
│  ├─ evaluationId valid? → NO → 404 "Evaluation not found"
│  └─ examId valid? → NO → 404 "Exam not found"
│
├─ Authorization Check:
│  ├─ Faculty owns exam? → NO → 403 "Not authorized"
│  └─ Is admin? → YES → Continue
│
├─ AI Evaluation Call:
│  ├─ Groq API error? 
│  │  ├─ Network error → Return 500 with error message
│  │  ├─ API timeout → Return error gracefully
│  │  └─ Invalid key → Return 500 "API configuration error"
│  │
│  ├─ Evaluation success?
│  │  ├─ YES → Continue to database update
│  │  └─ NO → Return error with message
│  │
│  └─ Database Update:
│     ├─ Save success? → YES → Return 200 with results
│     └─ Save error? → NO → Return 500 with error

POST /subjective-manual-review
│
├─ Input Validation:
│  ├─ Marks in range (0 to max)? → NO → 400 "Invalid marks"
│  ├─ answerIndex valid? → NO → 404 "Answer not found"
│  └─ evaluationId valid? → NO → 404 "Evaluation not found"
│
├─ Authorization Check:
│  ├─ Faculty owns exam? → NO → 403 "Not authorized"
│  └─ Is admin? → YES → Continue
│
└─ Database Update:
   ├─ Update success? → YES → Return 200 with confirmation
   └─ Update error? → NO → Return 500 with error message
```

---

## 11. Performance Timeline

```
FACULTY CLICKS "ANALYZE WITH AI"
│
├─ T+0ms: Request sent to backend
│
├─ T+50ms: Authorization check + database lookup
│
├─ T+100ms: Groq API call 1 starts (extract student keywords)
├─ T+1100ms: Groq API call 1 completes
│
├─ T+1150ms: Groq API call 2 starts (extract AI keywords)
├─ T+2150ms: Groq API call 2 completes
│
├─ T+2200ms: Keyword matching algorithm (< 100ms)
├─ T+2250ms: Confidence calculation (< 10ms)
├─ T+2260ms: Mark calculation (< 10ms)
│
├─ T+2300ms: Database update + audit log
│
├─ T+2350ms: Response sent to frontend
│
├─ T+2400ms: Frontend renders results
│  └─ Keywords display
│  └─ Match score bar
│  └─ Confidence badge
│  └─ Buttons
│
└─ T+2500ms: READY FOR FACULTY ACTION (2.5 seconds total)
   ├─ Faculty sees results
   ├─ Can click "Accept AI Marks"
   └─ Or can click "Manual Review"
```

---

**End of Architecture Diagrams**

These diagrams illustrate:
1. System components and relationships
2. Request/response data flows
3. Algorithm step-by-step execution
4. Database schema organization
5. Component state management
6. Security and authorization
7. Complete data journey
8. Third-party API integration
9. User workflows (faculty and students)
10. Error handling paths
11. Performance timeline

For more details, see the comprehensive documentation files.
