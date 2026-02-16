import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'How It Works', path: '/howitworks' },
    { name: 'Challenges', path: '/challenges' },
    { name: 'FAQs', path: '/faq ' },
    { name: 'About', path: '/about' },
    // { name: "Scaling", path: "/scalingplan"},
    // { name: "Rules", path: "/rules"},
    // { name: "Contact", path: "/contact"},
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? isDark
          ? 'bg-[#0a0d12]/95 backdrop-blur-xl border-b border-white/10 shadow-lg'
          : 'bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-lg'
        : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-[#0a0d12] font-black text-lg">PC</span>
            </div>
            <div className="flex flex-col">
              <span className={`font-bold text-lg tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                PROP<span className="text-amber-500">CAPITALS</span>
              </span>
              <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>FUNDED TRADING</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button
                  variant="ghost"
                  className={`rounded-full px-5 h-10 font-medium transition-all ${isActive(link.path)
                    ? 'text-amber-500 bg-amber-500/10'
                    : isDark
                      ? 'text-gray-300 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  {link.name}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDark
                ? 'bg-white/10 hover:bg-white/20 text-amber-400'
                : 'bg-slate-100 hover:bg-slate-200 text-amber-500'
                }`}
              data-testid="theme-toggle"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className={`w-px h-6 ${isDark ? 'bg-white/10' : 'bg-slate-200'} mx-2`}></div>

            {!user && (
              <Link to="/login">
                <Button
                  variant="ghost"
                  className={`rounded-full px-5 h-10 font-medium transition-all ${isDark
                    ? 'text-gray-300 hover:text-white hover:bg-white/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  Log in
                </Button>
              </Link>
            )}
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-6 h-10 font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all">
                Dashboard
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Theme Toggle Mobile */}
            <button
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDark
                ? 'bg-white/10 text-amber-400'
                : 'bg-slate-100 text-amber-500'
                }`}
              data-testid="theme-toggle-mobile"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                }`}
            >
              {isMobileMenuOpen ? (
                <X className={`w-6 h-6 ${isDark ? 'text-white' : 'text-slate-900'}`} />
              ) : (
                <Menu className={`w-6 h-6 ${isDark ? 'text-white' : 'text-slate-900'}`} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={`lg:hidden border-t ${isDark
          ? 'bg-[#0a0d12]/98 backdrop-blur-xl border-white/10'
          : 'bg-white/98 backdrop-blur-xl border-slate-200'
          }`}>
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start px-4 py-3 h-auto ${isActive(link.path)
                    ? 'text-amber-500 bg-amber-500/10'
                    : isDark
                      ? 'text-gray-300 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {link.name}
                </Button>
              </Link>
            ))}
            {!user && (
              <Link to="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className={`justify-start px-4 py-3 h-auto w-full ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Log in
                </Button>
              </Link>
            )}
            <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a0d12] rounded-full px-6 py-3 h-auto font-bold mt-2 w-full">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
