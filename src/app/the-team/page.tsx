import React from 'react';
import Image from 'next/image';
import { getTeamMembers } from '@/lib/content';
import { Users } from 'lucide-react';

export const metadata = {
  title: 'The Team — oldmangotree',
  description: 'The people who first sat under the OG mango tree — Akhil U Krishnan and Amala Thomas.',
};

export default function TheTeamPage() {
  const team = getTeamMembers();

  return (
    <div className="space-y-12 sm:space-y-16 pb-8 sm:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <header className="space-y-4 pt-2 sm:pt-4 border-b border-neutral-200 dark:border-neutral-800 pb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-[#E27A2B]">
          <Users className="w-4 h-4 text-[#E27A2B]" />
          <span className="underline decoration-[#E27A2B] underline-offset-4 decoration-2">Editorial Founders</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight leading-tight uppercase">
          THE PEOPLE WHO FIRST SAT UNDER THE OG MANGO TREE
        </h1>
      </header>

      {/* Team Members List (Text-focused, future-ready for avatars or new members) */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {team.map((member) => (
            <div
              key={member.id || member.name}
              className="p-6 sm:p-7 border-l-2 border-[#E27A2B] bg-neutral-50/70 dark:bg-neutral-900/40 space-y-2 transition-colors"
            >
              {member.avatar ? (
                <div className="relative aspect-square w-24 h-24 mb-4 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <Image
                    src={member.avatar}
                    alt={member.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                {member.name}
              </h2>

              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E27A2B]">
                {member.role}
              </p>

              {member.bio ? (
                <p className="text-sm text-neutral-700 dark:text-neutral-300 pt-2 leading-relaxed font-sans">
                  {member.bio}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* Story & Manifesto */}
      <section className="space-y-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="space-y-6 font-serif text-base sm:text-lg md:text-xl text-neutral-800 dark:text-neutral-200 leading-relaxed max-w-3xl">
          <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 leading-snug">
            Two friends. A lot of conversations and questions.
          </p>

          <p>
            We are not trained critics, journalists or academics in the fields we write about. We are simply two people who read, observe, and notice things, and spend an unreasonable amount of time discussing them.
          </p>

          <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-lg sm:text-xl">
            oldmangotree grew out of those conversations.
          </p>

          <p>
            Some began with a film. Some with a book. Some with something we noticed around us. And some simply began with a question — why do we think this way?
            <br />
            We wanted to take those conversations beyond ourselves and give them a place to grow.
            <br />
            oldmangotree is that place.
          </p>

          <p>
            We write about art, literature, cinema, culture, society and the many things that make us pause, think, disagree, wonder or look at something familiar differently.
          </p>

          <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <p className="italic font-bold text-[#E27A2B] text-lg sm:text-xl md:text-2xl tracking-wide">
              *No credentials to impress. Just ideas worth talking about.*
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
