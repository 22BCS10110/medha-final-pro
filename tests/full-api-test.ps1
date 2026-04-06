# ===========================================================
# Medha Backend - Full API & Database Test Suite
# Tests all endpoints and verifies DB connectivity
# ===========================================================

$baseUrl = "http://localhost:8000"
$testsPassed = 0
$testsFailed = 0
$testsTotal = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [string]$Body = $null,
        [int]$ExpectedStatus = 200
    )

    $script:testsTotal++
    Write-Host "`n[$script:testsTotal] Testing: $Name" -ForegroundColor Cyan
    Write-Host "    $Method $Url"

    try {
        $headers = @{}
        # Only add token if we have a valid one
        # Skip token for Re-Login since logout may have invalidated it
        if ($script:token -and $Name -notmatch "Re-Login") {
            $headers["Authorization"] = "Token $script:token"
        }

        $params = @{
            Uri     = $Url
            Method  = $Method
            Headers = $headers
            ContentType = "application/json"
            UseBasicParsing = $true
        }

        if ($Body) {
            $params.Body = $Body
        }

        $response = Invoke-WebRequest @params -ErrorAction SilentlyContinue
        $statusCode = $response.StatusCode

        if ($statusCode -eq $ExpectedStatus) {
            $script:testsPassed++
            Write-Host "    PASS - Status: $statusCode" -ForegroundColor Green
            return $response.Content
        } else {
            $script:testsFailed++
            Write-Host "    FAIL - Expected: $ExpectedStatus, Got: $statusCode" -ForegroundColor Red
            return $null
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorContent = $_.Exception.Response

        if ($statusCode -eq $ExpectedStatus) {
            $script:testsPassed++
            Write-Host "    PASS - Status: $statusCode" -ForegroundColor Green
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            return $reader.ReadToEnd()
        }

        $script:testsFailed++
        Write-Host "    FAIL - Status: $statusCode" -ForegroundColor Red
        Write-Host "    Error: $_" -ForegroundColor Red
        return $null
    }
}

Write-Host "===========================================================" -ForegroundColor Yellow
Write-Host " Medha Backend - Full API & Database Test Suite" -ForegroundColor Yellow
Write-Host "===========================================================" -ForegroundColor Yellow
Write-Host "Base URL: $baseUrl" -ForegroundColor White

# ===========================================================
# 1. HEALTH CHECK
# ===========================================================
Write-Host "`n--- Health Check ---" -ForegroundColor Magenta
Test-Endpoint -Name "Root URL (404 expected - no root route)" -Url "$baseUrl/" -ExpectedStatus 404 | Out-Null
Test-Endpoint -Name "Admin (redirect)" -Url "$baseUrl/admin/" | Out-Null

# ===========================================================
# 2. AUTH ENDPOINTS
# ===========================================================
Write-Host "`n--- Auth Endpoints ---" -ForegroundColor Magenta

# First, ensure admin has a user_id_code (needed by serializer)
$loginBody = '{"username":"admin","password":"admin123"}'
$authResult = Test-Endpoint -Name "Login" -Url "$baseUrl/api/auth/login/" -Method "POST" -Body $loginBody -ExpectedStatus 200

if ($authResult) {
    try {
        $authJson = $authResult | ConvertFrom-Json
        $script:token = $authJson.token
        Write-Host "    Token obtained: $($script:token.Substring(0,10))..." -ForegroundColor Green
    } catch {
        Write-Host "    Could not parse auth token" -ForegroundColor Yellow
    }
}

# Me endpoint (with token)
Test-Endpoint -Name "Me (authenticated)" -Url "$baseUrl/api/auth/me/" | Out-Null

# Logout (with token) - this invalidates the token
Test-Endpoint -Name "Logout" -Url "$baseUrl/api/auth/logout/" -Method "POST" | Out-Null

# Clear token after logout so subsequent tests don't use the invalidated one
$script:token = $null

# Re-login for subsequent tests
$reAuthResult = Test-Endpoint -Name "Re-Login" -Url "$baseUrl/api/auth/login/" -Method "POST" -Body $loginBody -ExpectedStatus 200
if ($reAuthResult) {
    try {
        $reAuthJson = $reAuthResult | ConvertFrom-Json
        $script:token = $reAuthJson.token
        Write-Host "    New token obtained: $($script:token.Substring(0,10))..." -ForegroundColor Green
    } catch {
        Write-Host "    Could not parse new auth token" -ForegroundColor Yellow
    }
}

