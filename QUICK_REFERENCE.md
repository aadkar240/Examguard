# ⚡ QUICK REFERENCE CARD - Faculty Approval System

## 🚀 START HERE

### Quick Access URLs
```
Register:         http://localhost:5174/register
Login:            http://localhost:5174/login
Admin Dashboard:  http://localhost:5174/admin
```

### Test Credentials
```
Admin Login:
  Email: admin@gmail.com
  Password: admin123

Create Your Own Faculty Account:
  Go to /register → Select Faculty → Fill form
```

---

## 🎯 One-Minute Test

### Test Faculty Registration (1 min)
```
1. Go to: http://localhost:5174/register
2. Click "Faculty" button
3. Fill: Name, Email, Password, Department
4. Click "Send OTP" → Check email (wait 30 sec)
5. Paste OTP, click "Register"
6. ✅ SUCCESS MODAL APPEARS!
```

### Test Admin Approval (1 min)
```
1. Go to: http://localhost:5174/admin
2. Login: admin@gmail.com / admin123
3. Find faculty in "Faculty Approvals"
4. Click "Approve"
5. ✅ Status changes Pending → Approved (green)
```

### Test Faculty Login (1 min)
```
1. Go to: http://localhost:5174/login
2. Email: Your registered faculty email
3. Password: Your registration password
4. Click Login
5. ✅ Faculty dashboard loads
```

---

## 📊 System Status

### Servers Running ✅
```
Frontend:  http://localhost:5174  (Vite)
Backend:   http://localhost:5000  (Node.js)
Database:  localhost:27017        (MongoDB)
Email:     Gmail SMTP (working)   ✅
```

### Commands to Verify
```bash
# Check backend running
netstat -ano | findstr :5000

# Check frontend running
netstat -ano | findstr :5174

# Restart backend (if needed)
cd backend && node server.js

# Restart frontend (if needed)
cd frontend && npm run dev
```

---

## 🎯 What Faculty Sees

### When Registering
```
1. Registration form with role selection
2. Visual "Faculty" button (not dropdown)
3. Form fields: Name, Email, Password, Department
4. "Send OTP" button
5. OTP arrives in email (within 1 min)
6. Enter OTP and click "Register"
7. ✅ GREEN SUCCESS MODAL APPEARS
   "Registration Successful! Faculty Account Created"
   "Pending admin approval..."
8. Auto-redirect to login page (5 sec)
```

### While Waiting for Approval
```
Status: Pending approval
Email: Received "Account pending admin approval"
Can Login: NO (will get error message)
Can Create Exams: NO
Wait For: Admin approval email
```

### After Approval
```
Status: Approved
Email: Received "Your account is approved"
Can Login: YES
Can Create Exams: YES
Access: Full faculty dashboard
```

---

## 🎯 What Admin Sees

### Faculty Approvals Section
```
Shows all faculty with:
├─ Name
├─ Email
├─ Department
├─ Status: 🟡 Pending (amber) or 🟢 Approved (green)
├─ [Approve] button (for pending)
└─ [Reject] button (for pending)

Auto-refresh: Every 5 seconds
Manual refresh: Click [🔄 Refresh] button
```

### When Approving
```
1. Click "Approve" button (colored green)
2. Status instantly changes: Pending → Approved
3. Success message: "Faculty approved successfully"
4. Email automatically sent to faculty
5. Faculty can now log in
```

### When Rejecting
```
1. Click "Reject" button (colored red)
2. Status changes: Pending → Rejected
3. Success message: "Faculty rejected successfully"
4. Email automatically sent to faculty
5. Faculty cannot log in
```

---

## 📧 Email System

### Emails Sent Automatically
```
1. OTP Email
   When: Faculty clicks "Send OTP"
   Contains: 6-digit code
   TTL: 10 minutes

2. Pending Status Email
   When: Faculty completes registration
   Shows: Account pending admin approval

3. Approval Email
   When: Admin clicks "Approve"
   Shows: Account approved, can log in

4. Rejection Email
   When: Admin clicks "Reject"
   Shows: Account rejected, contact admin
```

### Email Delivery
```
Sender: examguard2401@gmail.com
Method: Gmail SMTP
Port: 587
Speed: Usually < 30 seconds
```

---

## 🎨 Status Colors

```
🟡 PENDING (Amber/Yellow)
   - Waiting for admin approval
   - Show Approve/Reject buttons
   - Faculty cannot log in

🟢 APPROVED (Green)
   - Admin approved the faculty
   - Show "Already approved" text
   - Faculty can log in

🔴 REJECTED (Red)
   - Admin rejected the faculty
   - Show "Already rejected" text
   - Faculty cannot log in
```

