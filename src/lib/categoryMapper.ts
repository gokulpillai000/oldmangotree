/**
 * Tag-to-Category Auto Mapper
 * Maps user-selected article tags to official webzine categories:
 * cinema, sports, politics, arts-culture, literature, miscellaneous
 */

export const POPULAR_TAG_SUGGESTIONS = [
  'Cinema',
  'Sports',
  'Politics',
  'Arts & Culture',
  'Literature',
  'Book Review',
  'Short Stories',
  'Miscellaneous',
  'Kerala',
  'Elections',
  'Society',
  'Culture',
  'Ecology',
  'Football',
  'Cricket',
  'Film Studies',
];

export function determineCategoryFromTags(tags: string[]): string {
  if (!tags || tags.length === 0) return 'politics';

  const normalizedTags = tags.map((t) => t.toLowerCase().trim());

  const cinemaKeywords = ['cinema', 'film', 'movie', 'director', 'screenplay', 'actor', 'hollywood', 'mollywood', 'theatre-film'];
  const sportsKeywords = ['sports', 'football', 'cricket', 'games', 'athlete', 'messi', 'match', 'olympics', 'fifa'];
  const politicsKeywords = ['politics', 'kerala', 'elections', 'society', 'government', 'policy', 'state', 'rights', 'democracy'];
  const artsKeywords = ['arts', 'art', 'culture', 'heritage', 'music', 'visual-arts', 'sculpture', 'painting', 'folk', 'dance', 'drama'];
  const literatureKeywords = ['literature', 'books', 'book review', 'short stories', 'fiction', 'novel', 'poetry', 'essay', 'author', 'writing'];
  const miscKeywords = ['miscellaneous', 'philosophy', 'commentary', 'satire', 'opinion', 'reflection', 'perspective'];

  const scores: Record<string, number> = {
    cinema: 0,
    sports: 0,
    politics: 0,
    'arts-culture': 0,
    literature: 0,
    miscellaneous: 0,
  };

  for (const tag of normalizedTags) {
    if (cinemaKeywords.some((k) => tag.includes(k))) scores.cinema++;
    if (sportsKeywords.some((k) => tag.includes(k))) scores.sports++;
    if (politicsKeywords.some((k) => tag.includes(k))) scores.politics++;
    if (artsKeywords.some((k) => tag.includes(k))) scores['arts-culture']++;
    if (literatureKeywords.some((k) => tag.includes(k))) scores.literature++;
    if (miscKeywords.some((k) => tag.includes(k))) scores.miscellaneous++;
  }

  let bestCategory = 'politics';
  let maxHits = 0;

  for (const [cat, count] of Object.entries(scores)) {
    if (count > maxHits) {
      maxHits = count;
      bestCategory = cat;
    }
  }

  return bestCategory;
}
