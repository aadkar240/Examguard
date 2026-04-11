# Complete Faculty Approval Workflow - Visual Guide

## 🎯 The Complete Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  FACULTY REGISTRATION & APPROVAL WORKFLOW                │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 1: FACULTY REGISTERS                                                │
└──────────────────────────────────────────────────────────────────────────┘

   Faculty User                         Frontend                    Backend
       │                                   │                           │
       │  Goes to /register                │                           │
       ├──────────────────────────────────→│                           │
       │                                   │                           │
       │  Selects "Faculty" role           │                           │
       │  (visual button, not dropdown)    │                           │
       ├──────────────────────────────────→│                           │
       │                                   │                           │
       │  Fills form:                      │                           │
       │  - Name                           │                           │
       │  - Email                          │                           │
       │  - Password                       │                           │
       │  - Department                     │                           │
       │  Clicks "Send OTP"                │                           │
       ├──────────────────────────────────→│  POST /auth/send-registration-otp
       │                                   ├──────────────────────────→│
       │                                   │                           │ Generate OTP
       │                                   │                           │ Store in DB
       │                                   │                           │ Send email
       │                                   │←──────────────────────────┤
       │  OTP arrives in email             │                           │
       │  (check inbox & spam)             │                           │
       │  Copy 6-digit code                │                           │
       │  Paste into OTP field             │                           │
       │  Click "Register"                 │                           │
       ├──────────────────────────────────→│  POST /auth/register with OTP
       │                                   ├──────────────────────────→│
       │                                   │                           │ Verify OTP
       │                                   │                           │ Create User
       │                                   │                           │ Set status: pending
       │                                   │                           │ Send email
       │  🎉 SUCCESS MODAL APPEARS!        │←──────────────────────────┤
       │  ✅ Registration Successful!      │                           │
       │  Faculty Account Created          │                           │
       │                                   │                           │
       │  📋 What happens next:            │                           │
       │  - Pending admin approval         │                           │
       │  - Check email for updates        │                           │
       │  - Can login after approval       │                           │
       │                                   │                           │
       │  [Go to Login Page]               │                           │
       │  (or auto-redirect in 5 sec)      │                           │
       │                                   │                           │

┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 2: ADMIN SEES PENDING FACULTY                                       │
└──────────────────────────────────────────────────────────────────────────┘

   Admin User                          Frontend                    Backend
       │                                   │                           │
       │  Goes to /admin                   │                           │
       ├──────────────────────────────────→│                           │
       │                                   │                           │
       │  Login: admin@gmail.com           │                           │
       │          admin123                 │                           │
       ├──────────────────────────────────→│  POST /auth/login
       │                                   ├──────────────────────────→│
       │                                   │←──────────────────────────┤
       │  Dashboard loads                  │                           │
       │  Scrolls to "Faculty Approvals"   │                           │
       │                                   │                           │
       │  Sees:                            │  GET /api/users?role=faculty
       │  ┌─────────────────────────────┬─┤  (auto-refresh every 5s)
       │  │ Name: NewTestFaculty        │ ├──────────────────────────→│
       │  │ Email: newtest@example.com  │ │                           │ Returns:
       │  │ Dept: Computer Science      │ │       [Faculty records    │
       │  │ Status: 🟡 Pending          │ │        with approval     │
       │  │ [Approve] [Reject]          │ │        status field]     │
       │  └─────────────────────────────┘ │                           │
       │                                   │←──────────────────────────┤
       │                                   │                           │

┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 3: ADMIN APPROVES FACULTY                                           │
└──────────────────────────────────────────────────────────────────────────┘

   Admin User                          Frontend                    Backend
       │                                   │                           │
       │  Clicks "Approve" button          │                           │
       │  (green button)                   │                           │
       ├──────────────────────────────────→│  PUT /api/users/{id}
       │                                   │  Body: {facultyApprovalStatus: "approved"}
       │                                   ├──────────────────────────→│
       │                                   │                           │ Update user
       │                                   │                           │ Set status: approved
       │                                   │                           │ Send approval email
       │  ✅ Status changes:               │←──────────────────────────┤
       │  🟡 Pending → 🟢 Approved        │                           │
       │                                   │                           │
       │  See message:                     │                           │
       │  "Faculty approved successfully"  │                           │
       │                                   │                           │

┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 4: FACULTY RECEIVES APPROVAL EMAIL                                  │
└──────────────────────────────────────────────────────────────────────────┘

   Faculty User                        Email Service              Gmail
       │                                   │                          │
       │                                   │  Send approval email      │
       │                                   ├─────────────────→ ☁️│
       │                                   │  From: examguard  │
       │                                   │  To: faculty      │
       │                                   │  Subject: "Your   │
       │  📧 Email arrives!                │  account approved"│
       │  Subject: Your faculty account    │                   │
       │           is approved             │  ✅ Sent!         │
       │                                   │←─────────────────│
       │  Message:                         │                          │
       │  "Your account has been approved. │                          │
       │   You can now log in and access   │                          │
       │   your faculty dashboard."        │                          │
       │                                   │                          │

┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 5: FACULTY LOGS IN & ACCESSES DASHBOARD                             │
└──────────────────────────────────────────────────────────────────────────┘

   Faculty User                          Frontend                    Backend
       │                                   │                           │
       │  Reads approval email             │                           │
       │  Goes to /login                   │                           │
       ├──────────────────────────────────→│                           │
       │                                   │                           │
       │  Enters:                          │                           │
       │  - Email: newtest@example.com     │                           │
       │  - Password: Test@123456          │                           │
       │  Clicks "Login"                   │                           │
       ├──────────────────────────────────→│  POST /auth/login-email-password
       │                                   ├──────────────────────────→│
       │                                   │                           │ Verify credentials
       │                                   │                           │ Check status: approved ✅
       │                                   │                           │ Generate JWT token
       │                                   │←──────────────────────────┤
       │  Redirected to Faculty Dashboard  │                           │
       │  ✅ Can now:                      │                           │
       │  - Create exams                   │                           │
       │  - Manage students                │                           │
       │  - View reports                   │                           │
       │                                   │                           │


