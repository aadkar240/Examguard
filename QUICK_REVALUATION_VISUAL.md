# 📋 Quick Guide: Faculty Re-Evaluation with Student Answers

## What's New? 🎉

Faculty can now **view the complete exam** (questions + student answers) when reviewing grievances!

---

## Visual Workflow

### Before (❌ OLD)
```
Grievance Dashboard
├── Grievance Card
│   ├── Student Name
│   ├── Problem: Marks Discrepancy
│   └── Related Evaluation: 15/20 (Grade B)  ← Only summary!
│
└── [Review & Update Marks]  ← Blind update!
```

### After (✅ NEW)
```
Grievance Dashboard
├── Grievance Card
│   ├── Student Name
│   ├── Problem: Marks Discrepancy
│   └── Related Evaluation: 15/20 (Grade B)
│       └── [📄 View Student Answers]  ← NEW BUTTON!
│
├── Click → Opens Modal:
│   ┌────────────────────────────────────────┐
│   │ Checked Exam Paper                     │
│   │ Score: 15/20 (75%) • Grade: B          │
│   ├────────────────────────────────────────┤
│   │ Q1. What is OOP?               [8/10]  │
│   │ ├─ Student Answer: "Object..."         │
│   │ ├─ Rubric: "Should mention..."         │
│   │ └─ Feedback: "Good but incomplete"     │
│   │                                         │
│   │ Q2. Explain inheritance        [5/5]   │
│   │ ├─ Student Answer: "Derived..."        │
│   │ ├─ Rubric: "Must define..."            │
│   │ └─ Feedback: "Perfect!"                │
│   │                                         │
│   │ Q3. Code example               [2/5]   │
│   │ ├─ Student Answer: "class X{}"         │
│   │ ├─ Rubric: "Must show..."              │
│   │ └─ Feedback: "Missing details"         │
│   └────────────────────────────────────────┘
│
└── After reviewing → Close modal
    └── [Review & Update Marks]  ← Informed decision!
```

---

## Step-by-Step (3 Easy Steps!)

### Step 1: Open Grievance & Click Button
```
┌─────────────────────────────────────────────────────┐
│ Manage Grievances              [🔄 Refresh]         │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📌 GRV20260200001                    [Open]         │
│ Marks Discrepancy - End Sem Exam                   │
│ John Doe (CS2021001)                                │
│ Dept: Computer Science | Sem: 5                     │
│                                                      │
│ ▼ Click to expand                                   │
└─────────────────────────────────────────────────────┘

After clicking:

┌─────────────────────────────────────────────────────┐
│ 📌 GRV20260200001                    [Open]         │
│ ▲ (Expanded)                                        │
├─────────────────────────────────────────────────────┤
│ Description:                                        │
│ "I believe Q3 deserves more marks..."               │
│                                                      │
│ 📘 Related Evaluation      [📄 View Student Answers]│  ← Click here!
│ Current Marks: 15/20                                │
│ Grade: B                                            │
│ Status: evaluated                                   │
└─────────────────────────────────────────────────────┘
```

### Step 2: Review Complete Exam in Modal
```
┌─────────────────────────────────────────────────────┐
│ ✖ Checked Exam Paper                                │
│ Object Oriented Programming • Computer Science      │
│ Score: 15/20 (75.0%) • Grade: B                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Q1. Explain encapsulation     15/20  [✓ Correct]│ │
│ │ Type: short-answer • Marks: 10                  │ │
│ │ ┌───────────────────┬───────────────────────────┐│ │
│ │ │ Your Answer       │ Marking Rubric           ││ │
│ │ │ "Encapsulation is │ "Must define hiding data ││ │
│ │ │  data hiding..."  │  and methods, give       ││ │
│ │ │                   │  example..."             ││ │
│ │ └───────────────────┴───────────────────────────┘│ │
│ │ Faculty Feedback: "Good explanation, example OK"│ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Q2. Write a class example     2/5   [⚠ Partial] │ │  ← Check this!
│ │ Type: code • Marks: 5                           │ │
│ │ ┌───────────────────┬───────────────────────────┐│ │
│ │ │ Your Answer       │ Marking Rubric           ││ │
│ │ │ class Demo {      │ "Code must have:         ││ │
│ │ │   int x;          │  - Constructor (1pt)     ││ │
│ │ │ }                 │  - Private vars (1pt)    ││ │
│ │ │                   │  - Getters/setters (2pt) ││ │
│ │ │                   │  - Example usage (1pt)"  ││ │
│ │ └───────────────────┴───────────────────────────┘│ │
│ │ Feedback: "Missing constructor and methods"     │ │  ← Re-check this!
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│        [Scroll down for more questions...]          │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Faculty Thinking:**  
"Oh wait, student actually shows understanding of encapsulation in the first line. The code has private variable concept. Let me give 3/5 instead of 2/5!"

### Step 3: Update Marks with Remarks
```
Close modal → Back to grievance

