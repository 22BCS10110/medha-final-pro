import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Search, CheckCircle, Quote, Star, ArrowRight } from 'lucide-react';

import { cn } from '../../lib/utils';

const HowItWorks = () => {
  const steps = [
    {
      title: "Create Account",
      desc: "Register as a patient, doctor, or clinic administrator in under 60 seconds.",
      icon: UserPlus,
      step: 1
    },
    {
      title: "Data Integration",
      desc: "Connect your existing health data or start fresh with our smart intake system.",
      icon: Search,
      step: 2
    },
    {
      title: "Smart Insights",
      desc: "Receive real-time AI guidance and verified healthcare recommendations.",
      icon: CheckCircle,
      step: 3
    }
  ];

  return (
    <div className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-secondary mb-4">The Process</h2>
          <h3 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6">Simple 3-Step Integration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-[2px] bg-slate-100 z-0" />
          
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-white border-2 border-slate-100 flex items-center justify-center mb-8 shadow-sm group-hover:border-primary/20 transition-all relative">
                <step.icon className="text-primary" size={32} />
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-4 ring-white">
                  {step.step}
                </div>
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h4>
              <p className="text-slate-600 leading-relaxed max-w-[280px]">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Testimonials = () => {
  const testimonials = [
    {
       name: "Dr. Sarah Johnson",
       role: "Chief of Neurology",
       body: "Medhā has transformed how we handle diagnostic workflows. The AI insights are consistently accurate and medically sound.",
       avatar: "SJ"
    },
    {
       name: "Rajesh Mehta",
       role: "Patient Success",
       body: "Finally, a platform that gives me clear, understandable answers about my health status without the medical jargon.",
       avatar: "RM"
    }
  ];

  return (
    <div className="py-24 bg-slate-50 relative overflow-hidden">
       <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-12 items-center">
             <div className="lg:col-span-1">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-4">Patient & Doctor Trust</h2>
                <h3 className="text-4xl font-display font-bold text-slate-900 mb-6">Voices of Intelligence</h3>
                <p className="text-slate-600 mb-8">Join thousands of practitioners and patients who are already using Medhā to better their health journeys.</p>
                <div className="flex items-center gap-2">
                   {[1, 2, 3, 4, 5].map(i => <Star key={i} size={20} className="fill-gold text-gold" />)}
                   <span className="ml-2 font-bold text-slate-900 text-sm">4.9/5 Rating</span>
                </div>
             </div>

             <div className="lg:col-span-2 grid md:grid-cols-2 gap-8">
                {testimonials.map((t, i) => (
                   <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm relative"
                   >
                      <Quote className="absolute top-6 right-8 text-primary/10" size={48} />
                      <p className="text-slate-700 italic mb-8 relative z-10 text-lg leading-relaxed">"{t.body}"</p>
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-primary">{t.avatar}</div>
                         <div>
                            <p className="font-bold text-slate-900">{t.name}</p>
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">{t.role}</p>
                         </div>
                      </div>
                   </motion.div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
};

const FinalCTA = () => {
  return (
    <div className="py-24 px-6">
       <div className="max-w-5xl mx-auto rounded-[3.5rem] bg-slate-900 relative overflow-hidden p-12 md:p-24 text-center">
          {/* Abstract Visuals */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />
          
          <div className="relative z-10">
             <h3 className="text-4xl md:text-6xl font-display font-bold text-white mb-8">Ready to evolve your <br /> Healthcare Experience?</h3>
             <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
               Join the Medhā ecosystem today. Start your journey with the world’s most advanced health intelligence platform.
             </p>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button className="bg-primary text-white px-10 py-4 rounded-2xl font-bold text-lg hover:scale-[1.02] transition-transform">
                   Join as a Practitioner
                </button>
                <button className="text-white font-bold text-lg flex items-center gap-2 group underline underline-offset-8">
                   Download Native App
                   <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

export { HowItWorks, Testimonials, FinalCTA };
