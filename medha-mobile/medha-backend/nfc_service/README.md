# Medha NFC Bridge (Website)

This service enables NFC card tap -> patient fetch flow for Admin and Doctor dashboards.

## 1) Install

```bash
cd medha-backend/nfc_service
python -m venv .venv
.venv\\Scripts\\pip install -r requirements.txt
```

## 2) Run NFC reader (USB ACR122U)

```bash
.venv\\Scripts\\python nfc_reader.py
```

Reader fallback priority:
1. `pyscard` (if installed)
2. `nfcpy` (from `requirements.txt`)
3. Manual mode (type `patient_id` in terminal for testing)

This script writes latest scan payload to `latest_scan.json`.

### If you want true pyscard support on Windows

Install Visual C++ Build Tools first:
- https://visualstudio.microsoft.com/visual-cpp-build-tools/

Then:

```bash
.venv\\Scripts\\pip install pyscard
```

## 3) Run FastAPI bridge

```bash
.venv\\Scripts\\uvicorn app:app --host 0.0.0.0 --port 8010 --reload
```

## 4) Env vars (optional)

- `MEDHA_DB_PATH` (default: `../db.sqlite3`)
- `NFC_LAST_SCAN_FILE` (default: `./latest_scan.json`)
- `NFC_JWT_SECRET` (default: `change-me-in-prod`)
- `NFC_API_USER` (default: `nfc`)
- `NFC_API_PASSWORD` (default: `nfc123`)

## 5) API flow

1. `POST /token` -> get JWT
2. `GET /scan/latest` -> wait/poll latest card
3. `GET /patient/{patient_id}` -> patient details

