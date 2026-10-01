'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, Moon, Sun, Menu, X, BookOpen, Radio, TrendingUp, User, PenTool, Film, LogOut, Bookmark, Sparkles } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { MyLibraryModal } from './MyLibraryModal';
import { SearchModal } from './SearchModal';
import { Logo } from './Logo';
import { getStoredSession, setStoredSession, getAuthHeaders } from '@/lib/clientAuth';
import { getBookmarks } from '@/lib/readerStore';

export function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [session, setSession] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }

    // 1. Instantly restore session from localStorage (eliminates mobile delay/flicker)
    const stored = getStoredSession();
    if (stored) {
      setSession(stored);
    }

    // 2. Sync with server in background
    const syncServerAuth = () => {
      fetch('/api/auth', {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.session) {
            setSession(data.session);
            setStoredSession(data.session);
          } else {
            // Only clear if server explicitly confirms no session
            const currentStored = getStoredSession();
            if (!currentStored) {
              setSession(null);
            }
          }
        })
        .catch(() => {});
    };

    syncServerAuth();

    // 3. Reader bookmarks count
    const updateBookmarks = () => {
      setBookmarkCount(getBookmarks().length);
    };
    updateBookmarks();

    // Listen for custom auth, open auth modal, and reader events across components
    const handleAuthChanged = () => {
      const updated = getStoredSession();
      setSession(updated);
    };
    const handleOpenAuth = () => setIsAuthOpen(true);

    window.addEventListener('omt-auth-changed', handleAuthChanged);
    window.addEventListener('omt-open-auth', handleOpenAuth);
    window.addEventListener('omt-reader-updated', updateBookmarks);
    return () => {
      window.removeEventListener('omt-auth-changed', handleAuthChanged);
      window.removeEventListener('omt-open-auth', handleOpenAuth);
      window.removeEventListener('omt-reader-updated', updateBookmarks);
    };
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  const trendingTags = [
    { label: '#KeralaPolitics', query: 'Kerala' },
    { label: '#ThinkFootball', query: 'Football' },
    { label: '#Cinema', query: 'Cinema' },
    { label: '#Ecology', query: 'Ecology' },
    { label: '#Packet2', query: 'packet-2' },
    { label: '#Literature', query: 'Literature' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#0C2340] text-white transition-colors">
        {/* Pre-Header Bar with Trending Topic Pills - HIDDEN when hamburger menu is open */}
        {!isMobileMenuOpen && (
          <div className="hidden sm:block bg-[#071629] text-slate-300 text-xs py-1.5 px-3 sm:px-4 border-b border-slate-800/80 w-full overflow-hidden">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none overscroll-x-contain py-0.5 min-w-0 flex-1">
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 uppercase tracking-wider shrink-0">
                  <TrendingUp className="w-3 h-3 text-[#E27A2B]" /> Trending:
                </span>
                {trendingTags.map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => {
                      setSearchInitialQuery(tag.query);
                      setIsSearchOpen(true);
                    }}
                    className="shrink-0 px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-[#E27A2B] hover:text-white text-slate-300 transition-colors cursor-pointer"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 shrink-0 text-[11px]">
                <Link
                  href="/magazine/packet-2"
                  className="hidden md:inline-flex items-center gap-1 text-slate-300 hover:text-white font-bold"
                >
                  <span>PACKET 2 LIVE</span> →
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20">
            {/* Brand Logo with hanging square box & 3-line name */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2.5 sm:gap-3.5 group">
                <Logo variant="reference" />
              </Link>
            </div>

            {/* Desktop Navigation & Actions */}
            <div className="flex flex-col items-end justify-center">
              {/* Top Utility Icons (Search, Theme, Library, Profile) */}
              <div className="hidden lg:flex items-center gap-3 text-neutral-300 text-xs pb-1 pr-1">
                <button
                  type="button"
                  onClick={() => {
                    setSearchInitialQuery('');
                    setIsSearchOpen(true);
                  }}
                  className="p-1 hover:text-white transition-colors cursor-pointer"
                  title="Search"
                  aria-label="Search articles"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsLibraryOpen(true)}
                  className="relative p-1 hover:text-white transition-colors"
                  title="My Library"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  {bookmarkCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#E27A2B] text-white text-[8px] font-bold flex items-center justify-center">
                      {bookmarkCount > 9 ? '9+' : bookmarkCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={toggleDarkMode}
                  className="p-1 hover:text-white transition-colors"
                  title="Toggle Theme"
                >
                  {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="p-1 hover:text-white transition-colors"
                  title={session ? `Signed in as ${session.name}` : 'Sign In'}
                >
                  <User className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Main Nav Links Row */}
              <div className="flex items-center gap-3 xl:gap-5">
                <nav className="hidden lg:flex items-center gap-3 xl:gap-5 font-bold text-xs xl:text-[13px] tracking-wider text-neutral-200 uppercase">
                  <Link
                    href="/podcasts"
                    className={`hover:text-[#E27A2B] transition-colors ${
                      pathname === '/podcasts' ? 'text-[#E27A2B]' : ''
                    }`}
                  >
                    Audio
                  </Link>
                  <Link
                    href="/politics"
                    className={`hover:text-[#E27A2B] transition-colors ${
                      pathname === '/politics' ? 'text-[#E27A2B]' : ''
                    }`}
                  >
                    Politics
                  </Link>
                  <Link
                    href="/literature"
                    className={`hover:text-[#E27A2B] transition-colors ${
                      pathname === '/literature' ? 'text-[#E27A2B]' : ''
                    }`}
                  >
                    Literature
                  </Link>
                  <Link
                    href="/videos"
                    className={`hover:text-[#E27A2B] transition-colors ${
                      pathname === '/videos' ? 'text-[#E27A2B]' : ''
                    }`}
                  >
                    Videos
                  </Link>
                  <Link
                    href="/magazine"
                    className={`hover:text-[#E27A2B] transition-colors ${
                      pathname.startsWith('/magazine') ? 'text-[#E27A2B]' : ''
                    }`}
                  >
                    Webzine
                  </Link>
                  <Link
                    href="/series"
                    className={`hover:text-[#E27A2B] transition-colors ${
                      pathname.startsWith('/series') ? 'text-[#E27A2B]' : ''
                    }`}
                  >
                    Series
                  </Link>
                  <Link
                    href="/cinema"
                    className={`hover:text-[#E27A2B] transition-colors ${
                      pathname === '/cinema' ? 'text-[#E27A2B]' : ''
                    }`}
                  >
                    Cinema
                  </Link>
                  <Link
                    href="/sports"
                    className={`hover:text-[#E27A2B] transition-colors ${
                      pathname === '/sports' ? 'text-[#E27A2B]' : ''
                    }`}
                  >
                    Sports
                  </Link>
                </nav>

                {/* Mobile utility: Search & Theme */}
                <div className="flex lg:hidden items-center gap-1.5 text-neutral-300">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInitialQuery('');
                      setIsSearchOpen(true);
                    }}
                    className="p-1.5 hover:text-white transition-colors cursor-pointer"
                    aria-label="Search articles"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                  <button
                    onClick={toggleDarkMode}
                    className="p-1.5 hover:text-white transition-colors"
                    aria-label="Toggle Theme"
                  >
                    {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                  </button>
                </div>

                {/* Subscribe Button */}
                {session?.role === 'publisher' ? (
                  <Link
                    href="/publisher"
                    className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded bg-brand-700 hover:bg-brand-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                  >
                    Desk
                  </Link>
                ) : session?.role === 'reader' ? (
                  <Link
                    href="/member"
                    className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                  >
                    Member
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAuthOpen(true)}
                    className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded bg-[#E27A2B] hover:bg-[#c9661e] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                  >
                    Subscribe
                  </button>
                )}

                {/* Hamburger menu trigger (visible on desktop & mobile, like reference) */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-1.5 sm:p-2 rounded text-white hover:text-[#E27A2B] transition-colors"
                  aria-label="Open Menu"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Mango Amber Stripe (Matching logo brand) */}
        <div className="h-1 sm:h-[5px] bg-[#E27A2B] w-full" />

        {/* Slide-over Drawer Backdrop */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Right-aligned Compact Side Drawer (Matching Reference Style) */}
        {isMobileMenuOpen && (
          <aside
            className="fixed top-0 right-0 z-50 h-full w-[78vw] max-w-[270px] sm:max-w-[290px] bg-white dark:bg-[#1E293B] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-200 dark:border-slate-800 overflow-y-auto"
            aria-label="Navigation Drawer"
          >
            <div className="p-5 sm:p-6 flex flex-col flex-1 pb-16">
              {/* Top Controls: Close button & Mango Amber outline Theme Toggle button */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>

                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg border border-[#E27A2B] text-slate-800 dark:text-slate-200 hover:bg-[#E27A2B]/10 transition-colors"
                  aria-label="Toggle dark mode"
                  title="Toggle theme"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* SIGNIN button with mango amber outline */}
              <div className="mt-8">
                {session ? (
                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsAuthOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded border border-[#E27A2B] hover:bg-[#E27A2B]/10 text-slate-900 dark:text-white font-bold text-sm tracking-wider uppercase transition-colors text-center"
                    >
                      {session.name}
                    </button>
                    <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
                      <Link
                        href={session.role === 'publisher' ? '/publisher' : '/member'}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-[#E27A2B] hover:underline font-semibold"
                      >
                        {session.role === 'publisher' ? 'Editorial Desk' : 'Member Lounge'}
                      </Link>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsAuthOpen(true);
                        }}
                        className="hover:underline text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAuthOpen(true);
                    }}
                    className="w-full py-2 px-4 rounded border border-[#E27A2B] hover:bg-[#E27A2B]/10 text-slate-900 dark:text-white font-bold text-sm tracking-widest uppercase transition-colors text-center"
                  >
                    SIGNIN
                  </button>
                )}
              </div>

              {/* Categories matching navbar */}
              <nav className="mt-8 flex-1 space-y-0 text-[15px]">
                {[
                  { name: 'Audio', href: '/podcasts' },
                  { name: 'Politics', href: '/politics' },
                  { name: 'Literature', href: '/literature' },
                  { name: 'Videos', href: '/videos' },
                  { name: 'Webzine', href: '/magazine' },
                  { name: 'Series', href: '/series' },
                  { name: 'Cinema', href: '/cinema' },
                  { name: 'Sports', href: '/sports' },
                ].map((cat) => {
                  const isActive =
                    pathname === cat.href ||
                    (cat.href !== '/' && pathname.startsWith(cat.href));
                  return (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block py-2.5 border-b border-gray-200 dark:border-slate-800 font-normal transition-colors ${
                        isActive
                          ? 'text-[#E27A2B] font-semibold'
                          : 'text-slate-900 dark:text-slate-100 hover:text-[#E27A2B]'
                      }`}
                    >
                      {cat.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        session={session}
        onSessionChange={(newSession) => setSession(newSession)}
      />

      {/* Reader Library Modal */}
      <MyLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
      />

      {/* Instant In-Page Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        initialQuery={searchInitialQuery}
      />
    </>
  );
}
