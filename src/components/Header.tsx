'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Search, Moon, Sun, Menu, X, Bookmark, PenTool, ShieldCheck, ArrowRight } from 'lucide-react';

import { Logo } from './Logo';
import { SITE_CATEGORIES } from '@/lib/categories';
import { getBookmarks } from '@/lib/readerStore';
import { getStoredSession, UserSession } from '@/lib/clientAuth';

const MyLibraryModal = dynamic(() => import('./MyLibraryModal').then((m) => ({ default: m.MyLibraryModal })), { ssr: false });
const SearchModal = dynamic(() => import('./SearchModal').then((m) => ({ default: m.SearchModal })), { ssr: false });

export function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [publisherSession, setPublisherSession] = useState<UserSession | null>(null);
  const pathname = usePathname();
  const currentPath = pathname || '';
  const headerRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Track scroll and resize so drawer height/position aligns smoothly
  useEffect(() => {
    const updatePositions = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const hHeight = headerRef.current?.offsetHeight || (window.innerWidth >= 768 ? 93 : window.innerWidth >= 640 ? 85 : 68);
      setHeaderHeight(hHeight);

      // Adjust drawer top and height so it aligns cleanly whether hero is visible or scrolled away
      const drawerTop = Math.max(0, hHeight - scrollY);
      if (drawerRef.current) {
        drawerRef.current.style.top = `${drawerTop}px`;
        drawerRef.current.style.height = `calc(100dvh - ${drawerTop}px)`;
      }
    };

    updatePositions();
    window.addEventListener('scroll', updatePositions, { passive: true });
    window.addEventListener('resize', updatePositions, { passive: true });

    return () => {
      window.removeEventListener('scroll', updatePositions);
      window.removeEventListener('resize', updatePositions);
    };
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const hHeight = headerRef.current?.offsetHeight || (window.innerWidth >= 768 ? 93 : window.innerWidth >= 640 ? 85 : 68);
      const drawerTop = Math.max(0, hHeight - scrollY);
      if (drawerRef.current) {
        drawerRef.current.style.top = `${drawerTop}px`;
        drawerRef.current.style.height = `calc(100dvh - ${drawerTop}px)`;
      }
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }

    // Reader bookmarks count
    const updateBookmarks = () => {
      setBookmarkCount(getBookmarks().length);
    };
    updateBookmarks();

    // Publisher session check
    const syncSession = () => {
      const sess = getStoredSession();
      if (sess && sess.role === 'publisher') {
        setPublisherSession(sess);
      } else {
        setPublisherSession(null);
      }
    };
    syncSession();

    window.addEventListener('omt-reader-updated', updateBookmarks);
    window.addEventListener('omt-auth-changed', syncSession);
    window.addEventListener('storage', syncSession);
    return () => {
      window.removeEventListener('omt-reader-updated', updateBookmarks);
      window.removeEventListener('omt-auth-changed', syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  // Hamburger drawer slides back when clicking outside or pressing Escape
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        drawerRef.current &&
        target &&
        !drawerRef.current.contains(target) &&
        !target.closest('button[data-drawer-trigger="true"]')
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  // Close drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  return (
    <>
      <header ref={headerRef} className="relative z-40 w-full bg-[#0C2340] text-white transition-colors">
        <div className="w-full pl-3.5 sm:pl-5 lg:pl-6 xl:pl-8 pr-3 sm:pr-6 lg:pr-8">
          <div className="flex items-center justify-between h-16 sm:h-20 md:h-[88px]">
            {/* Brand Logo */}
            <div className="flex items-center min-w-0 shrink-0">
              <Link href="/" className="flex items-center gap-2 sm:gap-3.5 group">
                <Logo variant="reference" />
              </Link>
            </div>

            {/* Desktop Navigation & Actions */}
            <div className="flex flex-col items-end justify-center">
              {/* Top Utility Icons (Search first, Library, Theme toggle, Profile) */}
              <div className="hidden lg:flex items-center gap-4 text-white text-xs sm:text-sm pb-1.5 pr-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setSearchInitialQuery('');
                    setIsSearchOpen(true);
                  }}
                  className="p-1 hover:text-[#E27A2B] transition-colors cursor-pointer"
                  title="Search"
                  aria-label="Search articles"
                >
                  <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </button>
                <button
                  onClick={() => setIsLibraryOpen(true)}
                  className="relative p-1 hover:text-[#E27A2B] transition-colors"
                  title="My Library"
                >
                  <Bookmark className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  {bookmarkCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E27A2B] text-white text-[9px] font-bold flex items-center justify-center">
                      {bookmarkCount > 9 ? '9+' : bookmarkCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={toggleDarkMode}
                  className="p-1 hover:text-[#E27A2B] transition-colors"
                  title="Toggle Theme"
                >
                  {isDarkMode ? <Sun className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-amber-400" /> : <Moon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
                </button>
                {publisherSession && (
                  <Link
                    href="/publisher"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none bg-[#E27A2B] hover:bg-[#d0691c] text-white font-bold text-xs sm:text-sm shadow-sm transition-all tracking-normal"
                    title={`Editorial Desk • ${publisherSession.name}`}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Editorial Desk</span>
                  </Link>
                )}
              </div>

              {/* Main Nav Links Row */}
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-3 xl:gap-5 shrink-0">
                <nav className="hidden lg:flex items-center gap-2.5 xl:gap-3.5 2xl:gap-5 font-bold text-sm xl:text-[15px] 2xl:text-base tracking-wide text-white uppercase whitespace-nowrap">
                  {SITE_CATEGORIES.map((cat) => {
                    const isActive =
                      cat.href === '/'
                        ? currentPath === '/'
                        : cat.href === '/magazine' || cat.href === '/series'
                        ? currentPath.startsWith(cat.href)
                        : currentPath === cat.href;
                    return (
                      <Link
                        key={cat.name}
                        href={cat.href}
                        className={`transition-colors py-1 hover:text-[#E27A2B] hover:underline hover:decoration-[#E27A2B] hover:underline-offset-8 hover:decoration-2 ${
                          isActive
                            ? 'text-[#E27A2B] font-extrabold underline decoration-[#E27A2B] underline-offset-8 decoration-2'
                            : 'text-white hover:text-[#E27A2B]'
                        }`}
                      >
                        {cat.name}
                      </Link>
                    );
                  })}

                  {/* Hamburger Menu button placed directly next to Audio & Podcast */}
                  <button
                    type="button"
                    data-drawer-trigger="true"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="ml-1 xl:ml-2 p-1 text-white hover:text-[#E27A2B] transition-colors flex items-center justify-center cursor-pointer group"
                    aria-label={isMobileMenuOpen ? 'Close Navigation Drawer' : 'Open Navigation Drawer'}
                    title={isMobileMenuOpen ? 'Close Menu' : 'All Sections & Menu'}
                  >
                    {isMobileMenuOpen ? (
                      <X className="w-4 h-4 sm:w-5 sm:h-5 text-[#E27A2B]" />
                    ) : (
                      <Menu className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-105 transition-transform" />
                    )}
                  </button>
                </nav>

                {/* Mobile utility: Search, Theme, and Hamburger Menu */}
                <div className="flex lg:hidden items-center gap-1 sm:gap-1.5 text-white">
                  {publisherSession && (
                    <Link
                      href="/publisher"
                      className="p-1.5 text-[#E27A2B] rounded-none hover:bg-white/10 flex items-center gap-1"
                      title={`Editorial Desk • ${publisherSession.name}`}
                      aria-label="Editorial Desk"
                    >
                      <PenTool className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase hidden sm:inline">Desk</span>
                    </Link>
                  )}
                  {/* Search Icon */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setSearchInitialQuery('');
                      setIsSearchOpen(true);
                    }}
                    className="p-1.5 hover:text-[#E27A2B] transition-colors cursor-pointer rounded-none hover:bg-white/10"
                    aria-label="Search articles"
                    title="Search"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                  {/* Dark/Light Theme Icon */}
                  <button
                    onClick={toggleDarkMode}
                    className="p-1.5 hover:text-[#E27A2B] transition-colors rounded-none hover:bg-white/10"
                    aria-label="Toggle Theme"
                    title="Toggle Theme"
                  >
                    {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                  </button>
                  {/* Hamburger Menu Icon next to search and dark-light */}
                  <button
                    type="button"
                    data-drawer-trigger="true"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-1.5 hover:text-[#E27A2B] transition-colors rounded-none hover:bg-white/10 flex items-center justify-center cursor-pointer"
                    aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
                    title={isMobileMenuOpen ? 'Close Menu' : 'Open Navigation Menu'}
                  >
                    {isMobileMenuOpen ? (
                      <X className="w-5 h-5 text-[#E27A2B]" />
                    ) : (
                      <Menu className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Mango Amber Stripe */}
        <div className="h-1 sm:h-[5px] bg-[#E27A2B] w-full" />

        {/* Right-aligned Slim Side Drawer */}
        <aside
          ref={drawerRef}
          style={{
            top: headerHeight ? `${headerHeight}px` : undefined,
            height: headerHeight ? `calc(100dvh - ${headerHeight}px)` : undefined,
          }}
          className={`fixed top-[68px] sm:top-[85px] md:top-[93px] right-0 z-50 h-[calc(100dvh-68px)] sm:h-[calc(100dvh-85px)] md:h-[calc(100dvh-93px)] w-[220px] sm:w-[240px] bg-white dark:bg-[#1E293B] border-l border-b border-gray-200 dark:border-slate-800 flex flex-col transition-[transform,opacity] duration-300 ease-in-out ${
            isMobileMenuOpen
              ? 'translate-x-0 opacity-100 shadow-[-6px_0_24px_rgba(0,0,0,0.18)] pointer-events-auto'
              : 'translate-x-[110%] opacity-0 shadow-none pointer-events-none'
          }`}
          aria-label="Navigation Drawer"
          aria-hidden={!isMobileMenuOpen}
        >
          {/* Drawer Header with Title and Close Button */}
          <div className="px-3.5 py-2.5 border-b border-gray-100 dark:border-slate-800/80 bg-gray-50/60 dark:bg-slate-900/40 shrink-0 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Navigation Menu
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 text-slate-500 hover:text-[#E27A2B] transition-colors cursor-pointer"
              aria-label="Close Menu"
              title="Close Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2.5 flex flex-col gap-2.5 flex-1 overflow-y-auto pb-10">
            {/* Publisher View Active Card: Active across all routes until signout */}
            {publisherSession && (
              <div className="p-2.5 rounded-none bg-[#E27A2B]/10 border border-[#E27A2B]/30 mb-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#E27A2B] mb-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Publisher View
                  </span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 mb-2 truncate font-medium">
                  {publisherSession.name}
                </p>
                <Link
                  href="/publisher"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between w-full py-1.5 px-2 rounded-none bg-[#E27A2B] text-white text-xs font-bold shadow-xs hover:bg-[#c9661d] transition-colors"
                >
                  <span>Open Desk</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Categories */}
            <nav className="flex-1 space-y-0 text-sm sm:text-[15px]">
              {SITE_CATEGORIES.map((cat) => {
                const isActive =
                  cat.href === '/'
                    ? currentPath === '/'
                    : cat.href === '/magazine' || cat.href === '/series'
                    ? currentPath.startsWith(cat.href)
                    : currentPath === cat.href;
                return (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center py-2.5 px-2 border-b border-gray-100 dark:border-slate-800/80 font-bold transition-colors hover:underline hover:decoration-[#E27A2B] ${
                      isActive
                        ? 'text-[#E27A2B] font-extrabold underline decoration-[#E27A2B] underline-offset-4 decoration-2'
                        : 'text-slate-900 dark:text-slate-100 hover:text-[#E27A2B]'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
      </header>

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
