import React from 'react';
import { getAllArticles, isAudioArticle } from '@/lib/content';
import { WidgetGrid } from '@/components/WidgetGrid';

export const revalidate = 60; // ISR for static build

export default async function HomePage() {
  const allArticles = await getAllArticles(false);
  const articles = allArticles.filter((a) => !isAudioArticle(a));

  return (
    <div className="space-y-10">
      <WidgetGrid articles={articles} />
    </div>
  );
}
