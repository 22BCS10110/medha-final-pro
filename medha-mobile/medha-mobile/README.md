# Medha Health Intelligance Mobile (Flutter)

Patient-focused cross-platform app (Android + iOS) with a single Flutter codebase.

## Implemented architecture

- **Framework**: Flutter
- **Architecture**: Feature-first clean layering
- **State management**: Riverpod
- **Backend**: Firebase (Auth, Firestore, Storage, Messaging-ready)
- **Local cache**: SQLite (`sqflite`) for offline-first extension
- **Localization**: `intl` + ARB (`en`, `hi`) with language selection before login

## Folder structure

```txt
lib/
  core/
    models/
    router/
    services/
    theme/
  features/
    auth/
    home/
    screens/
    settings/
  l10n/
backend/
  firestore.rules
  firestore_schema.md
```

## Core screens included

1. Language selection (first launch)
2. Onboarding (3-item intro)
3. Login/Signup (email-password + guest path)
4. Home dashboard (quick actions)
5. Doctor listing + appointment booking action
6. Emergency (SOS call)
7. Medical records upload (Firebase Storage)
8. Prescription list (taken/missed)
9. Realtime chat (Firestore stream)
10. Profile (language switch + logout)

## Firebase setup (required)

1. Install Flutter + FlutterFire CLI.
2. Create Firebase project (`medha-health`).
3. Enable:
   - Authentication (Email/Password, Phone)
   - Firestore
   - Storage
   - Cloud Messaging
4. Run in this folder:

```bash
flutter pub get
flutterfire configure
```

5. Deploy Firestore rules:

```bash
firebase deploy --only firestore:rules
```

## Run on Android device

1. Enable Developer options + USB debugging on phone.
2. Connect phone via USB.
3. Verify device:

```bash
flutter devices
```

4. Run:

```bash
flutter run
```

## Run on iPhone

1. Open `ios/Runner.xcworkspace` in Xcode (from a macOS machine).
2. Set Team signing in Runner target.
3. Connect iPhone and trust Mac.
4. Run from Xcode or:

```bash
flutter run
```

## Notes for this Windows machine

Flutter SDK is not installed yet on this PC. Install it first:
- [Flutter installation guide](https://docs.flutter.dev/get-started/install)
- Then run: `flutter doctor` and fix all checks.

