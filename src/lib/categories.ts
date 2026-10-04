export interface SiteCategory {
  name: string;
  href: string;
  symbol: string;
}

export const SITE_CATEGORIES: SiteCategory[] = [
  { name: 'Arts & Culture', href: '/arts-culture', symbol: '🎨' },
  { name: 'Cinema', href: '/cinema', symbol: '🎥' },
  { name: 'Literature', href: '/literature', symbol: '📚' },
  { name: 'Politics', href: '/politics', symbol: '🏛️' },
  { name: 'Sports', href: '/sports', symbol: '🏏' },
  { name: 'Miscellaneous', href: '/miscellaneous', symbol: '💭' },
  { name: 'Special Series', href: '/series', symbol: '📑' },
  { name: 'Webzine', href: '/magazine', symbol: '📰' },
  { name: 'Audio & Podcast', href: '/podcasts', symbol: '🎙️' },
];
