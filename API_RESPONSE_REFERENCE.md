# API Response Reference - Faculty Approval System

## 1. Send Registration OTP

### Request
```
POST http://localhost:5000/api/auth/send-registration-otp
Content-Type: application/json

{
  "email": "newfaculty@example.com",
  "role": "faculty"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "OTP sent successfully to your email"
}
```

### Backend Action
```
✓ Generates 6-digit OTP (e.g., 693797)
✓ Stores in MongoDB with 10-minute expiry
✓ Sends email via Gmail SMTP
✓ Logs: [EMAIL_SERVICE] Successfully sent OTP to newfaculty@example.com
```

---

## 2. Register Faculty with OTP

### Request
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "New Test Faculty",
  "email": "newfaculty@example.com",
  "password": "Test@123456",
  "otp": "693797",
  "role": "faculty",
  "department": "Computer Science"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Faculty account created. Waiting for admin approval before dashboard access.",
  "requiresApproval": true,        ← This triggers success modal
  "emailSent": true,                ← Pending status email was sent
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "New Test Faculty",
    "email": "newfaculty@example.com",
    "role": "faculty",
    "department": "Computer Science",
    "facultyApprovalStatus": "pending",  ← Status field
    "createdAt": "2026-02-20T17:25:02.316Z"
  }
}
```

### Frontend Action
```
✓ Receives requiresApproval: true
✓ Shows success modal with message
✓ Auto-redirects to login after 5 seconds
✓ Frontend stores "pending" status from response
```

### Backend Action
```
✓ Validates OTP against database record
✓ Creates user with facultyApprovalStatus: "pending"
✓ Sends pending status email
✓ Returns successful response with requiresApproval flag
✓ Logs: [FACULTY_REGISTRATION] ✓ Email sent successfully!
```

---

## 3. Get Faculty List (Admin)

### Request
```
GET http://localhost:5000/api/users?role=faculty
Authorization: Bearer {admin_token}
```

### Response (Success)
```json
{
  "success": true,
  "count": 3,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "New Test Faculty",
      "email": "newfaculty@example.com",
      "role": "faculty",
      "department": "Computer Science",
      "facultyApprovalStatus": "pending",        ← Pending status
      "createdAt": "2026-02-20T17:25:02.316Z",
      "updatedAt": "2026-02-20T17:25:02.316Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "atharva sir",
      "email": "adkar.atharva@dypic.in",
      "role": "faculty",
      "department": "Computer Science",
      "facultyApprovalStatus": "approved",       ← Approved status
      "createdAt": "2026-02-20T17:00:00.000Z",
      "updatedAt": "2026-02-20T17:00:00.000Z",
      "facultyApprovedAt": "2026-02-20T17:10:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Faculty One",
      "email": "faculty1@gmail.com",
      "role": "faculty",
      "department": "Computer Science",
      "facultyApprovalStatus": "approved",       ← Approved status
      "createdAt": "2026-02-20T16:00:00.000Z",
      "updatedAt": "2026-02-20T16:00:00.000Z",
      "facultyApprovedAt": "2026-02-20T16:30:00.000Z"
    }
  ]
}
```

### Frontend Action
```
✓ Receives list of all faculty
✓ Filters by facultyApprovalStatus
✓ Renders cards with status and buttons:
  - Pending: Shows Approve/Reject buttons
  - Approved: Shows "Already approved" text
  - Rejected: Shows "Already rejected" text
✓ Colors status badge:
  - "pending" → Amber color
  - "approved" → Green color
  - "rejected" → Red color
