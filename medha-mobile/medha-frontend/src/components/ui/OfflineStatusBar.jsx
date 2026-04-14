/**
 * OfflineStatusBar — Compact status indicator for the desktop app
 *
 * Shows:
 *  - Green dot + "Online" when connected
 *  - Red dot + "Offline Mode" when disconnected
 *  - Spinning icon when syncing
 *  - Badge with pending sync count
 *  - Manual sync button
 */
import { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CloudUpload,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Database,
} from 'lucide-react';
import useOfflineStatus from '../../hooks/useOfflineStatus';
import { cn } from '../../utils/cn';

export default function OfflineStatusBar() {
  const { isOnline, syncState, pendingCount, lastPull, forcePull, forcePush, isElectron } = useOfflineStatus();
  const [expanded, setExpanded] = useState(false);

  // Don't render in web mode
  if (!isElectron) return null;

  const statusConfig = {
    idle: {
      icon: isOnline ? Wifi : WifiOff,
      label: isOnline ? 'Online' : 'Offline Mode',
      color: isOnline ? 'text-emerald-600' : 'text-red-500',
      bg: isOnline ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100',
      dot: isOnline ? 'bg-emerald-500' : 'bg-red-500',
    },
    syncing: {
      icon: RefreshCw,
      label: 'Syncing...',
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-100',
      dot: 'bg-blue-500',
      animate: true,
    },
    pushing: {
      icon: CloudUpload,
      label: 'Uploading...',
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100',
      dot: 'bg-amber-500',
      animate: true,
    },
    offline: {
      icon: WifiOff,
      label: 'Offline Mode',
      color: 'text-red-500',
      bg: 'bg-red-50 border-red-100',
      dot: 'bg-red-500',
    },
    error: {
      icon: AlertTriangle,
      label: 'Sync Error',
      color: 'text-red-600',
      bg: 'bg-red-50 border-red-100',
      dot: 'bg-red-500',
    },
  };

  const config = statusConfig[syncState] || statusConfig.idle;
  const StatusIcon = config.icon;

  const lastPullFormatted = lastPull
    ? new Date(lastPull).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Never';

  return (
    <div className="relative">
      {/* Compact bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:shadow-sm',
          config.bg, config.color
        )}
      >
        <span className={cn('w-2 h-2 rounded-full shrink-0', config.dot, syncState === 'syncing' || syncState === 'pushing' ? 'animate-pulse' : '')} />
        <StatusIcon size={14} className={config.animate ? 'animate-spin' : ''} />
        <span className="hidden sm:inline">{config.label}</span>
        {pendingCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-amber-500 text-white text-[10px] font-black px-1">
            {pendingCount}
          </span>
        )}
        <ChevronDown size={12} className={cn('transition-transform', expanded ? 'rotate-180' : '')} />
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden">
          {/* Status header */}
          <div className={cn('px-4 py-3 border-b', config.bg)}>
            <div className="flex items-center gap-2">
              <span className={cn('w-2.5 h-2.5 rounded-full', config.dot)} />
              <span className={cn('font-black text-sm', config.color)}>{config.label}</span>
            </div>
          </div>

          {/* Info rows */}
          <div className="p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Last synced</span>
              <span className="font-bold text-slate-900">{lastPullFormatted}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Pending changes</span>
              <span className={cn('font-bold', pendingCount > 0 ? 'text-amber-600' : 'text-slate-900')}>
                {pendingCount}
              </span>
            </div>

            {!isOnline && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  Working offline. Changes will sync automatically when connection is restored.
                </p>
              </div>
            )}

            {pendingCount > 0 && isOnline && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <Database size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                  {pendingCount} change{pendingCount > 1 ? 's' : ''} queued. Sync will push shortly.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {isOnline && (
            <div className="px-4 pb-4 flex gap-2">
              <button
                onClick={forcePull}
                disabled={syncState === 'syncing'}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50"
              >
                <RefreshCw size={12} className={syncState === 'syncing' ? 'animate-spin' : ''} />
                Sync Now
              </button>
              {pendingCount > 0 && (
                <button
                  onClick={forcePush}
                  disabled={syncState === 'pushing'}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  <CloudUpload size={12} />
                  Push Changes
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Click-away overlay */}
      {expanded && (
        <div className="fixed inset-0 z-40" onClick={() => setExpanded(false)} />
      )}
    </div>
  );
}
