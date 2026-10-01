'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, Film, Clock, User, Calendar, Share2 } from 'lucide-react';

interface VideoItem {
  id: string;
  title: string;
  excerpt: string;
  youtubeId: string;
  playlist?: string;
  category: string;
  publishedAt: string;
  duration: string;
  speaker?: string;
  coverImage?: string;
  isFeatured?: boolean;
}

const videosData: VideoItem[] = [
  {
    id: 'vismayam-paleri-doc',
    title: 'The Marvel of Paleri: Life and Memory in Literary Landscapes',
    excerpt: 'A retrospective documentary exploring cultural and political history through local literature.',
    youtubeId: 'dQw4w9WgXcQ',
    playlist: 'Documentaries',
    category: 'Literature',
    publishedAt: '2026-09-08T10:00:00.000Z',
    duration: '24:18',
    speaker: 'Editorial Desk',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
    isFeatured: true,
  },
  {
    id: 'gandhi-murder-investigation-talk',
    title: 'The Anatomy of an Assassination: Historical Retrospective & Inquiry',
    excerpt: 'An investigative historical dialogue examining archival records and public trials.',
    youtubeId: 'ysz5S6PUM-U',
    playlist: 'Historical Inquiries',
    category: 'History',
    publishedAt: '2026-09-06T15:00:00.000Z',
    duration: '38:42',
    speaker: 'K. T. Kunhikannan & Editorial Panel',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
    isFeatured: true,
  },
  {
    id: 'hindutva-india-panel',
    title: 'Constitutional Values in Contemporary Times: An Editorial Forum',
    excerpt: 'A critical panel dialogue exploring democratic institutions, civic freedoms, and modern challenges.',
    youtubeId: 'jNQXAC9IVRw',
    playlist: 'Democratic Debates',
    category: 'Politics',
    publishedAt: '2026-09-04T12:00:00.000Z',
    duration: '45:10',
    speaker: 'Damodar Prasad & K. Kannan',
    coverImage: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=800',
    isFeatured: false,
  },
  {
    id: 'venu-cinema-stories',
    title: 'Behind the Lens: The Aesthetics and Craft of Cinematography',
    excerpt: 'Veteran cinematographer Venu reflects on visual storytelling and cinematic composition.',
    youtubeId: 'kJQP7kiw5Fk',
    playlist: 'Cinema Conversations',
    category: 'Cinema',
    publishedAt: '2026-09-02T16:30:00.000Z',
    duration: '32:05',
    speaker: 'Venu (Cinematographer / Director)',
    coverImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=800',
    isFeatured: false,
  },
  {
    id: 'western-ghats-ecology-doc',
    title: 'The Western Ghats & Climate Vulnerability: Ground Reality',
    excerpt: 'An ecological documentary analyzing rain patterns, ecological preservation, and disaster management.',
    youtubeId: '9bZkp7q19f0',
    playlist: 'Documentaries',
    category: 'Environment',
    publishedAt: '2026-08-30T14:00:00.000Z',
    duration: '28:50',
    speaker: 'S. P. Ravi',
    coverImage: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&q=80&w=800',
    isFeatured: false,
  },
  {
    id: 'grandma-stories-oral-history',
    title: 'Folk Memory & Oral Histories: Voices Across Generations',
    excerpt: 'Documenting village folklore, oral histories, and matrilineal accounts across eras.',
    youtubeId: 'L_LUpnjgPso',
    playlist: 'Oral Histories',
    category: 'Culture',
    publishedAt: '2026-08-25T11:00:00.000Z',
    duration: '19:15',
    speaker: 'Editorial Team',
    coverImage: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?auto=format&fit=crop&q=80&w=800',
    isFeatured: false,
  },
  {
    id: 'editors-assembly-saniv-bhatt',
    title: 'Justice, Liberties & The Legal Paradigm: An Editorial Discussion',
    excerpt: 'A dialogue dissecting criminal jurisprudence and judicial reform in the modern republic.',
    youtubeId: 'ZXsQAXx_ao0',
    playlist: 'Democratic Debates',
    category: 'Politics',
    publishedAt: '2026-08-20T18:00:00.000Z',
    duration: '41:22',
    speaker: 'Editorial Collective',
    coverImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800',
    isFeatured: false,
  },
];