```

---

## 4. Approve Faculty (Admin)

### Request
```
PUT http://localhost:5000/api/users/507f1f77bcf86cd799439012
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "facultyApprovalStatus": "approved"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "New Test Faculty",
    "email": "newfaculty@example.com",
    "role": "faculty",
    "department": "Computer Science",
    "facultyApprovalStatus": "approved",         ← Changed to approved
    "facultyApprovedAt": "2026-02-20T17:27:03.142Z",  ← Approval timestamp
    "createdAt": "2026-02-20T17:25:02.316Z",
    "updatedAt": "2026-02-20T17:27:03.142Z"
  }
}
```

### Frontend Action
```
✓ Receives updated user with approved status
✓ Updates local state with new record
✓ Changes display from Pending → Approved
✓ Changes button from Approve/Reject → "Already approved"
✓ Changes color from Amber → Green
✓ Shows success toast: "Faculty approved successfully"
```

### Backend Action
```
✓ Updates user.facultyApprovalStatus to "approved"
✓ Sets user.facultyApprovedAt to current timestamp
✓ Sends approval email to faculty
✓ Logs: [FACULTY_APPROVAL] Faculty Email: newfaculty@example.com
✓ Logs: [EMAIL_SERVICE] Successfully sent approved email
✓ Returns updated user record
```

---

## 5. Reject Faculty (Admin)

### Request
```
PUT http://localhost:5000/api/users/507f1f77bcf86cd799439012
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "facultyApprovalStatus": "rejected"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "New Test Faculty",
    "email": "newfaculty@example.com",
    "role": "faculty",
    "department": "Computer Science",
    "facultyApprovalStatus": "rejected",         ← Changed to rejected
    "facultyApprovedAt": "2026-02-20T17:27:03.142Z",
    "createdAt": "2026-02-20T17:25:02.316Z",
    "updatedAt": "2026-02-20T17:27:03.142Z"
  }
}
```

### Frontend Action
```
✓ Receives updated user with rejected status
✓ Changes display from Pending → Rejected
✓ Changes button from Approve/Reject → "Already rejected"
✓ Changes color from Amber → Red
✓ Shows success toast: "Faculty rejected successfully"
```

### Backend Action
```
✓ Updates user.facultyApprovalStatus to "rejected"
✓ Sends rejection email to faculty
✓ Logs: [FACULTY_APPROVAL] Faculty rejected
✓ Logs: [EMAIL_SERVICE] Successfully sent rejected email
```

---

## 6. Faculty Login (After Approval)

### Request
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "newfaculty@example.com",
  "password": "Test@123456"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "New Test Faculty",
    "email": "newfaculty@example.com",
    "role": "faculty",
    "department": "Computer Science",
    "facultyApprovalStatus": "approved",        ← Must be approved to log in
    "createdAt": "2026-02-20T17:25:02.316Z"
  }
}
```

### Frontend Action
```
✓ Stores JWT token in localStorage
✓ Redirects to /faculty dashboard
✓ Faculty can now access all protected routes
```

### Response (If Still Pending)
```json
{
  "success": false,
  "message": "Faculty account is not yet approved. Please wait for admin approval."
}
```

---

## 7. Email Service - Pending Status Email

### Request (Internal)
```javascript
sendAccountStatusEmail({
  to: "newfaculty@example.com",
  name: "New Test Faculty",
  status: "pending"
})
```

### Email Sent
```
From: examguard2401@gmail.com
To: newfaculty@example.com
Subject: Account registration pending admin approval

Body:
Hi New Test Faculty,

Your faculty registration is currently pending admin approval.

Once approved, we will notify you by email.
```

---

## 8. Email Service - Approval Email

### Request (Internal)
```javascript
sendAccountStatusEmail({
  to: "newfaculty@example.com",
  name: "New Test Faculty",
  status: "approved"
})
```

### Email Sent
```
From: examguard2401@gmail.com
To: newfaculty@example.com
Subject: Your faculty account is approved

Body:
Hi New Test Faculty,

Your faculty account has been approved.

You can now log in and access your dashboard.
```

---

## 9. Email Service - Rejection Email

### Request (Internal)
```javascript
sendAccountStatusEmail({
  to: "newfaculty@example.com",
  name: "New Test Faculty",
  status: "rejected"
})
```

### Email Sent
```
From: examguard2401@gmail.com
To: newfaculty@example.com
Subject: Your faculty account request was rejected

Body:
Hi New Test Faculty,

Your faculty account request has been rejected.

Please contact the administrator for more details.
```

---

## Error Responses

