"""
NFC Bridge API for Medha Health Frontend
FastAPI service that bridges the NFC scanner with the frontend.
Reads from latest_scan.json and provides patient data via API.
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import json
import os
import jwt
from pathlib import Path

app = FastAPI(title="Medha NFC Bridge API")

# CORS - allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
JWT_SECRET = os.getenv("NFC_JWT_SECRET", "medha-nfc-secret-key-2024")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
LAST_SCAN_FILE = Path(__file__).parent / "latest_scan.json"
BACKEND_URL = os.getenv("MEDHA_BACKEND_URL", "http://127.0.0.1:8000")
BACKEND_TOKEN = os.getenv("MEDHA_AUTH_TOKEN", "403b8984be1212af496af0040c9741da373aa8b8")

# OAuth2 for authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class ScanResult(BaseModel):
    patient_id: str
    uid: str
    scanned_at: str
    patient_data: Optional[dict] = None

class PatientData(BaseModel):
    patient_id: str
    full_name: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    hospital_visits: list = []

# Helper functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_latest_scan() -> dict:
    """Read the latest scan from file."""
    if not LAST_SCAN_FILE.exists():
        return None
    try:
        with open(LAST_SCAN_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return None

def fetch_patient_from_backend(patient_id: str) -> dict:
    """Fetch patient data from Django backend."""
    import requests
    if not BACKEND_TOKEN:
        return None
    
    # Always try scanning by card number first
    url = f"{BACKEND_URL}/api/patients/scan-card/{patient_id}/"
    
    headers = {"Authorization": f"Token {BACKEND_TOKEN}"}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            return response.json()
    except Exception:
        pass
    
    # If card number didn't work, try patient_id
    if not patient_id.startswith('CARD-'):
        url = f"{BACKEND_URL}/api/patients/profile/{patient_id}/"
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                return response.json()
        except Exception:
            pass
    
    return None

# Routes
@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate and return JWT token."""
    # Simple auth - in production, use proper user management
    if form_data.username == "nfc" and form_data.password == "nfc123":
        access_token = create_access_token(data={"sub": form_data.username})
        return {"access_token": access_token, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/scan/latest", response_model=ScanResult)
async def get_latest_scan_endpoint(token: str = Depends(oauth2_scheme)):
    """Get the latest NFC scan result."""
    scan_data = get_latest_scan()
    if not scan_data:
        raise HTTPException(status_code=404, detail="No scan data available")
    
    # Try to fetch patient data from backend
    patient_id = scan_data.get("patient_id", "")
    patient_data = fetch_patient_from_backend(patient_id)
    
    return {
        "patient_id": patient_id,
        "uid": scan_data.get("uid", patient_id),
        "scanned_at": scan_data.get("scanned_at", ""),
        "patient_data": patient_data
    }

@app.get("/patient/{patient_id}", response_model=PatientData)
async def get_patient(patient_id: str, token: str = Depends(oauth2_scheme)):
    """Get patient data by ID."""
    patient_data = fetch_patient_from_backend(patient_id)
    if not patient_data:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return {
        "patient_id": patient_data.get("patient_id", patient_id),
        "full_name": patient_data.get("full_name", "Unknown"),
        "date_of_birth": patient_data.get("date_of_birth"),
        "gender": patient_data.get("gender"),
        "blood_group": patient_data.get("blood_group"),
        "phone": patient_data.get("phone"),
        "status": patient_data.get("status"),
        "hospital_visits": patient_data.get("hospital_visits", [])
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "Medha NFC Bridge"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8010)