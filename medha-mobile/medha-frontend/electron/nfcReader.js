/**
 * Medha Health Intelligance — Native NFC Card Reader (nfc-pcsc)
 *
 * Manages USB NFC reader (ACR122U / PN532) connection and card tap events.
 * Supports MIFARE DESFire card read/write with UID fallback.
 *
 * Emits events: reader:connect, reader:disconnect, card:uid, card:desfire, card:error
 *
 * Usage in main process:
 *   import { createNfcReader } from './nfcReader.js';
 *   const nfc = createNfcReader();
 *   nfc.on('card:uid', (uid) => { ... });
 *   nfc.on('card:desfire', (data, readerName) => { ... });
 *   nfc.on('reader:connect', (readerName) => { ... });
 */
import { EventEmitter } from 'events';

// ── DESFire APDU constants ──
const DESFIRE_AID = [0x12, 0x34, 0x56]; // Application ID
const DESFIRE_SELECT_APP = Buffer.from([0x90, 0x5A, 0x00, 0x00, 0x03, ...DESFIRE_AID, 0x00]);
// Read from File 01, offset 0, length 0 (read all)
const DESFIRE_READ_FILE = Buffer.from([0x90, 0xBD, 0x00, 0x00, 0x07, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

/**
 * Build a DESFire WriteData APDU for File 01.
 * Command 0x3D, File 01, offset 0, length = data.length
 */
function buildDesFireWriteApdu(dataBuffer) {
  const len = dataBuffer.length;
  // Lc = 7 (file + offset + length) + data length
  const lc = 7 + len;
  const buf = Buffer.alloc(5 + lc + 1); // header(5) + Lc payload + Le(1)
  buf[0] = 0x90; // CLA
  buf[1] = 0x3D; // INS (WriteData)
  buf[2] = 0x00; // P1
  buf[3] = 0x00; // P2
  buf[4] = lc;   // Lc
  buf[5] = 0x01; // File ID
  buf[6] = 0x00; // Offset byte 0
  buf[7] = 0x00; // Offset byte 1
  buf[8] = 0x00; // Offset byte 2
  buf[9] = len & 0xFF;         // Length byte 0 (LSB)
  buf[10] = (len >> 8) & 0xFF; // Length byte 1
  buf[11] = (len >> 16) & 0xFF; // Length byte 2
  dataBuffer.copy(buf, 12);
  buf[buf.length - 1] = 0x00; // Le
  return buf;
}

/** Check if APDU response ends with SW 91 00 (DESFire success) or 90 00 */
function isDesFireSuccess(response) {
  if (!response || response.length < 2) return false;
  const sw1 = response[response.length - 2];
  const sw2 = response[response.length - 1];
  return (sw1 === 0x91 && sw2 === 0x00) || (sw1 === 0x90 && sw2 === 0x00);
}

/** Parse "PATIENT_ID|NAME|BLOOD_GROUP" from DESFire file data */
function parseDesFireData(response) {
  // Strip SW bytes (last 2)
  const payload = response.slice(0, response.length - 2);
  // Trim trailing nulls / whitespace
  let str = '';
  for (let i = 0; i < payload.length; i++) {
    if (payload[i] === 0x00) break;
    str += String.fromCharCode(payload[i]);
  }
  str = str.trim();
  if (!str) return null;

  const parts = str.split('|');
  if (parts.length !== 3) return null;

  const [id, name, blood] = parts;
  if (!id || !name) return null;

  return { id, name, blood: blood || '' };
}

let NFC;
try {
  // nfc-pcsc is an optional native dependency — gracefully handle if missing
  NFC = (await import('nfc-pcsc')).default;
} catch (e) {
  console.log('[NFC-DEBUG] Import error:', e.message);
  NFC = null;
}

/**
 * Create and return an NFC reader manager.
 * Returns an EventEmitter that fires:
 *   - reader:connect   (readerName: string)
 *   - reader:disconnect (readerName: string)
 *   - card:uid         (uid: string, readerName: string)
 *   - card:removed     (readerName: string)
 *   - card:error       (error: Error, readerName: string)
 *   - nfc:unavailable  ()   — fired once if nfc-pcsc is not installed
 */
export function createNfcReader() {
  const emitter = new EventEmitter();

  // Track state
  emitter._readers = new Map();   // name → reader instance
  emitter._nfcInstance = null;
  emitter._started = false;

  /** True if the nfc-pcsc library is available */
  emitter.isAvailable = () => !!NFC;

  /** Get list of connected reader names */
  emitter.getReaders = () => [...emitter._readers.keys()];

  /** True if at least one reader is connected */
  emitter.hasReader = () => emitter._readers.size > 0;

  /** Track write-pending state: { data, resolve, reject } */
  emitter._writePending = null;

  /**
   * Attempt DESFire read on a reader.
   * Returns parsed { id, name, blood } or null on failure.
   */
  emitter.readDesfire = async (reader) => {
    try {
      // Step 1: Select DESFire application
      const selectResp = await reader.transmit(DESFIRE_SELECT_APP, 256);
      if (!isDesFireSuccess(selectResp)) {
        console.log('[NFC-DESFire] Select app failed — not a DESFire card or AID not found');
        return null;
      }

      // Step 2: Read file 01
      const readResp = await reader.transmit(DESFIRE_READ_FILE, 256);
      if (!isDesFireSuccess(readResp)) {
        console.log('[NFC-DESFire] Read file failed — file not found or empty');
        return null;
      }

      // Step 3: Parse data
      const parsed = parseDesFireData(readResp);
      if (!parsed) {
        console.log('[NFC-DESFire] Invalid data format on card');
        return null;
      }

      console.log(`[NFC-DESFire] Read success: ${parsed.id} | ${parsed.name} | ${parsed.blood}`);
      return parsed;
    } catch (err) {
      console.log('[NFC-DESFire] Read error:', err.message);
      return null;
    }
  };

  /**
   * Write patient data to DESFire card.
   * @param {object} reader - The nfc-pcsc reader instance
   * @param {{ id: string, name: string, blood: string }} data
   * @returns {{ success: boolean, error?: string }}
   */
  emitter.writeDesfire = async (reader, data) => {
    try {
      const str = `${data.id}|${data.name}|${data.blood}`;
      const dataBuffer = Buffer.from(str, 'utf8');

      // Step 1: Select DESFire application
      const selectResp = await reader.transmit(DESFIRE_SELECT_APP, 256);
      if (!isDesFireSuccess(selectResp)) {
        return { success: false, error: 'DESFire app not found (AID 0x123456). Card may not be provisioned.' };
      }

      // Step 2: Write data to file 01
      const writeApdu = buildDesFireWriteApdu(dataBuffer);
      const writeResp = await reader.transmit(writeApdu, 256);
      if (!isDesFireSuccess(writeResp)) {
        return { success: false, error: 'Write to DESFire file failed. Check card permissions.' };
      }

      console.log(`[NFC-DESFire] Write success: "${str}"`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Queue a write operation. Resolves when the next card tap triggers the write.
   * @param {{ id: string, name: string, blood: string }} data
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  emitter.queueWrite = (data) => {
    // Cancel any existing pending write
    if (emitter._writePending) {
      emitter._writePending.reject(new Error('Write cancelled — new write queued'));
    }
    return new Promise((resolve, reject) => {
      emitter._writePending = { data, resolve, reject };
      console.log(`[NFC-DESFire] Write queued — waiting for card tap...`);
    });
  };

  /** Cancel pending write */
  emitter.cancelWrite = () => {
    if (emitter._writePending) {
      emitter._writePending.reject(new Error('Write cancelled'));
      emitter._writePending = null;
    }
  };

  /**
   * Start listening for NFC readers and cards.
   * Safe to call multiple times — only initialises once.
   */
  emitter.start = () => {
    if (emitter._started) return;
    emitter._started = true;

    if (!NFC) {
      console.warn('[NFC] nfc-pcsc not available — running without NFC hardware support');
      emitter.emit('nfc:unavailable');
      return;
    }

    try {
      const nfc = new NFC();
      emitter._nfcInstance = nfc;

      nfc.on('reader', (reader) => {
        console.log("✅ READER CONNECTED:", reader.name);
        
        reader.on('card', (card) => {
          console.log("🔥 CARD DETECTED:", card.uid);
        });

        reader.on('error', (err) => {
          console.log("❌ NFC ERROR:", err.message);
        });
      });

      nfc.on('reader', (reader) => {
        const name = reader.name || 'Unknown Reader';
        console.log(`[NFC] Reader connected: ${name}`);
        emitter._readers.set(name, reader);
        emitter.emit('reader:connect', name);

        reader.on('card', async (card) => {
          const uid = card.uid?.toUpperCase() || '';
          console.log(`[NFC] Card tapped — UID: ${uid} (reader: ${name})`);

          // Handle pending write operation
          if (emitter._writePending) {
            const { data, resolve } = emitter._writePending;
            emitter._writePending = null;
            const result = await emitter.writeDesfire(reader, data);
            resolve(result);
            if (result.success) {
              emitter.emit('card:write-success', data, name);
            } else {
              emitter.emit('card:write-error', result.error, name);
            }
            return; // Don't process as a read when writing
          }

          // Attempt DESFire read first
          const desfire = await emitter.readDesfire(reader);
          if (desfire) {
            emitter.emit('card:desfire', desfire, uid, name);
          }

          // Always emit UID (fallback path + existing functionality)
          if (uid) {
            emitter.emit('card:uid', uid, name);
          }
        });

        reader.on('card.off', () => {
          emitter.emit('card:removed', name);
        });

        reader.on('error', (err) => {
          console.error(`[NFC] Reader error (${name}):`, err.message);
          emitter.emit('card:error', err, name);
        });

        reader.on('end', () => {
          console.log(`[NFC] Reader disconnected: ${name}`);
          emitter._readers.delete(name);
          emitter.emit('reader:disconnect', name);
        });
      });

      nfc.on('error', (err) => {
        // PCSC daemon errors (e.g. no smartcard service running)
        console.error('[NFC] PCSC error:', err.message);
        emitter.emit('card:error', err, null);
      });

      console.log('[NFC] Listener started — waiting for reader...');
    } catch (err) {
      console.error('[NFC] Failed to start:', err.message);
      emitter.emit('card:error', err, null);
    }
  };

  /**
   * Stop and clean up all NFC resources.
   */
  emitter.stop = () => {
    if (emitter._nfcInstance) {
      try { emitter._nfcInstance.close(); } catch {}
      emitter._nfcInstance = null;
    }
    emitter._readers.clear();
    emitter._started = false;
  };

  return emitter;
}