### Invalid OTP
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

### Email Not Sent
```json
{
  "success": false,
  "message": "Error registering user"
}
```

### Unauthorized (Not Admin)
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### Faculty Before Approval Tries to Login
```json
{
  "success": false,
  "message": "Faculty account is not yet approved. Please wait for admin approval."
}
```

---

## HTTP Status Codes

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Successful GET/PUT request |
| 201 | Created | Successful POST (registration) |
| 400 | Bad Request | Invalid data (missing fields, invalid email) |
| 401 | Unauthorized | Invalid OTP or not approved |
| 403 | Forbidden | Not admin accessing admin endpoint |
| 404 | Not Found | User ID doesn't exist |
| 500 | Server Error | Database or email service error |

---

## Database Collection: users

```javascript
db.users.find({ role: "faculty" }).pretty()

[
  {
    _id: ObjectId("507f1f77bcf86cd799439012"),
    name: "New Test Faculty",
    email: "newfaculty@example.com",
    password: "$2a$10$O8gaIZLBkw5...", // bcrypt hash
    role: "faculty",
    department: "Computer Science",
    facultyApprovalStatus: "pending",    // ← Key field
    facultyApprovedAt: null,             // ← Set on approval
    createdAt: ISODate("2026-02-20T17:25:02.316Z"),
    updatedAt: ISODate("2026-02-20T17:25:02.316Z"),
    __v: 0
  },
  // ... more faculty records
]
```

---

## Database Collection: emailotps

```javascript
db.emailotps.find({ email: "newfaculty@example.com" }).pretty()

{
  _id: ObjectId("507f1f77bcf86cd799439099"),
  email: "newfaculty@example.com",
  otp: "693797",
  purpose: "register",
  createdAt: ISODate("2026-02-20T17:24:22.978Z"),
  // Expires after 10 minutes (TTL index)
}
```

---

## Frontend State - Register Component

```javascript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  otp: '',
  password: '',
  confirmPassword: '',
  role: 'student',
  studentId: '',
  department: '',
  semester: '',
  phone: '',
})

const [showSuccessModal, setShowSuccessModal] = useState(false)  // ← New
```

On successful faculty registration:
```javascript
// After REST call succeeds
if (result.requiresApproval) {
  setShowSuccessModal(true)  // ← Shows modal
  setTimeout(() => navigate('/login'), 5000)  // ← Auto-redirect
}
```

---

## Frontend State - Admin Dashboard

```javascript
const [facultyApprovals, setFacultyApprovals] = useState([])

// On load, fetches:
api.get('/users?role=faculty')
  .then(res => setFacultyApprovals(res.data.users || []))

// Displays:
facultyApprovals.map(faculty => (
  <>
    <p>Name: {faculty.name}</p>
    <p>Email: {faculty.email}</p>
    <p>Department: {faculty.department}</p>
    <p>Status: {faculty.facultyApprovalStatus}</p>
    {faculty.facultyApprovalStatus === 'pending' && (
      <>
        <button onClick={() => approve(faculty._id)}>Approve</button>
        <button onClick={() => reject(faculty._id)}>Reject</button>
      </>
    )}
  </>
))
```

---

## Troubleshooting: Check These Responses

### If success modal doesn't appear:
1. Check if `requiresApproval: true` in registration response
2. Check if `role: "faculty"` in request
3. Check frontend console for errors

### If faculty doesn't appear in admin:
1. Check if `facultyApprovalStatus: "pending"` in database
2. Make admin request with admin token
3. Verify filter: `?role=faculty` in request URL

### If buttons don't work:
1. Check if admin is logged in (has valid token)
2. Verify `facultyApprovalStatus` is exactly "pending", "approved", or "rejected"
3. Check backend logs for [FACULTY_APPROVAL] messages

### If email not sent:
1. Check backend logs for [EMAIL_SERVICE] messages
2. Verify Gmail credentials in .env file
3. Check if SMTP connection working (test-smtp.mjs)
4. Check recipients' spam folder

---

**All API endpoints tested and working as of 2026-02-20** ✅
