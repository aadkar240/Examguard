# PowerShell Test Script for Grievance Visibility Issue
$ErrorActionPreference = 'Stop'
$API_URL = "http://localhost:5000/api"

Write-Host "Testing Grievance Submission and Faculty Visibility" -ForegroundColor Cyan
Write-Host "====================================================`n"

try {
    # Step 1: Login as student
    Write-Host "Step 1: Logging in as demo student..." -ForegroundColor Yellow
    $studentLogin = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -ContentType 'application/json' -Body (@{
        email = "student@demo.com"
        password = "Student@123"
    } | ConvertTo-Json)
    
    $studentToken = $studentLogin.token
    $studentData = $studentLogin.user
    Write-Host "✓ Student logged in: $($studentData.name)" -ForegroundColor Green
    Write-Host "  Department: $($studentData.department)"
    Write-Host "  Semester: $($studentData.semester)`n"
    
    # Step 2: Create a test grievance
    Write-Host "Step 2: Creating test grievance from student..." -ForegroundColor Yellow
    $grievanceBody = @{
        department = $studentData.department
        semester = [int]$studentData.semester
        problemType = "marks-calculation-error"
        category = "marks-discrepancy"
        subject = "Test Grievance - $(Get-Date -Format 'yyyyMMdd-HHmmss')"
        description = "This is a test grievance to verify visibility in faculty dashboard."
        priority = "medium"
    } | ConvertTo-Json
    
    $grievanceResponse = Invoke-RestMethod -Uri "$API_URL/grievances" -Method Post `
        -Headers @{ Authorization = "Bearer $studentToken" } `
        -ContentType 'application/json' `
        -Body $grievanceBody
    
    $grievanceId = $grievanceResponse.grievance._id
    Write-Host "✓ Grievance created: $($grievanceResponse.grievance.ticketId)" -ForegroundColor Green
    Write-Host "  Department: $($grievanceResponse.grievance.department)`n"
    
    # Step 3: Login as faculty
    Write-Host "Step 3: Logging in as demo faculty..." -ForegroundColor Yellow
    $facultyLogin = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -ContentType 'application/json' -Body (@{
        email = "faculty@demo.com"
        password = "Faculty@123"
    } | ConvertTo-Json)
    
    $facultyToken = $facultyLogin.token
    $facultyData = $facultyLogin.user
    Write-Host "✓ Faculty logged in: $($facultyData.name)" -ForegroundColor Green
    Write-Host "  Department: $($facultyData.department)`n"
    
    # Step 4: Fetch grievances as faculty
    Write-Host "Step 4: Fetching grievances as faculty..." -ForegroundColor Yellow
    $facultyGrievances = Invoke-RestMethod -Uri "$API_URL/grievances" -Method Get `
        -Headers @{ Authorization = "Bearer $facultyToken" }
    
    Write-Host "✓ Fetched $($facultyGrievances.count) grievance(s)  " -ForegroundColor Green
    
    if ($facultyGrievances.count -eq 0) {
        Write-Host "`n⚠️  WARNING: Faculty sees 0 grievances!" -ForegroundColor Red
        Write-Host "  Student dept: $($studentData.department)"
        Write-Host "  Faculty dept: $($facultyData.department)`n"
    } else {
        Write-Host "✓ SUCCESS: Faculty can see grievances!" -ForegroundColor Green
        $facultyGrievances.grievances | ForEach-Object {
            Write-Host "  - $($_.ticketId): $($_.subject) (Dept: $($_.department))"
        }
    }
    
    # Step 5: Admin check
    Write-Host "`nStep 5: Admin grievance access check..." -ForegroundColor Yellow
    $adminLogin = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -ContentType 'application/json' -Body (@{
        email = "admin@demo.com"
        password = "Admin@123"
    } | ConvertTo-Json)
    
    $adminToken = $adminLogin.token
    $adminGrievances = Invoke-RestMethod -Uri "$API_URL/grievances" -Method Get `
        -Headers @{ Authorization = "Bearer $adminToken" }
    
    Write-Host "✓ Admin sees $($adminGrievances.count) grievance(s)" -ForegroundColor Green
    
    # Summary
    Write-Host "`n=====================================================" -ForegroundColor Cyan
    Write-Host "DIAGNOSIS" -ForegroundColor Cyan
    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host "Student Dept = Faculty Dept? $($studentData.department -eq $facultyData.department)" 
    Write-Host "Faculty Can See? $($facultyGrievances.count -gt 0)"
    Write-Host "Admin Can See? $($adminGrievances.count -gt 0)"
}
catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
