# FIX SCRIPT: Faculty Registration & Email

## RUN THIS IMMEDIATELY

### Step 1: Close Everything
- Close terminal/backend process
- Close browser
- Kill any Node.js processes

### Step 2: Kill Port 5000 & Clean Up
Open PowerShell as Admin and run:

```powershell
# Find and kill process on port 5000
$p = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($p) {
    Stop-Process -Id $p.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Killed process on port 5000" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

# Verify port is free
$check = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if (-not $check) {
    Write-Host "✓ Port 5000 is now free" -ForegroundColor Green
} else {
    Write-Host "✗ Port still in use, force kill harder" -ForegroundColor Red
    taskkill /F /IM node.exe
}
```

### Step 3: Restart Backend

```bash
cd c:\Users\ATHARVA\Desktop\aissmshack\backend
npm start
```

**Watch for startup message:**
```
Server running on port 5000
```

### Step 4: Test the System

**In DIFFERENT PowerShell terminal:**

```powershell
# Test admin login
$login = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method Post -ContentType "application/json" `
  -Body '{"email":"admin@gmail.com","password":"admin123"}' `
  -UseBasicParsing

if ($login.StatusCode -eq 200) {
  Write-Host "✓ Backend is working!" -ForegroundColor Green
} else {
  Write-Host "✗ Backend error" -ForegroundColor Red
}
```

### Step 5: Open Browser & Test

1. Open: **http://localhost:5173**
2. Admin Login:
   - Email: `admin@gmail.com`
   - Password: `admin123`
3. Go to **Faculty Approvals** section
4. Click **"Refresh"** button
5. You should see: **Atharva** with status **"approved"**

### Step 6: Test New Faculty Registration

1. Open: **http://localhost:5173/register**
2. Click **"Faculty"** button
3. Fill form:
   - Name: `Test Faculty`
   - Email: `test.faculty.$(Get-Random)@gmail.com` (new email)
   - Password: `password123`
   - Department: `Computer Science`
4. Click **"Send OTP"**
5. Check backend logs in terminal for:
   ```
   [FACULTY_REGISTRATION] ========== REGISTRATION START ==========
   [FACULTY_REGISTRATION] Email sent successfully!
   ```
6. **Check email inbox for OTP** (check SPAM folder)
7. Enter OTP and complete registration
8. **Watch backend logs** for:
   ```
   [FACULTY_REGISTRATION] ========== REGISTRATION COMPLETE ==========
   ```
9. Open **admin dashboard** → **Faculty Approvals**
10. Click **"Refresh"** button
11. New faculty should appear with status **"pending"** ✓

### Step 7: Test Admin Approval

1. In admin dashboard, click **"Approve"** on test faculty
2. Watch backend logs for:
   ```
   [FACULTY_APPROVAL] ========== APPROVAL ACTION ==========
   [FACULTY_APPROVAL] Email sent successfully!
   [FACULTY_APPROVAL] ========== APPROVAL COMPLETE ==========
   ```
3. **Test faculty's status changes to "approved"** ✓
4. **Check test faculty's email** for approval notification ✓

---

## TROUBLESHOOTING

### If Backend Won't Start
```
Error: Port already in use
→ Kill node.exe: taskkill /F /IM node.exe
→ Restart: npm start
```

### If SMTP Shows in Logs as Not Configured
Check `.env` file has:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=examguard2401@gmail.com
EMAIL_PASSWORD=qhsdzfjxxykcpgvl
EMAIL_FROM=examguard2401@gmail.com
```

### If Emails Still Fail
Look for this in backend terminal:
```
[FACULTY_REGISTRATION] ✗ EMAIL FAILED
[FACULTY_REGISTRATION] Error: ...
```

**Common errors:**
- `Invalid login` → Gmail password wrong
- `ECONNREFUSED` → Gmail server unreachable (firewall)
- `SMTP is not configured` → Check .env

### If New Faculty Not Showing in Admin Panel
1. Click **"Refresh"** button (manual refresh)
2. Wait 5-10 seconds (auto-refresh every 5 sec)
3. Close and reopen admin dashboard
4. Check backend logs for `[FACULTY_REGISTRATION]` errors

---

## EXPECTED LOG OUTPUT

### When Faculty Registers:
```
[FACULTY_REGISTRATION] ========== REGISTRATION START ==========
[FACULTY_REGISTRATION] Faculty Email: newfaculty@example.com
[FACULTY_REGISTRATION] Faculty Name: John Doe
[FACULTY_REGISTRATION] Department: Computer Science
[FACULTY_REGISTRATION] Status: pending (waiting for admin approval)
[FACULTY_REGISTRATION] Attempting to send pending status email...
[FACULTY_REGISTRATION] ✓ Email sent successfully!
[FACULTY_REGISTRATION] ========== REGISTRATION COMPLETE ==========
```

### When Admin Approves:
```
[FACULTY_APPROVAL] ========== APPROVAL ACTION ==========
[FACULTY_APPROVAL] Faculty Email: newfaculty@example.com
[FACULTY_APPROVAL] Faculty Name: John Doe
[FACULTY_APPROVAL] Previous Status: pending
[FACULTY_APPROVAL] New Status: approved
[FACULTY_APPROVAL] Sending approved email...
[FACULTY_APPROVAL] ✓ Email sent successfully!
[FACULTY_APPROVAL] ========== APPROVAL COMPLETE ==========
```

---

## SUMMARY

✓ **All fixes implemented:**
- Better error logging in registration
- Better error logging in approval
- Clear log output for debugging
- Auto-refresh every 5 seconds in admin panel
- Manual refresh button available
- Detailed error messages if SMTP fails

✓ **What changed:**
- `backend/controllers/authController.js` - Improved registration logging
- `backend/controllers/userController.js` - Improved approval logging

✓ **No limits on faculty registrations** - system accepts unlimited registrations

---

## IF ALL ELSE FAILS

Reset everything from scratch:

1. Delete `node_modules` in `/backend` and `/frontend`
2. Run `npm install` in both
3. Restart backend and frontend
4. Or contact support with backend log output

