# Student Semester Access - Complete Guide

## 🐛 Issue Fixed

**Problem**: Students couldn't see exams for their specific semester (especially semester 8)

**Root Cause**: The `getMyExams` function was using the old `semester` field instead of the new `semesters` array

**Fix Applied**: Updated query to use `semesters: { $in: [req.user.semester] }`

---

## ✅ How It Works Now

### Student Exam Visibility Logic

Students can see an exam **ONLY IF** all these conditions are met:

1. ✅ Student has `semester` field set (1-8)
2. ✅ Student has `department` field set
3. ✅ Exam's `semesters` array includes student's semester
4. ✅ Exam's `department` matches student's department
5. ✅ Exam is published (`isPublished: true`)

### Example

**Student Profile:**
- Name: Demo Student
- Email: student@demo.com
- Department: Computer Science
- Semester: 8

**Exam Profile:**
- Title: Cloud Computing Exam
- Department: Computer Science
- Semesters: [1, 8]
- Published: true

**Result**: ✅ Student CAN see this exam (semester 8 is in the semesters array)

---

## 🎓 Managing Student Semesters

### Method 1: Using Script (EASIEST)

```bash
cd backend
node set-student-semester.js
```

Edit `set-student-semester.js` to change which student and what semester:

```javascript
const demoStudent = await User.findOneAndUpdate(
  { email: 'student@demo.com' },  // Change email here
  { 
    semester: 8,                    // Change semester here (1-8)
    department: 'Computer Science'  // Change department here
  },
  { new: true }
);
```

### Method 2: Direct Database Update

Using MongoDB Compass or mongo shell:

```javascript
db.users.updateOne(
  { email: 'student@demo.com' },
  { $set: { semester: 8, department: 'Computer Science' } }
)
```

### Method 3: Registration Form

When students register, they should provide:
- Name
- Email
- Password
- **Department** (dropdown)
- **Semester** (1-8, dropdown)

---

## 📝 Creating Exams for Specific Semesters

### When Creating Exam (Faculty):

1. Click **"AI Generate Exam"**
2. Fill exam details
3. In **"Publish To"** section:
   - Select **Department**
   - Click **multiple semester buttons** (they turn blue when selected)
   - Example: Click Sem 1, Sem 3, Sem 8 for multi-semester exam

4. Click **"Publish Exam"**

### Selecting Multiple Semesters:

```
[Sem 1] [Sem 2] [Sem 3] [Sem 4] [Sem 5] [Sem 6] [Sem 7] [Sem 8]
  🔵      ⚪      🔵      ⚪      ⚪      ⚪      ⚪      🔵
```

Blue = Selected → Exam visible to Semesters 1, 3, and 8

---

## 🔍 Debugging Student Access Issues

### Check If Student Can See Exams

```bash
cd backend
node check-semester-access.js
```

This will show:
- All students with their semester/department
- All exams with their semester assignments
- Which exams are available for each semester
- Specific warnings if data is missing

### Common Issues & Solutions

#### Issue 1: Student sees no exams

**Check:**
```bash
node check-semester-access.js
```

**Look for:**
- Is student's `semester` field set?
- Is student's `department` field set?
- Are there exams published for that semester?

**Solution:**
```bash
# Set student semester
node set-student-semester.js

# Or create exams for that semester
# Login as faculty → Create exam → Select that semester
```

#### Issue 2: Exam not visible to semester 8

**Check:**
- Is semester 8 selected when publishing exam?
- Does exam department match student department?

**Solution:**
1. Login as faculty
2. Go to Dashboard
3. Click **edit button** (✏️) on exam
4. Add semester 8
5. Click **"Save Changes"**

#### Issue 3: Department mismatch

**Student:** Computer Science
**Exam:** computer science (lowercase)

**Solution:** Departments are case-sensitive! Fix with:

```bash
# Update student
db.users.updateOne(
  { email: 'student@demo.com' },
  { $set: { department: 'Computer Science' } }
)

# Or update exam
db.exams.updateOne(
  { title: 'Exam Title' },
  { $set: { department: 'Computer Science' } }
)
```

---

## 🧪 Testing Different Semester Access

### Test Semester 1 Student

```javascript
// Edit set-student-semester.js
{ email: 'student@demo.com' },
{ semester: 1, department: 'Computer Science' }
```

```bash
node set-student-semester.js
```

Login as student@demo.com → Should see exams with semester 1

### Test Semester 8 Student

```javascript
// Edit set-student-semester.js
{ email: 'student@demo.com' },
{ semester: 8, department: 'Computer Science' }
```

```bash
node set-student-semester.js
```

Login as student@demo.com → Should see exams with semester 8

---

## 📊 Current Database State

### Students:
- **Atharva Adkar** - Semester 6, computer science
- **Test User** - Semester 1, Computer Science
- **Demo Student** - Semester 8, Computer Science ✅

### Exams:
- 7 exams for Semester 6
- 1 exam for Semesters 1 & 8 (Cloud Computing) ✅

### Result:
- Demo Student (Sem 8) can now see **Cloud Computing Exam** ✅

---

## 🚀 Quick Start Testing

1. **Verify Fix:**
   ```bash
   cd backend
   node check-semester-access.js
   ```

2. **Login as Semester 8 Student:**
   - Email: `student@demo.com`
   - Password: `Student@123`
   - Go to "Exams" page
   - Should see: **Cloud Computing Exam**

3. **Create More Semester 8 Exams:**
   - Login as faculty (`faculty@demo.com`)
   - Click "AI Generate Exam"
   - At bottom, click **Sem 8** button (make it blue)
   - Generate and publish

4. **Switch Student Semester:**
   ```bash
   # Edit set-student-semester.js - change semester to 1, 2, 3, etc.
   node set-student-semester.js
   # Login again as student - will see different exams
   ```

---

## ✨ Key Points

- ✅ All semesters (1-8) are now fully supported
- ✅ Students only see exams for their semester
- ✅ Faculty can publish to multiple semesters
- ✅ Faculty can edit semester assignments anytime
- ✅ Department must match exactly (case-sensitive)
- ✅ Both student and exam must have semester/department set

---

## 🛠️ Scripts Available

| Script | Purpose |
|--------|---------|
| `check-semester-access.js` | Diagnose access issues |
| `set-student-semester.js` | Update student semester |
| `migrate-semesters.js` | Migrate old exams to new format |
| `fix-exam-owners.js` | Fix exam createdBy references |

---

## 📞 Support

If students still can't see exams:
1. Run `node check-semester-access.js`
2. Verify student has semester AND department set
3. Verify exam includes that semester in its semesters array
4. Check department names match exactly (case-sensitive)
5. Ensure exam is published (`isPublished: true`)
