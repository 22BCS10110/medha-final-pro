import React from 'react';
import Layout from '../components/layout/Layout';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Zap, Shield, Crown } from 'lucide-react';
import { cn } from '../lib/utils';

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "₹1.2L",
      desc: "Perfect for small clinics and individual practitioners.",
      features: ["Admin Portal", "NFC Card Issuance", "Basic AI Summaries", "Up to 50 Patient/mo", "Email Support"],
      icon: Zap,
      featured: false
    },
    {
      name: "Professional",
      price: "₹3.6L",
      desc: "Our most popular plan for mid-sized healthcare facilities.",
      features: ["All Starter Features", "Unlimited Registrations", "Full Clinical AI Insights", "ABHA Integration", "Priority 24/7 Support"],
      icon: Shield,
      featured: true,
      badge: "Most Popular"
    },
    {
      name: "Enterprise",
      price: "Custom",
      desc: "Tailored solutions for large hospital chains and networks.",
      features: ["Custom EHR Integration", "Dedicated Account Manager", "White-label Portal", "Global Compliance Pack", "Advanced Analytics"],
      icon: Crown,
      featured: false
    }
  ];

  return (
    <Layout>
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
             <h1 className="text-5xl md:text-6xl font-display font-bold text-slate-900 mb-6">Investment in <span className="text-secondary">Health</span></h1>
             <p className="text-lg text-slate-600 max-w-2xl mx-auto">
               Transparent pricing designed to scale with your organization. 
               Join the future of healthcare intelligence today.
             </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-20">
             {plans.map((plan, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "relative p-10 rounded-[3rem] border transition-all duration-500",
                    plan.featured 
                      ? "bg-slate-900 border-slate-900 text-white shadow-2xl scale-105 z-10" 
                      : "bg-white border-slate-100 text-slate-900 hover:border-primary/20"
                  )}
                >
                   {plan.badge && (
                     <div className="absolute top-0 right-12 -translate-y-1/2 bg-primary text-white text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded-full shadow-lg">
                        {plan.badge}
                     </div>
                   )}

                   <div className={cn(
                     "w-14 h-14 rounded-2xl flex items-center justify-center mb-8",
                     plan.featured ? "bg-white/10 text-white" : "bg-primary/5 text-primary"
                   )}>
                      <plan.icon size={28} />
                   </div>

                   <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                   <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-display font-bold">{plan.price}</span>
                      <span className={cn("text-sm", plan.featured ? "text-slate-400" : "text-slate-500")}>/year</span>
                   </div>
                   
                   <p className={cn("text-sm leading-relaxed mb-8", plan.featured ? "text-slate-400" : "text-slate-500")}>
                      {plan.desc}
                   </p>

                   <ul className="space-y-4 mb-10">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-3 text-sm font-medium">
                           <div className={cn("shrink-0 w-5 h-5 rounded-full flex items-center justify-center", plan.featured ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary")}>
                              <Check size={12} strokeWidth={3} />
                           </div>
                           {f}
                        </li>
                      ))}
                   </ul>

                   <button className={cn(
                     "w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 group",
                     plan.featured 
                      ? "bg-white text-slate-900 hover:bg-slate-100" 
                      : "bg-slate-900 text-white hover:bg-slate-800"
                   )}>
                      Get Started
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </motion.div>
             ))}
          </div>

          <div className="p-12 rounded-[3.5rem] bg-primary/5 border border-primary/10 text-center">
             <h4 className="text-2xl font-display font-bold text-slate-900 mb-4">Need a custom plan?</h4>
             <p className="text-slate-600 mb-8 max-w-xl mx-auto">We offer bespoke configurations for government networks and multi-specialty regional hospital groups.</p>
             <button className="text-primary font-bold inline-flex items-center gap-2 text-lg hover:underline group">
                Contact Enterprise Sales
                <ArrowRight size={20} />
             </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Pricing;