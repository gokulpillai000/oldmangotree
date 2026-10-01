import React from 'react';
import Image from 'next/image';

interface LogoProps {
  variant?: 'horizontal' | 'stacked' | 'mark' | 'image' | 'reference';
  className?: string;
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  className = '',
  showTagline = true,
}) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const logoSrc = `${basePath}/images/logo-oldmangotree.jpg`;

  // Reference variant: Square box with white border + 3-line stacked brand name (old / mango / tree)
  if (variant === 'reference') {
    return (
      <div className={`inline-flex items-center gap-2.5 sm:gap-3.5 group ${className}`}>
        {/* Hanging Square Logo Box */}
        <div className="relative w-14 h-14 sm:w-20 sm:h-20 md:w-[86px] md:h-[86px] bg-[#fdf9ee] border-2 sm:border-[3px] border-[#E27A2B] shadow-[0_6px_16px_rgba(0,0,0,0.35)] translate-y-2 sm:translate-y-3.5 z-30 shrink-0 flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform duration-200 overflow-hidden">
          <Image
            src={logoSrc}
            alt="Old Mango Tree"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Website Name as in the past */}
        <div className="flex flex-col justify-center select-none">
          <span className="font-serif text-xl sm:text-2xl md:text-[26px] font-bold tracking-tight text-white leading-tight">
            oldman<span className="text-brand-500">go</span>tree
          </span>
          <span className="text-[9px] sm:text-[10px] md:text-[11px] tracking-wide text-slate-300 font-sans italic font-medium">
            A shade for wandering thoughts
          </span>
        </div>
      </div>
    );
  }
  // If variant is image, display the complete authentic square logo artwork directly
  if (variant === 'image') {
    return (
      <div className={`relative inline-block overflow-hidden rounded-2xl ${className}`}>
        <Image
          src={logoSrc}
          alt="Old Mango Tree Logo"
          width={220}
          height={220}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  // Mark variant: Circular/rounded emblem showing the tree and group
  if (variant === 'mark') {
    return (
      <div className={`relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-[#fdf9ee] border border-amber-200/80 dark:border-navy-800 shadow-xs ${className}`}>
        <Image
          src={logoSrc}
          alt="Old Mango Tree Emblem"
          width={44}
          height={44}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  // Stacked variant: For footers, auth modals, about pages
  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center gap-2 group ${className}`}>
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 overflow-hidden rounded-2xl bg-[#fdf9ee] border border-amber-200/60 dark:border-navy-800 shadow-sm p-1 transition-transform group-hover:scale-105">
          <Image
            src={logoSrc}
            alt="Old Mango Tree"
            fill
            className="object-contain p-1"
            priority
          />
        </div>
        <div>
          <div className="font-serif text-xl sm:text-2xl font-bold tracking-widest leading-tight">
            <span className="text-navy-950 dark:text-neutral-100">oldmang</span>
            <span className="text-brand-600 dark:text-brand-500">o</span>
            <span className="text-navy-950 dark:text-neutral-100">tree</span>
          </div>
          {showTagline && (
            <p className="font-sans text-xs italic tracking-wider text-brand-600 dark:text-brand-400 mt-0.5 font-medium">
              Where ideas come to sit
            </p>
          )}
        </div>
      </div>
    );
  }

  // Horizontal variant (default): Perfect for Header bar masthead
  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 group ${className}`}>
      <div className="relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 shrink-0 overflow-hidden rounded-xl bg-[#fdf9ee] border border-amber-200/80 dark:border-navy-800 shadow-xs transition-transform group-hover:scale-105">
        <Image
          src={logoSrc}
          alt="Old Mango Tree Mark"
          fill
          className="object-contain p-0.5"
          priority
        />
      </div>
      <div className="flex flex-col justify-center">
        <span className="font-serif text-lg sm:text-xl md:text-2xl font-bold tracking-wider leading-none">
          <span className="text-navy-950 dark:text-neutral-100">oldmang</span>
          <span className="text-brand-600 dark:text-brand-500">o</span>
          <span className="text-navy-950 dark:text-neutral-100">tree</span>
        </span>
        {showTagline && (
          <span className="text-[10px] sm:text-[11px] font-sans italic tracking-wide text-brand-600 dark:text-brand-400 font-medium leading-tight mt-1">
            Where ideas come to sit
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
