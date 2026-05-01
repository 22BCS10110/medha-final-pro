import React from 'react';
import { cn } from '../../utils/cn';
import medhaLogo from '../../assets/medha_logo.jpeg';

const Logo = ({ className, showText = true, dark = false }) => {
  return (
    <div className={cn("flex items-center gap-2 sm:gap-2.5 group cursor-pointer", className)}>
      <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
        {/* Logo Icon */}
        <img
          src={medhaLogo}
          alt="Medha Health Intelligance Logo"
          className={cn(
            "absolute inset-0 w-full h-full object-contain rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 z-10",
            dark ? "shadow-none" : "shadow-[0_4px_12px_rgba(0,102,255,0.2)]"
          )}
        />

        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn(
            "text-sm sm:text-base md:text-lg font-display font-bold tracking-tight leading-tight",
            dark ? "text-white" : "text-slate-900"
          )}>
            Medha<span className="text-primary ml-0.5">•</span>
          </span>
          <span className={cn(
            "text-[8px] sm:text-[10px] uppercase tracking-[0.18em] sm:tracking-[0.2em] font-semibold leading-tight whitespace-nowrap",
            dark ? "text-slate-300" : "text-slate-500"
          )}>
            Health Intelligence
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;

