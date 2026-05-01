import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from "../../auth/AuthContext";
import { cn } from "../../utils/cn";
import { Bell, Search, HelpCircle, Check, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OfflineStatusBar from "../../components/ui/OfflineStatusBar";
import { notificationsAPI } from "../../services/api";

function DoctorNotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  const load = async () => {
    try {
      const res = await notificationsAPI.list();
      const items = res.data?.results || res.data || [];
      setNotifications(items.slice(0, 15));
      setUnreadCount(items.filter((n) => !n.is_read).length);
    } catch { /* backend offline */ }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const markOne = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 text-[#505f76] hover:text-[#191c1e] hover:bg-[#f2f4f6] rounded-full transition-all focus:ring-2 focus:ring-[#003ec7]/20"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-[#ba1a1a] border-2 border-white text-white text-[9px] font-bold flex items-center justify-center px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#c3c5d9] z-[500] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#eceef0]">
              <span className="font-semibold text-sm text-[#191c1e]">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs font-semibold text-[#003ec7] hover:underline flex items-center gap-1">
                  <Check size={12} /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-[#eceef0]">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm font-medium text-[#737688]">No notifications</p>
              ) : notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markOne(n.id)}
                  className={cn('px-4 py-3 cursor-pointer hover:bg-[#f2f4f6] transition-colors', !n.is_read && 'bg-[#003ec7]/[0.03]')}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#003ec7] shrink-0" />}
                    <div className={cn(!n.is_read ? '' : 'ml-4')}>
                      <p className="text-sm font-semibold text-[#191c1e] leading-tight">{n.title}</p>
                      <p className="text-xs text-[#505f76] mt-0.5 leading-snug">{n.message}</p>
                      <p className="text-[10px] text-[#737688] mt-1 font-medium uppercase tracking-wider">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardHeader({ title, subtitle }) {
  const { user } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2)
    : "U";

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-[#c3c5d9] sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between px-8 py-3">
        <div>
          <h2 className="text-[24px] font-semibold text-[#191c1e] leading-8 tracking-[-0.01em]">{title}</h2>
          {subtitle && <p className="text-[13px] font-normal text-[#434656] mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-6">
          {/* Search Bar */}
          <div className="hidden lg:flex relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737688]" />
            <input
              type="text"
              placeholder="Search patients, records..."
              className="w-full bg-[#f2f4f6] border border-[#c3c5d9] rounded-full py-1.5 pl-10 pr-4 text-[13px] font-normal text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/20 focus:border-[#003ec7] transition-all placeholder:text-[#737688]"
            />
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2">
            <OfflineStatusBar />
            <DoctorNotificationBell />
            <button className="p-2 text-[#003ec7] hover:bg-[#dde1ff]/30 rounded-full transition-all focus:ring-2 focus:ring-[#003ec7]/20">
              <Radio size={20} />
            </button>
            <button className="ml-2 w-8 h-8 rounded-full bg-[#dde1ff] flex items-center justify-center text-[#003ec7] text-[12px] font-semibold shadow-sm overflow-hidden focus:ring-2 focus:ring-[#003ec7]/20 focus:outline-none">
              {initials}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
