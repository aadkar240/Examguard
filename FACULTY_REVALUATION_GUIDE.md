# Faculty Re-Evaluation Guide

## Overview
Faculty can now **view student's complete exam answers** when reviewing grievances. This allows proper re-evaluation with access to all questions, student responses, and original marks.

---

## New Features Added

### 1. **View Student Answers Button**
- Located in the "Related Evaluation" section of each grievance
- Click to open a detailed modal showing:
  - All exam questions
  - Student's submitted answers
  - Current marks per question
  - Faculty feedback given during initial evaluation
  - Expected answers/rubrics

### 2. **Detailed Exam Review Modal**
The modal displays:
- **Exam Header**: Title, subject, total score, grade
- **Per-Question View**:
  - Question text and type (MCQ, True/False, Short Answer, etc.)
  - Maximum marks for the question
  - Student's answer (what they submitted)
  - Expected answer OR marking rubric
  - Marks obtained (current)
  - Faculty feedback (if provided)
  - Visual status indicator (Correct/Partially Correct/Needs Improvement)

---

## How to Re-Evaluate an Exam

### Step 1: Open Grievance Dashboard
1. Navigate to **Faculty Dashboard** → **Manage Grievances**
2. The page auto-refreshes every 5 seconds
3. Use filters: All / Open / In-Progress / Resolved

### Step 2: View Student Answers
1. Click on a grievance to expand details
2. In the **Related Evaluation** section (blue box), click **"View Student Answers"**
3. Modal opens showing complete exam review

### Step 3: Review Questions & Answers
In the modal, for each question, you'll see:
```
╔══════════════════════════════════════════════════════╗
║ Q1. What is the capital of France?                  ║
║ Type: mcq • Marks: 2                                ║
║                                          Score: 2/2  ║
║                                    [✓ Correct]       ║
╠══════════════════════════════════════════════════════╣
║ Your Answer        │ Expected Answer                ║
║ Paris              │ Paris                          ║
╠══════════════════════════════════════════════════════╣
║ Faculty Feedback                                     ║
║ Perfect answer!                                     ║
╚══════════════════════════════════════════════════════╝
```

### Step 4: Update Marks (If Needed)
1. Close the modal
2. Click **"Review & Update Marks"** button
3. Enter new total marks
4. Add remarks explaining the change
5. Click **"Confirm & Update"**

The system will:
- Update evaluation marks
- Recalculate grade and percentage
- Record before/after audit trail
- Notify student via email + in-app notification
- Mark grievance as resolved (if appropriate)

---

## Key Benefits

### For Faculty:
- ✅ **Full Context**: See all questions and student answers before updating marks
- ✅ **Informed Decisions**: Make re-evaluation decisions based on complete information
- ✅ **Audit Trail**: All changes are logged with timestamps and remarks
- ✅ **Easy Navigation**: View answers without leaving the grievance page

### For Students:
- ✅ **Transparent Process**: Know that faculty can review actual answers
- ✅ **Fair Re-Evaluation**: Marks updated after thorough review
- ✅ **Instant Notification**: Get notified when marks are updated

---

## Technical Details

### API Endpoints Used
```javascript
// Fetch full evaluation with exam questions
GET /api/evaluations/:evaluationId
// Response includes: exam.questions[], answers[], marks, feedback

// Update marks after re-evaluation
POST /api/grievances/:grievanceId/review-evaluation
// Body: { updatedTotalMarks, remarks }
```

### Frontend Components
- **ManageGrievances.jsx**: Main faculty grievance dashboard
  - Auto-refresh every 5 seconds
  - Manual refresh button
  - Expand/collapse grievance cards
  - View Student Answers button

- **CheckedExamReviewModal.jsx**: Full-screen exam review modal
  - Read-only view of evaluated exam
  - Shows questions, answers, marks, feedback
  - Color-coded status indicators

