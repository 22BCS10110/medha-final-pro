import React from 'react';
import Layout from '../components/layout/Layout';
import { motion } from 'framer-motion';
import { Heart, ShieldCheck, Users, Sparkles, UserCheck, Globe } from 'lucide-react';

const About = () => {
  const values = [
    { title: "Empowerment", desc: "Giving patients and doctors the data they need to make better decisions.", icon: Sparkles },
    { title: "Trust", desc: "Security and privacy are at the heart of everything we build.", icon: ShieldCheck },
    { title: "Accessibility", desc: "Healthcare guidance should be available to everyone, everywhere.", icon: Globe },
  ];

  return (
    <Layout>
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-24">
             <motion.h1 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-5xl md:text-7xl font-display font-bold text-slate-900 mb-8"
             >
               We are <span className="text-primary italic">Intelligence</span> <br />
               for the Healing Arts.
             </motion.h1>
             <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
               Medhā Health Intelligence was founded with a single mission: to bridge the gap 
               between complex medical data and meaningful healthcare outcomes using 
               the world's most advanced artificial intelligence.
             </p>
          </div>

          {/* Icon Grid */}
          <div className="grid md:grid-cols-3 gap-12 mb-32">
             {values.map((v, i) => (
                <div key={i} className="p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                   <div className="w-16 h-16 rounded-[1.25rem] bg-primary/5 text-primary flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                      <v.icon size={32} />
                   </div>
                   <h3 className="text-2xl font-bold text-slate-900 mb-4">{v.title}</h3>
                   <p className="text-slate-600 leading-relaxed">{v.desc}</p>
                </div>
             ))}
          </div>

          {/* Mission Image Placeholder */}
          <div className="relative aspect-[21/9] rounded-[3rem] overflow-hidden bg-slate-100 mb-32 group">
             <div className="absolute inset-0 premium-gradient opacity-10 group-hover:opacity-20 transition-opacity" />
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                   <Heart className="text-primary mb-4 mx-auto animate-pulse" size={64} />
                   <p className="text-2xl font-display font-bold text-slate-400">Our Humanity-First Approach</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;