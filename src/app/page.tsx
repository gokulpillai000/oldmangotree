import React from 'react';
import { getAllArticles } from '@/lib/content';
import { WidgetGrid } from '@/components/WidgetGrid';

export const revalidate = 60; // ISR for static build

export default async function HomePage() {
  const articles = await getAllArticles(false);

  return (
    <div className="space-y-10">
      <WidgetGrid articles={articles} />
    </div>
  );
}
