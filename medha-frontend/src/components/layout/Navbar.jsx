import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import Logo from '../ui/Logo';
import { Menu, X, ArrowRight } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { title: 'Home', path: '/' },
    { title: 'Portal', path: '/portal' },
    { title: 'About', path: '/about' },
    { title: 'Pricing', path: '/pricing' },
    { title: 'Contact', path: '/contact' },

  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 px-6 md:px-12",
      isScrolled ? "h-20 bg-white/80 backdrop-blur-md border-b border-slate-200" : "h-24 bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === link.path ? "text-primary" : "text-slate-600"
              )}
            >
              {link.title}
            </Link>
          ))}
          
          <Link to="/portal" className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 hover:scale-[1.02] transition-all">
            Hospital Login
            <ArrowRight size={16} />
          </Link>

        </div>

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
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "text-2xl font-display font-semibold",
                location.pathname === link.path ? "text-primary" : "text-slate-900"
              )}
            >
              {link.title}
            </Link>
          ))}
          <Link 
            to="/portal" 
            onClick={() => setMobileMenuOpen(false)}
            className="mt-4 bg-primary text-white p-4 rounded-xl font-bold text-lg text-center"
          >
            Hospital Login
          </Link>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;