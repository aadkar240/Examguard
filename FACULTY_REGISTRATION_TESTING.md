# Faculty Registration Testing Guide

## Why Faculty Can't Register - Checklist

This guide helps identify why faculty registration might be failing.

---

## Quick Check: Is Backend Running?

1. Open browser: **http://localhost:5000/api/health** (or any endpoint)
2. You should get a response (if server is running)
3. If blank/no response: **Start backend first** - `npm start` in `/backend` folder

---

## Manual Faculty Registration Test

### Test Scenario: Register a New Faculty Member

**Prerequisites:**
- Backend running on port 5000
- Frontend running on port 5173
- All fields filled correctly

**Steps:**

1. **Go to Register Page**
   - URL: http://localhost:5173/register

2. **Select Faculty Role**
   - Click the **"Faculty"** button (not student or admin)
   - You should see the blue notification box

3. **Fill Form**
   ```
   Name:     Test Faculty
   Email:    testfaculty@yourdomain.com (use real email to get OTP)
   Password: password123
   Role:     Faculty
   Department: Computer Science
   Phone:    Optional
   ```

4. **Click "Send OTP"**
   - Wait 10-30 seconds
   - Check your email inbox for OTP from: `examguard2401@gmail.com`
   - Subject: "...OTP for account registration"

5. **If OTP Not Received**
   - ❌ Check SPAM/Promotions folder
   - ❌ Verify email address is correct
   - ❌ Try again (may need to wait 30 seconds)
   - ❌ Check .env has SMTP configured

6. **Enter OTP and Register**
   - Paste 6-digit code in OTP field
   - Click **"Register"** button
   - You should see: _"Faculty account created. Waiting for admin approval"_

7. **API Response Should Be**
   ```json
   {
     "success": true,
     "message": "Faculty account created. Waiting for admin approval before dashboard access.",
     "requiresApproval": true
   }
   ```

---

## Common Issues & Solutions

### Issue 1: "User Already Exists"
**Cause:** Email already registered  
**Solution:** Use different email address

**Where it shows:** Immediately after clicking "Send OTP"

---

### Issue 2: "Invalid or Expired OTP"
**Cause:**  
- Entered wrong OTP
- OTP expired (10 minutes)
- OTP was for different email

**Solution:**
- Copy OTP from email again
- Click "Send OTP" to request fresh OTP
- Ensure email matches what you requested OTP for

**Where it shows:** When you click "Register"

---

### Issue 3: OTP Never Arrives in Email
**Cause:**
- SMTP not configured in `.env`
- Email service isn't running
- Firewall blocking emails

**Solution:**
```
# Verify .env has these values:
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=examguard2401@gmail.com
EMAIL_PASSWORD=qhsdzfjxxykcpgvl
EMAIL_FROM=examguard2401@gmail.com
```

**Check backend console for:**
```
"Send registration OTP error: ..." 
```
This tells you SMTP configuration issue.

---

### Issue 4: Faculty Can't Login After Registration
**This is NORMAL** - Faculty must wait for admin approval

**Timeline:**
1. Faculty registers → Account created with status "pending"
2. Faculty receives email: "Your account is pending admin approval"
3. Admin logs in → Faculty Approvals section
4. Admin clicks "Approve" → Faculty receives approval email
5. Now faculty can login

---

### Issue 5: Department Field Won't Accept My Department
**Solution:**
- Type any department name (it's free text, not a dropdown)
- Examples: "Computer Science", "CS", "IT", "Electronics", etc.
- System accepts any department name

---

## Database Check: Do Registration OTPs Exist?

**If you have MongoDB access:**

```javascript
// Check if OTP was created
db.emailotps.findOne({ email: "testfaculty@youremail.com" })

// Should return:
{
  email: "testfaculty@youremail.com",
  otp: "123456",
  role: "faculty",
  purpose: "register",
  expiresAt: Date,
  createdAt: Date
}
```

---

## Email Service Configuration

**Current Setup:**
```
Provider: Gmail
Email: examguard2401@gmail.com
App Password: qhsdzfjxxykcpgvl
TTL: 10 minutes
```

**If emails not working:**
1. Verify Gmail app is configured
2. Check "Less secure app access" is enabled
3. Use App Password (not regular password)
4. Verify port 587 is not blocked

---

## Test with API (Advanced)

**Step 1: Request OTP**
```
POST /api/auth/send-registration-otp
Content-Type: application/json

{
  "email": "newtestfaculty@gmail.com",
  "role": "faculty"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "User already exists with this email"
}
```

---

## Step 2: After Getting OTP from Email, Register

```
POST /api/auth/register
Content-Type: application/json

{
  "name": "New Faculty",
  "email": "newtestfaculty@gmail.com",
  "password": "password123",
  "role": "faculty",
  "department": "Computer Science",
  "phone": "9876543210",
  "otp": "123456"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Faculty account created. Waiting for admin approval before dashboard access.",
  "requiresApproval": true,
  "user": {
    "id": "...",
    "name": "New Faculty",
    "email": "newtestfaculty@gmail.com",
    "role": "faculty",
    "facultyApprovalStatus": "pending"
  }
}
```

---

## TL;DR - Faculty Registration Simple Flow

```
1. Go to /register
2. Click "Faculty" button
3. Fill form + Click "Send OTP"
4. Check email for OTP (wait 30 sec, check SPAM)
5. Paste OTP → Click Register
6. See "Waiting for admin approval" message
7. Email received saying "pending admin approval"
8. Admin approves in Faculty Approvals section
9. Faculty receives approval email
10. Faculty can login ✓
```

---

## Support

Have issues? Check:
- [ ] Backend running? (`npm start` in backend dir)
- [ ] Frontend running? (`npm run dev` in frontend dir)
- [ ] MongoDB running?
- [ ] .env configured with SMTP?
- [ ] Check console logs for errors
- [ ] Try clearing browser cache (Ctrl+Shift+Del)

