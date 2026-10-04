import React from 'react';
import Link from 'next/link';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { PublisherBar } from '@/components/PublisherBar';
import { BottomNav } from '@/components/BottomNav';
import { AudioProvider } from '@/components/AudioContext';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Logo } from '@/components/Logo';
import { SITE_CATEGORIES } from '@/lib/categories';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'oldmangotree — A shade for wondering thoughts',
  description: 'Flat-file digital webzine, long-form journalism, cinema, sports, politics, arts & culture, literature, and audio streaming.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://blogger.googleusercontent.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://blogger.googleusercontent.com" />
        <link rel="preconnect" href="https://bp.blogspot.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://bp.blogspot.com" />
        <link rel="preconnect" href="https://img.youtube.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />
        <link rel="preload" href={`${basePath}/fonts/DzainTrueCopy-Regular.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href={`${basePath}/fonts/DzainTrueCopy-Bold.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" />
        <style dangerouslySetInnerHTML={{
          __html: `
            @font-face {
              font-family: 'DzainTrueCopy';
              src: url('${basePath}/fonts/DzainTrueCopy-Light.woff2') format('woff2');
              font-weight: 300;
              font-style: normal;
              font-display: swap;
            }
            @font-face {
              font-family: 'DzainTrueCopy';
              src: url('${basePath}/fonts/DzainTrueCopy-Regular.woff2') format('woff2');
              font-weight: 400;
              font-style: normal;
              font-display: swap;
            }
            @font-face {
              font-family: 'DzainTrueCopy';
              src: url('${basePath}/fonts/DzainTrueCopy-Bold.woff2') format('woff2');
              font-weight: 700;
              font-style: normal;
              font-display: swap;
            }
            @font-face {
              font-family: 'Dzain-TrueCopy Text';
              src: url('${basePath}/fonts/DzainTrueCopy-Text.woff2') format('woff2');
              font-weight: 400;
              font-style: normal;
              font-display: swap;
            }
            @font-face {
              font-family: 'DzainTrueCopy Inline';
              src: url('${basePath}/fonts/DzainTrueCopy-Inline.woff2') format('woff2');
              font-weight: 300;
              font-style: normal;
              font-display: swap;
            }
          `
        }} />
      </head>
      <body className="antialiased w-full overflow-x-hidden">
        <AudioProvider>
          <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
            <Header />
            <main className="flex-1 max-w-7xl w-full mx-auto px-5 sm:px-8 md:px-12 lg:px-20 xl:px-24 2xl:px-28 py-4 sm:py-8 pb-8 sm:pb-12">
              {children}
            </main>
            <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-paper-card dark:bg-paper-cardDark py-10 sm:py-12 mb-14 md:mb-0 transition-colors">
              <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-20 xl:px-24 2xl:px-28 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Brand & Slogan */}
                  <div className="md:col-span-4 space-y-3">
                    <Logo variant="horizontal" />
                    <p className="text-base sm:text-[17px] text-neutral-800 dark:text-neutral-200 leading-relaxed max-w-sm pt-2">
                      An independent, fearless digital media initiative. In-depth analysis, literature, cinema, politics, sports, arts &amp; culture, podcasts, and investigative stories.
                    </p>
                  </div>

                  {/* Main Departments */}
                  <div className="md:col-span-4 space-y-3">
                    <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#E27A2B]">
                      Sections &amp; Coverage
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100">
                      {SITE_CATEGORIES.map((cat) => (
                        <Link
                          key={cat.name}
                          href={cat.href}
                          className="hover:text-[#E27A2B] dark:hover:text-[#E27A2B] transition-colors flex items-center gap-2"
                        >
                          <span className="text-base sm:text-lg shrink-0" aria-hidden="true">{cat.symbol}</span>
                          <span>{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Policies & Institutional Links */}
                  <div className="md:col-span-4 space-y-3">
                    <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#E27A2B]">
                      Information &amp; Policies
                    </h4>
                    <div className="flex flex-col space-y-2.5 text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100">
                      <Link href="/pages/about-us" className="hover:text-[#E27A2B] dark:hover:text-[#E27A2B] transition-colors">About Us</Link>
                      <Link href="/the-team" className="hover:text-[#E27A2B] dark:hover:text-[#E27A2B] transition-colors">The Team</Link>
                      <Link href="/pages/contact-us" className="hover:text-[#E27A2B] dark:hover:text-[#E27A2B] transition-colors">Contact Us</Link>
                      <Link href="/pages/privacy-policy" className="hover:text-[#E27A2B] dark:hover:text-[#E27A2B] transition-colors">Privacy Policy</Link>
                      <Link href="/pages/terms-of-use" className="hover:text-[#E27A2B] dark:hover:text-[#E27A2B] transition-colors">Terms of Use</Link>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm sm:text-base text-neutral-800 dark:text-neutral-200 font-medium">
                  <p>© {new Date().getFullYear()} oldmangotree. All rights reserved.</p>
                </div>
              </div>
            </footer>
          </div>
          <PublisherBar />
          <AudioPlayer />
          <BottomNav />
        </AudioProvider>
      </body>
    </html>
  );
}
