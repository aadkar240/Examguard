#!/bin/bash
# Test script to verify grievance visibility issue

echo "Testing Grievance Submission and Visibility..."
echo "================================================"

# 1. Create a test student grievance
echo -e "\n1. Creating test student..."
STUDENT_EMAIL="test.student.$(date +%s)@test.com"
STUDENT_PASSWORD="Student@123"

# Send OTP for student
STUDENT_OTP_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/send-registration-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$STUDENT_EMAIL\",\"role\":\"student\"}")

echo "OTP Response: $STUDENT_OTP_RESPONSE"

# 2. Login as admin to check current state
echo -e "\n2. Logging in as admin..."
ADMIN_LOGIN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@demo.com\",\"password\":\"Admin@123\"}")

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Admin Token: ${ADMIN_TOKEN:0:20}..."

# 3. Check faculty users
echo -e "\n3. Checking faculty users with departments..."
curl -s -X GET http://localhost:5000/api/users?role=faculty \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.users[] | {name, email, department, facultyApprovalStatus}'

# 4. Check existing grievances
echo -e "\n4. Checking existing grievances..."
curl -s -X GET http://localhost:5000/api/grievances \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.grievances[] | {ticketId, subject, department, status}'

# 5. Run actual test with existing student/faculty
echo -e "\n5. Testing with demo student..."
STUDENT_LOGIN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"student@demo.com\",\"password\":\"Student@123\"}")

STUDENT_TOKEN=$(echo $STUDENT_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)
STUDENT_DATA=$(echo $STUDENT_LOGIN | jq '.user')
STUDENT_DEPT=$(echo $STUDENT_DATA | jq -r '.department')
STUDENT_SEM=$(echo $STUDENT_DATA | jq -r '.semester')

echo "Student Department: $STUDENT_DEPT"
echo "Student Semester: $STUDENT_SEM"

# 6. Create grievance as student
echo -e "\n6. Creating test grievance from student..."
GRIEVANCE=$(curl -s -X POST http://localhost:5000/api/grievances \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"department\":\"$STUDENT_DEPT\",
    \"semester\":$STUDENT_SEM,
    \"problemType\":\"marks-calculation-error\",
    \"category\":\"marks-discrepancy\",
    \"subject\":\"Test Grievance - $(date +%s)\",
    \"description\":\"This is a test grievance to verify visibility in faculty dashboard\",
    \"priority\":\"medium\"
  }")

echo "Grievance Response:"
echo $GRIEVANCE | jq '.'
GRIEVANCE_ID=$(echo $GRIEVANCE | jq -r '.grievance._id')
echo "Created Grievance ID: $GRIEVANCE_ID"

# 7. Login as faculty and check if grievance is visible
echo -e "\n7. Logging in as faculty..."
FACULTY_LOGIN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"faculty@demo.com\",\"password\":\"Faculty@123\"}")

FACULTY_TOKEN=$(echo $FACULTY_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)
FACULTY_DATA=$(echo $FACULTY_LOGIN | jq '.user')
FACULTY_DEPT=$(echo $FACULTY_DATA | jq -r '.department')

echo "Faculty Department: $FACULTY_DEPT"
echo "Faculty Token: ${FACULTY_TOKEN:0:20}..."

# 8. Fetch grievances as faculty
echo -e "\n8. Fetching grievances as faculty..."
FACULTY_GRIEVANCES=$(curl -s -X GET http://localhost:5000/api/grievances \
  -H "Authorization: Bearer $FACULTY_TOKEN")

echo "Faculty Grievances:"
echo $FACULTY_GRIEVANCES | jq '.grievances[] | {ticketId, subject, department, status}'

echo -e "\n9. Summary:"
echo "Student Department: $STUDENT_DEPT"
echo "Faculty Department: $FACULTY_DEPT"
echo "Grievance Department: Check if visible to faculty"

if [ "$STUDENT_DEPT" = "$FACULTY_DEPT" ]; then
  echo "✓ Departments match - grievance should be visible"
else
  echo "✗ Departments don't match - THIS IS THE ISSUE!"
fi
