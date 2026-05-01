# Medha Health Intelligance Shared Backend Schema (Web + Mobile)

This schema is intended to be shared by Flutter mobile and web clients.

## Collections

### `Users/{userId}`
- `name`: string
- `email`: string
- `phone`: string
- `role`: string (`patient`, `doctor`, `admin`)
- `language`: string (`en`, `hi`)
- `createdAt`: timestamp

### `Doctors/{doctorId}`
- `name`: string
- `specialty`: string
- `hospitalId`: string
- `rating`: number
- `available`: bool
- `experienceYears`: number

### `Hospitals/{hospitalId}`
- `name`: string
- `location`: string
- `rating`: number
- `phone`: string
- `emergencyAvailable`: bool

### `Appointments/{appointmentId}`
- `patientId`: string
- `doctorId`: string
- `scheduledAt`: string (ISO datetime)
- `mode`: string (`online`, `offline`)
- `status`: string (`booked`, `completed`, `cancelled`)
- `createdAt`: timestamp

### `Prescriptions/{prescriptionId}`
- `patientId`: string
- `doctorId`: string
- `medicines`: array of map `{name, dosage, schedule, status}`
- `createdAt`: timestamp

### `MedicalRecords/{recordId}`
- `patientId`: string
- `type`: string (`report`, `prescription`, `history`)
- `fileUrl`: string
- `uploadedAt`: timestamp

### `Chats/{roomId}`
- `members`: array of user IDs
- `lastMessage`: string
- `updatedAt`: timestamp

### `Chats/{roomId}/messages/{messageId}`
- `sender`: string
- `text`: string
- `createdAt`: timestamp

