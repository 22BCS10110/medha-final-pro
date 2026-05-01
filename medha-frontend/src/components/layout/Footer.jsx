import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../ui/Logo';
import { Mail, ExternalLink } from 'lucide-react';

const LinkedinIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.27 2.38 4.27 5.47v6.27zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
  </svg>
);
import ComingSoonModal from '../ui/ComingSoonModal';

const Footer = () => {
  const [comingSoon, setComingSoon] = useState(false);
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const location = useLocation();

  const handleHashLink = (e, path) => {
    e.preventDefault();
    const hash = path.split('#')[1];
    if (location.pathname === '/') {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

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
        { name: 'About Us', path: '/#about' },
        { name: 'Careers', path: '#' },
        { name: 'Contact', path: '/#contact' },
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
    <>
    <ComingSoonModal open={comingSoon} onClose={() => setComingSoon(false)} />
    <footer className="bg-slate-50 border-t border-slate-200 mt-12 sm:mt-20 pt-12 sm:pt-20 pb-8 sm:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 mb-10 sm:mb-16">
          {/* Brand Col */}
          <div className="col-span-2 lg:col-span-2 space-y-4 sm:space-y-6">
            <Logo className="mb-2 sm:mb-4" />
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-sm">
              Intelligence That Travels With You
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a
                href="https://www.linkedin.com/company/medha-health-intelligence"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all duration-300"
              >
                <LinkedinIcon size={18} />
              </a>
              <a
                href="mailto:info.medhahealth.in"
                aria-label="Email"
                className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all duration-300"
              >
                <Mail size={18} />
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
                    {link.path === '#' || (link.path.startsWith('#') && !link.path.startsWith('/#')) ? (
                      <button onClick={() => setComingSoon(true)} className="text-sm text-slate-600 hover:text-primary transition-colors flex items-center group">
                        {link.name}
                        <ExternalLink size={12} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ) : link.path.startsWith('/#') ? (
                      <button onClick={(e) => handleHashLink(e, link.path)} className="text-sm text-slate-600 hover:text-primary transition-colors flex items-center group">
                        {link.name}
                        <ExternalLink size={12} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ) : (
                      <Link to={link.path} className="text-sm text-slate-600 hover:text-primary transition-colors flex items-center group">
                        {link.name}
                        <ExternalLink size={12} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>&copy; {currentYear} Medha Health Intelligence. All rights reserved.</span>
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
    </>
  );
};

export default Footer;
