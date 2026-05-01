import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import Logo from '../ui/Logo';
import { Menu, X, Download } from 'lucide-react';

const isElectron = !!window.electronAPI?.isElectron;

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // In Electron, the marketing navbar is not used (desktop app has its own layout).
  if (isElectron) return null;

  const navLinks = [
    { title: 'Home', path: '/' },
    { title: 'Pricing', path: '/pricing' },
    { title: 'Contact', path: '/#contact' },
  ];

  const handleNavClick = (e, link) => {
    if (link.path === '/#contact') {
      e.preventDefault();
      if (location.pathname === '/') {
        // Already on home — just scroll
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Navigate to home, then scroll after navigation
        navigate('/');
        setTimeout(() => {
          document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  };

  const isActive = (link) => {
    if (link.path === '/#contact') return false;
    return location.pathname === link.path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] px-4 sm:px-6 md:px-12 h-16 sm:h-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between relative">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        {/* Desktop Links - Centered */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={(e) => handleNavClick(e, link)}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive(link) ? "text-primary" : "text-slate-600"
              )}
            >
              {link.title}
            </Link>
          ))}
        </div>

        {/* Download CTA */}
        <Link
          to="/download"
          className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 shadow-md shadow-primary/30 transition-all"
        >
          <Download size={16} />
          Download App
        </Link>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-slate-600"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        "fixed inset-0 top-[72px] bg-white z-[999] md:hidden transition-transform duration-300 p-8",
        mobileMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={(e) => {
                handleNavClick(e, link);
                setMobileMenuOpen(false);
              }}
              className={cn(
                "text-2xl font-display font-semibold",
                isActive(link) ? "text-primary" : "text-slate-900"
              )}
            >
              {link.title}
            </Link>
          ))}

          {/* Mobile download button */}
          <Link
            to="/download"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-primary text-white font-bold text-lg mt-4"
          >
            <Download size={20} />
            Download Desktop App
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
