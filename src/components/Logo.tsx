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
      <div className={`inline-flex items-center gap-2 min-[360px]:gap-2.5 sm:gap-3.5 group ${className}`}>
        {/* Logo Mark with rounded corners and orange border matching hero bottom border */}
        <div className="relative w-12 h-12 min-[360px]:w-[52px] min-[360px]:h-[52px] sm:w-16 sm:h-16 md:w-[72px] md:h-[72px] bg-[#fdf9ee] border-2 border-[#E27A2B] rounded-xl sm:rounded-2xl shadow-xs shrink-0 flex items-center justify-center p-0.5 sm:p-1 overflow-hidden">
          <Image
            src={logoSrc}
            alt="oldmangotree"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Website Name as in the past */}
        <div className="flex flex-col justify-center select-none min-w-0">
          <span className="font-serif text-lg min-[360px]:text-xl sm:text-2xl md:text-[28px] font-bold tracking-tight text-white leading-tight whitespace-nowrap">
            oldmang<span className="text-brand-500">o</span>tree
          </span>
          <span className="text-xs sm:text-sm tracking-normal text-[#f97316] font-sans italic font-medium whitespace-nowrap block">
            A shade for wondering thoughts
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
          alt="oldmangotree Logo"
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
          alt="oldmangotree Emblem"
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
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 overflow-hidden rounded-2xl bg-[#fdf9ee] border border-amber-200/60 dark:border-navy-800 shadow-sm p-1">
          <Image
            src={logoSrc}
            alt="oldmangotree"
            fill
            className="object-contain p-1"
            priority
          />
        </div>
        <div>
          <div className="font-serif text-xl sm:text-2xl font-bold tracking-widest leading-tight whitespace-nowrap">
            <span className="text-navy-950 dark:text-neutral-100">oldmang</span>
            <span className="text-brand-500">o</span>
            <span className="text-navy-950 dark:text-neutral-100">tree</span>
          </div>
          {showTagline && (
            <p className="font-sans text-xs sm:text-sm italic tracking-normal text-[#f97316] mt-0.5 font-medium whitespace-nowrap">
              A shade for wondering thoughts
            </p>
          )}
        </div>
      </div>
    );
  }

  // Horizontal variant (default): Perfect for Header bar masthead / Footer
  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 group ${className}`}>
      <div className="relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 shrink-0 overflow-hidden rounded-xl bg-[#fdf9ee] border border-amber-200/80 dark:border-navy-800 shadow-xs">
        <Image
          src={logoSrc}
          alt="oldmangotree Mark"
          fill
          className="object-contain p-0.5"
          priority
        />
      </div>
      <div className="flex flex-col justify-center min-w-0">
        <span className="font-serif text-lg sm:text-xl md:text-2xl font-bold tracking-wider leading-none whitespace-nowrap">
          <span className="text-navy-950 dark:text-neutral-100">oldmang</span>
          <span className="text-brand-500">o</span>
          <span className="text-navy-950 dark:text-neutral-100">tree</span>
        </span>
        {showTagline && (
          <span className="text-xs sm:text-sm font-sans italic tracking-normal text-[#f97316] font-medium leading-tight mt-1 whitespace-nowrap">
            A shade for wondering thoughts
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
