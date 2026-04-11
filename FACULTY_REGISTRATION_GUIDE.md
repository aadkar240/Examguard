# Faculty Registration Guide

## Overview
Faculty members need to register with their email and wait for admin approval before accessing the dashboard.

---

## Step-by-Step Faculty Registration Process

### Step 1: Go to Registration Page
1. Click on **"Register"** link from the login page, OR
2. Navigate directly to: `http://localhost:5173/register`

### Step 2: Fill Registration Form

| Field | Value | Notes |
|-------|-------|-------|
| **Full Name** | Your full name | Required |
| **Email** | your.email@gmail.com | Must be valid, will receive OTP here |
| **Password** | min 6 characters | Required |
| **Confirm Password** | same as above | Must match |
| **Role** | **Select "Faculty"** | ⚠️ IMPORTANT - Change from "Student" |
| **Department** | Computer Science / IT / etc | Required for all roles |
| **Phone** | Optional | Can be left blank |

### Step 3: Request OTP
1. After filling email, click **"Send OTP"** button
2. Check your email inbox (may take 10-30 seconds)
3. Look for email from: `examguard2401@gmail.com`
4. Subject: "Transparent Exam & Grievance Management System OTP for account registration"
5. Copy the **6-digit OTP** code

### Step 4: Complete Registration
1. Paste the **OTP** in the "Email OTP" field
2. Click **"Register"** button
3. You should see success message: *"Faculty account created. Waiting for admin approval before dashboard access."*

### Step 5: Wait for Admin Approval
After successful registration:
- ✅ Account is created with status: **"Pending"**
- 📧 You receive email: *"Your faculty registration is pending admin approval"*
- ⏳ Admin must approve your account in the **Faculty Approvals** dashboard
- ✅ Once approved, you get email: *"Your faculty account is approved"*
- 🔐 Then you can log in to the dashboard

---

## Admin Approval Workflow

**Admin steps to approve faculty:**

1. Go to **Admin Dashboard**
2. Click **"Faculty Approvals"** section
3. Find the pending faculty in the list
4. Click **"Approve"** button
5. Faculty receives approval email
6. Faculty can now log in

---

## Troubleshooting

### Issue: OTP not received in email

**Solution:**
1. Check **SPAM/Promotions** folder in Gmail
2. Wait 30 seconds before checking (email delay is normal)
3. Verify email address is correct
4. Try requesting OTP again by clicking "Send OTP"

### Issue: "User already exists with this email"

**Solution:**
- Email is already registered in the system
- Use different email address
- If you forgot password, use "Forgot Password" on login page

### Issue: Cannot log in after registration

**Possible Reasons:**
1. **Faculty account is pending approval** (normal state)
   - Admin hasn't approved yet
   - Wait for admin to approve and send approval email
   
2. **Faculty account was rejected**
   - Contact admin to request re-review

3. **OTP validation failed**
   - Ensure you copied OTP correctly (6 digits)
   - OTP expires after 10 minutes

### Issue: Department dropdown not showing my department

**Solution:**
- Type department name manually in the text field
- Accepted values: Computer Science, IT, Electronics, Mechanical, Civil, etc.

---

## System Configuration

**SMTP Email Service:**
- Email Provider: Gmail
- Sender Email: `examguard2401@gmail.com`
- OTP Expiry: 10 minutes
- OTP Format: 6-digit numeric code

**Database:**
- Faculty registration status defaults to: **"Pending"**
- Faculty can only log in after admin sets status to: **"Approved"**
- Each faculty has unique email address requirement

---

## Demo Testing

**Use these credentials to test as Admin:**
- Email: `admin@gmail.com`
- Password: `admin123`

**To test faculty registration:**
1. Use a new email address for each test (e.g., `testfaculty1@gmail.com`)
2. OTPs are sent to the actual inbox of that email
3. Check SPAM folder if not found in Inbox

---

## FAQ

**Q: Why is my faculty account pending?**
A: All new faculty accounts require one-time admin approval for security. Admin can approve from Faculty Approvals dashboard.

**Q: How long does approval take?**
A: Usually instant if admin is available. Check Faculty Approvals section in admin dashboard.

**Q: Can I change my department after registration?**
A: Yes, admin can update your department profile from user management.

**Q: What if I don't receive the approval email?**
A: Check SPAM folder or contact admin to confirm approval was sent.

**Q: Can I register with same email twice?**
A: No, email must be unique. System will show: "User already exists with this email"

---

## Email Notifications Timeline

```
Faculty Registers
       ↓
   [OTP sent to email]
       ↓
Faculty enters OTP
       ↓
[Pending status email sent]
       ↓
Admin approves in dashboard
       ↓
[Approval email sent]
       ↓
Faculty can now login
```

---

## Support

If registration is still not working:
1. Verify SMTP configuration in `.env`
2. Check backend server logs for errors
3. Ensure MongoDB is running
4. Clear browser cache and try again

