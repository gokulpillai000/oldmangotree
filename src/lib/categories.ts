export interface SiteCategory {
  name: string;
  href: string;
  symbol: string;
}

export const SITE_CATEGORIES: SiteCategory[] = [
  { name: 'The shade', href: '/the-shade', symbol: '🎨' },
  { name: 'Cinema', href: '/cinema', symbol: '🎥' },
  { name: 'Literature', href: '/literature', symbol: '📚' },
  { name: 'Politics', href: '/politics', symbol: '🏛️' },
  { name: 'Sports', href: '/sports', symbol: '🏏' },
  { name: 'Fallen mangoes', href: '/fallen-mangoes', symbol: '💭' },
  { name: 'Special Series', href: '/series', symbol: '📑' },
  { name: 'Webzine', href: '/magazine', symbol: '📰' },
  { name: 'Audio & Podcast', href: '/podcasts', symbol: '🎙️' },
];
