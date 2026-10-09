import React from 'react';
import { getArticleBySlug, getAllArticles, getRelatedArticles } from '@/lib/content';
import { ArticleViewClient } from '@/components/ArticleViewClient';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const articles = await getAllArticles();
  if (articles.length === 0) return [{ slug: '_empty' }];
  return articles.map((a) => ({
    slug: a.slug,
  }));
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = params;
  const article = await getArticleBySlug(slug);

  let relatedArticles: any[] = [];
  if (article) {
    const allArticles = await getAllArticles();
    relatedArticles = getRelatedArticles(article, 3, allArticles);
  }

  return (
    <ArticleViewClient
      slug={slug}
      initialArticle={article}
      relatedArticles={relatedArticles}
    />
  );
}
