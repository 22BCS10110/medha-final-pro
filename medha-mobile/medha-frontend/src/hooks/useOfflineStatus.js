/**
 * useOfflineStatus — React hook for tracking online/offline/sync state
 *
 * Returns:
 *  - isOnline: boolean
 *  - syncState: 'idle' | 'syncing' | 'pushing' | 'offline' | 'error'
 *  - pendingCount: number of queued offline actions
 *  - lastPull: ISO timestamp of last successful sync
 *  - forcePull / forcePush: manual sync triggers
 */
import { useState, useEffect, useCallback } from 'react';
import {
  onSyncStatusUpdate,
  checkOnline,
  forcePull as doForcePull,
  forcePush as doForcePush,
  getSyncQueueCount,
} from '../services/offlineService';

const isElectron = !!window.electronAPI?.isElectron;

export default function useOfflineStatus() {
  const [status, setStatus] = useState({
    isOnline: navigator.onLine,
    syncState: 'idle',
    pendingCount: 0,
    lastPull: null,
  });

  useEffect(() => {
    // Get initial status
    checkOnline().then((online) => {
      setStatus((prev) => ({ ...prev, isOnline: online }));
    });

    // Get initial pending count
    if (isElectron) {
      getSyncQueueCount().then((count) => {
        setStatus((prev) => ({ ...prev, pendingCount: count }));
      });
    }

    // Listen to sync engine status updates from main process
    let cleanupSync;
    if (isElectron) {
      cleanupSync = onSyncStatusUpdate((update) => {
        setStatus((prev) => ({
          ...prev,
          ...update,
        }));
      });
    }

    // Browser-level online/offline events
    const handleOnline = () => setStatus((prev) => ({ ...prev, isOnline: true, syncState: 'idle' }));
    const handleOffline = () => setStatus((prev) => ({ ...prev, isOnline: false, syncState: 'offline' }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (cleanupSync) cleanupSync();
    };
  }, []);

  const forcePull = useCallback(async () => {
    setStatus((prev) => ({ ...prev, syncState: 'syncing' }));
    try {
      await doForcePull();
    } finally {
      const count = await getSyncQueueCount();
      setStatus((prev) => ({ ...prev, syncState: 'idle', pendingCount: count }));
    }
  }, []);

  const forcePush = useCallback(async () => {
    setStatus((prev) => ({ ...prev, syncState: 'pushing' }));
    try {
      await doForcePush();
    } finally {
      const count = await getSyncQueueCount();
      setStatus((prev) => ({ ...prev, syncState: 'idle', pendingCount: count }));
    }
  }, []);

  return {
    ...status,
    forcePull,
    forcePush,
    isElectron,
  };
}
