import { NFC } from 'nfc-pcsc';

console.log("🚀 NFC FILE LOADED");

export function startNFC(win) {
  console.log("🚀 STARTING NFC...");
  
  const nfc = new NFC();

  nfc.on('reader', reader => {
    console.log("✅ READER DETECTED:", reader.name);

    reader.on('card', card => {
      console.log("🔥 CARD UID:", card.uid);
      if (win && !win.isDestroyed()) {
        win.webContents.send('nfc-card', card.uid);
      }
    });

    reader.on('error', err => {
      console.log("❌ READER ERROR:", err.message);
    });
  });

  nfc.on('error', err => {
    console.log("❌ NFC ERROR:", err.message);
  });
}
