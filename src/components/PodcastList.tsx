'use client';

import React from 'react';
import Image from 'next/image';
import { Podcast } from '@/lib/content';
import { useAudio } from '@/components/AudioContext';
import { Play, Pause, Clock, Mic } from 'lucide-react';

interface PodcastListProps {
  podcasts: Podcast[];
}

export function PodcastList({ podcasts }: PodcastListProps) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {podcasts.map((pod) => {
        const isCurrent = currentTrack?.url === pod.audioUrl;
        const isThisPlaying = isCurrent && isPlaying;

        return (
          <div
            key={pod.id}
            className="bg-paper-card dark:bg-paper-cardDark rounded-2xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between gap-5 sm:gap-6"
          >
            <div className="flex items-start gap-3.5 sm:gap-4">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 shadow">
                <Image src={pod.coverImage} alt={pod.title} fill className="object-cover" />
              </div>
              <div className="space-y-1.5 min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1">
                  <Mic className="w-3 h-3" /> {pod.speaker}
                </span>
                <h2 className="font-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-50 leading-snug line-clamp-2 break-words">
                  {pod.title}
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 break-words">
                  {pod.excerpt}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {Math.floor(pod.durationSeconds / 60)} minutes
              </span>

              <button
                onClick={() =>
                  isCurrent
                    ? togglePlayPause()
                    : playTrack({
                        title: pod.title,
                        url: pod.audioUrl,
                        durationSeconds: pod.durationSeconds,
                      })
                }
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl bg-brand-700 hover:bg-brand-600 text-white font-semibold shadow transition-colors"
              >
                {isThisPlaying ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Play Episode
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
