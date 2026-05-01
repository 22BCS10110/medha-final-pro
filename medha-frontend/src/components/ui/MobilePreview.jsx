import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Activity, 
  Thermometer, 
  ShieldCheck, 
  Bell, 
  Menu,
  ChevronRight,
  Pill,
  Calendar
} from 'lucide-react';
import { cn } from '../../utils/cn';

const MobilePreview = () => {
  return (
    <div className="relative w-[320px] h-[640px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-[8px] border-slate-800 overflow-hidden group">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center gap-1">
         <div className="w-2 h-2 rounded-full bg-slate-700" />
         <div className="w-8 h-1 bg-slate-700 rounded-full" />
      </div>

      {/* Screen Content */}
      <div className="w-full h-full bg-slate-50 rounded-[2.2rem] overflow-hidden flex flex-col relative">
        
        {/* Mobile App Header */}
        <div className="pt-10 pb-4 px-5 bg-white flex items-center justify-between border-b border-slate-100">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">M</div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Medha Health</span>
           </div>
           <Bell size={16} className="text-slate-400" />
        </div>

        <div className="flex-grow overflow-y-auto p-5 space-y-5">
           {/* Welcome Card */}
           <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm relative overflow-hidden">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Good Morning</p>
              <h4 className="text-sm font-bold text-slate-900 mb-3">Priya Sharma</h4>
              <div className="flex items-center gap-2 text-[8px] font-bold text-primary px-2 py-1 bg-primary/5 rounded-full w-fit">
                 <ShieldCheck size={10} />
                 ID: MHD-4521
              </div>
           </div>

           {/* Vitals Row */}
           <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                 <Heart size={14} className="text-red-500 mb-2" />
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Heart Rate</p>
                 <p className="text-lg font-display font-bold text-slate-900">72 <span className="text-[10px] text-slate-400">BPM</span></p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                 <Activity size={14} className="text-sky-500 mb-2" />
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">BP</p>
                 <p className="text-lg font-display font-bold text-slate-900">128/84</p>
              </div>
           </div>

           {/* Health Stats */}
           <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Upcoming Care</p>
              <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-lg space-y-3">
                 <div className="flex justify-between items-start">
                    <Calendar size={18} />
                    <span className="text-[8px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">Tomorrow, 10:00 AM</span>
                 </div>
                 <div>
                    <p className="text-xs font-bold leading-tight">Follow-up: Hypertension</p>
                    <p className="text-[10px] text-indigo-200">City Hospital · Dr. Mehta</p>
                 </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                       <Pill size={18} />
                    </div>
                    <div>
                       <p className="font-bold text-[11px] text-slate-900">Metformin 500mg</p>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Morn • Eve</p>
                    </div>
                 </div>
                 <ChevronRight size={14} className="text-slate-300" />
              </div>
           </div>
        </div>

        {/* Bottom Nav Mockup */}
        <div className="h-16 bg-white border-t border-slate-100 flex items-center justify-around px-2 relative z-10">
           <div className="flex flex-col items-center gap-1 text-primary">
              <Activity size={18} />
              <div className="w-1 h-1 rounded-full bg-primary" />
           </div>
           <div className="flex flex-col items-center gap-1 text-slate-300">
              <Calendar size={18} />
           </div>
           <div className="flex flex-col items-center gap-1 text-slate-300">
              <div className="w-10 h-10 rounded-full bg-primary shadow-lg flex items-center justify-center text-white -mt-10">
                 <Menu size={20} />
              </div>
           </div>
           <div className="flex flex-col items-center gap-1 text-slate-300">
              <Activity size={18} />
           </div>
           <div className="flex flex-col items-center gap-1 text-slate-300">
              <ShieldCheck size={18} />
           </div>
        </div>

        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-200 rounded-full" />
      </div>
    </div>
  );
};

export default MobilePreview;
