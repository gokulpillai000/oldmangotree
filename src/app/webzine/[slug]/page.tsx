import React from 'react';
import { getArticleBySlug, getAllArticles, getRelatedArticles } from '@/lib/content';
import { ArticleViewClient } from '@/components/ArticleViewClient';

interface WebzineArticlePageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const articles = await getAllArticles();
  const webzineArticles = articles.filter(
    (a) =>
      a.category?.toLowerCase() === 'webzine' ||
      Boolean(a.webzineIssue && a.webzineIssue.trim() && a.webzineIssue !== 'None')
  );
  if (webzineArticles.length === 0) return [{ slug: '_empty' }];
  return webzineArticles.map((a) => ({
    slug: a.slug,
  }));
}

export default async function WebzineArticlePage({ params }: WebzineArticlePageProps) {
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