EOF

```

---

## 🎨 Admin Dashboard - Faculty Approvals Display

```
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD - Faculty Approvals Section                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Faculty Approvals                              [🔄 Refresh]    │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ NewTestFaculty                                          │   │
│  │ Email: newtest@example.com                              │   │
│  │ Department: Computer Science                            │   │
│  │ Status: 🟡 Pending                                      │   │
│  │                                 [✅ Approve] [❌ Reject]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ atharva sir                                             │   │
│  │ Email: adkar.atharva@dypic.in                           │   │
│  │ Department: Computer Science                            │   │
│  │ Status: 🟢 Approved                                     │   │
│  │                                 Already approved        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Faculty One                                             │   │
│  │ Email: faculty1@gmail.com                               │   │
│  │ Department: Computer Science                            │   │
│  │ Status: 🟢 Approved                                     │   │
│  │                                 Already approved        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Legend:                                                         │
│  🟡 Pending = Waiting for admin approval (show buttons)         │
│  🟢 Approved = Already approved (show status text)              │
│  🔴 Rejected = Request rejected (show status text)              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Auto-refresh: Every 5 seconds
Manual refresh: Click [🔄 Refresh] button at top
```

---

## 📱 Registration Success Modal

```
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│                              ✅                                    │
│                                                                   │
│              Registration Successful!                            │
│              Faculty Account Created                             │
│                                                                   │
│  ───────────────────────────────────────────────────────────     │
│                                                                   │
│  What happens next:                                             │
│                                                                   │
│  • Your account is pending admin approval                       │
│  • Admin will review your registration                          │
│  • You will receive an approval email when ready                │
│  • After approval, you can log in and create exams             │
│                                                                   │
│  ───────────────────────────────────────────────────────────     │
│                                                                   │
│  Redirecting to login page in a few seconds...                  │
│                                                                   │
│              [Go to Login Page]                                 │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 📋 Status Badge Colors

```
Pending:   🟡 AMBER/YELLOW   #FCD34D    Text: "Pending"
Approved:  🟢 GREEN          #22C55E    Text: "Approved"  
Rejected:  🔴 RED            #EF4444    Text: "Rejected"
```

---

## 🔄 System Auto-Refresh

```
Timeline:
─────────────────────────────────────────────────────────────────

Admin logs in
    ↓
Dashboard loads
    ↓
Faculty list fetched initially
    ↓ (5 seconds)
Auto-refresh #1
    ↓ (5 seconds)
Auto-refresh #2
    ↓ (5 seconds)
Auto-refresh #3  ← New faculty appears here after registration
    ↓ (5 seconds)
... continues every 5 seconds ...

OR: Admin clicks [🔄 Refresh] button manually for instant update
```

---

## ✉️ Email Flow

```
1. OTP Email (Registration Start)
   From: examguard2401@gmail.com
   To: faculty@example.com
   Subject: Transparent Exam & Grievance Management System OTP
   Body: Your 6-digit code is: 693797
   Valid for: 10 minutes

2. Pending Status Email (After Registration)
   From: examguard2401@gmail.com
   To: faculty@example.com
   Subject: Account registration pending admin approval
   Body: Your faculty registration is pending admin approval...

3. Approval Email (When Admin Approves)
   From: examguard2401@gmail.com
   To: faculty@example.com
   Subject: Your faculty account is approved
   Body: Your account has been approved. You can now log in...

4. Rejection Email (When Admin Rejects)
   From: examguard2401@gmail.com
   To: faculty@example.com
   Subject: Your faculty account request was rejected
   Body: Your account has been rejected. Contact admin...
```

---

## 🔐 Database Schema - Faculty Approval

```javascript
User Schema {
  _id: ObjectId,
  name: String,                    // "NewTestFaculty"
  email: String,                   // "newtest@example.com"
  password: String (hashed),
  role: String,                    // "faculty"
  department: String,              // "Computer Science"
  
  // Faculty-specific fields
  facultyApprovalStatus: String,   // "pending" | "approved" | "rejected"
  facultyApprovedAt: Date,         // Timestamp of approval
  
  // Metadata
  createdAt: Date,                 // 2026-02-20T...
  updatedAt: Date
}
```

---

## 🎯 Key URLs

| Purpose | URL | Role |
|---------|-----|------|
| Register | http://localhost:5174/register | Public |
| Login | http://localhost:5174/login | Public |
| Admin Dashboard | http://localhost:5174/admin | Admin |
| Faculty Dashboard | http://localhost:5174/faculty | Faculty (approved) |
| Student Dashboard | http://localhost:5174/student | Student |

---

## ✅ Test Checklist

- [ ] Register new faculty
- [ ] See success modal with "Registration Successful" message
- [ ] Auto-redirect to login after 5 seconds
- [ ] Check email for OTP code
- [ ] Admin logs in
- [ ] Admin sees pending faculty in approvals section
- [ ] Approval status displayed as "Pending" (amber)
- [ ] Click "Approve" button
- [ ] Status changes to "Approved" (green)
- [ ] Faculty receives approval email
- [ ] Faculty logs in successfully
- [ ] Faculty accesses dashboard
- [ ] Faculty can create exams

---

**All systems operational! Ready to test!** 🚀
