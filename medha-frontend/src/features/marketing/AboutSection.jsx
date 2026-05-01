import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, WifiOff, ShieldCheck } from 'lucide-react';

const AboutSection = () => {
  const visionPoints = [
    { 
      title: "Smarter Clinical Decisions", 
      desc: "Empowering doctors with real-time AI insights that integrate directly into the workflow.", 
      icon: BrainCircuit,
      color: "text-primary bg-primary/10"
    },
    { 
      title: "Offline-First Healthcare Systems", 
      desc: "Uninterrupted patient care regardless of internet connectivity, designed for global resilience.", 
      icon: WifiOff,
      color: "text-secondary bg-secondary/10"
    },
    { 
      title: "Secure Patient Intelligence", 
      desc: "Bank-level encryption combining local-first storage with ABHA and HIPAA compliance.", 
      icon: ShieldCheck,
      color: "text-accent bg-accent/10"
    },
  ];

  return (
    <section id="about" className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-20">
           <motion.h1 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-5xl md:text-7xl font-display font-bold text-slate-900 mb-8 tracking-tight"
           >
             About <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-shimmer italic">Medha Health</span>
           </motion.h1>
           
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.1 }}
             className="max-w-3xl mx-auto"
           >
             <p className="text-xl md:text-2xl text-slate-600 leading-relaxed font-medium mb-4">
               AI-powered healthcare intelligence built for the modern clinical era.
             </p>
             <p className="text-lg text-slate-500 leading-relaxed">
               Our mission is simple: we focus on saving lives, not just managing data. We build systems that remove administrative burdens from doctors so they can focus on what they do best—caring for patients.
             </p>
           </motion.div>
        </div>

        {/* Core Vision Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-3 gap-8"
        >
           {visionPoints.map((v, i) => (
              <div key={i} className="p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group text-center md:text-left">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0 group-hover:scale-110 transition-transform ${v.color}`}>
                    <v.icon size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-4">{v.title}</h3>
                 <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
           ))}
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
