import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap, Search, BrainCircuit, Database, Star, ShieldCheck } from 'lucide-react';

import { cn } from '../../lib/utils';

const Features = () => {
  const features = [
    {
      title: "AI Guidance",
      desc: "Smart diagnostic assistance and treatment path recommendations powered by deep learning.",
      icon: BrainCircuit,
      color: "bg-primary/10 text-primary"
    },
    {
      title: "Verified Data",
      desc: "Every insight is cross-referenced with clinical databases and medical publications.",
      icon: Database,
      color: "bg-secondary/10 text-secondary"
    },
    {
      title: "Instant Insights",
      desc: "Get critical health indicators and administrative summaries in real-time.",
      icon: Zap,
      color: "bg-accent/10 text-accent"
    },
    {
      title: "Secure & Compliant",
      desc: "Bank-level encryption and full HIPAA/GDPR compliance for all medical records.",
      icon: ShieldCheck,
      color: "bg-slate-100 text-slate-900"
    }
  ];

  return (
    <div id="features" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-4">Core Capabilities</h2>
          <h3 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6">Built for Intelligence</h3>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Our platform integrates the latest in AI technology with clinical best practices 
            to provide a seamless experience for healthcare professionals and patients.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-3xl border border-slate-100 bg-white hover:border-primary/20 hover:shadow-xl transition-all group"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", feature.color)}>
                <feature.icon size={28} />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProblemSolution = () => {
  return (
    <div id="solutions" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-secondary mb-4">The Challenge</h2>
              <h3 className="text-4xl md:text-5xl font-display font-bold text-slate-900 leading-tight">
                Healthcare is complex. <br />
                We make it <span className="text-primary italic">simple.</span>
              </h3>
            </div>
            
            <div className="space-y-6">
              {[
                { title: "Fragmented Data", desc: "Patient records are often scattered across systems with no unified view.", icon: ShieldAlert },
                { title: "Limited Insights", desc: "Practitioners spend too much time on admin instead of clinical decisions.", icon: Search },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
              See How It Works
            </button>
          </motion.div>

          {/* Solution Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
             <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/10 rounded-[3rem] p-8 relative overflow-hidden">
                <div className="absolute inset-4 bg-white rounded-[2rem] shadow-2xl p-8 flex flex-col justify-center gap-6">
                   <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white">
                         <Star size={24} fill="currentColor" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-900">Medhā Intelligence Report</p>
                         <p className="text-[10px] text-slate-400 capitalize">Analysis Complete • 0.2s</p>
                      </div>
                   </div>
                   
                   <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-4 bg-slate-50 rounded-full w-full overflow-hidden relative">
                           <motion.div 
                              initial={{ width: 0 }}
                              whileInView={{ width: `${Math.random() * 60 + 40}%` }}
                              className="h-full bg-primary/20"
                           />
                        </div>
                      ))}
                   </div>

                   <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                      <p className="text-xs font-semibold text-primary mb-1 italic">AI Recommendation:</p>
                      <p className="text-sm text-slate-700 font-medium">Prioritize cardiology follow-up based on longitudinal vitals trend.</p>
                   </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute top-10 right-10 w-24 h-24 bg-accent/30 rounded-full blur-2xl animate-pulse" />
                <div className="absolute bottom-10 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
             </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export { Features, ProblemSolution };
