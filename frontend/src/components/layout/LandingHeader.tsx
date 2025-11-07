import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import ConnectAccount from '../ConnectAccount';

export const LandingHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '/app/vaults', label: 'Vaults' },
    { href: '/docs', label: 'Docs' },
  ];

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.getElementById(href.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 pt-6 px-6"
    >
      <div 
        className="max-w-7xl mx-auto rounded-full px-6 py-3"
        style={{
          background: 'linear-gradient(180deg, rgba(9,10,10,0.75), rgba(9,10,10,0.45)) padding-box, linear-gradient(120deg, rgba(220,232,93,0.25), rgba(255,255,255,0.08)) border-box',
          border: '1px solid transparent',
          backdropFilter: 'blur(16px) saturate(120%)',
          WebkitBackdropFilter: 'blur(16px) saturate(120%)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)'
        }}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Syft logo" className="w-8 h-8 rounded" />
            <span className="text-white text-lg font-semibold">Syft</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-white/60">
            {navItems.map((item) => {
              if (item.href.startsWith('/')) {
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="hover:text-white transition-colors duration-300 px-4 py-2 rounded-full hover:bg-white/5"
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(item.href, e)}
                  className="hover:text-white transition-colors duration-300 px-4 py-2 rounded-full hover:bg-white/5"
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right Side - Desktop Only */}
          <div className="hidden md:flex items-center gap-2">
            <ConnectAccount />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:text-white/80 transition-colors rounded-full hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation - Full Screen Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Mobile Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-[#090a0a] z-50 md:hidden overflow-y-auto"
              style={{
                borderLeft: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Syft logo" className="w-8 h-8 rounded" />
                  <span className="text-white text-xl font-semibold">Syft</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Mobile Menu Content */}
              <div className="flex flex-col p-6 space-y-8">
                {/* Navigation Items */}
                <nav className="flex flex-col gap-2">
                  <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-2">
                    Menu
                  </div>
                  {navItems.map((item, index) => {
                    const content = (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative"
                      >
                        <div className="px-5 py-4 rounded-xl text-lg font-medium transition-all duration-200 text-white hover:bg-white/5 active:bg-white/10 flex items-center justify-between group">
                          <span>{item.label}</span>
                          <svg 
                            className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </motion.div>
                    );

                    if (item.href.startsWith('/')) {
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {content}
                        </Link>
                      );
                    }
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={(e) => handleNavClick(item.href, e)}
                      >
                        {content}
                      </a>
                    );
                  })}
                </nav>

                {/* Divider */}
                <div className="border-t border-white/10" />

                {/* Wallet Connection Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-xs font-semibold text-white/40 uppercase tracking-wider px-2">
                    Connect
                  </div>
                  <ConnectAccount variant="mobile" />
                </motion.div>

                {/* Footer Info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="pt-6 mt-auto"
                >
                  <p className="text-xs text-white/30 text-center px-4">
                    Build smarter vaults on Stellar
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
