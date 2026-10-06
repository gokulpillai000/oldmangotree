'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Radio, Bookmark } from 'lucide-react';
import { getBookmarks } from '@/lib/readerStore';
import { MyLibraryModal } from './MyLibraryModal';

export function BottomNav() {
  const pathname = usePathname();
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setBookmarkCount(getBookmarks().length);
    };
    updateCount();
    window.addEventListener('omt-reader-updated', updateCount);
    return () => {
      window.removeEventListener('omt-reader-updated', updateCount);
    };
  }, []);

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Webzine', href: '/magazine', icon: BookOpen },
    { label: 'Audio', href: '/podcasts', icon: Radio },
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 px-1 py-1 shadow-lg transition-colors pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const currentPath = pathname || '';
            const isActive =
              item.href === '/'
                ? currentPath === '/'
                : currentPath.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-1 flex-1 max-w-[76px] min-h-[44px] transition-all ${
                  isActive
                    ? 'text-[#E27A2B] font-bold scale-105'
                    : 'text-neutral-800 dark:text-neutral-200 hover:text-[#E27A2B] dark:hover:text-[#E27A2B]'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                <span className="text-xs sm:text-sm font-bold tracking-tight">{item.label}</span>
              </Link>
            );
          })}

          {/* Library / Bookmarks Tab */}
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-1 flex-1 max-w-[76px] min-h-[44px] text-neutral-800 dark:text-neutral-200 hover:text-[#E27A2B] dark:hover:text-[#E27A2B] transition-all relative"
            aria-label="My Library"
          >
            <div className="relative">
              <Bookmark className="w-5 h-5 mb-0.5 stroke-[2px]" />
              {bookmarkCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-[#E27A2B] text-white text-[9px] font-bold flex items-center justify-center shadow-xs animate-in zoom-in">
                  {bookmarkCount > 9 ? '9+' : bookmarkCount}
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm font-bold tracking-tight">Library</span>
          </button>
        </div>
      </nav>

      {/* Persistent Library Modal */}
      <MyLibraryModal isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />
    </>
  );
}
