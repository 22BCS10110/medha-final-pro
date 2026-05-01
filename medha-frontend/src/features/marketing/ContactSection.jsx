import React, { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { cn } from '../../utils/cn';

// ── EmailJS config — replace with your real IDs from emailjs.com ──
const EMAILJS_SERVICE_ID  = 'service_vtxhw8r';
const EMAILJS_TEMPLATE_ID = 'template_az9e10j';
const EMAILJS_PUBLIC_KEY  = 'e3Px1YA3HsyTGULjn';

const ContactSection = () => {
  const formRef = useRef(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await emailjs.sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        formRef.current,
        EMAILJS_PUBLIC_KEY
      );
      alert('Message sent successfully!');
      formRef.current.reset();
    } catch {
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
           <motion.div
             initial={{ opacity: 0, x: -20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
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
                   { label: "Email Us", val: "info.medhahealth.in", icon: Mail },
                   { label: "Phone Support", val: "+91 7087846032", icon: Phone },
                   { label: "HQ Address", val: "Sirsa, Haryana, 125055", icon: MapPin },
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
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.2 }}
             className="relative"
           >
              <div className="absolute inset-0 bg-primary/5 rounded-[3rem] -rotate-3 scale-105 pointer-events-none" />
              <div className="relative bg-white p-10 md:p-12 rounded-[3rem] border border-slate-200 shadow-xl">
                 <h3 className="text-2xl font-bold text-slate-900 mb-8">Send a Message</h3>
                 <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Full Name</label>
                          <input type="text" name="name" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-primary/10 transition-all outline-none" placeholder="John Doe" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Work Email</label>
                          <input type="email" name="email" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-primary/10 transition-all outline-none" placeholder="john@hospital.com" />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Message</label>
                       <textarea name="message" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 h-32 focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none" placeholder="How can we help your facility?"></textarea>
                    </div>

                    <button type="submit" disabled={sending} className="w-full premium-gradient text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 group shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed">
                       {sending ? 'Sending...' : 'Send Message'}
                       {!sending && <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    </button>
                 </form>
              </div>
           </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
