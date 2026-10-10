'use client';

import React from 'react';
import { Headphones } from 'lucide-react';
import { isAudioStory } from '@/lib/articleHelpers';

export { isAudioStory };

interface AudioIndicatorProps {
  hasAudio?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AudioIndicator({
  hasAudio = true,
  className = '',
  size = 'md',
}: AudioIndicatorProps) {
  if (!hasAudio) return null;

  const sizeClasses =
    size === 'sm'
      ? 'w-6 h-6'
      : size === 'lg'
      ? 'w-9 h-9 sm:w-10 sm:h-10'
      : 'w-7 h-7 sm:w-8 sm:h-8';

  const iconSizes =
    size === 'sm'
      ? 'w-3 h-3 text-[#E27A2B]'
      : size === 'lg'
      ? 'w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#E27A2B]'
      : 'w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E27A2B]';

  return (
    <div
      className={`absolute top-2.5 left-2.5 z-20 flex items-center justify-center rounded-full bg-neutral-950/85 backdrop-blur-xs text-[#E27A2B] shadow-md border border-white/20 pointer-events-none transition-transform group-hover:scale-105 ${sizeClasses} ${className}`}
      title="Audio Story / Podcast"
      aria-label="Audio Story"
    >
      <Headphones className={iconSizes} />
    </div>
  );
}
