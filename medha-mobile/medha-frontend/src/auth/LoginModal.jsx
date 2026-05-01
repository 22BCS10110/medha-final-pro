import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Logo from "../components/ui/Logo";
import { X, ShieldCheck, Stethoscope, ArrowRight, Lock, User } from "lucide-react";
import { cn } from "../utils/cn";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginModal({ isOpen, onClose, initialRole }) {
  const [subrole, setSubrole] = useState(initialRole === 'doctor' ? 'doctor' : 'admin');
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialRole) {
      setSubrole(initialRole === 'hospital' ? 'admin' : initialRole);
    }
  }, [initialRole]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const userData = await login(loginId, password);
      onClose();
      if (userData.role === 'super_admin' || userData.role === 'hospital_admin') navigate("/admin");
      else if (userData.role === 'doctor') navigate("/doctor");
      else if (userData.role === 'patient') navigate("/patient");
      else navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1.5 premium-gradient" />

            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              <X size={20} />
            </button>

            <div className="p-10 md:p-12">
              <div className="flex flex-col items-center text-center mb-10">
                <Logo className="mb-6 scale-110" showText={false} />
                <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Welcome Back</h2>
                <p className="text-slate-500 font-medium">Sign in to access the Medha Health Intelligance portal.</p>
              </div>



              {/* Role Switcher */}
              <div className="flex p-1.5 bg-slate-50 rounded-2xl mb-8 border border-slate-100">
                {[
                  { id: 'admin', label: 'Admin', icon: ShieldCheck },
                  { id: 'doctor', label: 'Doctor', icon: Stethoscope },
                ].map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSubrole(role.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] text-sm font-bold transition-all",
                      subrole === role.id
                        ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <role.icon size={16} />
                    {role.label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Username</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder={subrole === 'admin' ? "admin_a" : "doctor_a_1"}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Password</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full premium-gradient text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
                >
                  {submitting ? "Signing in..." : `Sign In as ${subrole === 'admin' ? 'Admin' : 'Doctor'}`}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-slate-500 font-medium border-t border-slate-100 pt-8">
                <p>
                  Need a practitioner account? <button className="text-primary font-bold hover:underline">Contact Sales</button> <br />
                  Are you a Patient? <button className="text-emerald-600 font-bold hover:underline">Download Mobile App</button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
