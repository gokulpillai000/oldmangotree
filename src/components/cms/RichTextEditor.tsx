'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import { Mark, Node as TiptapNode, mergeAttributes } from '@tiptap/core';
import {
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  Image as ImageIcon,
  Film,
  Smile,
  Globe,
  RemoveFormatting,
  ChevronDown,
  ChevronUp,
  Pencil,
  Code,
  Check,
  X,
  Upload,
  ExternalLink,
  Loader2,
  Indent,
  Outdent,
  Search,
  Trash2,
  Crop,
  Sliders,
} from 'lucide-react';
import { compressAndUploadImage, uploadVideoFile } from '@/lib/imageUpload';
import { ImageCropperModal } from './ImageCropperModal';

// Dedicated Interactable Image Extension with Width, Alignment, and Styling
const InteractableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) => element.getAttribute('width') || element.style.width || '100%',
        renderHTML: (attributes) => {
          return {
            width: attributes.width || '100%',
          };
        },
      },
      alignment: {
        default: 'center',
        parseHTML: (element) => (element.getAttribute('data-align') as 'left' | 'center' | 'right') || 'center',
        renderHTML: (attributes) => {
          return {
            'data-align': attributes.alignment || 'center',
          };
        },
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    const align = HTMLAttributes['data-align'] || 'center';
    const width = HTMLAttributes.width || '100%';
    let alignClass = 'mx-auto block my-6 clear-both';
    let blockStyle = 'display: block; margin-left: auto; margin-right: auto; clear: both;';
    if (align === 'left') {
      alignClass = 'mr-auto ml-0 block my-6 clear-both';
      blockStyle = 'display: block; margin-left: 0; margin-right: auto; clear: both;';
    } else if (align === 'right') {
      alignClass = 'ml-auto mr-0 block my-6 clear-both';
      blockStyle = 'display: block; margin-left: auto; margin-right: 0; clear: both;';
    }

    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: `${alignClass} rounded shadow-md cursor-pointer transition-all hover:ring-2 hover:ring-[#E27A2B]`,
        style: `${blockStyle} width: ${width}; max-width: 100%; height: auto;`,
      }),
    ];
  },
});

export const CustomVideo = TiptapNode.create({
  name: 'customVideo',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'video',
        getAttrs: (element) => {
          if (typeof element === 'string') return {};
          return {
            src: element.getAttribute('src'),
            controls: element.hasAttribute('controls'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        controls: 'true',
        class: 'my-6 mx-auto rounded shadow-md max-w-full h-auto w-full',
      }),
    ];
  },
});

export const CustomIframe = TiptapNode.create({
  name: 'customIframe',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe:not([src*="youtube.com"]):not([src*="youtu.be"])',
        getAttrs: (element) => {
          if (typeof element === 'string') return {};
          return {
            src: element.getAttribute('src'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { class: 'my-6 aspect-video w-full rounded overflow-hidden shadow-md' },
      [
        'iframe',
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          class: 'w-full h-full border-0',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: 'true',
        }),
      ],
    ];
  },
});

// Dedicated Tiptap Mark for Font Size (Inline Span with style="font-size: ...")
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSize = Mark.create({
  name: 'fontSize',
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, ''),
        renderHTML: (attributes) => {
          if (!attributes.size) return {};
          return { style: `font-size: ${attributes.size}` };
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'span[style*="font-size"]',
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }) => {
          return chain().setMark(this.name, { size }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name).run();
        },
    };
  },
});

// Comprehensive Inbuilt & Malayalam Fonts List
export interface FontOption {
  name: string;
  value: string;
  category: 'Default' | 'Malayalam' | 'Latin Serif' | 'Latin Sans' | 'Monospace' | 'Custom';
  description?: string;
}

const INBUILT_FONTS: FontOption[] = [
  { name: 'Default Site Font', value: 'inherit', category: 'Default' },

  // ==================== 17 MALAYALAM FONTS ====================
  { name: 'മീര — Meera', value: '"Meera", serif', category: 'Malayalam', description: 'Classic Book & Literature' },
  { name: 'രചന — Rachana', value: '"Rachana", serif', category: 'Malayalam', description: 'Traditional Script' },
  { name: 'മഞ്ചേരി — Manjari', value: '"Manjari", sans-serif', category: 'Malayalam', description: 'Modern Clean Sans' },
  { name: 'ഗായത്രി — Gayathri', value: '"Gayathri", sans-serif', category: 'Malayalam', description: 'Contemporary Headline' },
  { name: 'നോട്ടോ സെരിഫ് — Noto Serif', value: '"Noto Serif Malayalam", serif', category: 'Malayalam', description: 'Formal Editorial' },
  { name: 'നോട്ടോ സാൻസ് — Noto Sans', value: '"Noto Sans Malayalam", sans-serif', category: 'Malayalam', description: 'Clear High-Legibility' },
  { name: 'ചിലങ്ക — Chilanka', value: '"Chilanka", cursive', category: 'Malayalam', description: 'Handwriting / Poetry' },
  { name: 'ദ്യുതി — Dyuthi', value: '"Dyuthi", serif', category: 'Malayalam', description: 'Calligraphic Title' },
  { name: 'കേരളീയം — Keraleeyam', value: '"Keraleeyam", serif', category: 'Malayalam', description: 'Vintage Periodical' },
  { name: 'ഉറൂബ് — Uroob', value: '"Uroob", sans-serif', category: 'Malayalam', description: 'Bold Magazine Display' },
  { name: 'അനേക് — Anek Malayalam', value: '"Anek Malayalam", sans-serif', category: 'Malayalam', description: 'Modern Geometric' },
  { name: 'ബാലൂ ചേട്ടൻ — Baloo Chettan 2', value: '"Baloo Chettan 2", cursive', category: 'Malayalam', description: 'Warm Engaging Display' },
  { name: 'അരിമ — Arima', value: '"Arima", cursive', category: 'Malayalam', description: 'Soft Literary Curve' },
  { name: 'അഞ്ജലി പഴയലിപി — AnjaliOldLipi', value: '"AnjaliOldLipi", serif', category: 'Malayalam', description: 'Classical Orthography' },
  { name: 'കറുമ്പി — Karumbi', value: '"Karumbi", cursive', category: 'Malayalam', description: 'Casual Script' },
  { name: 'സുറുമ — Suruma', value: '"Suruma", serif', category: 'Malayalam', description: 'Stylized Editorial' },
  { name: 'ഡിസൈൻ — DzainTrueCopy', value: '"DzainTrueCopy", sans-serif', category: 'Malayalam', description: 'Old Mango Tree Signature' },

  // ==================== ENGLISH / LATIN FONTS ====================
  // Serif
  { name: 'Georgia (Serif)', value: 'Georgia, serif', category: 'Latin Serif' },
  { name: 'Times New Roman', value: '"Times New Roman", Times, serif', category: 'Latin Serif' },
  { name: 'Garamond', value: 'Garamond, Baskerville, serif', category: 'Latin Serif' },
  { name: 'Merriweather (Google)', value: '"Merriweather", Georgia, serif', category: 'Latin Serif' },
  { name: 'Playfair Display (Google)', value: '"Playfair Display", serif', category: 'Latin Serif' },
  { name: 'Lora (Google)', value: '"Lora", serif', category: 'Latin Serif' },

  // Sans-Serif
  { name: 'Arial (Sans)', value: 'Arial, Helvetica, sans-serif', category: 'Latin Sans' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif', category: 'Latin Sans' },
  { name: 'Verdana', value: 'Verdana, sans-serif', category: 'Latin Sans' },
  { name: 'Roboto (Google)', value: '"Roboto", Arial, sans-serif', category: 'Latin Sans' },
  { name: 'Inter (Google)', value: '"Inter", sans-serif', category: 'Latin Sans' },
  { name: 'Open Sans (Google)', value: '"Open Sans", sans-serif', category: 'Latin Sans' },
  { name: 'Montserrat (Google)', value: '"Montserrat", sans-serif', category: 'Latin Sans' },

  // Monospace
  { name: 'Courier New (Mono)', value: '"Courier New", Courier, monospace', category: 'Monospace' },
  { name: 'Consolas (Mono)', value: 'Consolas, "Courier New", monospace', category: 'Monospace' },
  { name: 'Fira Code (Mono)', value: '"Fira Code", monospace', category: 'Monospace' },
];

const FONT_SIZES = [
  { label: 'Smallest', value: '11px' },
  { label: 'Small', value: '13px' },
  { label: 'Normal', value: '15px' },
  { label: 'Medium', value: '18px' },
  { label: 'Large', value: '24px' },
  { label: 'Largest', value: '32px' },
];

// Exact Google Docs / Blogger 10x8 Material Color Palette Matrix
const MATERIAL_COLOR_MATRIX = [
  ['#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff'],
  ['#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff'],
  ['#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc'],
  ['#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd'],
  ['#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0'],
  ['#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79'],
  ['#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47'],
  ['#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130'],
];

// Google Input Tools Language List matching media_1791222727483.png
const INPUT_TOOL_LANGUAGES = [
  'Afrikaans', 'Albanian', 'Amharic', 'Arabic', 'Armenian', 'Assamese', 'Azerbaijani',
  'Bangla', 'Basque', 'Belarusian', 'Bosnian', 'Bulgarian', 'Burmese',
  'Cantonese (Traditional)', 'Catalan', 'Cebuano', 'Central Kurdish', 'Cherokee',
  'Croatian', 'Czech', 'Danish', 'Dari', 'Divehi', 'Dutch', 'Dzongkha', 'English',
  'Esperanto', 'Estonian', 'Ewe', 'Faroese', 'Filipino', 'Finnish', 'French',
  'Galician', 'Georgian', 'German', 'Greek', 'Gujarati', 'Haitian Creole', 'Hausa',
  'Hawaiian', 'Hebrew', 'Hindi', 'Hmong', 'Hungarian', 'Icelandic', 'Igbo', 'Ilocano',
  'Indonesian', 'Irish', 'Italian', 'Japanese', 'Javanese', 'Kannada', 'Kazakh',
  'Khmer', 'Kinyarwanda', 'Korean', 'Kurdish', 'Kyrgyz', 'Lao', 'Latin', 'Latvian',
  'Lingala', 'Lithuanian', 'Luganda', 'Luxembourgish', 'Macedonian', 'Malagasy',
  'Malay', 'Malayalam (മലയാളം)', 'Maltese', 'Maori', 'Marathi', 'Meiteilon (Manipuri)',
  'Mizo', 'Mongolian', 'Myanmar (Burmese)', 'Nepali', 'Northern Sotho', 'Norwegian',
  'Odia (Oriya)', 'Oromo', 'Pashto', 'Persian', 'Polish', 'Portuguese', 'Punjabi',
  'Quechua', 'Romanian', 'Russian', 'Samoan', 'Sanskrit', 'Scots Gaelic', 'Sepedi',
  'Serbian', 'Sesotho', 'Shona', 'Sindhi', 'Sinhala', 'Slovak', 'Slovenian', 'Somali',
  'Spanish', 'Sundanese', 'Swahili', 'Swedish', 'Tajik', 'Tamil (தமிழ்)', 'Tatar',
  'Telugu (తెలుగు)', 'Thai', 'Tigrinya', 'Tsonga', 'Turkish', 'Turkmen', 'Twi',
  'Ukrainian', 'Urdu (اردو)', 'Uyghur', 'Uzbek', 'Vietnamese', 'Welsh', 'Xhosa',
  'Yiddish', 'Yoruba', 'Zulu',
];

// Comprehensive Language Auto-Detection (Optimized O(1) sampling)
const detectLanguageFromText = (text: string): string => {
  if (!text || !text.trim()) return 'English';
  // Fast sample: test up to first 2,500 characters for instant script detection
  const sample = text.length > 2500 ? text.slice(0, 2500) : text;
  const clean = sample.replace(/<[^>]*>/g, ' ').trim();
  if (!clean) return 'English';

  if (/[\u0D00-\u0D7F]/.test(clean)) return 'Malayalam (മലയാളം)';
  if (/[\u0B80-\u0BFF]/.test(clean)) return 'Tamil (தமிழ்)';
  if (/[\u0C00-\u0C7F]/.test(clean)) return 'Telugu (తెలుగు)';
  if (/[\u0C80-\u0CFF]/.test(clean)) return 'Kannada';
  if (/[\u0980-\u09FF]/.test(clean)) return 'Bangla';
  if (/[\u0A80-\u0AFF]/.test(clean)) return 'Gujarati';
  if (/[\u0900-\u097F]/.test(clean)) return 'Hindi';
  if (/[\u0600-\u06FF]/.test(clean)) return 'Arabic';
  if (/[\u0400-\u04FF]/.test(clean)) return 'Russian';
  if (/[\u0370-\u03FF]/.test(clean)) return 'Greek';
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(clean)) return 'Japanese';
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(clean)) return 'Korean';
  if (/[\u4E00-\u9FFF]/.test(clean)) return 'Cantonese (Traditional)';

  return 'English';
};

