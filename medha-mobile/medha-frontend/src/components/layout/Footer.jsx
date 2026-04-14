import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';
import { X, Globe, Users, Mail, ExternalLink } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Platform',
      links: [
        { name: 'Features', path: '#features' },
        { name: 'Solutions', path: '#solutions' },
        { name: 'Pricing', path: '/pricing' },
        { name: 'Updates', path: '#' },
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', path: '/about' },
        { name: 'Careers', path: '#' },
        { name: 'Contact', path: '/contact' },
        { name: 'Privacy Policy', path: '#' },
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Documentation', path: '#' },
        { name: 'Help Center', path: '#' },
        { name: 'Community', path: '#' },
        { name: 'Trust Center', path: '#' },
      ]
    }
  ];

  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-20 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-6">
            <Logo className="mb-4" />
            <p className="text-slate-600 text-base leading-relaxed max-w-sm">
              The next generation of healthcare intelligence. 
              Empowering clinics, doctors, and students with 
              AI-driven insights and seamless administrative tools.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all duration-300">
                <X size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all duration-300">
                <Users size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all duration-300">
                <Mail size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all duration-300">
                <Globe size={18} />
              </a>
            </div>
          </div>

          {/* Links Cols */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2">
                {section.title}
              </h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-sm text-slate-600 hover:text-primary transition-colors flex items-center group">
                      {link.name}
                      <ExternalLink size={12} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>&copy; {currentYear} Medhā Health Intelligence. All rights reserved.</span>
            <span className="inline-block w-1 h-1 rounded-full bg-slate-300" />
            <span>Built for the future of Medicine.</span>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold text-primary uppercase tracking-tighter">System Live</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
