import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Download, ShieldCheck } from 'lucide-react';
import MobilePreview from './MobilePreview';

const MobilePreviewModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 z-50 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X size={24} />
            </button>

            {/* Left Side - Mobile Preview */}
            <div className="w-full md:w-1/2 bg-slate-50 p-12 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
               <div className="relative group">
                  <MobilePreview />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem] pointer-events-none" />
               </div>
            </div>

            {/* Right Side - App Details */}
            <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-6 w-fit">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Native Healthcare App</span>
               </div>
               
               <h3 className="text-4xl font-display font-bold text-slate-900 mb-6">Experience the future of <span className="text-primary italic">Personal Health.</span></h3>
               <p className="text-slate-600 mb-10 leading-relaxed">
                  The Medha Native App gives patients direct access to their clinical data, 
                  AI-driven insights, and seamless hospital integration in a high-performance mobile environment.
               </p>

               <div className="space-y-6 mb-12">
                  {[
                    "Real-time vitals monitoring & alerts",
                    "Digital ABHA card & instant check-ins",
                    "Direct prescription downloads",
                    "AI clinical analysis from your doctor"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <ShieldCheck size={12} />
                       </div>
                       <span className="text-sm font-bold text-slate-700">{feature}</span>
                    </div>
                  ))}
               </div>

               <div className="flex flex-col sm:flex-row gap-4">
                  <button className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                     <Smartphone size={20} />
                     App Store
                  </button>
                  <button className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                     <Download size={20} />
                     Play Store
                  </button>
               </div>

               <p className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Join 10,000+ patients tracking their health on Medha.
               </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MobilePreviewModal;
