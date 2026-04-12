import React from 'react';
import Layout from '../../components/layout/Layout';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageCircle, HelpCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const Contact = () => {
  return (
    <Layout>
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="space-y-12"
             >
                <div>
                   <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 mb-6">Let's <span className="text-primary italic">Connect.</span></h1>
                   <p className="text-lg text-slate-600 max-w-md leading-relaxed">
                     Have questions about our platform or want to 
                     schedule a custom demonstration? Our team is here to help.
                   </p>
                </div>

                <div className="space-y-8">
                   {[
                     { label: "Email Us", val: "partnerships@medha.ai", icon: Mail },
                     { label: "Phone Support", val: "+91 (80) 4567 8900", icon: Phone },
                     { label: "HQ Address", val: "Indiranagar, Bengaluru, KA 560038", icon: MapPin },
                   ].map((item, i) => (
                     <div key={i} className="flex gap-5 group items-center p-4 rounded-3xl bg-white border border-slate-100 hover:border-primary/20 transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                           <item.icon size={28} />
                        </div>
                        <div>
                           <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">{item.label}</p>
                           <p className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">{item.val}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </motion.div>

             <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="relative"
             >
                <div className="absolute inset-0 bg-primary/5 rounded-[3rem] -rotate-3 scale-105 pointer-events-none" />
                <div className="relative bg-white p-10 md:p-12 rounded-[3rem] border border-slate-200 shadow-xl">
                   <h3 className="text-2xl font-bold text-slate-900 mb-8">Send a Message</h3>
                   <form className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Full Name</label>
                            <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-primary/10 transition-all outline-none" placeholder="John Doe" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Work Email</label>
                            <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-primary/10 transition-all outline-none" placeholder="john@hospital.com" />
                         </div>
                      </div>
                      
                      <div className="space-y-2">
                         <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Message</label>
                         <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 h-32 focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none" placeholder="How can we help your facility?"></textarea>
                      </div>

                      <button className="w-full premium-gradient text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 group shadow-lg shadow-primary/20">
                         Send Message
                         <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </button>
                   </form>
                </div>
             </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
