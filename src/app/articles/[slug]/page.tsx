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
  const allArticles = await getAllArticles();
  const article = allArticles.find((a) => a.slug === slug) || (await getArticleBySlug(slug));
  const relatedArticles = article ? getRelatedArticles(article, 3, allArticles) : [];

  return (
    <ArticleViewClient
      slug={slug}
      initialArticle={article}
      relatedArticles={relatedArticles}
    />
  );
}
