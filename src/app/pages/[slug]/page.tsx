import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPageContent, getAllPages } from '@/lib/content';
import { FileText, ArrowLeft } from 'lucide-react';

interface StaticPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  const pages = getAllPages();
  return pages.map((slug) => ({
    slug,
  }));
}

export default async function StaticInfoPage({ params }: StaticPageProps) {
  const page = await getPageContent(params.slug);

  if (!page) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto py-4 sm:py-8 space-y-6 sm:space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <header className="border-b border-neutral-200 dark:border-neutral-800 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          <FileText className="w-4 h-4" />
          <span>Official Information &amp; Policy</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight break-words">
          {page.title}
        </h1>
        {page.subtitle && (
          <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base break-words">
            {page.subtitle}
          </p>
        )}
      </header>

      <div
        className="prose prose-neutral dark:prose-invert max-w-none font-serif text-base sm:text-lg leading-relaxed space-y-4 overflow-hidden break-words"
        dangerouslySetInnerHTML={{ __html: page.contentHtml || '' }}
      />
    </article>
  );
}