### Data Flow
```
1. Faculty clicks "View Student Answers"
   ↓
2. Frontend calls GET /api/evaluations/:id
   ↓
3. Backend fetches Evaluation + populates Exam.questions
   ↓
4. Modal renders with complete exam data
   ↓
5. Faculty reviews answers
   ↓
6. Faculty clicks "Review & Update Marks"
   ↓
7. Frontend calls POST /grievances/:id/review-evaluation
   ↓
8. Backend updates marks + creates audit log + notifies student
```

---

## Example Workflow

### Scenario: Student Appeals Question 3 Marks

**Student Action:**
- Creates grievance: "I believe my answer to Q3 deserves more marks"
- Links grievance to evaluated exam
- Problem type: "Marks Discrepancy"

**Faculty Action (OLD way):**
- ❌ Opens grievance
- ❌ Only sees total marks: 15/20
- ❌ Has to manually find the exam paper elsewhere
- ❌ Updates marks blindly

**Faculty Action (NEW way):**
- ✅ Opens grievance
- ✅ Clicks "View Student Answers"
- ✅ **Sees Q3**: Student wrote detailed answer, initial marks = 2/5
- ✅ Re-reads answer against rubric
- ✅ Realizes answer covered 4/5 points
- ✅ Closes modal, clicks "Review & Update Marks"
- ✅ Updates total from 15/20 to 18/20
- ✅ Adds remarks: "Re-evaluated Q3: covered additional key points, increased from 2 to 5"
- ✅ Student gets notification + sees update

---

## Important Notes

### Security & Authorization
- Faculty can only view evaluations for grievances in their department
- Students cannot see faculty-view evaluation modals (read-only access via different route)
- Admin can see all grievances and evaluations

### Auto-Refresh
- Grievances list refreshes every 5 seconds automatically
- Manual refresh button available for immediate updates
- Loading states prevent duplicate requests

### Evaluation Status
- Initial evaluation: `status = 'evaluated'`
- After re-evaluation: `status = 're-evaluated'`
- Audit log tracks all changes with timestamps

### Grade Recalculation
When marks are updated:
```javascript
// Automatic recalculation
percentage = (updatedMarks / maxMarks) * 100
grade = calculateGrade(percentage)
// Grade scale: A (90-100), B (80-89), C (70-79), D (60-69), F (<60)
```

---

## Troubleshooting

### "View Student Answers" button disabled
- **Cause**: Evaluation data still loading
- **Solution**: Wait 1-2 seconds, button will become enabled

### Modal shows "No questions found"
- **Cause**: Exam might not have questions populated
- **Solution**: Check exam creation - ensure questions were saved

### Marks update fails
- **Cause**: Invalid marks (exceeds max marks)
- **Solution**: Ensure updated marks ≤ max marks for the exam

### Grievances not visible
- **Cause**: Department mismatch between student and faculty
- **Solution**: Check user profiles - departments must match

---

## Best Practices

1. **Always Review Answers First**
   - Don't update marks without viewing student answers
   - Use the modal to ensure fair re-evaluation

2. **Add Clear Remarks**
   - Explain what changed during re-evaluation
   - Reference specific questions (e.g., "Q3 and Q7 re-checked")

3. **Respond Before Resolving**
   - Add a response explaining your decision
   - Then mark grievance as resolved

4. **Check Audit Trail**
   - Review the "Marks Update Summary" section
   - Verify before/after values are correct

5. **Use Status Updates**
   - Mark "In Progress" when starting review
   - Mark "Resolved" only after marks are updated

---

## Future Enhancements (Potential)

- [ ] Allow per-question mark editing in the modal
- [ ] Add "Re-evaluate" mode with editable marks directly in modal
- [ ] Export grievance report with before/after comparison
- [ ] Bulk re-evaluation for multiple grievances
- [ ] Attach evidence files (scanned answer sheets)

---

## Support

If you encounter issues:
1. Check console logs (F12 → Console tab)
2. Verify backend is running (port 5000)
3. Check that student department matches yours
4. Review error messages in toast notifications

**System Status Indicators:**
- 🟢 Auto-refresh active (updates every 5s)
- 🔄 Manual refresh button available
- 📊 Grievance count displayed (Total | Open)

---

*Last Updated: 2026-02-01*  
*Version: 2.0 - Added Full Exam Review Capability*
