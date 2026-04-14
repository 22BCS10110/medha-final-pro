import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Activity, ShieldCheck, HeartPulse, Smartphone } from 'lucide-react';
import { cn } from '../../utils/cn';

const Hero = ({ onOpenMobilePreview }) => {
  return (
    <section className="relative min-h-[95vh] flex flex-col items-center justify-center pt-32 pb-20 px-6 overflow-hidden bg-white">
      {/* Premium Background Decor */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(0,102,255,0.05)_0%,transparent_70%)] pointer-events-none" />
      
      {/* Dynamic Background Shapes */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: 2 }}
        className="absolute bottom-1/4 -right-40 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[150px] pointer-events-none" 
      />

      <div className="max-w-7xl mx-auto w-full relative z-10 text-center">
        {/* Tagline */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-50 border border-slate-200 mb-10 shadow-sm"
        >
          <Sparkles className="text-primary" size={14} />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
            Empowering the Future of Care
          </span>
        </motion.div>

        {/* Emotional, Value-Driven Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl md:text-8xl lg:text-9xl font-display font-bold text-slate-900 leading-[0.95] mb-10 max-w-6xl mx-auto tracking-tight"
        >
          Intelligence that <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-shimmer italic">
            Saves Lives.
          </span>
        </motion.h1>

        {/* Clear Subheading */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-2xl text-slate-500 max-w-3xl mx-auto mb-16 leading-relaxed font-medium"
        >
          Medhā harmonizes clinical expertise with advanced AI to deliver 
          high-fidelity health insights. Built for hospitals that prioritize 
          outcome over output.
        </motion.p>

        {/* High-Conversion CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center justify-center mb-24 w-full"
        >
          <button 
            onClick={onOpenMobilePreview}
            className="w-full sm:w-auto px-10 py-5 rounded-[2rem] font-bold text-xl text-slate-900 border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-50 hover:shadow-lg hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
          >
            <Smartphone size={22} />
            Patient App Preview
          </button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-10 md:gap-20 py-12 border-y border-slate-100 max-w-5xl mx-auto"
        >
          {[
            { label: 'Clinics Partnered', value: '250+', icon: Activity },
            { label: 'Uptime Guarantee', value: '99.9%', icon: ShieldCheck },
            { label: 'Real-time Insights', value: '1M+', icon: Sparkles },
            { label: 'Care Speed', value: '+40%', icon: HeartPulse },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-1 group">
              <span className="text-3xl font-display font-bold text-slate-900 group-hover:text-primary transition-colors">{stat.value}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
