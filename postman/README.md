# Postman API Tests (Medha)

## Files
- `postman/medha.postman_collection.json`: Requests for all backend APIs (local).
- `postman/medha.postman_environment.json`: Local environment variables (baseUrl, token, IDs).

## Import into Postman
1. Postman → **Import** → select both JSON files above.
2. Select environment **Medha Local (Django)**.

## Run backend locally
In PowerShell:

```powershell
cd "d:\medha project mac os\medha project"
.\.venv\Scripts\python .\medha-backend\manage.py runserver 8000
```

## Recommended run order (Collection Runner)
Run requests in this order so IDs are created and reused:

1. `Auth/Login (Token)` (saves `token`)
2. `Core CRUD/Doctors - Create` (saves `doctorPk`)
3. `Core CRUD/Patients - Create` (saves `patientPk`)
4. `Core CRUD/Appointments - Create` (saves `appointmentPk`)
5. `Core CRUD/Records - Create` (saves `recordPk`)
6. `Core CRUD/Prescriptions - Create` (saves `prescriptionPk`)
7. `Core CRUD/Vitals - Create` (saves `vitalPk`)
8. `Billing/Receipts - Create` (saves `receiptPk`)
9. Any remaining GET endpoints

## Notes
- Auth header format: `Authorization: Token {{token}}`
- Base URL: `{{baseUrl}}` defaults to `http://127.0.0.1:8000`

