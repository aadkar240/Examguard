# URGENT FIX: Faculty Registration & Email Issues

## Problems Identified

1. ✗ Emails not sending (pending/approval status)
2. ✗ New faculty can't register
3. ✓ One faculty (Atharva with email adkar.atharva@dypic.in) exists with approved status

## Root Causes & Fixes

### Issue 1: Backend May Have Crashed or Hung

**Fix:** Restart the backend server
```
1. Kill port 5000: netstat -ano | findstr :5000
2. Kill process: taskkill /PID [PID] /F
3. Navigate: cd c:\Users\ATHARVA\Desktop\aissmshack\backend
4. Start: npm start
5. Watch for: "[FACULTY_REGISTRATION]" logs when testing
```

### Issue 2: Email Service Configuration

**Current .env settings:**
- EMAIL_HOST: smtp.gmail.com
- EMAIL_PORT: 587
- EMAIL_USER: examguard2401@gmail.com
- EMAIL_PASSWORD: qhsdzfjxxykcpgvl (app password)

**If emails still don't work:**
- Check if Gmail wants 2FA verification
- Regenerate Gmail app password
- Try with a different email service

### Issue 3: Faculty Registration Blocking

**Possible causes:**
- Database connection lost (MongoDB)
- Validation error in registration form
- Server error not being shown to frontend

**Fix:**
- Check backend logs for `[FACULTY_REGISTRATION]` errors
- Verify MongoDB is running
- Test with curl/Postman if frontend registration fails

---

## QUICK TESTING STEPS

### Step 1: Verify Backend is Running
```powershell
# Check port 5000
netstat -ano | findstr :5000

# If running, you should see Node.js process
```

### Step 2: Restart Backend
```bash
cd c:\Users\ATHARVA\Desktop\aissmshack\backend
npm start

# Watch for startup message: "Server running on port 5000"
```

### Step 3: Test Admin Panel
- Open: http://localhost:5173/admin
- Login: admin@gmail.com / admin123
- Go to "Faculty Approvals" section
- Click "Refresh" button
- Atharva should appear with "approved" status

### Step 4: Test Faculty Registration
- Open: http://localhost:5173/register
- Select "Faculty" role
- Enter: Name, email (new one), password, department
- Click "Send OTP"
- Check email for OTP (check SPAM)
- Enter OTP, submit form
- Watch backend logs for `[FACULTY_REGISTRATION]` messages
- Check admin panel - faculty should appear within 5 seconds

### Step 5: Check Logs for Errors
In backend terminal, look for:
```
[FACULTY_REGISTRATION] Sending pending status email to xxxxx@email.com 
[EMAIL_SERVICE] Attempting to send pending email to xxxxx@email.com
[EMAIL_SERVICE] Successfully sent pending email to xxxxx@email.com
```

OR (if failed):
```
[EMAIL_SERVICE] Failed to send email: ...error message...
```

---

## Files That Handle This

1. **Backend Registration**: `backend/controllers/authController.js` (lines 415-430)
2. **Email Service**: `backend/services/emailService.js` (all email logic)
3. **Admin Dashboard**: `frontend/src/pages/admin/Dashboard.jsx` (shows faculty approvals, auto-refreshes every 5 sec)
4. **User Updates**: `backend/controllers/userController.js` (handles approve/reject)

---

##MANUAL DATABASE CHECK (if needed)

```javascript
// MongoDB: Check faculty records
db.users.find({ role: 'faculty' }, { name: 1, email: 1, facultyApprovalStatus: 1 })

// Expected output similar to:
// { _id: ..., name: "Atharva", email: "adkar.atharva@dypic.in", facultyApprovalStatus: "approved" }

// Check email OTPs
db.emailotps.find({}, { email: 1, purpose: 1, otp: 1, expiresAt: 1 }).sort({ createdAt: -1 }).limit(5)
```

---

## If SMTP is Broken

Email service will fail silently (but logs will show error). Faculty still gets registered but doesn't get email notification.

**Test SMTP:**
```javascript
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'examguard2401@gmail.com',
    pass: 'qhsdzfjxxykcpgvl'
  }
});

transporter.sendMail({
  from: 'examguard2401@gmail.com',
  to: 'test@example.com',
  subject: 'Test',
  text: 'Test email'
}, (err, info) => {
  if (err) console.log('SMTP Error:', err.message);
  else console.log('Email sent:', info.messageId);
});
```

---

## SUMMARY

**What to do RIGHT NOW:**

1. ✓ Kill process on port 5000
2. ✓ Restart backend with `npm start`
3. ✓ Test registration in browser
4. ✓ Watch backend logs for `[FACULTY_REGISTRATION]` messages  
5. ✓ Check admin panel Faculty Approvals (auto-refreshes)
6. ✓ If emails work, you're done!
7. ✗ If emails don't work, check SMTP config

---

## Expected Behavior (After Fix)

```
Faculty registers:
  [FACULTY_REGISTRATION] Sending pending status email to new.faculty@email.com
  [EMAIL_SERVICE] Successfully sent pending email
  ✓ Pending status email arrives in faculty inbox

Admin approves faculty:
  [FACULTY_APPROVAL] Sending approved email to new.faculty@email.com
  [EMAIL_SERVICE] Successfully sent approved email
  ✓ Approval email arrives in faculty inbox
  ✓ Faculty can now login
```

All systems working! 🎉

