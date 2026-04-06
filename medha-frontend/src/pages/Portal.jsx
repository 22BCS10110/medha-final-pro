import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { motion } from 'framer-motion';
import { ShieldCheck, Stethoscope, User, ArrowRight, Activity, BrainCircuit, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import LoginModal from '../components/layout/LoginModal';

const Portal = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('patient');

  const openLogin = (role) => {
    setSelectedRole(role);
    setIsLoginOpen(true);
  };

  const roles = [
    {
      id: 'admin',
      title: 'Hospital Admin',
      desc: 'Manage medical staff, analyze hospital revenue, and configure facility settings.',
      icon: ShieldCheck,
      color: 'bg-primary/10 text-primary',
      accent: 'border-primary/20',
      tag: 'Healthcare Operations'
    },
    {
      id: 'doctor',
      title: 'Medical Practitioner',
      desc: 'Access patient records, approved AI clinical insights, and manage your daily schedule.',
      icon: Stethoscope,
      color: 'bg-secondary/10 text-secondary',
      accent: 'border-secondary/20',
      tag: 'Clinical Intelligence'
    }
  ];


  return (
    <Layout>
      <div className="pt-32 pb-24 px-6 min-h-screen bg-white relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-slate-50 to-white pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 mb-6"
             >
                <Lock size={14} className="text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Secure Gateway</span>
             </motion.div>
             <h1 className="text-5xl md:text-6xl font-display font-bold text-slate-900 mb-6">Medhā Unified Portal</h1>
             <p className="text-lg text-slate-600 max-w-2xl mx-auto">
               Welcome to the intelligence layer of your healthcare journey. 
               Select your role to access your personalized workspace.
             </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
             {roles.map((role, i) => (

                <motion.div 
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => openLogin(role.id)}
                  className={cn(
                    "relative p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group",
                    role.id === 'admin' ? "hover:border-primary/20" : role.id === 'doctor' ? "hover:border-secondary/20" : "hover:border-emerald-200"
                  )}
                >
                   <div className={cn("w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner", role.color)}>
                      <role.icon size={32} />
                   </div>
                   
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{role.tag}</p>
                   <h3 className="text-2xl font-bold text-slate-900 mb-4">{role.title}</h3>
                   <p className="text-slate-500 text-sm leading-relaxed mb-10">{role.desc}</p>
                   
                   <div className="flex items-center gap-2 text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
                      Enter Portal
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                   </div>

                   {/* Background Decoration */}
                   <div className="absolute bottom-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                      <role.icon size={120} />
                   </div>
                </motion.div>
             ))}
             
             {/* Patient Mobile CTA Card */}
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="md:col-span-2 p-8 rounded-[3rem] bg-emerald-50 border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-8 mt-4 group hover:shadow-xl transition-all"
             >
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <User size={32} />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-slate-900">Are you a Patient?</h3>
                      <p className="text-sm text-slate-600">Please download the **Medhā Native App** for the best experience.</p>
                   </div>
                </div>
                 <Link to="/patient-portal" className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2">
                    <User size={18} />
                    Patient Login / Register
                 </Link>
             </motion.div>
          </div>


          <div className="mt-24 p-12 rounded-[3.5rem] bg-slate-900 text-white relative overflow-hidden text-center">
             <div className="relative z-10">
                <h4 className="text-2xl font-bold mb-4">Enterprise Healthcare Network</h4>
                <p className="text-slate-400 max-w-xl mx-auto mb-8">
                   Connecting 250+ clinics across India with a unified medical data layer. 
                   Our platform is fully HIPAA and ABHA compliant.
                </p>
                <div className="flex justify-center gap-12 opacity-40">
                   <div className="flex items-center gap-2"><Activity size={20} /> <span className="text-xs font-bold uppercase tracking-widest">Real-time</span></div>
                   <div className="flex items-center gap-2"><BrainCircuit size={20} /> <span className="text-xs font-bold uppercase tracking-widest">Neural Analysis</span></div>
                   <div className="flex items-center gap-2"><ShieldCheck size={20} /> <span className="text-xs font-bold uppercase tracking-widest">End-to-End</span></div>
                </div>
             </div>
             {/* Gradient glow */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
          </div>
        </div>
      </div>

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        initialRole={selectedRole}
      />
    </Layout>
  );
};

export default Portal;
