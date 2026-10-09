import React, { useState, useEffect, useRef } from 'react';
import { BrandLogo } from './BrandLogo';
import { Link, useRouter } from '../lib/router';
import { Menu, X, ArrowUpRight, User, LogOut, LayoutDashboard, Bookmark, ChevronDown, Sparkles } from 'lucide-react';
import { SignInModal } from './SignInModal';
import { useAuth } from '../lib/auth-context';

export const Navbar: React.FC = () => {
  const { path, navigate } = useRouter();
  const { user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (target: string) => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    if (target.startsWith('#')) {
      if (path !== '/') {
        navigate(`/${target}`);
      } else {
        const el = document.querySelector(target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      navigate(target);
    }
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled
            ? 'bg-[#FAFAF8]/90 backdrop-blur-md border-b border-zinc-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.02)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* LEFT: Wordmark */}
          <div className="flex items-center gap-6">
            <BrandLogo size="md" />
          </div>

          {/* CENTER: Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/explore"
              className={`text-sm tracking-tight transition-colors ${
                path === '/explore'
                  ? 'text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Explore
            </Link>
            <button
              onClick={() => handleNavClick('#categories')}
              className="text-sm tracking-tight text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
            >
              Categories
            </button>
            <button
              onClick={() => handleNavClick('#how-it-works')}
              className="text-sm tracking-tight text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
            >
              How it works
            </button>
            {user && (
              <Link
                to="/dashboard"
                className={`text-sm tracking-tight transition-colors flex items-center gap-1.5 ${
                  path === '/dashboard' || path === '/projects'
                    ? 'text-zinc-950 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <span>Dashboard</span>
              </Link>
            )}
          </nav>

          {/* RIGHT: Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 pr-2 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-xs font-medium text-zinc-800 cursor-pointer shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-[10px]">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user.displayName || user.email.split('@')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-zinc-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-2 border-b border-zinc-100">
                      <p className="text-xs font-semibold text-zinc-950 truncate">
                        {user.displayName || 'Workspace'}
                      </p>
                      <p className="text-[11px] font-mono text-zinc-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-zinc-500" />
                      <span>My Projects</span>
                    </Link>

                    <Link
                      to="/dashboard?tab=saved"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Saved References</span>
                    </Link>

                    <div className="my-1 border-t border-zinc-100" />

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setSignInOpen(true)}
                className="text-sm tracking-tight text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer font-medium"
              >
                Sign in
              </button>
            )}

            <Link
              to="/build"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 active:bg-black transition-all shadow-xs"
            >
              <span>Build from URL</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {user ? (
              <Link
                to="/dashboard"
                className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs"
                title="Go to dashboard"
              >
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </Link>
            ) : null}
            <Link
              to="/build"
              className="text-xs px-2.5 py-1.5 font-semibold bg-zinc-950 text-white rounded-md"
            >
              Build
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-16 z-30 bg-[#FAFAF8] border-b border-zinc-200 px-5 py-6 flex flex-col gap-5 md:hidden shadow-lg animate-in slide-in-from-top-2 duration-200">
          {user && (
            <div className="pb-3 border-b border-zinc-200">
              <p className="text-sm font-semibold text-zinc-950">{user.displayName || 'Workspace'}</p>
              <p className="text-xs font-mono text-zinc-500">{user.email}</p>
            </div>
          )}

          <nav className="flex flex-col gap-4 text-base font-medium">
            <button
              onClick={() => handleNavClick('/explore')}
              className="text-left py-1 text-zinc-800 hover:text-zinc-950 transition-colors"
            >
              Explore Websites
            </button>
            <button
              onClick={() => handleNavClick('#categories')}
              className="text-left py-1 text-zinc-800 hover:text-zinc-950 transition-colors"
            >
              Browse Categories
            </button>
            <button
              onClick={() => handleNavClick('#how-it-works')}
              className="text-left py-1 text-zinc-800 hover:text-zinc-950 transition-colors"
            >
              How It Works
            </button>
            {user && (
              <>
                <button
                  onClick={() => handleNavClick('/dashboard')}
                  className="text-left py-1 text-zinc-800 hover:text-zinc-950 transition-colors flex items-center justify-between"
                >
                  <span>My Projects</span>
                  <span className="text-xs bg-zinc-200 px-2 py-0.5 rounded-full">Dashboard</span>
                </button>
                <button
                  onClick={() => handleNavClick('/dashboard?tab=saved')}
                  className="text-left py-1 text-zinc-800 hover:text-zinc-950 transition-colors"
                >
                  Saved References
                </button>
              </>
            )}
          </nav>

          <div className="pt-4 border-t border-zinc-200 flex flex-col gap-3">
            <Link
              to="/build"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 px-4 text-center text-sm font-semibold rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 transition-colors"
            >
              Build from URL
            </Link>
            {user ? (
              <button
                onClick={handleSignOut}
                className="w-full py-2.5 px-4 text-center text-sm font-medium rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                Sign out
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSignInOpen(true);
                }}
                className="w-full py-2.5 px-4 text-center text-sm font-medium rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sign In / Sign Up Modal */}
      <SignInModal isOpen={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
};
