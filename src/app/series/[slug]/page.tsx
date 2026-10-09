import React from 'react';
import { redirect } from 'next/navigation';
import { getAllSeries, getSeriesBySlug, getArticleBySlug } from '@/lib/content';
import { SeriesDetailClient } from '@/components/SeriesDetailClient';

interface SeriesPageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const series = await getAllSeries();
  if (series.length === 0) return [{ slug: '_empty' }];
  return series.map((s) => ({
    slug: s.slug,
  }));
}

export default async function SeriesDetailPage({ params }: SeriesPageProps) {
  const { slug } = params;

  // 1. If an article exists with this slug, redirect to its article page directly
  const article = await getArticleBySlug(slug);
  if (article) {
    redirect(`/articles/${slug}`);
  }

  // 2. If a series exists with this slug and has only 1 episode, redirect to the article
  const series = await getSeriesBySlug(slug);
  if (series && series.episodes && series.episodes.length === 1) {
    redirect(`/articles/${series.episodes[0].slug}`);
  }

  return <SeriesDetailClient slug={slug} initialSeries={series || null} />;
}
