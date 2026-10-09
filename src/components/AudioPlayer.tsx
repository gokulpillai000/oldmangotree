'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from './AudioContext';
import { Play, Pause, Radio, Volume2, VolumeX, X, Gauge } from 'lucide-react';

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(seconds: number) {
  if (isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function AudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    isMuted,
    currentTime,
    duration,
    playbackRate,
    setPlaybackRate,
    togglePlayPause,
    toggleMute,
    seekTo,
    closeTrack,
  } = useAudio();

  const [showMobileSpeed, setShowMobileSpeed] = useState(false);
  const [showDesktopSpeed, setShowDesktopSpeed] = useState(false);
  const mobileSpeedRef = useRef<HTMLDivElement>(null);
  const desktopSpeedRef = useRef<HTMLDivElement>(null);

  // Close speed popover when clicking or tapping outside
  useEffect(() => {
    if (!showMobileSpeed && !showDesktopSpeed) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (showMobileSpeed && mobileSpeedRef.current && !mobileSpeedRef.current.contains(target)) {
        setShowMobileSpeed(false);
      }
      if (showDesktopSpeed && desktopSpeedRef.current && !desktopSpeedRef.current.contains(target)) {
        setShowDesktopSpeed(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showMobileSpeed, showDesktopSpeed]);

  if (!currentTrack) return null;

  const progressPercent =
    duration && duration > 0
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  return (
    <div className="fixed bottom-[56px] md:bottom-0 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 text-white shadow-2xl transition-all duration-300">
      {/* Mobile Top Progress Seekbar (Interactive, Slim, Single Bar) */}
      <div className="md:hidden w-full relative h-1.5 bg-neutral-800 flex items-center">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => seekTo(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, #E27A2B ${progressPercent}%, #383838 ${progressPercent}%)`,
          }}
          className="w-full h-1.5 appearance-none cursor-pointer accent-[#E27A2B] focus:outline-none"
          aria-label="Seek audio"
        />
      </div>

      {/* Main Single Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2.5 sm:gap-3">
        {/* Track Info */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 md:w-1/4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#E27A2B] flex items-center justify-center text-white shrink-0 shadow">
            <Radio className={`w-4 h-4 sm:w-5 sm:h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>
          <div className="truncate min-w-0">
            <p className="text-[11px] uppercase text-[#E27A2B] font-bold tracking-wider hidden sm:block">
              Now Playing
            </p>
            <p className="text-xs sm:text-base font-semibold truncate text-neutral-100 leading-tight">
              {currentTrack.title}
            </p>
            <p className="text-[11px] font-medium sm:hidden flex items-center gap-1">
              <span className="text-[#E27A2B] font-mono font-semibold">{formatTime(currentTime)}</span>
              <span className="text-neutral-500">/</span>
              <span className="text-neutral-400 font-mono">{formatTime(duration)}</span>
            </p>
          </div>
        </div>

        {/* Desktop Controls & Seekbar */}
        <div className="hidden md:flex flex-col items-center gap-1 w-2/4">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlayPause}
              className="w-9 h-9 bg-[#E27A2B] hover:bg-[#d0691c] flex items-center justify-center text-white transition-colors shadow cursor-pointer"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full text-xs sm:text-sm text-neutral-300">
            <span className="font-mono text-xs sm:text-sm font-semibold text-[#E27A2B]">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              style={{
                background: `linear-gradient(to right, #E27A2B ${progressPercent}%, #383838 ${progressPercent}%)`,
              }}
              className="w-full h-1.5 appearance-none cursor-pointer accent-[#E27A2B] rounded-full focus:outline-none"
              aria-label="Seek audio"
            />
            <span className="font-mono text-xs sm:text-sm font-medium text-neutral-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Mobile Controls (Single Bar - Everything Included, No Expansion) */}
        <div className="flex items-center gap-1 shrink-0 md:hidden relative">
          {/* Speed Controller Popover & Trigger */}
          <div ref={mobileSpeedRef} className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileSpeed(!showMobileSpeed);
              }}
              className="px-1.5 py-1 rounded text-[11px] font-mono font-bold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 transition-colors border border-neutral-700 cursor-pointer"
              title="Playback speed (.5x to 2x)"
              aria-label={`Playback speed: ${playbackRate}x`}
            >
              {playbackRate}x
            </button>

            {showMobileSpeed && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute bottom-full mb-2 right-0 bg-neutral-950/95 backdrop-blur-md border border-neutral-700 shadow-2xl p-1.5 z-50 rounded-lg flex flex-col gap-0.5 min-w-[76px]"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1.5 py-0.5 border-b border-neutral-800 text-center">
                  Speed
                </div>
                {SPEED_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlaybackRate(rate);
                      setShowMobileSpeed(false);
                    }}
                    className={`px-2 py-1 text-xs text-center font-mono font-bold rounded transition-colors cursor-pointer ${
                      playbackRate === rate
                        ? 'bg-[#E27A2B] text-white shadow-xs'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mute Button */}
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 text-neutral-400 hover:text-white"
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className="w-8 h-8 bg-[#E27A2B] hover:bg-[#d0691c] active:scale-95 flex items-center justify-center text-white shadow transition-all cursor-pointer"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Close Button */}
          <button
            onClick={closeTrack}
            className="p-1.5 text-neutral-400 hover:text-white"
            title="Close audio player"
            aria-label="Close audio player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auxiliary info / Volume & Speed (Desktop) */}
        <div className="hidden md:flex items-center justify-end gap-2.5 w-1/4 text-neutral-300 text-xs sm:text-sm relative">
          {/* Desktop Speed Controller */}
          <div ref={desktopSpeedRef} className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDesktopSpeed(!showDesktopSpeed);
              }}
              className="px-2 py-1 rounded text-xs font-mono font-bold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition-colors border border-neutral-700 cursor-pointer flex items-center gap-1"
              title="Playback speed (.5x to 2x)"
              aria-label={`Playback speed: ${playbackRate}x`}
            >
              <Gauge className="w-3.5 h-3.5 text-[#E27A2B]" />
              <span>{playbackRate}x</span>
            </button>

            {showDesktopSpeed && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute bottom-full mb-2 right-0 bg-neutral-950/95 backdrop-blur-md border border-neutral-700 shadow-2xl p-1.5 z-50 rounded-lg flex flex-col gap-0.5 min-w-[78px]"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1.5 py-0.5 border-b border-neutral-800 text-center">
                  Speed
                </div>
                {SPEED_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlaybackRate(rate);
                      setShowDesktopSpeed(false);
                    }}
                    className={`px-2 py-1 text-xs text-center font-mono font-bold rounded transition-colors cursor-pointer ${
                      playbackRate === rate
                        ? 'bg-[#E27A2B] text-white shadow-xs'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer rounded"
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
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
          <button
            onClick={closeTrack}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors ml-1 cursor-pointer rounded"
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
