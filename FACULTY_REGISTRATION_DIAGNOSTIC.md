# Faculty Registration Diagnostic Guide

## What Was Fixed

### ✅ Better Logging
- Added `[FACULTY_REGISTRATION]` logs when faculty register
- Added `[FACULTY_APPROVAL]` logs when admin approves/rejects
- Added `[EMAIL_SERVICE]` logs for all email operations
- Logs show: attempt → success/failure with error details

### ✅ Admin Dashboard Auto-Refresh
- Faculty Approvals list now **refreshes every 5 seconds**
- Added manual **"Refresh" button** to fetch latest list
- No need to reload page after faculty registration

### ✅ Better Error Handling
- Email errors logged with full stack trace
- Email failures don't block registration or approval
- Helps diagnose SMTP configuration issues

---

## Checking Faculty Registration Status

### Step 1: Check Backend Logs
When a faculty registers, look for these logs in your backend terminal:

```
[FACULTY_REGISTRATION] Sending pending status email to newfaculty@example.com
[FACULTY_REGISTRATION] Email sent successfully to newfaculty@example.com
```

**OR** (if email failed):
```
[FACULTY_REGISTRATION] Email failed for newfaculty@example.com: ...error message...
[FACULTY_REGISTRATION] Stack: ...stack trace...
```

### Step 2: Verify Faculty Was Created
After admin registers faculty:
1. Go to admin dashboard
2. **Faculty Approvals** section should show new faculty within 5 seconds
3. Click **"Refresh"** button if needed
4. Look for faculty with status badge (should be amber/yellow for "pending")

### Step 3: Check If Faculty Exists
Use browser console to manually test API:
```javascript
// This will show all faculty
fetch('http://localhost:5000/api/users?role=faculty', {
  headers: { 'Authorization': 'Bearer YOUR_ADMIN_TOKEN' }
}).then(r => r.json()).then(d => console.log(d.users))
```

---

## Email Troubleshooting

### Issue: Emails Not Sending

#### Check 1: SMTP Configuration
Look for `[EMAIL_SERVICE] SMTP is not configured` in logs.

**Solution:** Verify `.env` file has:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=examguard2401@gmail.com
EMAIL_PASSWORD=qhsdzfjxxykcpgvl
EMAIL_FROM=examguard2401@gmail.com
```

#### Check 2: Verify Credentials Work
Test SMTP connection manually:
```javascript
// In backend console
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

