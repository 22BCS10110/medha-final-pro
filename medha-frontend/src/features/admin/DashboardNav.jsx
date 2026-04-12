import React from 'react';
import { useAuth } from "../../auth/AuthContext";
import { cn } from "../../utils/cn";
import { Bell, Search, Settings, HelpCircle, User } from "lucide-react";
import OfflineStatusBar from "../../components/ui/OfflineStatusBar";

export default function DashboardHeader({ title, subtitle }) {
  const { user } = useAuth();
  
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2)
    : "U";

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-50">
      <div>
        <h2 className="text-2xl font-display font-bold text-slate-900 leading-none">{title}</h2>
        {subtitle && <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-6">
        {/* Search Bar */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl w-80 text-slate-400 group focus-within:ring-4 focus-within:ring-primary/5 transition-all">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search records, doctors, bills..." 
            className="bg-transparent border-none outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400 w-full"
          />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2 pr-6 border-r border-slate-100">
           <OfflineStatusBar />
           <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
              <Bell size={20} />
           </button>
           <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
              <HelpCircle size={20} />
           </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
           <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{user?.name}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">{user?.role}</p>
           </div>
           <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/20 group-hover:scale-105 transition-all">
              {initials}
           </div>
        </div>
      </div>
    </header>
  );
}