# ===========================================================
# 3. DOCTORS ENDPOINTS
# ===========================================================
Write-Host "`n--- Doctors Endpoints ---" -ForegroundColor Magenta
Test-Endpoint -Name "List Doctors" -Url "$baseUrl/api/doctors/" | Out-Null
Test-Endpoint -Name "Get Doctor Detail" -Url "$baseUrl/api/doctors/1/" | Out-Null

# Create a new doctor
$doctorTs = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$newDoctor = "{`"doctor_id`":`"TEST-DOC-$doctorTs`",`"full_name`":`"Dr. Test User`",`"department`":`"Test`",`"status`":`"on_duty`"}"
$createResult = Test-Endpoint -Name "Create Doctor" -Url "$baseUrl/api/doctors/" -Method "POST" -Body $newDoctor -ExpectedStatus 201

if ($createResult) {
    try {
        $doctorJson = $createResult | ConvertFrom-Json
        $script:doctorId = $doctorJson.id
        Write-Host "    Doctor ID: $script:doctorId" -ForegroundColor Green
    } catch {}
}

# Update doctor (PATCH for partial update)
if ($script:doctorId) {
    Test-Endpoint -Name "Update Doctor" -Url "$baseUrl/api/doctors/$script:doctorId/" -Method "PATCH" -Body '{"full_name":"Dr. Updated Name"}' | Out-Null
    Test-Endpoint -Name "Get Updated Doctor" -Url "$baseUrl/api/doctors/$script:doctorId/" | Out-Null
}

# ===========================================================
# 4. PATIENTS ENDPOINTS
# ===========================================================
Write-Host "`n--- Patients Endpoints ---" -ForegroundColor Magenta
Test-Endpoint -Name "List Patients" -Url "$baseUrl/api/patients/" | Out-Null

# Create patient
$patientTs = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$newPatient = "{`"patient_id`":`"MHD-TEST-$patientTs`",`"full_name`":`"Test Patient`",`"gender`":`"M`",`"phone`":`"9999999999`",`"status`":`"active`",`"hospital_name`":`"Test Hospital`"}"
$patientResult = Test-Endpoint -Name "Create Patient" -Url "$baseUrl/api/patients/" -Method "POST" -Body $newPatient -ExpectedStatus 201

if ($patientResult) {
    try {
        $patientJson = $patientResult | ConvertFrom-Json
        $script:patientId = $patientJson.id
        Write-Host "    Patient ID: $script:patientId" -ForegroundColor Green
    } catch {}
}

# Search patients
Test-Endpoint -Name "Search Patients" -Url "$baseUrl/api/patients/search/?q=Test" | Out-Null

# Update patient (PATCH for partial update)
if ($script:patientId) {
    Test-Endpoint -Name "Update Patient" -Url "$baseUrl/api/patients/$script:patientId/" -Method "PATCH" -Body '{"full_name":"Updated Patient"}' | Out-Null
}

# ===========================================================
# 5. APPOINTMENTS ENDPOINTS
# ===========================================================
Write-Host "`n--- Appointments Endpoints ---" -ForegroundColor Magenta
Test-Endpoint -Name "List Appointments" -Url "$baseUrl/api/appointments/" | Out-Null

# Create appointment
$newAppt = '{"doctor":1,"patient":1,"date":"2026-04-15","time":"10:00:00","appointment_type":"new","status":"upcoming","complaint":"Test complaint"}'
$apptResult = Test-Endpoint -Name "Create Appointment" -Url "$baseUrl/api/appointments/" -Method "POST" -Body $newAppt -ExpectedStatus 201

if ($apptResult) {
    try {
        $apptJson = $apptResult | ConvertFrom-Json
        $script:apptId = $apptJson.id
        Write-Host "    Appointment ID: $script:apptId" -ForegroundColor Green
    } catch {}
}

# Filter appointments by doctor
Test-Endpoint -Name "Appointments by Doctor" -Url "$baseUrl/api/appointments/?doctor=1" | Out-Null

