'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Edit3, ShieldCheck, PenTool, LogOut } from 'lucide-react';
import { getStoredSession, setStoredSession, UserSession } from '@/lib/clientAuth';

interface ArticlePublisherControlsProps {
  slug: string;
  category?: string;
}

export function ArticlePublisherControls({ slug }: ArticlePublisherControlsProps) {
  const [session, setSession] = useState<UserSession | null>(null);

  const handleExitPublisher = () => {
    sessionStorage.removeItem('omt_editorial_auth');
    try {
      localStorage.removeItem('omt_editorial_last_active');
    } catch {}
    setStoredSession(null);
  };

  useEffect(() => {
    const sync = () => {
      const sess = getStoredSession();
      if (sess && sess.role === 'publisher') {
        setSession(sess);
      } else {
        setSession(null);
      }
    };
    sync();

    window.addEventListener('omt-auth-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('omt-auth-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Normal users never see this
  if (!session || session.role !== 'publisher') return null;

  return (
    <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-[#0C2340] text-white border border-slate-700 shadow-sm justify-between flex-wrap text-xs">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <ShieldCheck className="w-3.5 h-3.5 text-[#E27A2B]" />
        <span className="font-bold text-slate-200">Publisher View Active</span>
        <span className="text-slate-400 hidden sm:inline">• {session.name}</span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/publisher?edit=${slug}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E27A2B] hover:bg-[#c9661d] text-white font-bold shadow-xs transition-colors"
        >
          <Edit3 className="w-3 h-3" />
          <span>Edit This Story</span>
        </Link>
        <Link
          href="/publisher"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
        >
          <PenTool className="w-3 h-3 text-[#E27A2B]" />
          <span>Desk</span>
        </Link>
        <button
          type="button"
          onClick={handleExitPublisher}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/60 border border-slate-700 hover:border-red-800/80 text-slate-200 hover:text-red-300 font-bold transition-colors cursor-pointer"
          title="Exit publisher view and return to standard reader view"
        >
          <LogOut className="w-3 h-3 text-red-400" />
          <span>Exit</span>
        </button>
      </div>
    </div>
  );
}
