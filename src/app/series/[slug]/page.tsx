import React from 'react';
import { notFound } from 'next/navigation';
import { getAllSeries, getSeriesBySlug } from '@/lib/content';
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
  const series = await getSeriesBySlug(params.slug);

  if (!series) {
    notFound();
  }

  return <SeriesDetailClient initialSeries={series} />;
}
