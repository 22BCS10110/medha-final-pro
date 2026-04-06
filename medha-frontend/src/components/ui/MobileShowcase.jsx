import React from 'react';
import { motion } from 'framer-motion';
import MobilePreview from './MobilePreview';
import { Apple, Play, ArrowRight, ShieldCheck, Zap, Heart } from 'lucide-react';


const MobileShowcase = ({ onOpenMobilePreview }) => {
  return (
    <div id="mobile-showcase" className="py-24 bg-slate-50 relative overflow-hidden">

       {/* Background accent */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-primary/5 blur-[120px] pointer-events-none" />
       
       <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1 flex justify-center lg:justify-start"
          >
             <div className="relative">
                <MobilePreview />
                {/* Floating tags around the phone */}
                <motion.div 
                   animate={{ y: [0, -10, 0] }}
                   transition={{ duration: 4, repeat: Infinity }}
                   className="absolute -top-10 -right-10 p-4 rounded-2xl bg-white shadow-xl border border-slate-100 flex items-center gap-3"
                >
                   <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                      <ShieldCheck size={18} />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ABHA Integrated</span>
                </motion.div>

                <motion.div 
                   animate={{ y: [0, 10, 0] }}
                   transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                   className="absolute bottom-20 -left-10 p-4 rounded-2xl bg-white shadow-xl border border-slate-100 flex items-center gap-3"
                >
                   <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                      <Heart size={18} />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Vitals</span>
                </motion.div>
             </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
             <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 mb-4">Patient Experience</h2>
             <h3 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-8 leading-tight">Your Health, <br /> In Your Pocket.</h3>
             <p className="text-slate-600 text-lg mb-10 leading-relaxed max-w-lg">
                While doctors and admins manage operations via the web, patients get a dedicated, high-performance native app to monitor health, manage prescriptions, and receive AI-driven guidance 24/7.
             </p>

             <div className="space-y-6 mb-12">
                {[
                   { title: "Real-time Sync", desc: "Instant updates from your hospital dashboard.", icon: Zap },
                   { title: "Universal Health ID", desc: "Digital ABHA card for seamless hospital check-ins.", icon: ShieldCheck },
                   { title: "Encrypted Privacy", desc: "Your medical data stays private and secure.", icon: Heart },
                ].map((item, i) => (
                   <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-primary shrink-0">
                         <item.icon size={20} />
                      </div>
                      <div>
                         <h4 className="font-bold text-slate-900">{item.title}</h4>
                         <p className="text-sm text-slate-500">{item.desc}</p>
                      </div>
                   </div>
                ))}
             </div>

             <div className="flex flex-wrap gap-4">
                <button 
                  onClick={onOpenMobilePreview}
                  className="flex items-center gap-3 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                   <Apple size={20} />
                   iOS App
                </button>
                <button 
                  onClick={onOpenMobilePreview}
                  className="flex items-center gap-3 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                   <Play size={20} />
                   Play Store
                </button>
             </div>

          </motion.div>
       </div>
    </div>
  );
};

export default MobileShowcase;
