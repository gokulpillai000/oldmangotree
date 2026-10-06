/**
 * Tag-to-Category Auto Mapper
 * Maps user-selected article tags to official webzine categories:
 * cinema, sports, politics, the-shade, literature, fallen-mangoes
 */

export const POPULAR_TAG_SUGGESTIONS = [
  'Cinema',
  'Sports',
  'Politics',
  'The shade',
  'Literature',
  'Book Review',
  'Short Stories',
  'Fallen mangoes',
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
  const artsKeywords = ['the-shade', 'the shade', 'shade', 'arts', 'art', 'culture', 'heritage', 'music', 'visual-arts', 'sculpture', 'painting', 'folk', 'dance', 'drama'];
  const literatureKeywords = ['literature', 'books', 'book review', 'short stories', 'fiction', 'novel', 'poetry', 'essay', 'author', 'writing'];
  const miscKeywords = ['fallen-mangoes', 'fallen mangoes', 'mangoes', 'miscellaneous', 'philosophy', 'commentary', 'satire', 'opinion', 'reflection', 'perspective'];

  const scores: Record<string, number> = {
    cinema: 0,
    sports: 0,
    politics: 0,
    'the-shade': 0,
    literature: 0,
    'fallen-mangoes': 0,
  };

  for (const tag of normalizedTags) {
    if (cinemaKeywords.some((k) => tag.includes(k))) scores.cinema++;
    if (sportsKeywords.some((k) => tag.includes(k))) scores.sports++;
    if (politicsKeywords.some((k) => tag.includes(k))) scores.politics++;
    if (artsKeywords.some((k) => tag.includes(k))) scores['the-shade']++;
    if (literatureKeywords.some((k) => tag.includes(k))) scores.literature++;
    if (miscKeywords.some((k) => tag.includes(k))) scores['fallen-mangoes']++;
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
