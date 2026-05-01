import React from 'react';
import { cn } from '../../utils/cn';

const Logo = ({ className, showText = true, dark = false }) => {
  return (
    <div className={cn("flex items-center gap-2.5 group cursor-pointer", className)}>
      <div className="relative w-10 h-10 flex items-center justify-center">
        {/* Logo Icon */}
        <div className={cn(
          "absolute inset-0 rounded-xl bg-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-6",
          dark ? "bg-slate-900" : "bg-primary shadow-[0_4px_12px_rgba(0,102,255,0.2)]"
        )}>
           <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
        </div>
        
        {/* Inner Symbol - Abstract M + Plus */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-6 h-6 z-10 transition-transform duration-300 group-hover:scale-90"
        >
          <path d="M4 18V6l8 12 8-12v12" className="opacity-90" />
          <path d="M12 4v4M10 6h4" className="stroke-secondary text-secondary" strokeWidth="3" />
        </svg>

        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {showText && (
        <div className="flex flex-col -gap-1">
          <span className={cn(
            "text-xl font-display font-bold tracking-tight leading-none",
            dark ? "text-white" : "text-slate-900"
          )}>
            Medha<span className="text-primary tracking-tighter cursor-default ml-0.5">•</span>
          </span>
          <span className={cn(
            "text-[10px] uppercase tracking-[0.2em] font-semibold opacity-60",
            dark ? "text-slate-400" : "text-slate-500"
          )}>
            Health Intelligence
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
