param(
  [string]$BaseUrl = "http://127.0.0.1:8000",
  [string]$Username = "devadmin",
  [string]$Password = "MedhaDevadmin#42"
)

$ErrorActionPreference = 'Stop'

function Pass([string]$Name, [string]$Msg) { Write-Output "[PASS] $Name - $Msg" }
function Fail([string]$Name, [string]$Msg) { Write-Output "[FAIL] $Name - $Msg"; exit 1 }
function Step([string]$Name, [scriptblock]$Fn) {
  try {
    & $Fn
  } catch {
    Fail $Name ($_.Exception.Message)
  }
}

$suffix = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

Write-Output "Running Medha API smoke tests"
Write-Output "BaseUrl=$BaseUrl"

Step "Login" {
  $login = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/login/" -ContentType 'application/json' -Body (
    @{ username = $Username; password = $Password } | ConvertTo-Json
  )
  if (-not $login.token) { Fail "Login" "no token returned" }
  $script:Token = $login.token
  Pass "Login" "received token"
}

Step "Auth Me" {
  $me = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/auth/me/" -Headers @{ Authorization = "Token $Token" }
  if ($me.username -ne $Username) { Fail "Auth Me" "expected username=$Username got username=$($me.username)" }
  Pass "Auth Me" "authenticated user fetched"
}

Step "Doctor Create" {
  $doctor = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/doctors/" -ContentType 'application/json' -Body (
    @{
      doctor_id     = "DOC-PT-$suffix"
      full_name     = "Dr. API Test"
      department    = "General Medicine"
      status        = "on_duty"
      hospital_name = "City Hospital"
    } | ConvertTo-Json
  )
  if (-not $doctor.id) { Fail "Doctor Create" "no id returned" }
  $script:DoctorPk = $doctor.id
  Pass "Doctor Create" "doctor id=$DoctorPk"
}

Step "Patient Create" {
  $patient = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/patients/" -ContentType 'application/json' -Body (
    @{
      patient_id      = "MHD-PT-$suffix"
      full_name       = "Patient API Test"
      gender          = "M"
      phone           = "9999999999"
      status          = "active"
      hospital_name   = "City Hospital"
      assigned_doctor = $DoctorPk
    } | ConvertTo-Json
  )
  if (-not $patient.id) { Fail "Patient Create" "no id returned" }
  $script:PatientPk = $patient.id
  Pass "Patient Create" "patient id=$PatientPk"
}

Step "Appointment Create" {
  $appt = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/appointments/" -ContentType 'application/json' -Body (
    @{
      doctor           = $DoctorPk
      patient          = $PatientPk
      date             = "2026-03-31"
      time             = "10:30:00"
      appointment_type = "new"
      status           = "upcoming"
      complaint        = "Fever"
    } | ConvertTo-Json
  )
  if (-not $appt.id) { Fail "Appointment Create" "no id returned" }
  Pass "Appointment Create" "appointment id=$($appt.id)"
}

Step "Record Create" {
  $record = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/records/" -ContentType 'application/json' -Body (
    @{
      patient     = $PatientPk
      doctor      = $DoctorPk
      date        = "2026-03-31"
      diagnosis   = "Viral fever"
      record_type = "routine"
      notes       = "Hydrate and rest"
      attachments = @()
    } | ConvertTo-Json
  )
  if (-not $record.id) { Fail "Record Create" "no id returned" }
  Pass "Record Create" "record id=$($record.id)"
}

Step "Prescription Create" {
  $pres = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/prescriptions/" -ContentType 'application/json' -Body (
    @{
      patient    = $PatientPk
      doctor     = $DoctorPk
      medicine   = "Paracetamol 500mg"
      dosage     = "1-0-1"
      duration   = "3 days"
      status     = "active"
      notes      = "After food"
      ddi_alerts = @()
    } | ConvertTo-Json
  )
  if (-not $pres.id) { Fail "Prescription Create" "no id returned" }
  Pass "Prescription Create" "prescription id=$($pres.id)"
}

Step "Vital Create" {
  $vital = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/vitals/" -ContentType 'application/json' -Body (
    @{
      patient        = $PatientPk
      blood_pressure = "120/80"
      heart_rate     = 72
      spo2           = 98
      temperature    = 98.4
      weight         = 70
    } | ConvertTo-Json
  )
  if (-not $vital.id) { Fail "Vital Create" "no id returned" }
  Pass "Vital Create" "vital id=$($vital.id)"
}

Step "Receipt Create" {
  $receipt = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/billing/receipts/" -ContentType 'application/json' -Body (
    @{
      receipt_number = "RCP-PT-$suffix"
      patient        = $PatientPk
      doctor         = $DoctorPk
      items          = @(@{ name = "Consultation"; amount = 500 })
      total_amount   = "500.00"
      payment_mode   = "upi"
      status         = "paid"
    } | ConvertTo-Json -Depth 5
  )
  if (-not $receipt.id) { Fail "Receipt Create" "no id returned" }
  Pass "Receipt Create" "receipt id=$($receipt.id)"
}

Step "Billing Summary" {
  $summary = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/billing/summary/"
  if ($null -eq $summary.total_billed) { Fail "Billing Summary" "missing total_billed" }
  Pass "Billing Summary" "summary returned"
}

Step "Contact Enquiry" {
  $enq = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/contact/enquiry/" -ContentType 'application/json' -Body (
    @{
      hospital_name  = "Demo Hospital"
      contact_person = "Rohit"
      email          = "rohit@example.com"
      phone          = "9999999999"
      hospital_type  = "Clinic"
      beds           = "10"
      plan           = "Starter"
      message        = "Interested in demo"
    } | ConvertTo-Json
  )
  if (-not $enq.message) { Fail "Contact Enquiry" "no message returned" }
  Pass "Contact Enquiry" "enquiry submitted"
}

Step "Dashboards/Reports/Settings" {
  $adminDash = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/dashboard/admin/"
  if ($null -eq $adminDash.metrics) { Fail "Admin Dashboard" "missing metrics" }
  Pass "Admin Dashboard" "ok"

  $doctorDash = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/dashboard/doctor/"
  if ($null -eq $doctorDash.stats) { Fail "Doctor Dashboard" "missing stats" }
  Pass "Doctor Dashboard" "ok"

  $patientDash = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/dashboard/patient/"
  if ($null -eq $patientDash.profile) { Fail "Patient Dashboard" "missing profile" }
  Pass "Patient Dashboard" "ok"

  $reports = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/reports/"
  if ($null -eq $reports.avg_stay) { Fail "Reports" "missing avg_stay" }
  Pass "Reports" "ok"

  $settings = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/hospital/settings/"
  if (-not $settings.hospital_name) { Fail "Settings GET" "missing hospital_name" }
  Pass "Settings GET" "ok"

  $settingsPut = Invoke-RestMethod -Method Put -Uri "$BaseUrl/api/hospital/settings/" -ContentType 'application/json' -Body (
    @{ hospital_name = "City Hospital" } | ConvertTo-Json
  )
  if (-not $settingsPut.message) { Fail "Settings PUT" "missing message" }
  Pass "Settings PUT" "ok"
}

Step "Logout" {
  $logout = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/logout/" -Headers @{ Authorization = "Token $Token" }
  if ($logout.message -ne "Logged out") { Fail "Logout" "unexpected response" }
  Pass "Logout" "token invalidated"
}

Write-Output "ALL API TESTS PASSED"