transporter.verify((err, success) => {
  if (err) console.log('SMTP Error:', err);
  else console.log('SMTP Connected:', success);
});
```

#### Check 3: Look for Email Errors
Errors appear in logs like:
```
[EMAIL_SERVICE] Failed to send email to newfaculty@example.com: Invalid login
```

**Common errors:**
- `Invalid login` - Wrong credentials in `.env`
- `ECONNREFUSED` - SMTP server unreachable (firewall issue)
- `Authentication failed` - Gmail app password issue

---

## Faculty Not Showing in Admin Panel

### Issue 1: Dashboard Not Refreshing
**Solution:** 
- Click the **"Refresh"** button in Faculty Approvals section
- Or manually refresh browser (F5)
- Dashboard auto-refreshes every 5 seconds now

### Issue 2: Faculty Exists but Not Visible
**Check:** Is faculty`role` actually set to `faculty`?

Run this to see all users:
```javascript
// Get ALL users by role
fetch('http://localhost:5000/api/users', {
  headers: { 'Authorization': 'Bearer YOUR_ADMIN_TOKEN' }
}).then(r => r.json()).then(d => {
  console.log('All users:');
  d.users.forEach(u => console.log(`${u.name} - Role: ${u.role} - Faculty Status: ${u.facultyApprovalStatus}`));
});
```

### Issue 3: Faculty `facultyApprovalStatus` Not Set
**Check database:**
```javascript
// MongoDB: Check a faculty record
db.users.findOne({ email: 'newfaculty@example.com' }, { facultyApprovalStatus: 1 });
// Should show: { facultyApprovalStatus: 'pending' }
```

If missing, faculty was created incorrectly by backend.

---

## Testing Full Flow

### Complete Test Scenario

**Time: 0 min**
1. Admin logs in → Dashboard shows Faculty Approvals (might be empty)

**Time: 1 min**
2. New faculty registers at `/register`
   - Selects "Faculty" role
   - Enters: Name, Email, Password, Department
   - Clicks "Send OTP"
   - Gets OTP in email
   - Enters OTP → Clicks Register
   - Sees message: "Faculty account created. Waiting for admin approval"

**Check backend logs:**
```
[FACULTY_REGISTRATION] Sending pending status email to new.faculty@email.com
[FACULTY_REGISTRATION] Email sent successfully to new.faculty@email.com
```

**Time: 2 min**
3. Faculty checks email
   - Should receive: "Account registration pending admin approval"
   - Subject: "Account registration pending admin approval"

**Time: 3 min**
4. Admin dashboard updates
   - Faculty Approvals **auto-refreshes every 5 seconds**
   - New faculty should appear with "pending" status after ~5 seconds
   - If not: Click "Refresh" button manually

**Time: 4 min**
5. Admin approves faculty
   - Clicks "Approve" button on faculty row
   - Faculty row updates to show "approved" status
   - Toast shows: "Faculty approved successfully"

**Check backend logs:**
```
[FACULTY_APPROVAL] Sending approved email to new.faculty@email.com
[FACULTY_APPROVAL] Email sent successfully to new.faculty@email.com
```

**Time: 5 min**
6. Faculty checks email again
   - Should receive: "Your faculty account is approved"
   - Now can log in to dashboard

---

## Removing Registration Limits

### Current Status
✅ **No hard limits exist**

- Frontend: Allows unlimited faculty registrations
- Backend: Allows unlimited faculty registrations
- Database: No quota or limit checks

### Scaling Considerations

If you want to add limits in future:

**Frontend limits** (not enforced):
- None currently

**Backend limits** (not enforced):
- None currently

**Database considerations:**
- MongoDB: No limits on Users collection
- Email service: Gmail SMTP has rate limits (~100 emails/min)

---

## Force-Test Faculty Registration

### Without Email (For Testing)
If SMTP isn't working, you can:

1. **Bypass email sending** temporarily:
   - Comment out email sending in `authController.js`
   - Faculty still gets created with `facultyApprovalStatus: 'pending'`
   - Will appear in admin panel without email

2. **Check MongoDB directly:**
   ```javascript
   db.users.find({ role: 'faculty' }, { name: 1, email: 1, facultyApprovalStatus: 1 }).pretty()
   ```

---

## Email Service Logs Example

### Scenario: Faculty Registers

```
[FACULTY_REGISTRATION] Sending pending status email to alice@example.com
[EMAIL_SERVICE] Attempting to send pending email to alice@example.com
[EMAIL_SERVICE] Successfully sent pending email to alice@example.com
[FACULTY_REGISTRATION] Email sent successfully to alice@example.com
```

### Scenario: Admin Approves

```
[FACULTY_APPROVAL] Sending approved email to alice@example.com
[EMAIL_SERVICE] Attempting to send approved email to alice@example.com
[EMAIL_SERVICE] Successfully sent approved email to alice@example.com
[FACULTY_APPROVAL] Email sent successfully to alice@example.com
```

### Scenario: Email Failed

```
[FACULTY_REGISTRATION] Sending pending status email to bob@example.com
[EMAIL_SERVICE] Attempting to send pending email to bob@example.com
[EMAIL_SERVICE] Failed to send email to bob@example.com: Invalid login
[FACULTY_REGISTRATION] Email failed for bob@example.com: Invalid login
[FACULTY_REGISTRATION] Stack: at SMTPConnection...
```

---

## Next Steps

1. **Test Registration**: Have faculty register and note the email (optional - might fail if SMTP misconfigured)
2. **Check Admin Dashboard**: Click "Refresh" - new faculty should appear within 5 seconds
3. **Check Logs**: Look for `[FACULTY_REGISTRATION]` logs in backend terminal
4. **If Email Fails**: Check SMTP configuration in `.env` and logs
5. **Approve Faculty**: Click "Approve" button - should happen instantly
6. **Verify Approval Email**: Faculty should get approval email (or check logs)

---

## Summary of Changes

| Component | Change | Purpose |
|-----------|--------|---------|
| `authController.js` | Added `[FACULTY_REGISTRATION]` logs | Track registration emails |
| `userController.js` | Added `[FACULTY_APPROVAL]` logs | Track approval/rejection emails |
| `emailService.js` | Added `[EMAIL_SERVICE]` logs | Debug email sending |
| `admin/Dashboard.jsx` | Auto-refresh every 5 seconds | Faculty approvals update live |
| `admin/Dashboard.jsx` | Added "Refresh" button | Manual refresh option |

