import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getIssueById, getAllIssues, getAllArticles } from '@/lib/content';
import { formatDate } from '@/lib/format';
import { BookOpen, Lock, ArrowRight } from 'lucide-react';

interface IssuePageProps {
  params: {
    packet: string;
  };
}

export const revalidate = 60;

export async function generateStaticParams() {
  const issues = await getAllIssues();
  return issues.map((i) => ({
    packet: i.id,
  }));
}

export default async function IssuePacketPage({ params }: IssuePageProps) {
  const { packet } = params;
  const issue = await getIssueById(packet);

  if (!issue) {
    notFound();
  }

  const allArticles = await getAllArticles();
  const issueArticles = allArticles.filter((a) =>
    issue.articleSlugs.includes(a.slug)
  );

  return (
    <div className="space-y-10">
      {/* Packet Header Banner */}
      <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-900 dark:bg-neutral-950 text-white p-5 sm:p-8 md:p-12 shadow-md border border-neutral-800">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
          <div className="md:col-span-8 space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1 rounded-full text-xs sm:text-sm font-serif font-bold uppercase tracking-widest bg-brand-700 text-white">
                ISSUE {issue.issueNumber}
              </span>
              <span className="text-xs sm:text-sm text-neutral-400 font-medium">
                {new Date(issue.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight break-words">
              {issue.title}
            </h1>

            <p className="text-lg sm:text-2xl text-neutral-300 font-serif italic leading-relaxed break-words">
              “{issue.theme}”
            </p>
          </div>

          <div className="md:col-span-4 flex justify-center">
            <div className="relative w-48 h-64 sm:w-56 sm:h-72 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 transform rotate-2 hover:rotate-0 transition-transform duration-300">
              <Image src={issue.coverImage} alt={issue.title} fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Packet Table of Contents */}
      <section className="space-y-6">
        <div className="border-b border-neutral-200 dark:border-neutral-800 pb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-600" /> Packet Contents ({issueArticles.length} Stories)
          </h2>
        </div>

        <div className="space-y-4">
          {issueArticles.map((article, index) => (
            <div
              key={article.slug}
              className="group p-4 sm:p-6 md:p-7 rounded-2xl bg-paper-card dark:bg-paper-cardDark border border-neutral-200 dark:border-neutral-800 hover:border-brand-500 transition-all shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6"
            >
              <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                <span className="font-serif text-2xl sm:text-4xl font-bold text-neutral-300 dark:text-neutral-700 group-hover:text-brand-600 transition-colors shrink-0">
                  0{index + 1}
                </span>
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-brand-600 uppercase">
                    <span>{article.category}</span>
                    {article.isPremium && (
                      <span className="flex items-center gap-1 text-brand-700 dark:text-brand-300 font-medium">
                        <Lock className="w-3.5 h-3.5" /> Member
                      </span>
                    )}
                  </div>
                  <Link href={`/articles/${article.slug}`}>
                    <h3 className="font-serif text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug break-words">
                      {article.title}
                    </h3>
                  </Link>
                  <p className="text-xs sm:text-base text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed break-words">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-neutral-500 pt-1.5 font-sans">
                    <span className="font-serif font-bold text-neutral-800 dark:text-neutral-200 truncate">{article.authorNames}</span>
                    <span>•</span>
                    <span className="shrink-0">{formatDate(article.publishedAt)}</span>
                  </div>
                </div>
              </div>

              <Link
                href={`/articles/${article.slug}`}
                className="w-full md:w-auto shrink-0 flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs sm:text-sm font-bold group-hover:bg-brand-700 group-hover:text-white transition-colors"
              >
                Read Article <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