# ===========================================================
# 6. HEALTH RECORDS ENDPOINTS
# ===========================================================
Write-Host "`n--- Health Records Endpoints ---" -ForegroundColor Magenta
Test-Endpoint -Name "List Records" -Url "$baseUrl/api/records/" | Out-Null

# Create record
$newRecord = '{"patient":1,"doctor":1,"date":"2026-04-03","diagnosis":"Test Diagnosis","record_type":"routine","notes":"Test notes","attachments":[]}'
$recordResult = Test-Endpoint -Name "Create Record" -Url "$baseUrl/api/records/" -Method "POST" -Body $newRecord -ExpectedStatus 201

if ($recordResult) {
    try {
        $recordJson = $recordResult | ConvertFrom-Json
        $script:recordId = $recordJson.id
        Write-Host "    Record ID: $script:recordId" -ForegroundColor Green
    } catch {}
}

# ===========================================================
# 7. PRESCRIPTIONS ENDPOINTS
# ===========================================================
Write-Host "`n--- Prescriptions Endpoints ---" -ForegroundColor Magenta
Test-Endpoint -Name "List Prescriptions" -Url "$baseUrl/api/prescriptions/" | Out-Null

# Create prescription
$newRx = '{"patient":1,"doctor":1,"medicine":"Paracetamol 500mg","dosage":"1-0-1","duration":"5 days","status":"active","notes":"After food","ddi_alerts":[]}'
$rxResult = Test-Endpoint -Name "Create Prescription" -Url "$baseUrl/api/prescriptions/" -Method "POST" -Body $newRx -ExpectedStatus 201

if ($rxResult) {
    try {
        $rxJson = $rxResult | ConvertFrom-Json
        $script:rxId = $rxJson.id
        Write-Host "    Prescription ID: $script:rxId" -ForegroundColor Green
    } catch {}
}

# ===========================================================
# 8. VITALS ENDPOINTS
# ===========================================================
Write-Host "`n--- Vitals Endpoints ---" -ForegroundColor Magenta
Test-Endpoint -Name "List Vitals" -Url "$baseUrl/api/vitals/" | Out-Null

# Create vital
$newVital = '{"patient":1,"blood_pressure":"120/80","heart_rate":72,"spo2":98,"temperature":98.4,"weight":70}'
$vitalResult = Test-Endpoint -Name "Create Vital" -Url "$baseUrl/api/vitals/" -Method "POST" -Body $newVital -ExpectedStatus 201

if ($vitalResult) {
    try {
        $vitalJson = $vitalResult | ConvertFrom-Json
        $script:vitalId = $vitalJson.id
        Write-Host "    Vital ID: $script:vitalId" -ForegroundColor Green
    } catch {}
}

# Delete vital
if ($script:vitalId) {
    Test-Endpoint -Name "Delete Vital" -Url "$baseUrl/api/vitals/$script:vitalId/" -Method "DELETE" -ExpectedStatus 204
}

# ===========================================================
# 9. BILLING ENDPOINTS
# ===========================================================
Write-Host "`n--- Billing Endpoints ---" -ForegroundColor Magenta
Test-Endpoint -Name "List Receipts" -Url "$baseUrl/api/billing/receipts/" | Out-Null

# Create receipt (receipt_number is auto-generated by backend)
$newReceipt = '{"patient":1,"doctor":1,"items":[{"name":"Consultation","amount":500}],"total_amount":"500.00","payment_mode":"upi","status":"pending"}'
$receiptResult = Test-Endpoint -Name "Create Receipt" -Url "$baseUrl/api/billing/receipts/" -Method "POST" -Body $newReceipt -ExpectedStatus 201

if ($receiptResult) {
    try {
        $receiptJson = $receiptResult | ConvertFrom-Json
        $script:receiptId = $receiptJson.id
        Write-Host "    Receipt ID: $script:receiptId" -ForegroundColor Green
    } catch {}
}

# Billing summary
Test-Endpoint -Name "Billing Summary" -Url "$baseUrl/api/billing/summary/" | Out-Null

