import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, HeartPulse, Shield, Globe } from 'lucide-react';
import { patientAuthAPI } from '../services/api';

const PatientPortal = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    date_of_birth: '',
    gender: 'M',
    blood_group: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const response = await patientAuthAPI.login(formData.email, formData.password);
        if (response.success) {
          localStorage.setItem('patient', JSON.stringify(response.patient));
          setSuccess('Login successful! Redirecting...');
          setTimeout(() => {
            window.location.href = '/patient';
          }, 1000);
        }
      } else {
        const response = await patientAuthAPI.register(formData);
        if (response.success) {
          localStorage.setItem('patient', JSON.stringify(response.patient));
          setSuccess('Registration successful! Redirecting...');
          setTimeout(() => {
            window.location.href = '/patient';
          }, 1000);
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      <div className="p-6">
        <Link to="/portal" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to Portal</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white mb-4 shadow-lg">
              <HeartPulse size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-slate-500">
              {isLogin 
                ? 'Sign in to access your health records' 
                : 'Register to get started with Medha Health'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Blood Group</label>
                      <select
                        name="blood_group"
                        value={formData.blood_group}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                      >
                        <option value="">Select</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                    placeholder="patient@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                    placeholder="Password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccess('');
                }}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In'}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 grid grid-cols-3 gap-4"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 mb-2">
                <Shield size={18} />
              </div>
              <p className="text-xs text-slate-500">Secure Data</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-teal-100 text-teal-600 mb-2">
                <Globe size={18} />
              </div>
              <p className="text-xs text-slate-500">Global Access</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 mb-2">
                <HeartPulse size={18} />
              </div>
              <p className="text-xs text-slate-500">Health Records</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PatientPortal;