export default function VideosPage() {
  const [activeVideo, setActiveVideo] = useState<VideoItem>(videosData[0]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('All');

  const playlists = ['All', ...new Set(videosData.map((v) => v.playlist).filter(Boolean))] as string[];

  const filteredVideos =
    selectedPlaylist === 'All'
      ? videosData
      : videosData.filter((v) => v.playlist === selectedPlaylist);

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Portal Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          <Film className="w-4 h-4" />
          <span>Videos &amp; Documentaries</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight break-words">
          Video Essays, Documentaries &amp; Discussions
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base max-w-3xl leading-relaxed">
          A curated visual platform featuring in-depth documentaries, editorial discussions, cinematic analyses, and oral histories.
        </p>
      </header>

      {/* Featured Video Active Player Dock */}
      <div className="bg-neutral-950 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 text-white">
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=0&rel=0`}
            title={activeVideo.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>

        <div className="p-4 sm:p-6 md:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full font-bold bg-brand-600 text-white">
                {activeVideo.category}
              </span>
              {activeVideo.playlist && (
                <span className="px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 font-medium">
                  {activeVideo.playlist}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                {activeVideo.duration}
              </span>
            </div>
          </div>

          <h2 className="font-serif text-xl sm:text-3xl font-bold leading-snug break-words">
            {activeVideo.title}
          </h2>

          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed max-w-4xl break-words">
            {activeVideo.excerpt}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-800 text-xs text-neutral-400">
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-4 h-4 text-brand-400 shrink-0" />
              <span className="font-semibold text-neutral-200 truncate">
                {activeVideo.speaker}
              </span>
            </div>
            <span className="shrink-0">Now Playing</span>
          </div>
        </div>
      </div>

      {/* Playlist / Category Filter Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Film className="w-5 h-5 text-brand-600 shrink-0" />
            <span>Playlists &amp; Series</span>
          </h3>
          <span className="text-xs text-neutral-500 font-bold shrink-0">
            {filteredVideos.length} Videos
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none overscroll-x-contain pb-2 w-full min-w-0">
          {playlists.map((pl) => (
            <button
              key={pl}
              onClick={() => setSelectedPlaylist(pl)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                selectedPlaylist === pl
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {pl === 'All' ? 'All Videos' : pl}
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => {
          const isSelected = activeVideo.id === video.id;
          return (
            <div
              key={video.id}
              onClick={() => {
                setActiveVideo(video);
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
              className={`group cursor-pointer flex flex-col justify-between bg-paper-card dark:bg-paper-cardDark rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all ${
                isSelected
                  ? 'border-brand-600 ring-2 ring-brand-600/30 dark:border-brand-500'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
              }`}
            >
              <div>
                <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
                  {video.coverImage ? (
                    <Image
                      src={video.coverImage}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                      <Film className="w-10 h-10 text-neutral-600" />
                    </div>
                  )}

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-brand-600/90 group-hover:bg-brand-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[11px] font-bold bg-black/80 text-white backdrop-blur-sm">
                    {video.duration}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      {video.playlist || video.category}
                    </span>
                  </div>

                  <h4 className="font-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug">
                    {video.title}
                  </h4>

                  <p className="text-neutral-500 dark:text-neutral-400 text-xs line-clamp-2 leading-relaxed">
                    {video.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-neutral-100 dark:border-neutral-800/80 mt-2 flex items-center justify-between text-xs text-neutral-500">
                <span className="line-clamp-1 font-medium text-neutral-700 dark:text-neutral-300">
                  {video.speaker}
                </span>
                {isSelected && (
                  <span className="text-brand-600 dark:text-brand-400 font-bold shrink-0">
                    Playing
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
