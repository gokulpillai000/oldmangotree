import React from 'react';
import Link from 'next/link';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { AudioProvider } from '@/components/AudioContext';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Logo } from '@/components/Logo';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Old Mango Tree — Where ideas come to sit',
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
            <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-8 sm:pb-12">
              {children}
            </main>
            <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-paper-card dark:bg-paper-cardDark py-10 sm:py-12 mb-14 md:mb-0 transition-colors">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Brand & Slogan */}
                  <div className="md:col-span-4 space-y-3">
                    <Logo variant="horizontal" />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm pt-2">
                      An independent, fearless digital media initiative. In-depth analysis, literature, cinema, politics, sports, arts &amp; culture, podcasts, and investigative stories.
                    </p>
                  </div>

                  {/* Main Departments */}
                  <div className="md:col-span-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      Sections &amp; Coverage
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                      <Link href="/cinema" className="hover:text-brand-600 transition-colors">🎥 Cinema</Link>
                      <Link href="/sports" className="hover:text-brand-600 transition-colors">🏏 Sports</Link>
                      <Link href="/politics" className="hover:text-brand-600 transition-colors">🏛️ Politics</Link>
                      <Link href="/arts-culture" className="hover:text-brand-600 transition-colors">🎨 Arts &amp; Culture</Link>
                      <Link href="/literature" className="hover:text-brand-600 transition-colors">📚 Literature</Link>
                      <Link href="/miscellaneous" className="hover:text-brand-600 transition-colors">💭 Miscellaneous</Link>
                      <Link href="/magazine" className="hover:text-brand-600 transition-colors">Webzine Packets</Link>
                      <Link href="/podcasts" className="hover:text-brand-600 transition-colors">Audio &amp; Podcasts</Link>
                      <Link href="/videos" className="hover:text-brand-600 transition-colors">Videos</Link>
                      <Link href="/series" className="hover:text-brand-600 transition-colors">Special Series</Link>
                    </div>
                  </div>

                  {/* Policies & Institutional Links */}
                  <div className="md:col-span-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      Information &amp; Policies
                    </h4>
                    <div className="flex flex-col space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                      <Link href="/pages/about-us" className="hover:text-brand-600 transition-colors">About Us</Link>
                      <Link href="/the-team" className="hover:text-brand-600 transition-colors">The Team</Link>
                      <Link href="/pages/contact-us" className="hover:text-brand-600 transition-colors">Contact Us</Link>
                      <Link href="/pages/grievance-redressal" className="hover:text-brand-600 transition-colors">Grievance Redressal</Link>
                      <Link href="/pages/privacy-policy" className="hover:text-brand-600 transition-colors">Privacy Policy</Link>
                      <Link href="/pages/terms-of-use" className="hover:text-brand-600 transition-colors">Terms of Use</Link>
                      <Link href="/pages/refund-policy" className="hover:text-brand-600 transition-colors">Refund Policy</Link>
                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                        <Link href="/member" className="font-semibold text-brand-600 hover:underline">
                          Member Space
                        </Link>
                        <span>•</span>
                        <Link href="/publisher" className="font-semibold text-neutral-500 hover:text-brand-600 hover:underline">
                          Editorial Desk
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
                  <p>© {new Date().getFullYear()} OldmanGoTree Media. All rights reserved.</p>
                  <p className="text-[11px] text-neutral-400">
                    Compliant with Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021
                  </p>
                </div>
              </div>
            </footer>
          </div>
          <AudioPlayer />
          <BottomNav />
        </AudioProvider>
      </body>
    </html>
  );
}
