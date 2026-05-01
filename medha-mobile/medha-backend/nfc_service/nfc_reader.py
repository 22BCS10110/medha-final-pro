"""
NFC Patient Card Scanner for Medha Health Intelligance
Connects to Django backend API and displays patient information when card is scanned.
Works in manual mode (type patient_id) or with NFC hardware if available.
"""
from __future__ import annotations

import json
import os
import sys
import time
import requests
from datetime import datetime
from pathlib import Path

# Configuration
BACKEND_URL = os.getenv("MEDHA_BACKEND_URL", "http://127.0.0.1:8000")
AUTH_TOKEN = os.getenv("MEDHA_AUTH_TOKEN", "")
LAST_SCAN_FILE = Path(os.getenv("NFC_LAST_SCAN_FILE", Path(__file__).resolve().parent / "latest_scan.json"))

# ANSI Color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}  {text}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.CYAN}ℹ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.ENDC}")

def _write_scan(uid: str) -> None:
    """Write last scan info to file."""
    payload = {
        "patient_id": uid,
        "uid": uid,
        "scanned_at": datetime.utcnow().isoformat(),
    }
    LAST_SCAN_FILE.write_text(json.dumps(payload), encoding="utf-8")

def scan_patient_card(card_number: str) -> dict:
    """
    Scan a patient card by calling the backend API.
    Returns patient data if found, None otherwise.
    """
    if not AUTH_TOKEN:
        print_error("No authentication token set!")
        print_info("Set MEDHA_AUTH_TOKEN environment variable or login first.")
        return None

    url = f"{BACKEND_URL}/api/patients/scan-card/{card_number}/"
    headers = {"Authorization": f"Token {AUTH_TOKEN}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 401:
            print_error("Authentication failed. Token may be invalid or expired.")
            return None
        elif response.status_code == 404:
            print_error(f"Card not found: {card_number}")
            return None
        else:
            print_error(f"Server error: {response.status_code}")
            print_info(response.text[:200])
            return None
    except requests.exceptions.ConnectionError:
        print_error(f"Cannot connect to backend at {BACKEND_URL}")
        print_info("Make sure Django server is running: python manage.py runserver 8000")
        return None
    except requests.exceptions.Timeout:
        print_error("Request timed out. Server may be slow.")
        return None
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        return None

def display_patient_data(data: dict) -> None:
    """Display patient information in a formatted way."""
    if not data:
        return

    print_header("PATIENT FOUND")
    
    # Basic Info
    print(f"\n{Colors.BOLD}Patient ID:{Colors.ENDC}    {Colors.GREEN}{data.get('patient_id', 'N/A')}{Colors.ENDC}")
    print(f"{Colors.BOLD}Full Name:{Colors.ENDC}     {data.get('full_name', 'N/A')}")
    print(f"{Colors.BOLD}Date of Birth:{Colors.ENDC} {data.get('date_of_birth', 'N/A')}")
    print(f"{Colors.BOLD}Gender:{Colors.ENDC}        {data.get('gender', 'N/A')}")
    print(f"{Colors.BOLD}Blood Group:{Colors.ENDC}   {Colors.RED}{data.get('blood_group', 'N/A')}{Colors.ENDC}")
    print(f"{Colors.BOLD}Phone:{Colors.ENDC}         {data.get('phone', 'N/A')}")
    print(f"{Colors.BOLD}Status:{Colors.ENDC}        {data.get('status', 'N/A')}")
    
    # ABHA ID if available
    if data.get('abha_id'):
        print(f"{Colors.BOLD}ABHA ID:{Colors.ENDC}     {data.get('abha_id')}")
    
    # Emergency Contact
    if data.get('emergency_contact'):
        print(f"{Colors.BOLD}Emergency:{Colors.ENDC}     {data.get('emergency_contact')}")
    
    # Hospital Visits
    visits = data.get('hospital_visits', [])
    if visits:
        print(f"\n{Colors.BOLD}{Colors.UNDERLINE}Hospital Visit History:{Colors.ENDC}")
        for visit in visits:
            hospital_name = visit.get('hospital_name', 'Unknown Hospital')
            visit_date = visit.get('visit_date', 'N/A')[:10]
            is_active = visit.get('is_active', False)
            status_icon = f"{Colors.GREEN}[ACTIVE]{Colors.ENDC}" if is_active else f"{Colors.YELLOW}[PAST]{Colors.ENDC}"
            print(f"  {status_icon} {hospital_name} - {visit_date}")
    
    # Assigned Doctor
    if data.get('assigned_doctor'):
        print(f"\n{Colors.BOLD}Assigned Doctor:{Colors.ENDC} {data.get('assigned_doctor')}")
    
    # Card Info
    scanned_card = data.get('scanned_card', {})
    if scanned_card:
        print(f"\n{Colors.BOLD}Card Details:{Colors.ENDC}")
        print(f"  Card Number: {scanned_card.get('card_number', 'N/A')}")
        print(f"  Card Type:   {scanned_card.get('card_type', 'NFC/QR').upper()}")
        print(f"  Issued:      {scanned_card.get('issued_at', 'N/A')[:10]}")
        if scanned_card.get('last_scanned_at'):
            print(f"  Last Scan:   {scanned_card.get('last_scanned_at')[:19]}")

    print(f"\n{Colors.HEADER}{'='*60}{Colors.ENDC}\n")

def get_auth_token() -> str:
    """Try to get auth token from environment or prompt user."""
    token = AUTH_TOKEN
    if not token:
        print_warning("No authentication token found!")
        print_info("You can set it via environment variable:")
        print_info("  Windows: set MEDHA_AUTH_TOKEN=your_token")
        print_info("  Linux/Mac: export MEDHA_AUTH_TOKEN=your_token")
        print()
        token = input("Enter auth token (or press Enter to skip): ").strip()
    return token

def _run_with_pyscard() -> bool:
    """Try to run with pyscard NFC library."""
    try:
        from smartcard.CardMonitoring import CardMonitor, CardObserver
        from smartcard.util import toHexString
    except Exception:
        return False

    class PrintObserver(CardObserver):
        def update(self, observable, actions):
            added_cards, _ = actions
            for card in added_cards:
                uid = toHexString(card.atr).replace(" ", "")
                print(f"\n[NFC] Card detected! ATR: {uid}")
                _write_scan(uid)

    print_info("Backend: pyscard")
    print_info("Waiting for card tap...")
    monitor = CardMonitor()
    observer = PrintObserver()
    monitor.addObserver(observer)
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[NFC] Stopped by user")
    finally:
        monitor.deleteObserver(observer)
    return True

def _run_with_nfcpy() -> bool:
    """Try to run with nfcpy library."""
    try:
        import nfc
    except Exception:
        return False

    print_info("Backend: nfcpy")
    print_info("Waiting for card tap...")

    def on_connect(tag):
        uid = getattr(tag, "identifier", b"").hex().upper() or str(tag)
        print(f"\n[NFC] Card tapped! UID: {uid}")
        _write_scan(uid)
        return True

    try:
        clf = nfc.ContactlessFrontend("usb")
    except Exception:
        return False

    try:
        while True:
            clf.connect(rdwr={"on-connect": on_connect})
    except KeyboardInterrupt:
        print("\n[NFC] Stopped by user")
    finally:
        clf.close()
    return True

def run_manual_mode(token: str) -> None:
    """Run in manual mode where user types patient_id or card number."""
    print_header("NFC Patient Card Scanner - Manual Mode")
    print_info(f"Backend: {BACKEND_URL}")
    print_info(f"Auth: {'Token set' if token else 'No token (read-only mode)'}")
    print()
    print_info("Available Patient Cards (from database):")
    print(f"  {Colors.CYAN}CARD-1775386502-1143DE{Colors.ENDC} - Rajan Kumar (PAT-4500)")
    print(f"  {Colors.CYAN}CARD-1775386502-5DBC94{Colors.ENDC} - Priya Sharma (PAT-4501)")
    print(f"  {Colors.CYAN}CARD-1775386502-FEC60D{Colors.ENDC} - Amit Verma (PAT-4502)")
    print(f"  {Colors.CYAN}CARD-1775386502-7CCA0C{Colors.ENDC} - Sneha Patel (PAT-4503)")
    print(f"  {Colors.CYAN}CARD-1775386502-D2AA5E{Colors.ENDC} - Rohit Singh (PAT-4504)")
    print()
    print_info("Type a card number or patient_id and press Enter to scan.")
    print_info("Press 'q' or Ctrl+C to quit.\n")
    
    while True:
        try:
            user_input = input(f"{Colors.BOLD}[SCAN]{Colors.ENDC} ").strip()
            
            if not user_input:
                continue
            
            if user_input.lower() in ['q', 'quit', 'exit']:
                print_info("Exiting scanner...")
                break
            
            # Check if input looks like a card number or patient_id
            if user_input.upper().startswith('CARD-') or user_input.upper().startswith('PAT-'):
                if token:
                    # Call the API to scan the card
                    result = scan_patient_card(user_input)
                    if result:
                        display_patient_data(result)
                        _write_scan(user_input)
                    else:
                        print()
                else:
                    print_warning("No auth token - cannot query backend.")
                    print_info("Set MEDHA_AUTH_TOKEN and restart.")
                    print()
            else:
                print_warning("Invalid input. Use card number (CARD-xxx) or patient ID (PAT-xxx)")
                print()
                
        except KeyboardInterrupt:
            print("\n\n[NFC] Stopped by user")
            break
        except EOFError:
            break

def main() -> None:
    """Main entry point."""
    LAST_SCAN_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    # Get auth token
    token = get_auth_token()
    
    # Try NFC hardware first, fallback to manual
    if _run_with_pyscard():
        return
    if _run_with_nfcpy():
        return
    
    # Manual mode as fallback
    run_manual_mode(token)

if __name__ == "__main__":
    main()