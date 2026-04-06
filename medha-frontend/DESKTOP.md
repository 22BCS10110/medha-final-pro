# Medha Health Desktop Application

A native desktop application for doctors and hospital administrators built with Electron and React.

## Features

- **NFC Patient Scanning**: Scan patient cards using USB NFC readers
- **Print Prescriptions**: Direct printing to connected printers
- **Export Patient Data**: Save patient records to local files
- **Auto-Updates**: Automatic application updates
- **Offline Support**: Works with cached data when offline

## Requirements

- **Node.js**: 18.x or higher
- **Backend**: Django API server running on http://127.0.0.1:8000
- **NFC Bridge**: FastAPI service running on http://localhost:8010 (for web mode)

## Installation

```bash
# Install dependencies
npm install

# Run in development mode (web)
npm run dev

# Run in development mode (desktop)
npm run electron:dev

# Build desktop application
npm run electron:build
```

## Building Installers

### Windows
```bash
npm run electron:build
# Output: dist-electron/Medha Health Setup X.X.X.exe
```

### macOS
```bash
npm run electron:build
# Output: dist-electron/Medha Health X.X.X.dmg
```

### Linux
```bash
npm run electron:build
# Output: dist-electron/Medha Health X.X.X.AppImage
#         dist-electron/medha-health-desktop_X.X.X_amd64.deb
```

## Desktop-Specific Features

### NFC Card Scanning
The desktop app supports direct USB NFC reader integration. When running in desktop mode:
- Click "Scan Patient" to start NFC polling
- Tap patient card on USB NFC reader
- Patient data is fetched from backend automatically

### Printing
- Print prescriptions directly to connected printers
- Supports standard and thermal receipt printers

### Data Export
- Export patient records as JSON files
- Save to any location on your computer

## Architecture

```
┌─────────────────────────────────────────┐
│         DESKTOP APPLICATION              │
│  ┌─────────────────────────────────┐    │
│  │   Electron Shell                 │    │
│  │  ┌───────────────────────────┐  │    │
│  │  │   React Frontend          │  │    │
│  │  │   - Doctor Dashboard      │  │    │
│  │  │   - Admin Dashboard       │  │    │
│  │  └───────────────────────────┘  │    │
│  │  ┌───────────────────────────┐  │    │
│  │  │   Native Bridge           │  │    │
│  │  │   - NFC Reader            │  │    │
│  │  │   - Printer               │  │    │
│  │  │   - File System           │  │    │
│  │  └───────────────────────────┘  │    │
│  └─────────────────────────────────┘    │
└──────────────┬──────────────────────────┘
               │ HTTPS/API
               ▼
┌─────────────────────────────────────────┐
│         DJANGO BACKEND API               │
└─────────────────────────────────────────┘
```

## Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Hospital A Admin | admin_a | admin_a123 |
| Hospital B Admin | admin_b | admin_b123 |
| Super Admin | superadmin | superadmin123 |
| Doctor A | doctor_a_1 | doctor_a_1 |
| Doctor B | doctor_b_1 | doctor_b_1 |

## Troubleshooting

### NFC Reader Not Detected
- Ensure USB NFC reader is connected
- Check device manager for driver issues
- Restart the application

### Backend Connection Error
- Ensure Django backend is running on port 8000
- Check network connectivity
- Verify firewall settings

### Print Not Working
- Check printer is connected and online
- Install printer drivers if needed
- Try printing a test page from system settings

## Support

For issues and feature requests, please contact the Medha Health development team.