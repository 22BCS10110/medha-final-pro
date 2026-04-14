// ─────────────────────────────────────────────────────────────────
// LEGACY FILE — disabled.
//
// This file previously created a second, independent `new NFC()` instance
// that ran in parallel with electron/nfcReader.js. Running two nfc-pcsc
// sessions against a single USB reader caused:
//   • "Cannot process ISO 14443-4 tag because AID was not set" errors
//     (this instance never set reader.autoProcessing = false)
//   • Reader contention and swallowed card events
//   • Duplicate IPC messages on different channels ('nfc-card' vs 'nfc:card-tap')
//
// All functionality — reader detection, UID reading, DESFire read/write,
// patient lookup, IPC forwarding — now lives in nfcReader.js + main.js.
// The old 'nfc-card' IPC channel is no longer consumed by any frontend code
// (doctor dashboard uses 'nfc:card-tap' and 'nfc:patient-basic').
//
// Kept as a no-op so main.js's `import { startNFC } from './nfc.js'` and
// `startNFC(mainWindow)` call site don't need to change.
// ─────────────────────────────────────────────────────────────────

console.log("[NFC] Legacy nfc.js loaded (no-op) — real reader runs in nfcReader.js");

export function startNFC(_win) {
  // Intentionally empty. See header comment above.
}
