'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Podcast } from '@/lib/content';
import { useAudio } from '@/components/AudioContext';
import { formatDate } from '@/lib/format';
import { Play, Pause, Clock, Mic, Calendar } from 'lucide-react';
import { fetchLivePodcastsFromSupabase, subscribeToContentUpdates } from '@/lib/liveArticles';

interface PodcastListProps {
  podcasts: Podcast[];
}

export function PodcastList({ podcasts: initialPodcasts = [] }: PodcastListProps) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();
  const [podcasts, setPodcasts] = useState<Podcast[]>(initialPodcasts);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(initialPodcasts.length === 0);

  useEffect(() => {
    let isMounted = true;

    const loadLive = async () => {
      try {
        const live = await fetchLivePodcastsFromSupabase();
        if (isMounted && live && live.length > 0) {
          setPodcasts(live);
        }
      } catch (err) {
        console.warn('Error fetching live podcasts:', err);
      } finally {
        if (isMounted) setIsLoadingLive(false);
      }
    };

    loadLive();

    const unsubscribe = subscribeToContentUpdates(() => {
      loadLive();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (!podcasts || podcasts.length === 0) {
    if (isLoadingLive) {
      return (
        <div className="py-16 text-center text-neutral-500 font-serif text-lg animate-pulse">
          Loading podcasts...
        </div>
      );
    }
    return (
      <div className="py-16 text-center text-neutral-500 font-serif text-lg">
        No podcasts published yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {podcasts.map((pod) => {
        const isCurrent = currentTrack?.url === pod.audioUrl;
        const isThisPlaying = isCurrent && isPlaying;

        return (
          <div
            key={pod.id}
            onClick={() =>
              isCurrent
                ? togglePlayPause()
                : playTrack({
                    title: pod.title,
                    url: pod.audioUrl,
                    durationSeconds: pod.durationSeconds,
                  })
            }
            className="group cursor-pointer flex flex-col justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800 transition-colors"
          >
            <div>
              <div style={{ position: 'relative' }} className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <Image
                  src={pod.coverImage || '/images/logo-oldmangotree.jpg'}
                  alt={pod.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>

              <div className="pt-3 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#E27A2B] underline decoration-[#E27A2B] underline-offset-2 decoration-1">
                  {pod.speaker}
                </span>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-[#E27A2B] transition-colors leading-snug line-clamp-2 break-words">
                  {pod.title}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 break-words leading-relaxed">
                  {pod.excerpt}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 mt-3 flex items-center justify-between gap-3 text-xs text-neutral-500">
              <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  {formatDate(pod.publishedAt)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {Math.floor(pod.durationSeconds / 60)} mins
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  isCurrent
                    ? togglePlayPause()
                    : playTrack({
                        title: pod.title,
                        url: pod.audioUrl,
                        durationSeconds: pod.durationSeconds,
                      });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-700 hover:bg-brand-600 text-white font-semibold transition-colors"
              >
                {isThisPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> <span>Play Episode</span>
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