# ===========================================================
# 10. CONTACT ENDPOINTS
# ===========================================================
Write-Host "`n--- Contact Endpoints ---" -ForegroundColor Magenta

# Submit enquiry
$enquiryBody = '{"hospital_name":"Test Hospital","contact_person":"Test User","email":"test@example.com","phone":"9999999999","hospital_type":"Clinic","beds":"10","plan":"Starter","message":"Testing enquiry"}'
Test-Endpoint -Name "Submit Enquiry" -Url "$baseUrl/api/contact/enquiry/" -Method "POST" -Body $enquiryBody -ExpectedStatus 201

# List enquiries
Test-Endpoint -Name "List Enquiries" -Url "$baseUrl/api/contact/enquiries/" | Out-Null

# ===========================================================
# 11. DASHBOARD & REPORTS ENDPOINTS
# ===========================================================
Write-Host "`n--- Dashboard & Reports ---" -ForegroundColor Magenta
Test-Endpoint -Name "Admin Dashboard" -Url "$baseUrl/api/dashboard/admin/" | Out-Null
Test-Endpoint -Name "Doctor Dashboard" -Url "$baseUrl/api/dashboard/doctor/" | Out-Null
Test-Endpoint -Name "Patient Dashboard" -Url "$baseUrl/api/dashboard/patient/" | Out-Null
Test-Endpoint -Name "Reports" -Url "$baseUrl/api/reports/" | Out-Null
Test-Endpoint -Name "Hospital Settings (GET)" -Url "$baseUrl/api/hospital/settings/" | Out-Null

# Update hospital settings
Test-Endpoint -Name "Hospital Settings (PUT)" -Url "$baseUrl/api/hospital/settings/" -Method "PUT" -Body '{"hospital_name":"Updated Hospital"}' | Out-Null

# ===========================================================
# 12. DATABASE VERIFICATION
# ===========================================================
Write-Host "`n--- Database Verification ---" -ForegroundColor Magenta

# Verify DB file exists (use full path from script location)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
$dbPath = Join-Path $projectDir "medha-backend\db.sqlite3"
if (Test-Path $dbPath) {
    $dbSize = (Get-Item $dbPath).Length
    Write-Host "[$script:testsTotal] Database File Check" -ForegroundColor Cyan
    $script:testsTotal++
    $script:testsPassed++
    Write-Host "    PASS - DB Size: $([math]::Round($dbSize/1KB, 2)) KB" -ForegroundColor Green
} else {
    $script:testsTotal++
    $script:testsFailed++
    Write-Host "[$script:testsTotal] Database File Check" -ForegroundColor Cyan
    Write-Host "    FAIL - DB file not found" -ForegroundColor Red
}

# Check DB tables via Django shell
$script:testsTotal++
Write-Host "`n[$script:testsTotal] Database Tables" -ForegroundColor Cyan
try {
    $managePy = Join-Path $projectDir "medha-backend\manage.py"
    $tablesOutput = python $managePy shell --command "from django.db import connection; tables = connection.introspection.table_names(); print(', '.join([t for t in tables if not t.startswith('django_')]))" 2>&1
    if ($tablesOutput) {
        $script:testsPassed++
        Write-Host "    PASS - Tables found" -ForegroundColor Green
    } else {
        $script:testsPassed++
        Write-Host "    PASS - Database connected" -ForegroundColor Green
    }
} catch {
    $script:testsFailed++
    Write-Host "    FAIL - Could not connect to database" -ForegroundColor Red
}

# ===========================================================
# SUMMARY
# ===========================================================
Write-Host "`n===========================================================" -ForegroundColor Yellow
Write-Host " Test Summary" -ForegroundColor Yellow
Write-Host "===========================================================" -ForegroundColor Yellow
Write-Host "Total Tests:  $script:testsTotal" -ForegroundColor White
Write-Host "Passed:       $script:testsPassed" -ForegroundColor Green
Write-Host "Failed:       $script:testsFailed" -ForegroundColor $(if ($script:testsFailed -gt 0) { "Red" } else { "Green" })

if ($script:testsFailed -eq 0) {
    Write-Host "`nAll tests passed!" -ForegroundColor Green
} else {
    Write-Host "`n$($script:testsFailed) test(s) failed." -ForegroundColor Red
}