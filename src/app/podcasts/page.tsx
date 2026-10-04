import React from 'react';
import { getAllPodcasts } from '@/lib/content';
import { PodcastList } from '@/components/PodcastList';
import { Radio } from 'lucide-react';

export const revalidate = 60;

export default async function PodcastsPage() {
  const podcasts = await getAllPodcasts();

  return (
    <div className="space-y-8 pb-6 sm:pb-8">
      <header className="border-b border-neutral-200 dark:border-neutral-800 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#E27A2B]">
          <span>Audio &amp; Podcast Streaming Hub</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-50 break-words">
          <span className="inline-block underline decoration-[#E27A2B] underline-offset-4 decoration-2">
            Audio &amp; Podcast
          </span>
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm max-w-2xl">
          Listen to long-form editorial audio narrations, interviews, and cultural discussions streamed directly in high fidelity.
        </p>
      </header>

      <PodcastList podcasts={podcasts} />
    </div>
  );
}