// Special Characters Database
const SPECIAL_CHARS_CATALOG: Record<string, Record<string, string[]>> = {
  Emoji: {
    'People and Emotions': [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '🥹', '😊', '😇', '🙂', '🙃', '😉', '😌',
      '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
      '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢',
      '😭', '😮‍💨', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🫣',
      '🤗', '🫡', '🤔', '🫢', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🫠', '🙄', '😯', '😦', '😧',
      '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '😵‍💫', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕',
      '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺',
      '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪',
      '👀', '👁️', '👅', '👄', '💋', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️',
      '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '🔥', '💥', '💫', '⭐', '🌟', '💢', '💤', '💬',
    ],
    'Animals and Nature': [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
      '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞',
      '🐜', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🌾', '💐',
      '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌙', '⭐', '🌟', '✨', '⚡', '☄️', '🔥',
    ],
    'Food and Drink': [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥',
      '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯',
      '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟',
      '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟',
      '☕', '🫖', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧋', '🥛', '🧊',
    ],
    'Activities & Objects': [
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏏', '⛳', '🏹', '🎣', '🥊', '🥋',
      '🛹', '🎿', '🏂', '🏋️', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🎫', '🎟️', '🎭', '🎨', '🎬',
      '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🧩', '📱',
      '💻', '🖥️', '🖨️', '⌨️', '🖱️', '📷', '📸', '📹', '🎥', '📽️', '📻', '🎙️', '⏱️', '⏰', '⌛', '💡',
    ],
  },
  Symbol: {
    'Punctuation & Editorial': [
      '“', '”', '‘', '’', '«', '»', '„', '“', '—', '–', '…', '•', '·', '‣', '⁃', '¶', '§', '†', '‡',
      '©', '®', '™', '№', '@', '&', '#', '%', '‰', '‱', '*', '⁂', '¿', '¡', '‽', '‹', '›', '⟨', '⟩',
      '⟦', '⟧', '「', '」', '『', '』', '【', '】', '〔', '〕', '〖', '〗',
    ],
    'Arrows & Shapes': [
      '←', '→', '↑', '↓', '↔', '↕', '↖', '↗', '↘', '↙', '↩', '↪', '↫', '↬', '↺', '↻', '⇄', '⇅', '⇆',
      '⇐', '⇒', '⇑', '⇓', '⇔', '➔', '➜', '➡', '➢', '➤', '➥', '➦', '★', '☆', '✦', '✧', '✪', '✫', '✬',
      '■', '□', '▲', '△', '▶', '▷', '▼', '▽', '◀', '◁', '◆', '◇', '○', '●', '✓', '✕',
    ],
    'Currency & Math': [
      '₹', '$', '€', '£', '¥', '¢', '¤', '฿', '₿', '₩', '₫', '₪', '₱', '₴', '₸', '₺', '+', '−', '×', '÷',
      '=', '≠', '≈', '≡', '≤', '≥', '<', '>', '±', '⁄', '%', '‰', '¼', '½', '¾', '⅓', '⅔', '⅕', '∞', '√',
      '∑', '∏', '∫', '∂', '∇', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁰', '₀', '₁', '₂', '₃', '₄',
    ],
    'Malayalam & Indic': [
      'മലയാളം', 'ലേഖനം', 'അഭിമുഖം', 'സിനിമ', 'പുസ്തകം', 'രാഷ്ട്രീയം', 'കവിത', 'വാർത്ത', 'കഥ', 'സ്പോർട്സ്',
      'വായന', 'സംസ്കാരം', 'ഓൾഡ് മാംഗോ ട്രീ', 'ൺ', 'ൻ', 'ർ', 'ൽ', 'ൾ', 'ൿ', '൦', '൧', '൨', '൩', '൪', '൫',
      '൬', '൭', '൮', '൯', '൹', 'ഽ', 'ൎ',
    ],
  },
};

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Write your article story here... Use the toolbar above for formatting.',
}: RichTextEditorProps) {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [rawHtml, setRawHtml] = useState(content);

  // Active Dropdowns state
  const [activeDropdown, setActiveDropdown] = useState<
    'mode' | 'font' | 'size' | 'heading' | 'color' | 'highlight' | 'image' | 'video' | 'align' | 'lang' | null
  >(null);

  // Custom fonts uploaded from device
  const [customFonts, setCustomFonts] = useState<FontOption[]>([]);

  // Current selections
  const [currentTextColor, setCurrentTextColor] = useState('#171717');
  const [currentHighlightColor, setCurrentHighlightColor] = useState('transparent');
  const [customTextColorHex, setCustomTextColorHex] = useState('#171717');
  const [customHighlightHex, setCustomHighlightHex] = useState('#fef08a');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Malayalam (മലയാളം)');
  const [langSearch, setLangSearch] = useState('');

  // Blogger-Style Link Dialog (matching media_1791223956125.png)
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkBlank, setLinkBlank] = useState(true);
  const [linkNofollow, setLinkNofollow] = useState(false);
  const [savedSelection, setSavedSelection] = useState<{ from: number; to: number } | null>(null);

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoModalTab, setVideoModalTab] = useState<'url' | 'embed'>('url');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoEmbedCode, setVideoEmbedCode] = useState('');

  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // Compact Special Characters Modal State
  const [showSpecialCharsModal, setShowSpecialCharsModal] = useState(false);
  const [specialCategory, setSpecialCategory] = useState<'Emoji' | 'Symbol'>('Emoji');
  const [specialSubcategory, setSpecialSubcategory] = useState<string>('People and Emotions');
  const [specialSearchQuery, setSpecialSearchQuery] = useState('');

  // Upload refs & loading states
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const fontFileInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Interactive Selected Image State
  const [selectedImage, setSelectedImage] = useState<{
    pos: number;
    src: string;
    alt: string;
    width: string;
    alignment: 'left' | 'center' | 'right';
  } | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  // Initialize Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      FontSize,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#E27A2B] underline hover:text-[#d66f22]',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      InteractableImage.configure({
        HTMLAttributes: {
          class: 'my-6 mx-auto rounded shadow-md max-w-full h-auto',
        },
      }),
      CustomVideo,
      CustomIframe,
      Youtube.configure({
        HTMLAttributes: {
          class: 'my-6 aspect-video w-full rounded shadow-md',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'min-h-[500px] max-w-none focus:outline-none text-neutral-900 dark:text-neutral-100 text-[15px] leading-relaxed font-serif clearfix',
      },
      handleClickOn: (view, pos, node, nodePos, event, direct) => {
        if (node.type.name === 'image') {
          setSelectedImage({
            pos: nodePos,
            src: node.attrs.src,
            alt: node.attrs.alt || '',
            width: node.attrs.width || '100%',
            alignment: node.attrs.alignment || 'center',
          });
          return true;
        } else {
          setSelectedImage(null);
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setRawHtml(html);
      onChange(html);
      const text = editor.getText();
      const detected = detectLanguageFromText(text);
      if (detected) {
        setSelectedLanguage(detected);
      }
    },
  });

  const handleUpdateImageAlignment = (alignment: 'left' | 'center' | 'right') => {
    if (!selectedImage || !editor) return;
    editor
      .chain()
      .focus()
      .setNodeSelection(selectedImage.pos)
      .updateAttributes('image', { alignment })
      .run();
    setSelectedImage((prev) => (prev ? { ...prev, alignment } : null));
  };

  const handleUpdateImageSize = (width: string) => {
    if (!selectedImage || !editor) return;
    editor
      .chain()
      .focus()
      .setNodeSelection(selectedImage.pos)
      .updateAttributes('image', { width })
      .run();
    setSelectedImage((prev) => (prev ? { ...prev, width } : null));
  };

  const handleAdjustImageSize = (deltaPercent: number) => {
    if (!selectedImage || !editor) return;
    const current = parseInt(String(selectedImage.width || '100').replace(/[^0-9]/g, ''), 10) || 100;
    const next = Math.min(100, Math.max(15, current + deltaPercent));
    const nextWidth = `${next}%`;
    editor
      .chain()
      .focus()
      .setNodeSelection(selectedImage.pos)
      .updateAttributes('image', { width: nextWidth })
      .run();
    setSelectedImage((prev) => (prev ? { ...prev, width: nextWidth } : null));
  };

  const handleDeleteSelectedImage = () => {
    if (!selectedImage || !editor) return;
    editor
      .chain()
      .focus()
      .setNodeSelection(selectedImage.pos)
      .deleteSelection()
      .run();
    setSelectedImage(null);
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    if (!selectedImage || !editor) return;
    editor
      .chain()
      .focus()
      .setNodeSelection(selectedImage.pos)
      .updateAttributes('image', { src: croppedDataUrl })
      .run();
    setSelectedImage((prev) => (prev ? { ...prev, src: croppedDataUrl } : null));
    setShowCropModal(false);
    const html = editor.getHTML();
    setRawHtml(html);
    onChange(html);
  };

  // Sync external content & auto-detect language
  useEffect(() => {
    if (editor && content !== editor.getHTML() && !isHtmlMode) {
      editor.commands.setContent(content);
      setRawHtml(content);
    }
    if (content) {
      const detected = detectLanguageFromText(content);
      if (detected) {
        setSelectedLanguage(detected);
      }
    }
  }, [content, editor, isHtmlMode]);

  // Load persisted custom fonts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('omt_custom_fonts_v2');
      if (saved) {
        const parsed: { name: string; value: string; dataUrl?: string }[] = JSON.parse(saved);
        parsed.forEach((f) => {
          if (f.dataUrl && typeof FontFace !== 'undefined') {
            const fontFace = new FontFace(f.value, `url(${f.dataUrl})`);
            fontFace.load().then((loaded) => {
              document.fonts.add(loaded);
            }).catch(() => {});
          }
        });
        setCustomFonts(
          parsed.map((f) => ({
            name: f.name,
            value: f.value,
            category: 'Custom' as const,
          }))
        );
      }
    } catch {}
  }, []);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // HTML Mode Switch
  const handleToggleHtmlMode = () => {
    if (!editor) return;
    if (isHtmlMode) {
      editor.commands.setContent(rawHtml);
      onChange(rawHtml);
      setIsHtmlMode(false);
    } else {
      setRawHtml(editor.getHTML());
      setIsHtmlMode(true);
    }
    setActiveDropdown(null);
  };

  const handleRawHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawHtml(val);
    onChange(val);
    const detected = detectLanguageFromText(val);
    if (detected) {
      setSelectedLanguage(detected);
    }
  };

  // Image Upload handler
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    setIsUploadingImage(true);
    try {
      const res = await compressAndUploadImage(file);
      if (res.url) {
        editor.chain().focus().setImage({ src: res.url, alt: file.name }).run();
      } else {
        alert(res.error || 'Failed to upload image.');
      }
    } catch (err: any) {
      alert(`Image upload error: ${err?.message || 'Error'}`);
    } finally {
      setIsUploadingImage(false);
      setActiveDropdown(null);
      if (imageFileInputRef.current) imageFileInputRef.current.value = '';
    }
  };

  // Video Upload from Computer handler
  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    setIsUploadingVideo(true);
    try {
      const res = await uploadVideoFile(file);
      if (res.url) {
        editor
          .chain()
          .focus()
          .insertContent(
            `<p><video controls src="${res.url}" class="my-6 mx-auto rounded shadow-md max-w-full h-auto w-full"></video></p>`
          )
          .run();
      } else {
        alert(res.error || 'Failed to upload video file.');
      }
    } catch (err: any) {
      alert(`Video upload failed: ${err?.message || 'Error'}`);
    } finally {
      setIsUploadingVideo(false);
      setActiveDropdown(null);
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  // Custom Font Upload from Device handler
  const handleFontFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cleanName = file.name.replace(/\.[^/.]+$/, '').trim();
    const fontFaceName = `Custom_${cleanName.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        if (typeof FontFace !== 'undefined') {
          const fontFace = new FontFace(fontFaceName, `url(${dataUrl})`);
          const loaded = await fontFace.load();
          document.fonts.add(loaded);
        }
        const newFont: FontOption = {
          name: `${cleanName} (Uploaded)`,
          value: fontFaceName,
          category: 'Custom',
        };
        const updated = [...customFonts.filter((f) => f.value !== fontFaceName), newFont];
        setCustomFonts(updated);
        try {
          const toSave = updated.map((f) => ({ ...f, dataUrl }));
          localStorage.setItem('omt_custom_fonts_v2', JSON.stringify(toSave));
        } catch {}
        editor?.chain().focus().setFontFamily(fontFaceName).run();
        setActiveDropdown(null);
      } catch (err: any) {
        alert(`Could not load custom font: ${err?.message || 'Error'}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Link Dialog
  const handleOpenLinkModal = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    setSavedSelection({ from, to });
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    setLinkText(selectedText);
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setShowLinkModal(true);
  };

  const handleInsertLinkConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor || !linkUrl.trim()) return;

    if (savedSelection) {
      editor.chain().focus().setTextSelection(savedSelection).run();
    }

    const relAttributes = [
      linkBlank ? 'noopener' : '',
      linkBlank ? 'noreferrer' : '',
      linkNofollow ? 'nofollow' : '',
    ]
      .filter(Boolean)
      .join(' ');

    if (linkText.trim()) {
      const relStr = relAttributes ? ` rel="${relAttributes}"` : '';
      const targetStr = linkBlank ? ' target="_blank"' : '';
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${linkUrl.trim()}"${targetStr}${relStr}>${linkText.trim()}</a>`)
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({
          href: linkUrl.trim(),
          target: linkBlank ? '_blank' : null,
          rel: relAttributes || null,
        })
        .run();
    }

    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
    setSavedSelection(null);
  };

  // Insert Video (YouTube, Vimeo, Google Drive, Direct MP4/URL, or Embed)
  const handleInsertVideoConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;

    if (videoModalTab === 'embed') {
      const code = videoEmbedCode.trim();
      if (!code) return;
      editor.chain().focus().insertContent(code).run();
      setShowVideoModal(false);
      setVideoEmbedCode('');
      return;
    }

    const raw = videoUrlInput.trim();
    if (!raw) return;

    // 1. YouTube
    if (raw.includes('youtube.com') || raw.includes('youtu.be')) {
      editor.chain().focus().setYoutubeVideo({ src: raw }).run();
    }
    // 2. Vimeo
    else if (raw.includes('vimeo.com')) {
      const match = raw.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/);
      const vimeoId = match ? match[3] : raw.split('/').pop()?.split('?')[0];
      const vimeoEmbed = `https://player.vimeo.com/video/${vimeoId}`;
      editor.chain().focus().insertContent(
        `<div class="my-6 aspect-video w-full rounded overflow-hidden shadow-md"><iframe src="${vimeoEmbed}" class="w-full h-full border-0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`
      ).run();
    }
    // 3. Google Drive Video Link (e.g. https://drive.google.com/file/d/.../view)
    else if (raw.includes('drive.google.com')) {
      const drivePreview = raw.replace(/\/view(\?.*)?$/, '/preview');
      editor.chain().focus().insertContent(
        `<div class="my-6 aspect-video w-full rounded overflow-hidden shadow-md"><iframe src="${drivePreview}" class="w-full h-full border-0" allow="autoplay"></iframe></div>`
      ).run();
    }
    // 4. Direct video file (.mp4, .webm, .ogg, .mov, bunny.net, cloudflare, etc.)
    else {
      editor.chain().focus().insertContent(
        `<p><video controls src="${raw}" class="my-6 mx-auto rounded shadow-md max-w-full h-auto w-full"></video></p>`
      ).run();
    }

    setShowVideoModal(false);
    setVideoUrlInput('');
  };

  // Image by URL
  const handleInsertImageUrlConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor || !imageUrl.trim()) return;
    editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
    setShowImageUrlModal(false);
    setImageUrl('');
  };

  // Clear Formatting
  const handleClearFormatting = () => {
    if (!editor) return;
    editor.chain().focus().clearNodes().unsetAllMarks().unsetFontFamily().unsetFontSize().run();
  };

  // Insert Jump Break (Blogger "Read More")
  const handleInsertJumpBreak = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent('<hr class="omt-jump-break" data-break="read-more" title="--- Read More Break ---" />')
      .run();
  };

  // Filtered Special Characters
  const currentSpecialChars = useMemo(() => {
    if (specialSearchQuery.trim()) {
      const q = specialSearchQuery.toLowerCase();
      const all: string[] = [];
      Object.values(SPECIAL_CHARS_CATALOG).forEach((cat) => {
        Object.values(cat).forEach((list) => {
          list.forEach((ch) => {
            if (ch.includes(q)) all.push(ch);
          });
        });
      });
      return all.length ? all : SPECIAL_CHARS_CATALOG[specialCategory][specialSubcategory] || [];
    }
    const catObj = SPECIAL_CHARS_CATALOG[specialCategory] || {};
    return catObj[specialSubcategory] || Object.values(catObj)[0] || [];
  }, [specialCategory, specialSubcategory, specialSearchQuery]);

  // Insert Special Character click handler
  const handleInsertSpecialChar = (char: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(char).run();
  };

  // Filtered Input Tool Languages
  const filteredLanguages = useMemo(() => {
    if (!langSearch.trim()) return INPUT_TOOL_LANGUAGES;
    return INPUT_TOOL_LANGUAGES.filter((l) => l.toLowerCase().includes(langSearch.toLowerCase()));
  }, [langSearch]);

  // Combined font pool (Inbuilt + Uploaded)
  const combinedFonts = useMemo(() => {
    return [...INBUILT_FONTS, ...customFonts];
  }, [customFonts]);

  // Current heading label
  const currentHeadingLabel = (() => {
    if (!editor) return 'Normal';
    if (editor.isActive('heading', { level: 1 })) return 'Major Heading';
    if (editor.isActive('heading', { level: 2 })) return 'Heading';
    if (editor.isActive('heading', { level: 3 })) return 'Subheading';
    if (editor.isActive('heading', { level: 4 })) return 'Minor Heading';
    return 'Normal';
  })();

  const { wordCount, readTimeMin } = useMemo(() => {
    if (!content) return { wordCount: 0, readTimeMin: 1 };
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const count = plainText ? plainText.split(/\s+/).length : 0;
    return {
      wordCount: count,
      readTimeMin: Math.max(1, Math.ceil(count / 200)),
    };
  }, [content]);

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageFileInputRef}
        onChange={handleImageFileSelect}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={videoFileInputRef}
        onChange={handleVideoFileSelect}
        accept="video/mp4,video/webm,video/ogg,video/quicktime"
        className="hidden"
      />
      <input
        type="file"
        ref={fontFileInputRef}
        onChange={handleFontFileUpload}
        accept=".ttf,.otf,.woff,.woff2"
        className="hidden"
      />

      {/* ========================================================
          BOX 1: STANDALONE ENLARGED GOOGLE BLOGGER TOOLBAR BOX
          ======================================================== */}
      <div className="bg-white dark:bg-[#131d2b] border border-[#dadce0] dark:border-neutral-800 rounded-lg shadow-sm sticky top-0 z-40 overflow-visible">
        <div
          ref={toolbarRef}
          className="px-3.5 py-2 flex items-center gap-1 flex-wrap select-none text-sm text-[#3c4043] dark:text-neutral-200 overflow-visible"
        >
        {/* GROUP 0: COMPOSE / HTML VIEW SWITCHER */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setActiveDropdown(activeDropdown === 'mode' ? null : 'mode')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs transition-colors cursor-pointer ${
              isHtmlMode
                ? 'bg-[#e8f0fe] dark:bg-neutral-800 text-[#1a73e8] font-bold'
                : 'hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 text-[#5f6368] dark:text-neutral-300'
            }`}
            title="Compose view / HTML view"
          >
            {isHtmlMode ? <Code className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {activeDropdown === 'mode' && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="absolute top-full left-0 mt-0.5 w-48 bg-white dark:bg-[#1e293b] border border-[#dadce0] dark:border-neutral-700 shadow-xl rounded-none py-1.5 z-[100] animate-in fade-in-50 duration-75 select-none text-xs"
            >
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (isHtmlMode) handleToggleHtmlMode();
                  setActiveDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left flex items-center text-xs hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 cursor-pointer ${
                  !isHtmlMode ? 'bg-[#f1f3f4] dark:bg-neutral-800 font-semibold' : ''
                }`}
              >
                <div className="w-5 flex items-center justify-center shrink-0">
                  {!isHtmlMode && <Check className="w-4 h-4 text-[#E27A2B]" />}
                </div>
                <span className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-[#5f6368]" /> Compose view
                </span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (!isHtmlMode) handleToggleHtmlMode();
                  setActiveDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left flex items-center text-xs hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 cursor-pointer ${
                  isHtmlMode ? 'bg-[#f1f3f4] dark:bg-neutral-800 font-semibold' : ''
                }`}
              >
                <div className="w-5 flex items-center justify-center shrink-0">
                  {isHtmlMode && <Check className="w-4 h-4 text-[#E27A2B]" />}
                </div>
                <span className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-[#5f6368]" /> &lt;&gt; HTML view
                </span>
              </button>
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="h-6 w-[1.5px] bg-neutral-300 dark:bg-neutral-700 mx-1.5 shrink-0" />

        {/* GROUP 1: UNDO & REDO */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={isHtmlMode || !editor?.can().undo()}
          className="p-2 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 rounded disabled:opacity-30 cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-5 h-5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={isHtmlMode || !editor?.can().redo()}
          className="p-2 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 rounded disabled:opacity-30 cursor-pointer"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-5 h-5" />
        </button>

        {/* DIVIDER */}
        <div className="h-6 w-[1.5px] bg-neutral-300 dark:bg-neutral-700 mx-1.5 shrink-0" />

        {/* GROUP 2: FONT FAMILY (A▾) - INBUILT + UPLOAD FROM DEVICE */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setActiveDropdown(activeDropdown === 'font' ? null : 'font')}
            disabled={isHtmlMode}
            className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 text-[#5f6368] dark:text-neutral-300 rounded-xs cursor-pointer disabled:opacity-30 font-serif font-bold text-sm"
            title="Font type"
          >
            <span>A</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
          </button>

          {activeDropdown === 'font' && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="absolute top-full left-0 mt-0.5 w-80 max-h-96 overflow-y-auto bg-white dark:bg-[#1e293b] border border-[#dadce0] dark:border-neutral-700 shadow-xl rounded-none py-1 z-[100] animate-in fade-in-50 duration-75 select-none"
            >
              {/* Default Site Font */}
              <div className="p-1">
                {combinedFonts.filter((f) => f.category === 'Default').map((f) => {
                  const isActive = !editor?.getAttributes('textStyle').fontFamily;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        editor?.chain().focus().unsetFontFamily().run();
                        setActiveDropdown(null);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center justify-between cursor-pointer rounded-xs ${
                        isActive
                          ? 'bg-[#f1f3f4] dark:bg-neutral-800 font-bold text-neutral-900 dark:text-neutral-100'
                          : 'text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <span className="font-sans font-medium">{f.name}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-[#E27A2B]" />}
                    </button>
                  );
                })}
              </div>

              {/* SECTION: MALAYALAM FONTS */}
              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E27A2B] bg-orange-50/50 dark:bg-orange-950/20 flex items-center justify-between">
                  <span>മലയാളം ഫോണ്ടുകൾ (Malayalam)</span>
                  <span className="text-[9px] font-mono opacity-80">17 FONTS</span>
                </div>

                <div className="p-1 space-y-0.5">
                  {combinedFonts
                    .filter((f) => f.category === 'Malayalam')
                    .map((f) => {
                      const isActive = editor?.isActive('textStyle', { fontFamily: f.value });
                      return (
                        <button
                          key={f.value}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            editor?.chain().focus().setFontFamily(f.value).run();
                            setActiveDropdown(null);
                          }}
                          className={`w-full px-3 py-1.5 text-left hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center justify-between cursor-pointer rounded-xs transition-colors ${
                            isActive
                              ? 'bg-orange-50 dark:bg-orange-950/40 text-neutral-900 dark:text-neutral-100 font-semibold'
                              : 'text-neutral-800 dark:text-neutral-200'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span
                              className="text-[13px] leading-snug truncate"
                              style={{ fontFamily: f.value }}
                            >
                              {f.name}
                            </span>
                            {f.description && (
                              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-sans font-normal">
                                {f.description}
                              </span>
                            )}
                          </div>
                          {isActive && <Check className="w-3.5 h-3.5 text-[#E27A2B] shrink-0" />}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* SECTION: LATIN / ENGLISH FONTS */}
              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50">
                  English &amp; Latin Typography
                </div>

                <div className="p-1 space-y-0.5">
                  {combinedFonts
                    .filter((f) => f.category.startsWith('Latin') || f.category === 'Monospace')
                    .map((f) => {
                      const isActive = editor?.isActive('textStyle', { fontFamily: f.value });
                      return (
                        <button
                          key={f.value}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            editor?.chain().focus().setFontFamily(f.value).run();
                            setActiveDropdown(null);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-xs hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center justify-between cursor-pointer rounded-xs ${
                            isActive
                              ? 'bg-[#f1f3f4] dark:bg-neutral-800 font-semibold text-neutral-900 dark:text-neutral-100'
                              : 'text-neutral-800 dark:text-neutral-200'
                          }`}
                          style={{ fontFamily: f.value }}
                        >
                          <span className="truncate">{f.name}</span>
                          {isActive && <Check className="w-3.5 h-3.5 text-[#E27A2B] shrink-0" />}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* SECTION: CUSTOM UPLOADED FONTS (IF ANY) */}
              {customFonts.length > 0 && (
                <div className="border-t border-neutral-200 dark:border-neutral-800 pt-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Custom Uploaded Fonts
                  </div>
                  <div className="p-1 space-y-0.5">
                    {customFonts.map((f) => {
                      const isActive = editor?.isActive('textStyle', { fontFamily: f.value });
                      return (
                        <button
                          key={f.value}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            editor?.chain().focus().setFontFamily(f.value).run();
                            setActiveDropdown(null);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-xs hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center justify-between cursor-pointer rounded-xs ${
                            isActive
                              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-semibold'
                              : 'text-neutral-800 dark:text-neutral-200'
                          }`}
                          style={{ fontFamily: f.value }}
                        >
                          <span className="truncate">{f.name}</span>
                          {isActive && <Check className="w-3.5 h-3.5 text-[#E27A2B] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload Font From Device */}
              <div className="border-t border-neutral-200 dark:border-neutral-800 mt-1 pt-1 bg-neutral-50 dark:bg-neutral-800/30">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    fontFileInputRef.current?.click();
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-[#E27A2B] hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>+ Upload Custom Font (.ttf, .otf, .woff)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* GROUP 3: FONT SIZE (TT▾) */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setActiveDropdown(activeDropdown === 'size' ? null : 'size')}
            disabled={isHtmlMode}
            className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 text-[#5f6368] dark:text-neutral-300 rounded-xs cursor-pointer disabled:opacity-30 font-sans font-bold text-sm"
            title="Font size"
          >
            <span>T<span className="text-[11px]">T</span></span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
          </button>

          {activeDropdown === 'size' && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="absolute top-full left-0 mt-0.5 w-48 bg-white dark:bg-[#1e293b] border border-[#dadce0] dark:border-neutral-700 shadow-xl rounded-none py-1.5 z-[100] animate-in fade-in-50 duration-75 select-none"
            >
              {FONT_SIZES.map((s) => {
                const isActive = editor?.isActive('fontSize', { size: s.value });
                return (
                  <button
                    key={s.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor?.chain().focus().setFontSize(s.value).run();
                      setActiveDropdown(null);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-[#f1f3f4] dark:bg-neutral-800 font-semibold text-neutral-900 dark:text-neutral-100'
                        : 'text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 flex items-center justify-center shrink-0">
                        {isActive && <Check className="w-4 h-4 text-[#E27A2B]" />}
                      </div>
                      <span>{s.label}</span>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-mono pr-2">{s.value}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* GROUP 4: PARAGRAPH FORMAT / HEADINGS (Normal ▾) */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setActiveDropdown(activeDropdown === 'heading' ? null : 'heading')}
            disabled={isHtmlMode}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 text-[#3c4043] dark:text-neutral-200 rounded-xs cursor-pointer disabled:opacity-30 text-sm font-medium"
            title="Paragraph format"
          >
            <span>{currentHeadingLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#5f6368] opacity-70 ml-0.5" />
          </button>

          {activeDropdown === 'heading' && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="absolute top-full left-0 mt-0.5 w-56 bg-white dark:bg-[#1e293b] border border-[#dadce0] dark:border-neutral-700 shadow-xl rounded-none py-1.5 z-[100] animate-in fade-in-50 duration-75 select-none"
            >
              {/* Major Heading (H1) */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor?.chain().focus().setHeading({ level: 1 }).run();
                  setActiveDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-base font-normal hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center cursor-pointer transition-colors ${
                  editor?.isActive('heading', { level: 1 })
                    ? 'bg-[#f1f3f4] dark:bg-neutral-800 font-medium text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-800 dark:text-neutral-200'
                }`}
              >
                <div className="w-6 flex items-center justify-center shrink-0">
                  {editor?.isActive('heading', { level: 1 }) && (
                    <Check className="w-4 h-4 text-[#E27A2B]" />
                  )}
                </div>
                <span>Major Heading</span>
              </button>

              {/* Heading (H2) */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor?.chain().focus().setHeading({ level: 2 }).run();
                  setActiveDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm font-normal hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center cursor-pointer transition-colors ${
                  editor?.isActive('heading', { level: 2 })
                    ? 'bg-[#f1f3f4] dark:bg-neutral-800 font-medium text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-800 dark:text-neutral-200'
                }`}
              >
                <div className="w-6 flex items-center justify-center shrink-0">
                  {editor?.isActive('heading', { level: 2 }) && (
                    <Check className="w-4 h-4 text-[#E27A2B]" />
                  )}
                </div>
                <span>Heading</span>
              </button>

              {/* Subheading (H3) */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor?.chain().focus().setHeading({ level: 3 }).run();
                  setActiveDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm font-normal hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center cursor-pointer transition-colors ${
                  editor?.isActive('heading', { level: 3 })
                    ? 'bg-[#f1f3f4] dark:bg-neutral-800 font-medium text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-800 dark:text-neutral-200'
                }`}
              >
                <div className="w-6 flex items-center justify-center shrink-0">
                  {editor?.isActive('heading', { level: 3 }) && (
                    <Check className="w-4 h-4 text-[#E27A2B]" />
                  )}
                </div>
                <span>Subheading</span>
              </button>

              {/* Minor Heading (H4) */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor?.chain().focus().setHeading({ level: 4 }).run();
                  setActiveDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-xs font-normal hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center cursor-pointer transition-colors ${
                  editor?.isActive('heading', { level: 4 })
                    ? 'bg-[#f1f3f4] dark:bg-neutral-800 font-medium text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-800 dark:text-neutral-200'
                }`}
              >
                <div className="w-6 flex items-center justify-center shrink-0">
                  {editor?.isActive('heading', { level: 4 }) && (
                    <Check className="w-4 h-4 text-[#E27A2B]" />
                  )}
                </div>
                <span>Minor Heading</span>
              </button>

              {/* Normal */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor?.chain().focus().setParagraph().run();
                  setActiveDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-xs font-normal hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center cursor-pointer transition-colors ${
                  currentHeadingLabel === 'Normal'
                    ? 'bg-[#f1f3f4] dark:bg-neutral-800 font-medium text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-800 dark:text-neutral-200'
                }`}
              >
                <div className="w-6 flex items-center justify-center shrink-0">
                  {currentHeadingLabel === 'Normal' && (
                    <Check className="w-4 h-4 text-[#E27A2B]" />
                  )}
                </div>
                <span>Normal</span>
              </button>
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="h-6 w-[1.5px] bg-neutral-300 dark:bg-neutral-700 mx-1.5 shrink-0" />

        {/* GROUP 5: BOLD, ITALIC, UNDERLINE, STRIKE */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={isHtmlMode}
          className={`px-2.5 py-1.5 font-bold text-sm rounded transition-colors cursor-pointer ${
            editor?.isActive('bold')
              ? 'bg-neutral-200 dark:bg-neutral-700 text-[#0C2340] dark:text-white font-extrabold'
              : 'hover:bg-[#f1f3f4] dark:hover:bg-neutral-800'
          }`}
          title="Bold (Ctrl+B)"
        >
          B
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={isHtmlMode}
          className={`px-2.5 py-1.5 italic font-serif text-sm rounded transition-colors cursor-pointer ${
            editor?.isActive('italic')
              ? 'bg-neutral-200 dark:bg-neutral-700 text-[#0C2340] dark:text-white'
              : 'hover:bg-[#f1f3f4] dark:hover:bg-neutral-800'
          }`}
          title="Italic (Ctrl+I)"
        >
          I
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          disabled={isHtmlMode}
          className={`px-2.5 py-1.5 underline font-sans text-sm rounded transition-colors cursor-pointer ${
            editor?.isActive('underline')
              ? 'bg-neutral-200 dark:bg-neutral-700 text-[#0C2340] dark:text-white'
              : 'hover:bg-[#f1f3f4] dark:hover:bg-neutral-800'
          }`}
          title="Underline (Ctrl+U)"
        >
          U
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          disabled={isHtmlMode}
          className={`px-2.5 py-1.5 line-through font-sans text-sm rounded transition-colors cursor-pointer ${
            editor?.isActive('strike')
              ? 'bg-neutral-200 dark:bg-neutral-700 text-[#0C2340] dark:text-white'
              : 'hover:bg-[#f1f3f4] dark:hover:bg-neutral-800'
          }`}
          title="Strikethrough"
        >
          T
        </button>

        {/* TEXT COLOR (A with color bar) */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setActiveDropdown(activeDropdown === 'color' ? null : 'color')}
            disabled={isHtmlMode}
            className="flex flex-col items-center justify-center px-2 py-1.5 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 rounded cursor-pointer disabled:opacity-30"
            title="Text color"
          >
            <span className="font-bold text-sm leading-none">A</span>
            <span
              className="w-4 h-[3.5px] mt-0.5 rounded-full"
              style={{ backgroundColor: currentTextColor }}
            />
          </button>

          {activeDropdown === 'color' && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="absolute top-full left-0 mt-0.5 p-3 bg-white dark:bg-[#1e293b] border border-[#dadce0] dark:border-neutral-700 shadow-2xl rounded-none z-[100] animate-in fade-in-50 duration-75 select-none w-64"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200 dark:border-neutral-700 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  Text Color
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().unsetColor().run();
                    setCurrentTextColor('#171717');
                    setActiveDropdown(null);
                  }}
                  className="text-[10px] text-[#E27A2B] hover:underline font-semibold cursor-pointer"
                >
                  Reset Default
                </button>
              </div>

              {/* 10x8 Material Palette Matrix */}
              <div className="space-y-1">
                {MATERIAL_COLOR_MATRIX.map((row, rIdx) => (
                  <div key={rIdx} className="flex gap-1 justify-between">
                    {row.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          editor?.chain().focus().setColor(hex).run();
                          setCurrentTextColor(hex);
                          setActiveDropdown(null);
                        }}
                        className="w-5 h-5 rounded-xs border border-neutral-300 dark:border-neutral-700 hover:scale-125 transition-transform cursor-pointer"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-700 flex items-center gap-2">
                <input
                  type="color"
                  value={customTextColorHex}
                  onChange={(e) => setCustomTextColorHex(e.target.value)}
                  className="w-7 h-7 rounded border border-neutral-300 dark:border-neutral-700 cursor-pointer p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={customTextColorHex}
                  onChange={(e) => setCustomTextColorHex(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().setColor(customTextColorHex).run();
                    setCurrentTextColor(customTextColorHex);
                    setActiveDropdown(null);
                  }}
                  className="px-2.5 py-1 bg-[#0C2340] text-white dark:bg-[#E27A2B] text-xs font-bold rounded cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TEXT BACKGROUND / HIGHLIGHT */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setActiveDropdown(activeDropdown === 'highlight' ? null : 'highlight')}
            disabled={isHtmlMode}
            className="flex flex-col items-center justify-center px-2 py-1.5 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 rounded-xs cursor-pointer disabled:opacity-30"
            title="Text background color"
          >
            <span className="text-sm leading-none">🖊️</span>
            <span
              className="w-4 h-[3.5px] mt-0.5 rounded-full"
              style={{
                backgroundColor: currentHighlightColor === 'transparent' ? '#cbd5e1' : currentHighlightColor,
              }}
            />
          </button>

          {activeDropdown === 'highlight' && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="absolute top-full left-0 mt-0.5 p-3 bg-white dark:bg-[#1e293b] border border-[#dadce0] dark:border-neutral-700 shadow-2xl rounded-none z-[100] animate-in fade-in-50 duration-75 select-none w-64"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200 dark:border-neutral-700 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  Highlight Color
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().unsetHighlight().run();
                    setCurrentHighlightColor('transparent');
                    setActiveDropdown(null);
                  }}
                  className="text-[10px] text-red-500 hover:underline font-semibold cursor-pointer"
                >
                  Clear Highlight
                </button>
              </div>

              {/* 10x8 Material Palette Matrix */}
              <div className="space-y-1">
                {MATERIAL_COLOR_MATRIX.map((row, rIdx) => (
                  <div key={rIdx} className="flex gap-1 justify-between">
                    {row.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          editor?.chain().focus().setHighlight({ color: hex }).run();
                          setCurrentHighlightColor(hex);
                          setActiveDropdown(null);
                        }}
                        className="w-5 h-5 rounded-xs border border-neutral-300 dark:border-neutral-700 hover:scale-125 transition-transform cursor-pointer"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Custom Highlight Color Input */}
              <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-700 flex items-center gap-2">
                <input
                  type="color"
                  value={customHighlightHex}
                  onChange={(e) => setCustomHighlightHex(e.target.value)}
                  className="w-7 h-7 rounded border border-neutral-300 dark:border-neutral-700 cursor-pointer p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={customHighlightHex}
                  onChange={(e) => setCustomHighlightHex(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().setHighlight({ color: customHighlightHex }).run();
                    setCurrentHighlightColor(customHighlightHex);
                    setActiveDropdown(null);
                  }}
                  className="px-2.5 py-1 bg-[#0C2340] text-white dark:bg-[#E27A2B] text-xs font-bold rounded cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="h-6 w-[1.5px] bg-neutral-300 dark:bg-neutral-700 mx-1.5 shrink-0" />

        {/* GROUP 6: INSERT LINK, IMAGE, VIDEO, SPECIAL CHARS, JUMP BREAK */}
        {/* Link Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleOpenLinkModal}
          disabled={isHtmlMode}
          className={`p-2 rounded-xs transition-colors cursor-pointer ${
            editor?.isActive('link')
              ? 'bg-[#e8f0fe] dark:bg-neutral-800 text-[#1a73e8]'
              : 'hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 text-[#5f6368] dark:text-neutral-300'
          }`}
          title="Insert or edit link"
        >
          <Link2 className="w-5 h-5" />
        </button>

        {/* Insert Image Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setActiveDropdown(activeDropdown === 'image' ? null : 'image')}
            disabled={isHtmlMode}
            className="flex items-center gap-0.5 p-2 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 text-[#5f6368] dark:text-neutral-300 rounded-xs cursor-pointer disabled:opacity-30"
            title="Insert image"
          >
            {isUploadingImage ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#E27A2B]" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
            <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
          </button>

          {activeDropdown === 'image' && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="absolute top-full left-0 mt-0.5 w-52 bg-white dark:bg-[#1e293b] border border-[#dadce0] dark:border-neutral-700 shadow-xl rounded-none py-1.5 z-[100] animate-in fade-in-50 duration-75 select-none"
            >
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  imageFileInputRef.current?.click();
                  setActiveDropdown(null);
                }}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#E27A2B]" /> Upload from computer
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setShowImageUrlModal(true);
                  setActiveDropdown(null);
                }}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-blue-500" /> By URL
              </button>
            </div>
          )}
        </div>

        {/* Insert Video Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setActiveDropdown(activeDropdown === 'video' ? null : 'video')}
            disabled={isHtmlMode}
            className="flex items-center gap-0.5 p-2 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 text-[#5f6368] dark:text-neutral-300 rounded-xs cursor-pointer disabled:opacity-30"
            title="Insert video"
          >
            {isUploadingVideo ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#E27A2B]" />
            ) : (
              <Film className="w-5 h-5" />
            )}
            <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
          </button>

          {activeDropdown === 'video' && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="absolute top-full left-0 mt-0.5 w-56 bg-white dark:bg-[#1e293b] border border-[#dadce0] dark:border-neutral-700 shadow-xl rounded-none py-1.5 z-[100] animate-in fade-in-50 duration-75 select-none"
            >
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  videoFileInputRef.current?.click();
                  setActiveDropdown(null);
                }}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#E27A2B]" /> Upload from computer (.mp4, .webm)
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setVideoModalTab('url');
                  setShowVideoModal(true);
                  setActiveDropdown(null);
                }}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-blue-500" /> Web Video (YouTube, Vimeo, Drive, MP4)
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setVideoModalTab('embed');
                  setShowVideoModal(true);
                  setActiveDropdown(null);
                }}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
              >
                <Code className="w-4 h-4 text-emerald-500" /> Embed Video Code (iframe / custom)
              </button>
            </div>
          )}
        </div>

        {/* Special Characters Modal Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowSpecialCharsModal(true)}
          disabled={isHtmlMode}
          className="p-2 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 text-[#5f6368] dark:text-neutral-300 rounded-xs cursor-pointer disabled:opacity-30"
          title="Insert special characters"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Jump Break ("Read More") */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleInsertJumpBreak}
          disabled={isHtmlMode}
          className="p-2 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 rounded cursor-pointer disabled:opacity-30 font-mono text-xs font-bold"
          title="Insert jump break ('Read more')"
        >
          &lt;&gt;
        </button>

        {/* DIVIDER */}
        <div className="h-6 w-[1.5px] bg-neutral-300 dark:bg-neutral-700 mx-1.5 shrink-0" />

        {/* GROUP 7: ALIGNMENT & INDENT */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setActiveDropdown(activeDropdown === 'align' ? null : 'align')}
            disabled={isHtmlMode}
            className="flex items-center gap-0.5 p-2 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 rounded cursor-pointer disabled:opacity-30"
            title="Align"
          >
            {editor?.isActive({ textAlign: 'center' }) ? (
              <AlignCenter className="w-5 h-5" />
            ) : editor?.isActive({ textAlign: 'right' }) ? (
              <AlignRight className="w-5 h-5" />
            ) : editor?.isActive({ textAlign: 'justify' }) ? (
              <AlignJustify className="w-5 h-5" />
            ) : (
              <AlignLeft className="w-5 h-5" />
            )}
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {activeDropdown === 'align' && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="absolute top-full left-0 mt-0.5 w-40 bg-white dark:bg-[#1e293b] border border-[#dadce0] dark:border-neutral-700 shadow-xl rounded-none py-1.5 z-[100] animate-in fade-in-50 duration-75 select-none"
            >
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor?.chain().focus().setTextAlign('left').run();
                  setActiveDropdown(null);
                }}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
              >
                <AlignLeft className="w-4 h-4" /> Left align
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor?.chain().focus().setTextAlign('center').run();
                  setActiveDropdown(null);
                }}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
              >
                <AlignCenter className="w-4 h-4" /> Center align
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor?.chain().focus().setTextAlign('right').run();
                  setActiveDropdown(null);
                }}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
              >
                <AlignRight className="w-4 h-4" /> Right align
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor?.chain().focus().setTextAlign('justify').run();
                  setActiveDropdown(null);
                }}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
              >
                <AlignJustify className="w-4 h-4" /> Justify
              </button>
            </div>
          )}
        </div>

        {/* Increase Indent */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (editor?.can().sinkListItem('listItem')) {
              editor.chain().focus().sinkListItem('listItem').run();
            } else {
              editor?.chain().focus().toggleBlockquote().run();
            }
          }}
          disabled={isHtmlMode}
          className="p-2 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 rounded cursor-pointer disabled:opacity-30"
          title="Increase indent"
        >
          <Indent className="w-5 h-5" />
        </button>

        {/* Decrease Indent */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (editor?.can().liftListItem('listItem')) {
              editor.chain().focus().liftListItem('listItem').run();
            } else if (editor?.isActive('blockquote')) {
              editor.chain().focus().toggleBlockquote().run();
            }
          }}
          disabled={isHtmlMode}
          className="p-2 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 rounded cursor-pointer disabled:opacity-30"
          title="Decrease indent"
        >
          <Outdent className="w-5 h-5" />
        </button>

        {/* DIVIDER */}
        <div className="h-6 w-[1.5px] bg-neutral-300 dark:bg-neutral-700 mx-1.5 shrink-0" />

        {/* GROUP 8: LISTS, QUOTES, HORIZONTAL LINE */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={isHtmlMode}
          className={`p-2 rounded transition-colors cursor-pointer ${
            editor?.isActive('bulletList')
              ? 'bg-neutral-200 dark:bg-neutral-700 text-[#0C2340] dark:text-white'
              : 'hover:bg-[#f1f3f4] dark:hover:bg-neutral-800'
          }`}
          title="Bulleted list"
        >
          <List className="w-5 h-5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={isHtmlMode}
          className={`p-2 rounded transition-colors cursor-pointer ${
            editor?.isActive('orderedList')
              ? 'bg-neutral-200 dark:bg-neutral-700 text-[#0C2340] dark:text-white'
              : 'hover:bg-[#f1f3f4] dark:hover:bg-neutral-800'
          }`}
          title="Numbered list"
        >
          <ListOrdered className="w-5 h-5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          disabled={isHtmlMode}
          className={`p-2 rounded transition-colors cursor-pointer ${
            editor?.isActive('blockquote')
              ? 'bg-neutral-200 dark:bg-neutral-700 text-[#0C2340] dark:text-white'
              : 'hover:bg-[#f1f3f4] dark:hover:bg-neutral-800'
          }`}
          title="Quote text"
        >
          <Quote className="w-5 h-5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          disabled={isHtmlMode}
          className="p-2 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 rounded cursor-pointer disabled:opacity-30"
          title="Insert horizontal line"
        >
          <Minus className="w-5 h-5" />
        </button>

        {/* DIVIDER */}
        <div className="h-6 w-[1.5px] bg-neutral-300 dark:bg-neutral-700 mx-1.5 shrink-0" />

        {/* GROUP 9: DIRECTION & GOOGLE INPUT TOOLS (GLOBE ICON) */}
        {/* Left to Right (LTR) */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().setTextAlign('left').run()}
          disabled={isHtmlMode}
          className="p-2 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 rounded cursor-pointer disabled:opacity-30 font-bold text-sm"
          title="Left-to-right text direction"
        >
          ¶→
        </button>

        {/* Right to Left (RTL) */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().setTextAlign('right').run()}
          disabled={isHtmlMode}
          className="p-2 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 rounded cursor-pointer disabled:opacity-30 font-bold text-sm"
          title="Right-to-left text direction"
        >
          ←¶
        </button>

        {/* Google Input Tools - Globe Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setActiveDropdown(activeDropdown === 'lang' ? null : 'lang')}
            className={`flex items-center gap-0.5 p-2 rounded cursor-pointer transition-colors ${
              activeDropdown === 'lang'
                ? 'bg-[#e8f0fe] dark:bg-neutral-800 text-[#1a73e8]'
                : 'hover:bg-[#f1f3f4] dark:hover:bg-neutral-800'
            }`}
            title="Google Input Tools (Select Language & Script)"
          >
            <Globe className="w-5 h-5 text-[#5f6368] dark:text-neutral-300" />
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {activeDropdown === 'lang' && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="absolute top-full right-0 mt-0.5 w-60 max-h-96 overflow-y-auto bg-white dark:bg-[#1e293b] border border-[#dadce0] dark:border-neutral-700 shadow-2xl rounded-none py-1 z-[100] animate-in fade-in-50 duration-75 select-none"
            >
              {/* Search box inside language dropdown */}
              <div className="p-2 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 bg-white dark:bg-[#1e293b] z-10">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2" />
                  <input
                    type="text"
                    placeholder="Search languages..."
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded focus:ring-1 focus:ring-[#E27A2B]"
                    autoFocus
                  />
                </div>
              </div>

              {/* Exact vertical scrollable list from reference image */}
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
                {filteredLanguages.map((lang) => {
                  const isSelected = selectedLanguage === lang;
                  return (
                    <button
                      key={lang}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setActiveDropdown(null);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#e8f0fe] dark:bg-neutral-800/80 font-bold text-[#1a73e8]'
                          : 'text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <span>{lang}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#1a73e8]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Clear Formatting (Tx) */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClearFormatting}
          disabled={isHtmlMode}
          className="p-2 hover:bg-[#f1f3f4] dark:hover:bg-neutral-800 rounded-xs cursor-pointer disabled:opacity-30 text-[#5f6368] dark:text-neutral-400 hover:text-red-500"
          title="Clear formatting (Remove all styling)"
        >
          <RemoveFormatting className="w-5 h-5" />
        </button>
        </div>
      </div>

      {/* ========================================================
          BOX 2: STANDALONE CONTENT EDITOR WRITING BOX (SPACED)
          ======================================================== */}
      <div className="bg-[#f8f9fa] dark:bg-[#0a101d] border border-[#dadce0] dark:border-neutral-800 rounded-lg shadow-sm flex flex-col overflow-hidden relative">
        {/* Interactive Image Control Bar (appears when an image is clicked in the editor) */}
        {selectedImage && (
          <div className="bg-[#0C2340] text-white px-4 py-2 flex items-center justify-between gap-3 text-xs border-b border-amber-500/40 shadow-sm animate-in slide-in-from-top-2 duration-150 z-30">
            <div className="flex items-center gap-2 shrink-0">
              <ImageIcon className="w-4 h-4 text-[#E27A2B] shrink-0" />
              <span className="font-bold text-amber-300 hidden sm:inline">Image Controls:</span>
              <span className="text-[11px] text-neutral-300 font-mono truncate max-w-[120px]">
                {selectedImage.alt || 'Selected Image'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Alignment / Move */}
              <span className="text-[10px] uppercase font-bold text-neutral-400 mr-0.5 hidden md:inline">Align:</span>
              <div className="flex items-center bg-white/10 rounded p-0.5">
                <button
                  type="button"
                  onClick={() => handleUpdateImageAlignment('left')}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    selectedImage.alignment === 'left' ? 'bg-[#E27A2B] text-white' : 'hover:bg-white/20 text-neutral-300'
                  }`}
                  title="Align Left (Block left - no text wrap)"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateImageAlignment('center')}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    selectedImage.alignment === 'center' ? 'bg-[#E27A2B] text-white' : 'hover:bg-white/20 text-neutral-300'
                  }`}
                  title="Align Center (Block center)"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateImageAlignment('right')}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    selectedImage.alignment === 'right' ? 'bg-[#E27A2B] text-white' : 'hover:bg-white/20 text-neutral-300'
                  }`}
                  title="Align Right (Block right - no text wrap)"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-4 w-[1px] bg-white/20 mx-1" />

              {/* Crop Tool Button */}
              <button
                type="button"
                onClick={() => setShowCropModal(true)}
                className="px-2.5 py-1 bg-[#E27A2B] hover:bg-[#d46a1d] text-white rounded font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Crop image (aspect ratios, zoom, canvas framing)"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Crop</span>
              </button>

              <div className="h-4 w-[1px] bg-white/20 mx-1" />

              {/* Manual Width Slider & Custom Input */}
              <span className="text-[10px] uppercase font-bold text-neutral-400 mr-0.5 hidden lg:inline">Width:</span>
              <div className="flex items-center gap-2 bg-white/10 rounded px-2 py-0.5">
                <input
                  type="range"
                  min="15"
                  max="100"
                  step="1"
                  value={parseInt(String(selectedImage?.width || '100').replace(/[^0-9]/g, ''), 10) || 100}
                  onChange={(e) => handleUpdateImageSize(`${e.target.value}%`)}
                  className="w-20 sm:w-28 accent-[#E27A2B] cursor-pointer h-1.5"
                  title="Slide to manually resize image width (15% - 100%)"
                />
                <div className="flex items-center">
                  <input
                    type="number"
                    min="15"
                    max="100"
                    value={parseInt(String(selectedImage?.width || '100').replace(/[^0-9]/g, ''), 10) || 100}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(15, parseInt(e.target.value, 10) || 15));
                      handleUpdateImageSize(`${val}%`);
                    }}
                    className="w-11 bg-black/40 text-amber-300 font-mono text-xs text-center border border-white/20 rounded py-0.5 focus:outline-none focus:border-[#E27A2B]"
                  />
                  <span className="text-[10px] font-mono text-neutral-300 ml-0.5">%</span>
                </div>
              </div>

              {/* Size Preset Buttons */}
              <div className="hidden sm:flex items-center bg-white/10 rounded p-0.5">
                {(['25%', '50%', '75%', '100%'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleUpdateImageSize(sz)}
                    className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded transition-colors cursor-pointer ${
                      selectedImage.width === sz ? 'bg-[#E27A2B] text-white' : 'hover:bg-white/20 text-neutral-300'
                    }`}
                  >
                    {sz === '25%' ? 'Small' : sz === '50%' ? 'Med' : sz === '75%' ? 'Large' : 'Full'}
                  </button>
                ))}
              </div>

              {/* Fine-tune +/- (5% steps) */}
              <div className="flex items-center bg-white/10 rounded p-0.5">
                <button
                  type="button"
                  onClick={() => handleAdjustImageSize(-5)}
                  className="px-1.5 py-0.5 hover:bg-white/20 rounded text-neutral-200 font-bold font-mono text-xs cursor-pointer"
                  title="Shrink width by 5%"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustImageSize(5)}
                  className="px-1.5 py-0.5 hover:bg-white/20 rounded text-neutral-200 font-bold font-mono text-xs cursor-pointer"
                  title="Expand width by 5%"
                >
                  +
                </button>
              </div>

              <div className="h-4 w-[1px] bg-white/20 mx-1" />

              {/* Delete Image */}
              <button
                type="button"
                onClick={handleDeleteSelectedImage}
                className="p-1 hover:bg-red-600/80 rounded text-red-300 hover:text-white transition-colors cursor-pointer"
                title="Delete this image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Close controls */}
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1 hover:bg-white/20 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer ml-1"
                title="Deselect image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Bounded Document Canvas */}
        <div
          ref={canvasContainerRef}
          className="p-4 sm:p-8 bg-[#f8f9fa] dark:bg-[#070e17] max-h-[640px] overflow-y-auto relative z-10 scroll-smooth"
        >
          {isHtmlMode ? (
            <div className="max-w-4xl mx-auto p-4 bg-neutral-950 border border-neutral-800 rounded-none shadow-md flex flex-col h-full">
              <div className="text-[11px] font-mono text-neutral-500 mb-2 flex items-center justify-between">
                <span>Code &amp; Embed View (Formatting codes &amp; custom embeds)</span>
                <span className="text-[#E27A2B] font-bold">Code View Active</span>
              </div>
              <textarea
                value={rawHtml}
                onChange={handleRawHtmlChange}
                rows={24}
                className="w-full flex-1 p-4 font-mono text-xs sm:text-sm bg-neutral-950 text-emerald-400 border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#E27A2B] rounded-none leading-relaxed"
                placeholder="Paste embed code or text here..."
              />
            </div>
          ) : (
            /* Exact Blogger Elevated White Paper Sheet with crisp border */
            <div className="max-w-4xl mx-auto bg-white dark:bg-[#0a1424] border border-[#dadce0] dark:border-neutral-800 shadow-sm rounded-none p-6 sm:p-12 lg:p-16 min-h-[500px] transition-colors relative z-10">
              <EditorContent editor={editor} />
            </div>
          )}
        </div>

        {/* ========================================================
            BOTTOM STATUS BAR
            ======================================================== */}
        <div className="px-4 py-2 bg-[#f1f3f4] dark:bg-neutral-950 border-t border-neutral-300 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-400 flex items-center justify-between font-mono select-none">
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>~{readTimeMin} min read</span>
          </div>
          <div className="flex items-center gap-2">
            {isHtmlMode && (
              <span className="text-[#E27A2B] font-bold">HTML Mode</span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          EXACT BLOGGER LINK DIALOG (MATCHING media_1791223956125.png)
          ======================================================== */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleInsertLinkConfirm}
            className="w-full max-w-sm bg-white dark:bg-neutral-900 shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 border border-neutral-200 dark:border-neutral-800"
          >
            {/* Input 1: Text to display with Blogger Orange Underline */}
            <div className="relative">
              <input
                type="text"
                placeholder="Text to display"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="w-full pb-1.5 text-sm bg-transparent border-0 border-b-2 border-[#E27A2B] text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#d46a1d] transition-colors"
              />
            </div>

            {/* Input 2: Paste or search for a link with Blogger Orange Underline */}
            <div className="relative">
              <input
                type="url"
                required
                placeholder="Paste or search for a link"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full pb-1.5 text-sm bg-transparent border-0 border-b-2 border-[#E27A2B] text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#d46a1d] transition-colors"
                autoFocus
              />
            </div>

            {/* Blogger Options Checkboxes */}
            <div className="space-y-3 pt-1 text-xs text-neutral-800 dark:text-neutral-200">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={linkBlank}
                  onChange={(e) => setLinkBlank(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-400 text-[#E27A2B] focus:ring-[#E27A2B] cursor-pointer"
                />
                <span>Open this link in a new window</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={linkNofollow}
                  onChange={(e) => setLinkNofollow(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-400 text-[#E27A2B] focus:ring-[#E27A2B] cursor-pointer"
                />
                <span>
                  Add &apos;rel=nofollow&apos; attribute{' '}
                  <span className="text-blue-600 dark:text-blue-400 hover:underline">(Learn more)</span>
                </span>
              </label>
            </div>

            {/* Action Buttons: Clean CANCEL and APPLY */}
            <div className="flex justify-end items-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!linkUrl.trim()}
                className="text-xs font-bold uppercase tracking-wider text-[#E27A2B] hover:text-[#d46a1d] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Apply
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          COMPACT SPECIAL CHARACTERS MODAL (NO SKETCHPAD)
          ======================================================== */}
      {showSpecialCharsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-[#dadce0] dark:border-neutral-700 shadow-2xl rounded p-4 space-y-3 animate-in fade-in zoom-in-95">
            {/* Header: Title and Close */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
              <h3 className="font-serif font-bold text-base text-neutral-900 dark:text-neutral-50">
                Insert special characters
              </h3>
              <button
                type="button"
                onClick={() => setShowSpecialCharsModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Selectors Row */}
            <div className="flex items-center gap-2 text-xs">
              <select
                value={specialCategory}
                onChange={(e) => {
                  const val = e.target.value as 'Emoji' | 'Symbol';
                  setSpecialCategory(val);
                  setSpecialSubcategory(Object.keys(SPECIAL_CHARS_CATALOG[val])[0]);
                }}
                className="px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded font-semibold text-neutral-800 dark:text-neutral-200"
              >
                <option value="Emoji">Emoji</option>
                <option value="Symbol">Symbol</option>
              </select>

              <select
                value={specialSubcategory}
                onChange={(e) => setSpecialSubcategory(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded font-semibold text-neutral-800 dark:text-neutral-200 truncate"
              >
                {Object.keys(SPECIAL_CHARS_CATALOG[specialCategory]).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search characters or emojis..."
                value={specialSearchQuery}
                onChange={(e) => setSpecialSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 focus:ring-1 focus:ring-[#E27A2B]"
              />
            </div>

            {/* Character Grid */}
            <div className="border border-neutral-300 dark:border-neutral-700 rounded p-2 overflow-y-auto max-h-56 bg-neutral-50/50 dark:bg-neutral-950/40">
              <div className="grid grid-cols-10 gap-1 text-base">
                {currentSpecialChars.map((ch, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertSpecialChar(ch)}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:scale-125 transition-transform cursor-pointer"
                    title={ch}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowSpecialCharsModal(false)}
                className="px-4 py-1.5 bg-[#0C2340] text-white dark:bg-[#E27A2B] text-xs font-bold rounded cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          INSERT VIDEO MODAL (YouTube, Vimeo, Google Drive, Direct MP4, Embed)
          ======================================================== */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleInsertVideoConfirm}
            className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 shadow-2xl rounded p-6 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
              <h3 className="font-serif font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                <Film className="w-4 h-4 text-[#E27A2B]" /> Insert Video
              </h3>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setVideoModalTab('url')}
                className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                  videoModalTab === 'url'
                    ? 'border-[#E27A2B] text-[#E27A2B]'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                Video Link / Stream
              </button>
              <button
                type="button"
                onClick={() => setVideoModalTab('embed')}
                className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                  videoModalTab === 'embed'
                    ? 'border-[#E27A2B] text-[#E27A2B]'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                Embed Code (iframe)
              </button>
            </div>

            {videoModalTab === 'url' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400 mb-1">
                    Paste Video Link or Stream URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://vimeo.com/... or https://youtube.com/... or https://drive.google.com/file/d/... or .mp4"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded focus:ring-1 focus:ring-[#E27A2B]"
                    autoFocus
                  />
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded border border-neutral-200 dark:border-neutral-700/60 space-y-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <span>✨ Supported video sources:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    <li><strong className="text-neutral-700 dark:text-neutral-300">Vimeo:</strong> Clean, ad-free editorial player</li>
                    <li><strong className="text-neutral-700 dark:text-neutral-300">Google Drive:</strong> 15 GB free video storage (set link to &quot;Anyone with link&quot;)</li>
                    <li><strong className="text-neutral-700 dark:text-neutral-300">YouTube:</strong> Public or unlisted video link</li>
                    <li><strong className="text-neutral-700 dark:text-neutral-300">Direct MP4 / CDN:</strong> Direct .mp4, .webm, or Bunny.net / Cloudflare Stream</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400">
                  Paste Embed Snippet (&lt;iframe&gt; or &lt;video&gt;)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder='<iframe src="https://player.vimeo.com/video/..." width="640" height="360" frameborder="0" allowfullscreen></iframe>'
                  value={videoEmbedCode}
                  onChange={(e) => setVideoEmbedCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded focus:ring-1 focus:ring-[#E27A2B]"
                  autoFocus
                />
                <p className="text-[11px] text-neutral-500">
                  Paste embed code from Cloudflare Stream, Bunny.net, Wistia, Loom, or your self-hosted video player.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#E27A2B] hover:bg-[#d66f22] text-white text-xs font-bold rounded cursor-pointer transition-colors"
              >
                Insert Video
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          INSERT IMAGE BY URL MODAL
          ======================================================== */}
      {showImageUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleInsertImageUrlConfirm}
            className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 shadow-2xl rounded p-6 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
              <h3 className="font-serif font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-500" /> Insert Image by Web URL
              </h3>
              <button
                type="button"
                onClick={() => setShowImageUrlModal(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400 mb-1">
                Image Web URL
              </label>
              <input
                type="url"
                required
                placeholder="https://example.com/photo.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded focus:ring-1 focus:ring-[#E27A2B]"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowImageUrlModal(false)}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#0C2340] text-white dark:bg-[#E27A2B] text-xs font-bold rounded cursor-pointer"
              >
                Insert Photo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          IMAGE CROP MODAL (CANVAS-BASED ASPECT RATIOS & FRAMING)
          ======================================================== */}
      {showCropModal && selectedImage && (
        <ImageCropperModal
          isOpen={showCropModal}
          imageUrl={selectedImage.src}
          onCropComplete={handleCropComplete}
          onClose={() => setShowCropModal(false)}
        />
      )}
    </div>
  );
}
