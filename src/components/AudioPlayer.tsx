'use client';

import React, { useState } from 'react';
import { useAudio } from './AudioContext';
import { Play, Pause, Radio, ChevronUp, ChevronDown, Volume2, VolumeX, X } from 'lucide-react';

function formatTime(seconds: number) {
  if (isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function AudioPlayer() {
  const { currentTrack, isPlaying, isMuted, currentTime, duration, togglePlayPause, toggleMute, seekTo, closeTrack } = useAudio();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-[56px] md:bottom-0 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 text-white shadow-2xl transition-all duration-300">
      {/* Mobile Expandable Overlay View */}
      {isExpanded && (
        <div className="p-4 space-y-4 border-b border-neutral-800 bg-neutral-950 md:hidden max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
              <Radio className="w-4 h-4 animate-pulse" /> High-Fidelity Audio Stream
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 text-neutral-400 hover:text-white"
                title={isMuted ? "Unmute audio" : "Mute audio"}
                aria-label={isMuted ? "Unmute audio" : "Mute audio"}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 text-neutral-400 hover:text-white"
                title="Minimize player"
                aria-label="Minimize player"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <button
                onClick={closeTrack}
                className="p-1.5 text-neutral-400 hover:text-white"
                title="Close player"
                aria-label="Close audio player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-1 text-center py-2">
            <h4 className="font-serif font-bold text-base text-neutral-100 line-clamp-2">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-brand-300 font-medium">oldmangotree High-Fidelity Audio</p>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 appearance-none cursor-pointer accent-brand-500"
            />
            <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Bar (Mobile Compact + Desktop Full) */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 md:w-1/4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-brand-700 flex items-center justify-center text-white shrink-0 shadow">
            <Radio className={`w-4 h-4 sm:w-5 sm:h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>
          <div className="truncate min-w-0">
            <p className="text-xs uppercase text-[#E27A2B] font-bold tracking-wider hidden sm:block">
              Now Playing
            </p>
            <p className="text-sm sm:text-base font-semibold truncate text-neutral-100 leading-tight">
              {currentTrack.title}
            </p>
            <p className="text-xs text-neutral-300 font-medium sm:hidden">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
        </div>

        {/* Desktop Controls & Seekbar */}
        <div className="hidden md:flex flex-col items-center gap-1 w-2/4">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlayPause}
              className="w-9 h-9 bg-brand-600 hover:bg-brand-500 flex items-center justify-center text-white transition-colors shadow"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full text-xs sm:text-sm text-neutral-300">
            <span className="font-mono text-xs sm:text-sm font-medium">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-700 appearance-none cursor-pointer accent-brand-500"
            />
            <span className="font-mono text-xs sm:text-sm font-medium">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-1.5 md:hidden">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 text-neutral-400 hover:text-white"
            title={isMuted ? "Unmute audio" : "Mute audio"}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={togglePlayPause}
            className="w-9 h-9 bg-brand-600 active:bg-brand-500 flex items-center justify-center text-white shadow"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-neutral-400 hover:text-white"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
          <button
            onClick={closeTrack}
            className="p-1.5 text-neutral-400 hover:text-white"
            title="Close audio player"
            aria-label="Close audio player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auxiliary info / Volume (Desktop) */}
        <div className="hidden md:flex items-center justify-end gap-3 w-1/4 text-neutral-300 text-xs sm:text-sm">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            title={isMuted ? "Unmute audio" : "Mute audio"}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-neutral-200" />
            )}
            <span className="text-xs font-semibold text-neutral-200">
              {isMuted ? 'Unmute' : 'Mute'}
            </span>
          </button>
          <span className="uppercase tracking-wider text-xs font-bold bg-neutral-800 px-2 py-1 border border-neutral-700 text-neutral-200">
            High-Fidelity Audio
          </span>
          <button
            onClick={closeTrack}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors ml-1"
            title="Close audio player"
            aria-label="Close audio player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
