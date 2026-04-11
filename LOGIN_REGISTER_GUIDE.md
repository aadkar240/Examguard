# Login/Register Fix - Complete Guide

## ✅ Issue Resolved

**Problem:** Login/Register not working
**Root Cause:** Database was empty - no users existed
**Solution:** Seeded database with demo users

---

## 🎯 Demo Credentials (For Testing)

You can now login with these test accounts:

### Student Account
```
Email:    student@demo.com
Password: Student@123
```

### Faculty Account
```
Email:    faculty@demo.com
Password: Faculty@123
```

### Admin Account
```
Email:    admin@demo.com
Password: Admin@123
```

---

## 🚀 How to Login

1. **Open Frontend:** Go to `http://localhost:5174` (or `http://localhost:5173`)
2. **Click "Login"** button
3. **Select Login Mode:** Choose between:
   - **Password Mode:** (Recommended for testing)
     - Enter email and password from above
     - Click "Login"
   - **OTP Mode:** 
     - Click "Login with OTP"
     - Enter email
     - Click "Send OTP"
     - OTP will appear in development mode
     - Enter OTP (6 digits)
     - Click "Login"
4. **After Login:** You'll be redirected to your dashboard

---

## 📝 How to Register New User

### Two Options:

#### Option 1: Register as Student
1. Click "Register" button
2. Fill in basic details:
   - Name
   - Email
   - Password (min 6 chars)
   - Confirm Password
   - Student ID
   - Department  
   - Semester
   - Phone (optional)
3. Click "Send OTP"
4. OTP will be displayed (in development mode)
5. Copy/paste OTP
6. Click "Register"
7. **Success!** You're now logged in

#### Option 2: Register as Faculty
1. Click "Register" button
2. Select "Faculty" from role dropdown
3. Fill in details:
   - Name
   - Email
   - Password
   - Confirm Password
   - Department
   - Phone (optional)
4. Click "Send OTP"
5. Enter OTP
6. Click "Register"
7. **Pending Approval:** Faculty accounts need admin approval
8. Admin will approve, then you can login

#### Option 3: Register as Admin
- Can only be done by existing admin
- Contact admin to create account

---

## 🔧 System Status

**Backend:**
- ✅ Running on `http://localhost:5000`
- ✅ MongoDB Connected
- ✅ All endpoints working
- ✅ Email OTP working (returns OTP in development)

**Frontend:**
- ✅ Running on `http://localhost:5174`
- ✅ All pages loading
- ✅ Auth context working
- ✅ API calls successful

**Database:**
- ✅ Connected
- ✅ Demo users created
- ✅ Ready for testing

---

## 🆘 Troubleshooting

### If you still can't login:

1. **Check Backend is Running**
   ```
   cd backend
   npm start
   ```
   Should see: "Server running on port 5000"

2. **Check Frontend is Running**
   ```
   cd frontend
   npm run dev
   ```
   Should see: "Local: http://localhost:5174"

3. **Clear Browser Cache**
   - Clear localStorage: Open DevTools → Application → Local Storage → Clear
   - Clear session storage
   - Refresh page

4. **Check MongoDB is Running**
   - Ensure MongoDB is running on localhost:27017
   - Check `.env` file has correct `MONGODB_URI`

5. **Verify Demo Users Exist**
   ```
   cd backend
   node seed.js
   ```
   This will recreate demo users

### If OTP is not showing:

1. Check browser console for errors (F12)
2. Check if email service is configured in `.env`
3. In development mode, OTP should appear automatically

### If registration email is failing:

1. In development, email failures don't block registration
2. OTP is still generated and should be returned
3. Check `.env` for email configuration:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=examguard38@gmail.com
   EMAIL_PASSWORD=mblmnhlygqvaphum
   ```

---

## 📊 What's Working Now

✅ **Password-based Login**
- Email + Password authentication
- JWT tokens working
- Session persistence

✅ **OTP-based Login**
- Send OTP to email
- Verify OTP
- Login with OTP

✅ **Password-based Registration**
- Send OTP
- Verify email
- Create account

✅ **Faculty Approval Workflow**
- New faculty accounts pending approval
- Admin can approve/reject
- Approved faculty can login

✅ **Password Reset**
- Send forgot password OTP
- Reset password with OTP

✅ **Profile Management**
- Update profile
- Change password
- View account details

---

## 🎓 Next Steps

1. **Test Basic Login**
   - Login with student@demo.com / Student@123
   - Browse your dashboard
   - Try creating an exam (faculty only)

2. **Test Registration**
   - Create a new student account
   - Verify registration flow works

3. **Test Faculty Features**
   - Login as faculty@demo.com
   - Create exams
   - Evaluate submissions
   - View analytics

4. **Test Admin Features**
   - Login as admin@demo.com
   - Approve faculty accounts
   - View system statistics
   - Manage users

---

## 📞 Quick Commands

```bash
# Start Backend
cd backend && npm start

# Start Frontend  
cd frontend && npm run dev

# Seed Database (Create demo users)
cd backend && node seed.js

# Kill Port 5000 (if needed)
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Check Backend Status
# Open: http://localhost:5000

# Check Frontend Status
# Open: http://localhost:5174 or http://localhost:5173
```

---

## ✨ Summary

Your system is now:
- ✅ **Ready to Test**
- ✅ **Demo Users Available**
- ✅ **All Auth Features Working**
- ✅ **Database Connected**

**You can now login and register successfully!**

Use the demo credentials above to test immediately.

---

**Last Updated:** Current Session
**Status:** ✅ FULLY OPERATIONAL
