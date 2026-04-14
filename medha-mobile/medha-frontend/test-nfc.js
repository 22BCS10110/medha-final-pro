window.electronAPI.onNFCCard((uid) => {
  console.log("NFC UID:", uid);

  window.electronAPI.upsertPatient({
    id: uid,
    name: "Test Patient",
    nfc_uid: uid
  });
});
