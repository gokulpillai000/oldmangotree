'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

export interface AudioTrack {
  title: string;
  url: string;
  durationSeconds?: number;
  articleSlug?: string;
  speaker?: string;
}

interface AudioContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  playTrack: (track: AudioTrack) => void;
  togglePlayPause: () => void;
  toggleMute: () => void;
  seekTo: (time: number) => void;
  closeTrack: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRateState] = useState<number>(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackRateRef = useRef<number>(1);

  // Helper to ensure audio element applies playbackRate and pitch preservation across browsers
  const applyRateToElement = React.useCallback((rate: number) => {
    if (!audioRef.current) return;
    try {
      audioRef.current.defaultPlaybackRate = rate;
      audioRef.current.playbackRate = rate;
      if ('preservesPitch' in audioRef.current) {
        audioRef.current.preservesPitch = true;
      }
      if ('webkitPreservesPitch' in audioRef.current) {
        (audioRef.current as any).webkitPreservesPitch = true;
      }
      if ('mozPreservesPitch' in audioRef.current) {
        (audioRef.current as any).mozPreservesPitch = true;
      }
    } catch (e) {
      console.warn('Could not apply playback rate:', e);
    }
  }, []);

  const setPlaybackRate = (rate: number) => {
    playbackRateRef.current = rate;
    applyRateToElement(rate);
    setPlaybackRateState(rate);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();

      const audio = audioRef.current;
      audio.preload = 'auto';

      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleLoadedMetadata = () => {
        setDuration(audio.duration || 0);
        applyRateToElement(playbackRateRef.current);
      };
      const handleCanPlay = () => {
        applyRateToElement(playbackRateRef.current);
      };
      const handlePlay = () => {
        setIsPlaying(true);
        applyRateToElement(playbackRateRef.current);
      };
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);
      const handleRateChange = () => {
        // Prevent browser internal media pipeline from silently resetting rate back to 1.0
        if (Math.abs(audio.playbackRate - playbackRateRef.current) > 0.01) {
          applyRateToElement(playbackRateRef.current);
        }
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('ratechange', handleRateChange);

      return () => {
        audio.pause();
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('ratechange', handleRateChange);
      };
    }
  }, [applyRateToElement]);

  const playTrack = (track: AudioTrack) => {
    if (!audioRef.current) return;

    if (currentTrack?.url === track.url) {
      togglePlayPause();
      return;
    }

    setCurrentTrack(track);
    audioRef.current.src = track.url;
    audioRef.current.muted = isMuted;
    applyRateToElement(playbackRateRef.current);

    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        applyRateToElement(playbackRateRef.current);
      })
      .catch((err) => console.error('Audio playback failed:', err));
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      applyRateToElement(playbackRateRef.current);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          applyRateToElement(playbackRateRef.current);
        })
        .catch((err) => console.error('Audio playback failed:', err));
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !audioRef.current.muted;
    audioRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      applyRateToElement(playbackRateRef.current);
    }
  };

  const closeTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setCurrentTrack(null);
    setCurrentTime(0);
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isMuted,
        currentTime,
        duration,
        playbackRate,
        setPlaybackRate,
        playTrack,
        togglePlayPause,
        toggleMute,
        seekTo,
        closeTrack,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
