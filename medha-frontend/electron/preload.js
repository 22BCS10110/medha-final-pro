const { contextBridge, ipcRenderer } = require('electron');

const apiMethods = {
  // Auth
  login: (username, password) => ipcRenderer.invoke('auth:login', { username, password }),
  logout: () => ipcRenderer.invoke('auth:logout'),
  navigateToApp: (user, tokens) => ipcRenderer.invoke('navigate:app', { user, tokens }),
  setAuthToken: (token) => ipcRenderer.invoke('auth:set-token', token),

  // API proxy (online requests to backend)
  apiGet: (endpoint) => ipcRenderer.invoke('api:get', endpoint),
  apiPost: (endpoint, body) => ipcRenderer.invoke('api:post', endpoint, body),
  apiPut: (endpoint, body) => ipcRenderer.invoke('api:put', endpoint, body),

  // Local database (offline reads)
  db: {
    patients:         () => ipcRenderer.invoke('db:patients:all'),
    patient:          (id) => ipcRenderer.invoke('db:patients:get', id),
    searchPatients:   (q) => ipcRenderer.invoke('db:patients:search', q),
    cachePatients:    (list) => ipcRenderer.invoke('db:patients:upsert', list),
    /** Offline direct lookup by NFC UID — hits local nfc_uid_map only, no API fallback */
    getPatientByUID:  (uid) => ipcRenderer.invoke('db:patients:byNfcUid', uid),

    doctors:       () => ipcRenderer.invoke('db:doctors:all'),
    cacheDoctors:  (list) => ipcRenderer.invoke('db:doctors:upsert', list),

    appointments:  () => ipcRenderer.invoke('db:appointments:all'),
    todayAppts:    () => ipcRenderer.invoke('db:appointments:today'),

    recordsFor:    (pid) => ipcRenderer.invoke('db:records:byPatient', pid),
    allRecords:    () => ipcRenderer.invoke('db:records:all'),

    prescriptionsFor: (pid) => ipcRenderer.invoke('db:prescriptions:byPatient', pid),
    allPrescriptions: () => ipcRenderer.invoke('db:prescriptions:all'),

    receipts:      () => ipcRenderer.invoke('db:receipts:all'),

    getCache:      (key) => ipcRenderer.invoke('db:cache:get', key),
    setCache:      (key, data) => ipcRenderer.invoke('db:cache:set', key, data),

    stats:         () => ipcRenderer.invoke('db:stats'),
  },

  // Sync
  sync: {
    queue:     (action, entity, entityId, payload) => ipcRenderer.invoke('sync:queue', action, entity, entityId, payload),
    count:     () => ipcRenderer.invoke('sync:count'),
    forcePull: () => ipcRenderer.invoke('sync:forcePull'),
    forcePush: () => ipcRenderer.invoke('sync:forcePush'),
    isOnline:  () => ipcRenderer.invoke('sync:isOnline'),
    onStatus:  (cb) => {
      const handler = (_e, s) => cb(s);
      ipcRenderer.on('sync:status', handler);
      return () => ipcRenderer.removeListener('sync:status', handler);
    },
  },

  // NFC (legacy polling)
  nfc: {
    scan:    () => ipcRenderer.invoke('nfc:scan'),
    patient: (id) => ipcRenderer.invoke('nfc:patient', id),
  },

  // NFC Hardware (nfc-pcsc — real-time card tap events)
  nfcHardware: {
    /** Get current NFC reader status */
    status: () => ipcRenderer.invoke('nfc:status'),

    /** Manual UID lookup (offline-first) */
    lookup: (uid) => ipcRenderer.invoke('nfc:lookup', uid),

    /** Get all cached NFC UID → patient mappings */
    mappings: () => ipcRenderer.invoke('nfc:mappings'),

    /** Listen for card tap (uid, readerName, status, patient, source, error) */
    onCardTap: (cb) => {
      const handler = (_e, data) => {
        console.log('[PRELOAD] Received NFC event:', data);
        cb(data);
      };
      ipcRenderer.on('nfc:card-tap', handler);
      return () => ipcRenderer.removeListener('nfc:card-tap', handler);
    },

    /** Listen for card removed */
    onCardRemoved: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on('nfc:card-removed', handler);
      return () => ipcRenderer.removeListener('nfc:card-removed', handler);
    },

    /** Listen for reader connect/disconnect */
    onReaderStatus: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on('nfc:reader-status', handler);
      return () => ipcRenderer.removeListener('nfc:reader-status', handler);
    },

    /** Listen for NFC errors */
    onError: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on('nfc:error', handler);
      return () => ipcRenderer.removeListener('nfc:error', handler);
    },

    /**
     * onNFCCard — fires ONCE per physical card tap with just the raw UID string.
     * Use this in assign mode. Does NOT trigger patient lookup.
     * Usage: const unsub = medhaAPI.nfcHardware.onNFCCard(uid => { ... })
     */
    onNFCCard: (cb) => {
      const handler = (_e, { uid }) => cb(uid);
      ipcRenderer.on('nfc:raw-uid', handler);
      return () => ipcRenderer.removeListener('nfc:raw-uid', handler);
    },

    /** Assign NFC card UID to a patient */
    assign: (patientId, nfcUid) => ipcRenderer.invoke('nfc:assign', { patientId, nfcUid }),

    /** Check NFC assignment status for a patient */
    patientStatus: (patientId) => ipcRenderer.invoke('nfc:patient-status', patientId),

    // ── DESFire support ──

    /** Listen for DESFire basic patient data (id, name, blood, source) */
    onPatientBasic: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on('nfc:patient-basic', handler);
      return () => ipcRenderer.removeListener('nfc:patient-basic', handler);
    },

    /**
     * Write patient data to DESFire card.
     * Queues the write — resolves when the next card is tapped.
     * @param {{ id: string, name: string, blood: string }} data
     */
    writeCard: (data) => ipcRenderer.invoke('nfc:write-card', data),

    /** Cancel a pending write operation */
    cancelWrite: () => ipcRenderer.invoke('nfc:cancel-write'),

    /** Listen for successful card write */
    onWriteSuccess: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on('nfc:write-success', handler);
      return () => ipcRenderer.removeListener('nfc:write-success', handler);
    },

    /** Listen for card write errors */
    onWriteError: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on('nfc:write-error', handler);
      return () => ipcRenderer.removeListener('nfc:write-error', handler);
    },
  },
};

contextBridge.exposeInMainWorld('medhaAPI', apiMethods);
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  onNFCCard: (callback) => ipcRenderer.on('nfc-card', (_, uid) => callback(uid)),
  upsertPatient: (data) => ipcRenderer.invoke('db:patients:upsert', data),
  db: apiMethods.db,
  sync: apiMethods.sync
});