---

## ❌ Troubleshooting Quick Fixes

### Success Modal Doesn't Appear
```
Fix: Check if faculty role selected
Fix: Verify OTP was correct
Fix: Refresh page and try again
Fix: Check browser console for errors
```

### Faculty Not in Admin Dashboard
```
Fix: Click [🔄 Refresh] button
Fix: Wait 5 seconds for auto-refresh
Fix: Verify admin is logged in
Fix: Check database: mongodb://localhost:27017
```

### Approval Button Doesn't Work
```
Fix: Verify admin credentials
Fix: Clear browser cache (Ctrl+F5)
Fix: Check backend logs for errors
Fix: Restart backend if needed
```

### Faculty Doesn't Receive Email
```
Fix: Check SPAM folder
Fix: Verify email address in form
Fix: Check backend logs (search [EMAIL_SERVICE])
Fix: Test SMTP: node test-smtp.mjs
```

### Faculty Can't Log In After Approval
```
Fix: Verify status is "approved" (green)
Fix: Check email and password are correct
Fix: Verify login route: http://localhost:5174/login
Fix: Check selected role in login form
```

---

## 📱 API Endpoints (For Testing)

### Register Faculty
```
POST http://localhost:5000/api/auth/register
Body: {
  name, email, password, otp, role: "faculty", department
}
Response: {
  success: true, requiresApproval: true, emailSent: true
}
```

### Get Faculty List (Admin)
```
GET http://localhost:5000/api/users?role=faculty
Header: Authorization: Bearer {admin_token}
Response: { users: [...faculty with facultyApprovalStatus...] }
```

### Approve Faculty (Admin)
```
PUT http://localhost:5000/api/users/{facultyId}
Header: Authorization: Bearer {admin_token}
Body: { facultyApprovalStatus: "approved" }
Response: { user: {...updated faculty...} }
```

---

## 🔐 Default Accounts

### Admin
```
Email: admin@gmail.com
Password: admin123
Uses: Faculty approvals, system management
```

### Test Faculty (Already Approved)
```
Email: adkar.atharva@dypic.in
Department: Computer Science
Status: Approved ✅
```

---

## 📋 Files Modified

### Frontend
```
frontend/src/pages/Register.jsx
  - Added: showSuccessModal state
  - Added: Success modal component
  - Modified: handleSubmit for faculty
  - Result: Modal shows after registration
```

### Backend (No Changes Needed)
```
All email and approval functionality already existed ✅
```

### Admin Dashboard (Already Working)
```
Already displaying facultyApprovalStatus correctly ✅
Already showing color-coded status ✅
Already showing approve/reject buttons ✅
```

---

## ⏱️ Timeline

### Registration to Approval
```
T+0s    Faculty clicks "Register"
T+1s    Success modal appears ✅
T+5s    Faculty sees auto-redirect message
T+30s   Faculty receives pending email
T+?     Admin logs in and approves
T+1s    Admin sees status change (instant)
T+30s   Faculty receives approval email
T+?     Faculty logs in with credentials
T+1s    Faculty dashboard loads
```

---

## 🎓 Complete Test Sequence (5 minutes)

```
[Minute 1] REGISTER
- Go to /register
- Select Faculty, fill form
- Send OTP, enter it
- Click Register
- ✅ See success modal

[Minute 2] CHECK ADMIN
- Go to /admin
- Login as admin
- Find new faculty
- ✅ See "Pending" status (amber)

[Minute 3] APPROVE
- Click Approve button
- ✅ Status changes to Approved (green)
- Success message shown

[Minute 4] VERIFY EMAIL
- Check faculty inbox/spam
- ✅ See approval email arrived

[Minute 5] FACULTY LOGIN
- Go to /login
- Enter faculty email/password
- Click Login
- ✅ Faculty dashboard loads
```

---

## 🚀 That's It!

### System is Ready
✅ Backend running
✅ Frontend running  
✅ Database connected
✅ Email service working
✅ All features implemented
✅ Tests passed

### You Can Now
✅ Register faculty
✅ View pending approvals  
✅ Approve/reject faculty
✅ Send emails
✅ Let faculty log in

**Start testing at: http://localhost:5174/register**

---

## 📞 Quick Help

| Issue | Check |
|-------|-------|
| Server won't start | Port not in use? MongoDB running? |
| No OTP email | Check SPAM, verify email address |
| Can't approve | Is admin logged in? Valid faculty ID? |
| Frontend won't load | Port 5174? Node running? Browser cache clear? |
| Mobile issue | Clear cache, hard refresh (Ctrl+F5) |

---

**Everything is working! Start testing now!** 🎉
