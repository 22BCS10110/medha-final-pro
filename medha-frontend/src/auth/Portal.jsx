import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Monitor, Apple, WifiOff, CreditCard, Download, 
  BrainCircuit, Database, Search, Activity
} from 'lucide-react';
import { cn } from '../utils/cn';
import MobileShowcase from '../components/ui/MobileShowcase';
import { HowItWorks } from '../components/ui/HowItWorks';
import MobilePreviewModal from '../components/ui/MobilePreviewModal';

const Portal = () => {
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

  const features = [
    {
      icon: WifiOff,
      title: 'Offline First System',
      desc: 'Ensure uninterrupted care. Works seamlessly without internet and syncs automatically when connectivity is restored.',
      color: 'text-primary bg-primary/10',
    },
    {
      icon: CreditCard,
      title: 'Smart NFC Health Cards',
      desc: 'Instant tap-to-scan identity verification. Retrieve complete patient health records securely via NFC technology.',
      color: 'text-secondary bg-secondary/10',
    },
    {
      icon: BrainCircuit,
      title: 'AI Clinical Insights',
      desc: 'Smart diagnostic assistance, automated charting, and treatment path recommendations powered by deep learning.',
      color: 'text-accent bg-accent/10',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Local Storage',
      desc: 'Military-grade AES-256 encryption. Fully HIPAA and ABHA compliant architecture with local-first secure storage.',
      color: 'text-primary bg-primary/10',
    },
    {
      icon: Search,
      title: 'Fast Patient Lookup',
      desc: 'Instantly search and pull up patient details, historical data, and longitudinal vitals with zero lag.',
      color: 'text-secondary bg-secondary/10',
    },
    {
      icon: Activity,
      title: 'Hospital Dashboard',
      desc: 'Unified interface for administrators and doctors to manage operations, patient flow, and clinical workflows.',
      color: 'text-accent bg-accent/10',
    }
  ];

  return (
    <Layout>
      {/* 1. Desktop App Hero */}
      <section className="relative min-h-[95vh] flex flex-col items-center justify-center pt-32 pb-20 px-6 overflow-hidden bg-white font-sans">
        {/* Premium Light Background Decor */}
        <div className="absolute top-0 inset-x-0 h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(0,102,255,0.05)_0%,transparent_70%)] pointer-events-none" />
        
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" 
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: 2 }}
          className="absolute bottom-1/4 -right-40 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[150px] pointer-events-none" 
        />

        <div className="max-w-7xl mx-auto w-full relative z-10 flex-grow flex flex-col items-center text-center">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-50 border border-slate-200 mb-10 shadow-sm"
          >
            <Monitor size={14} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
              Desktop Application
            </span>
          </motion.div>

          {/* Hero Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-slate-900 leading-[0.95] tracking-tight mb-8 max-w-6xl mx-auto"
          >
            Download{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-shimmer italic">
              Medha
            </span>
            <br />
            Hospital Desktop App
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-2xl text-slate-500 max-w-3xl mx-auto mb-16 leading-relaxed font-medium"
          >
            Install the Medha Desktop System for a lightning-fast, offline-capable experience. 
            Securely manage hospital operations and unlock the power of AI right on your local machine.
          </motion.p>

          {/* Download Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full px-4 mb-24"
          >
            {/* Windows Primary Button */}
            <a
              href="#"
              className="group relative w-full sm:w-auto bg-primary text-white px-10 py-5 rounded-xl font-bold text-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              <Download size={22} className="group-hover:-translate-y-0.5 transition-transform" />
              <span>Download for Windows</span>
            </a>

            {/* macOS Secondary Button */}
            <a
              href="#"
              className="group w-full sm:w-auto px-10 py-5 rounded-xl font-bold text-xl text-slate-900 border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-50 hover:shadow-lg hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              <Apple size={22} className="group-hover:-translate-y-0.5 transition-transform" />
              <span>Download for macOS</span>
            </a>
          </motion.div>
        </div>
      </section>

      {/* 2. Full Experience Section (Mobile Showcase / Patient Mgmt) */}
      <MobileShowcase onOpenMobilePreview={() => setIsMobilePreviewOpen(true)} />

      {/* 3. Detailed Features Grid */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-4">Everything You Need</h2>
          <h3 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-16 leading-tight">
            Designed for Modern Healthcare
          </h3>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl text-left mx-auto"
          >
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="group p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform duration-500 group-hover:scale-110", feature.color)}>
                  <feature.icon size={26} />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
                  {feature.title}
                </h3>
                
                <p className="text-slate-500 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <HowItWorks />

      <MobilePreviewModal
        isOpen={isMobilePreviewOpen} 
        onClose={() => setIsMobilePreviewOpen(false)} 
      />
    </Layout>
  );
};

export default Portal;
