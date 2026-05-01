import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket } from 'lucide-react';

const ComingSoonModal = ({ open, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        // Backdrop
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[2000] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm"
        >
          {/* Card — stop propagation so clicking inside doesn't close */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl p-10 text-center"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-6">
              <Rocket size={28} className="text-primary" />
            </div>

            {/* Text */}
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">
              Coming Soon 🚀
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              This feature is under development and will be available soon.
            </p>

            {/* Dismiss button */}
            <button
              onClick={onClose}
              className="mt-8 w-full py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ComingSoonModal;
