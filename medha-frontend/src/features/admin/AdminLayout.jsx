import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Users,
  UserPlus,
  Stethoscope,
  CreditCard,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  Check,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import Logo from '../../components/ui/Logo';
import OfflineStatusBar from '../../components/ui/OfflineStatusBar';
import { cn } from '../../utils/cn';
import { notificationsAPI } from '../../services/api';

// ── Notification Bell (shared) ──────────────────────────────────
function NotificationBell() {
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
    } catch { /* backend may be offline */ }
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
        className="relative w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 border-2 border-white text-white text-[10px] font-black flex items-center justify-center px-0.5">
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
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-[500] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="font-black text-sm text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  <Check size={12} /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm font-bold text-slate-400">No notifications</p>
              ) : notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markOne(n.id)}
                  className={cn('px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors', !n.is_read && 'bg-primary/[0.03]')}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />}
                    <div className={cn(!n.is_read ? '' : 'ml-4')}>
                      <p className="text-sm font-bold text-slate-900 leading-tight">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">
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

const AdminSidebar = ({ isMobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3, path: '/admin' },
    { id: 'patients', label: 'Patient Mgt', icon: Users, path: '/admin/patients' },
    { id: 'doctors', label: 'Medical Staff', icon: Stethoscope, path: '/admin/doctors' },
    { id: 'registration', label: 'Register Patient', icon: UserPlus, path: '/admin/registration' },
    { id: 'billing', label: 'Billing & Finance', icon: CreditCard, path: '/admin/billing' },
    { id: 'reports', label: 'Clinical Reports', icon: BarChart3, path: '/admin/reports' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-100 h-screen sticky top-0">
        <div className="p-8">
           <Logo className="h-8" />
        </div>

        {/* Register New Patient — always visible */}
        <div className="px-6 mb-2">
          <button
            onClick={() => navigate('/admin/registration')}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
          >
            <UserPlus size={18} />
            Register Patient
          </button>
        </div>

        <nav className="flex-grow px-6 space-y-1 mt-4">
           {menuItems.map((item) => {
             const isActive = location.pathname === item.path;
             return (
               <Link 
                 key={item.id}
                 to={item.path}
                 className={cn(
                   "flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group",
                   isActive 
                     ? "bg-primary text-white shadow-lg shadow-primary/20" 
                     : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                 )}
               >
                 <div className="flex items-center gap-3">
                    <item.icon size={20} className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                 </div>
                 {isActive && <motion.div layoutId="activeInd" className="w-1.5 h-1.5 rounded-full bg-white" />}
               </Link>
             );
           })}
        </nav>

        <div className="p-6 border-t border-slate-50">
           <button 
             onClick={handleLogout}
             className="flex items-center gap-3 px-4 py-3.5 w-full rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
           >
              <LogOut size={20} />
              Sign Out
           </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="absolute top-0 left-0 w-80 h-full bg-white shadow-2xl flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-10">
                 <Logo className="h-6" />
                 <button onClick={() => setMobileOpen(false)} className="p-2 text-slate-400">
                    <X size={24} />
                 </button>
              </div>
              <nav className="space-y-2">
                 {menuItems.map((item) => (
                   <Link 
                     key={item.id}
                     to={item.path}
                     onClick={() => setMobileOpen(false)}
                     className={cn(
                       "flex items-center gap-4 px-4 py-4 rounded-2xl font-bold",
                       location.pathname === item.path ? "bg-primary text-white" : "text-slate-500"
                     )}
                   >
                     <item.icon size={22} />
                     {item.label}
                   </Link>
                 ))}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const AdminLayout = ({ children, title = "Administrator" }) => {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AdminSidebar isMobileOpen={isMobileOpen} setMobileOpen={setMobileOpen} />
      
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-10 shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-500">
                <Menu size={24} />
             </button>
             <h1 className="text-xl font-black text-slate-900 tracking-tight">{title}</h1>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
             <div className="hidden md:flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 w-80 group focus-within:border-primary/30 transition-all">
                <Search size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Universal patient search..." 
                  className="bg-transparent border-none focus:ring-0 text-sm font-medium w-full ml-2 text-slate-600"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/admin/patients?q=${e.target.value}`);
                  }}
                />
             </div>

             <div className="flex items-center gap-3">
                <OfflineStatusBar />
                <NotificationBell />
                <div className="flex items-center gap-3 pl-3 md:pl-6 border-l border-slate-100">
                   <div className="hidden md:block text-right">
                      <p className="text-sm font-black text-slate-900 leading-none mb-1">{user?.name || "Admin User"}</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Hospital Admin</p>
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-lg shadow-primary/20">
                      {user?.name?.[0] || "A"}
                   </div>
                </div>
             </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <main className="flex-grow overflow-y-auto p-6 md:p-10">
           {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
