/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Orange (Mango / Highlights / Buttons / Badges)
        brand: {
          50: '#fff8ed',
          100: '#ffeed4',
          200: '#ffd9a8',
          300: '#ffbc70',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        // Deep Navy Blue (Typography / Dark Mode Backgrounds / Accents)
        navy: {
          50: '#f0f5fa',
          100: '#e1ebf4',
          200: '#c5d8ea',
          300: '#9bbdde',
          400: '#699ccf',
          500: '#437fc0',
          600: '#3266a8',
          700: '#285188',
          800: '#1b365d',
          900: '#0f1f38',
          950: '#0a1424',
        },
        // Reading Paper backgrounds (Clean Off-White for Light, Navy for Dark)
        paper: {
          light: '#fcfbf7',
          dark: '#0a1424',
          card: '#ffffff',
          cardDark: '#0f1f38',
          muted: '#f4f1ea',
          mutedDark: '#14233c',
        },
        // Alternate Presets (Sage Green & Accent Yellow)
        sage: {
          50: '#f4f7f4',
          100: '#e5ece5',
          200: '#ccdccd',
          300: '#a7c2a8',
          500: '#6b8e6b',
          700: '#405b40',
          800: '#2d3f2d',
          900: '#1a261a',
        },
        accentYellow: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
        },
      },
      fontFamily: {
        sans: ['DzainTrueCopy', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['DzainTrueCopy', 'Georgia', 'Cambria', 'serif'],
        text: ['"Dzain-TrueCopy Text"', 'DzainTrueCopy', 'Georgia', 'serif'],
        inline: ['"DzainTrueCopy Inline"', 'DzainTrueCopy', 'sans-serif'],
        ml: ['DzainTrueCopy', '"Dzain-TrueCopy Text"', 'Noto Sans Malayalam', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