┌─────────────────────────────────────────────────────┐
│ [Review & Update Marks]  ← Click to update          │
└─────────────────────────────────────────────────────┘

Form appears:

┌─────────────────────────────────────────────────────┐
│ Update Marks                                        │
│                                                      │
│ Updated Total Marks (Max: 20)                       │
│ ┌─────────────────┐                                 │
│ │ 16              │  (was 15)                       │
│ └─────────────────┘                                 │
│                                                      │
│ Remarks (Optional)                                  │
│ ┌───────────────────────────────────────────────┐   │
│ │ Re-evaluated Q2: Student shows understanding  │   │
│ │ of encapsulation concept, increased from 2    │   │
│ │ to 3 marks                                    │   │
│ └───────────────────────────────────────────────┘   │
│                                                      │
│ [✓ Confirm & Update]  [Cancel]                      │
└─────────────────────────────────────────────────────┘

Click Confirm → ✅ Done!
```

**Result:**
- ✅ Marks updated: 15 → 16
- ✅ Grade recalculated: B → B (80%)
- ✅ Student notified via email + in-app
- ✅ Audit trail created
- ✅ Grievance marked as resolved

---

## Color Codes in Modal

```
┌────────────────────────────────────┐
│ [✓ Correct]       Green            │  Full marks
│ [⚠ Partial]       Yellow           │  Some marks
│ [✗ Incorrect]     Red              │  Zero marks
└────────────────────────────────────┘
```

---

## Quick Tips

### ✅ DO:
- Click "View Student Answers" before updating marks
- Review all questions, not just the disputed one
- Add clear remarks explaining your re-evaluation
- Respond to student explaining your decision

### ❌ DON'T:
- Update marks without viewing answers
- Leave remarks empty
- Forget to mark grievance as resolved after updating

---

## Example Remarks (Copy & Paste!)

Good remarks:
```
✅ "Re-evaluated Q3: Answer demonstrates understanding, increased from 5 to 7"
✅ "Reviewed all answers: Q2 and Q4 deserved higher marks, updated total to 18/20"
✅ "Initial evaluation was too strict. Student's code is correct, marks increased"
```

Bad remarks:
```
❌ "Updated"  (too vague)
❌ "+2 marks"  (no explanation)
❌ (empty)  (no context)
```

---

## Shortcut Keys (Modal)

- **Esc**: Close modal
- **Scroll**: Navigate questions
- **Click outside**: Close modal

---

## Status Icons

```
🟢 Auto-refresh active (5 sec)
🔄 Manual refresh available
📄 View Student Answers button
✓ Marks updated successfully
⚠️ Loading evaluation...
```

---

## Need Help?

**Common Issues:**

1. **Button disabled / "Loading..."**
   - Wait 1-2 seconds for data to load

2. **Modal empty / no questions**
   - Check if exam has questions
   - Contact admin if issue persists

3. **Can't update marks**
   - Ensure new marks ≤ max marks
   - Check that you entered a number

4. **Grievances not appearing**
   - Check department match
   - Click manual refresh button

---

## System Requirements

- ✅ Backend running (port 5000)
- ✅ Frontend running (port 5174)
- ✅ Faculty logged in
- ✅ Department matches student's department

---

*🚀 You're ready to do fair re-evaluations!*

---

**Quick Reference Card:**
```
┌──────────────────────────────────────────┐
│ FACULTY RE-EVALUATION: 3 STEPS           │
├──────────────────────────────────────────┤
│ 1. Expand grievance                      │
│ 2. Click [📄 View Student Answers]       │
│ 3. Review → Close → Update Marks         │
└──────────────────────────────────────────┘
```
