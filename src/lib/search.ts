export interface SearchableArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags?: string[];
  publishedAt: string;
  content: string;
  authorNames?: string;
}

export interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags?: string[];
  publishedAt: string;
  authorNames?: string;
}

export function performSearch(articles: SearchableArticle[], query: string): SearchResult[] {
  if (!query || query.trim() === '') return [];

  const normalizedQuery = query.toLowerCase().trim();

  return articles
    .filter((article) => {
      const inTitle = article.title.toLowerCase().includes(normalizedQuery);
      const inExcerpt = article.excerpt.toLowerCase().includes(normalizedQuery);
      const inCategory = article.category.toLowerCase().includes(normalizedQuery);
      const inTags = article.tags?.some((t) => t.toLowerCase().includes(normalizedQuery));
      const inContent = article.content.toLowerCase().includes(normalizedQuery);
      const inAuthor = article.authorNames?.toLowerCase().includes(normalizedQuery);

      return inTitle || inExcerpt || inCategory || inTags || inContent || inAuthor;
    })
    .map((article) => ({
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      category: article.category,
      tags: article.tags,
      publishedAt: article.publishedAt,
      authorNames: article.authorNames,
    }));
}
