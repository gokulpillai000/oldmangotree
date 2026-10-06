'use client';

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  X,
  BookOpen,
  FileText,
  PenTool,
  Check,
  Copy,
  Sparkles,
  Lightbulb,
  AlignLeft,
  Quote,
  Image as ImageIcon,
  Type,
} from 'lucide-react';

interface PublisherHelpGuideProps {
  onInsertTemplate?: (template: string) => void;
}

export function PublisherHelpGuide({ onInsertTemplate }: PublisherHelpGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'structure' | 'markdown' | 'media' | 'style' | 'templates'>('structure');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Close on Escape key, toggle on '?'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
      if (
        e.key === '?' &&
        !isOpen &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(label);
    setTimeout(() => {
      setCopiedSnippet(null);
    }, 2000);
  };

  const essayTemplate = `## The Opening Horizon
Begin your essay with a compelling scene, an unexpected question, or a poignant observation that grounds the reader in the socio-cultural or political moment.

> "A memorable quote from a historical figure, literary work, or interview subject that encapsulates the thesis."

## Cultural Context & Background
Detail the historical antecedents, societal currents, or ideological debate that give rise to this topic. Avoid superficial summaries; provide critical depth and intellectual context.

### The Critical Turning Point
- **First observation:** Analyze how cultural institutions or policy shifts influenced everyday reality.
- **Second observation:** Examine competing narratives and nuances that are often overlooked in mainstream media.

![Descriptive caption of photo or archival illustration](https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80)

## Deeper Reflections
Connect the local Kerala or regional Indian experience to broader global humanistic questions. What does this reveal about our contemporary conscience?

## Epilogue / Conclusion
Draw together the narrative strands, offering an enduring insight or evocative closing thought that lingers in the reader's mind long after reading.`;

  const reviewTemplate = `## Introduction & Premise
Introduce the work (book, film, art exhibition, or theatrical performance) and its creator. State the central thematic proposition and why this work demands our attention today.

> "An excerpt from the book or a poignant dialogue from the film that reveals its artistic ambition."

## The Aesthetic & Narrative Architecture
Examine the craftsmanship: structure, prose style, cinematography, character development, or tonal shifts. What traditions does the creator draw upon or subvert?

### Strengths & Nuances
- **Thematic Resonance:** How convincingly the work engages with memory, identity, or politics.
- **Form & Voice:** The unique stylistic choices that distinguish this artistic contribution.

## Critical Evaluation & Takeaway
Offer a measured critique. Where does the work succeed brilliantly, and where does it fall short? Conclude with its place in contemporary cultural discourse.`;

  return (
    <>
      {/* Floating Bottom-Corner Help Button */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-[#0C2340] hover:bg-[#123157] active:scale-95 text-[#E27A2B] rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-[#E27A2B]/40"
          aria-label="Open Content Writing Guide"
          title="Content Writing Guide & Formatting Manual"
        >
          <HelpCircle className="w-5 h-5 text-[#E27A2B]" />
          <span className="text-xs sm:text-sm font-bold tracking-wide hidden sm:inline-block text-white">
            Writing Guide
          </span>
        </button>
      </div>

      {/* Fullscreen Overlay & Writing Guide Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border-2 border-neutral-300 dark:border-neutral-700 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="writing-guide-title"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between bg-neutral-50 dark:bg-neutral-950/60">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-[#0C2340] text-[#E27A2B] border border-[#E27A2B]/30">
                    <PenTool className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 id="writing-guide-title" className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                      Editorial Writing Guide &amp; Editor Manual
                    </h2>
                    <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Editorial guidelines, essay architecture, typography, and Markdown syntax for Old Mango Tree writers.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close writing guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-2 px-4 sm:px-6 py-3 overflow-x-auto scrollbar-none border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/80 text-xs sm:text-sm font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('structure')}
                className={`px-4 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'structure'
                    ? 'bg-[#0C2340] text-white dark:bg-[#E27A2B] shadow-xs'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                <AlignLeft className="w-4 h-4" />
                <span>Essay Structure</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('markdown')}
                className={`px-4 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'markdown'
                    ? 'bg-[#0C2340] text-white dark:bg-[#E27A2B] shadow-xs'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                <Type className="w-4 h-4" />
                <span>Markdown Syntax</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('media')}
                className={`px-4 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'media'
                    ? 'bg-[#0C2340] text-white dark:bg-[#E27A2B] shadow-xs'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Images &amp; Quotes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('style')}
                className={`px-4 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'style'
                    ? 'bg-[#0C2340] text-white dark:bg-[#E27A2B] shadow-xs'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Voice &amp; Bilingual Style</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                className={`px-4 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'templates'
                    ? 'bg-[#0C2340] text-white dark:bg-[#E27A2B] shadow-xs'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Writing Templates</span>
              </button>
            </div>

            {/* Modal Body / Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-neutral-900 dark:text-neutral-100">

              {/* TAB 1: ESSAY STRUCTURE */}
              {activeTab === 'structure' && (
                <div className="space-y-6">
                  <div className="p-4 sm:p-5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-[#E27A2B] shrink-0 mt-0.5" />
                    <div className="text-sm sm:text-base text-neutral-900 dark:text-neutral-100 font-medium leading-relaxed">
                      <strong className="text-[#E27A2B]">The Anatomy of an oldmangotree Essay:</strong> We prioritize narrative depth, nuance, and cultural insight. A memorable piece balances vivid storytelling with rigorous analytical reflection.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Element 1: Headline */}
                    <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border-2 border-neutral-200 dark:border-neutral-700 space-y-2">
                      <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#E27A2B]">1. Headline / Title</span>
                      <h4 className="font-serif font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-50">
                        Evocative &amp; Specific
                      </h4>
                      <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans">
                        Avoid sensationalist clickbait. Choose titles that capture the spirit, conflict, or literary core of the piece. (e.g. <em>&ldquo;Monsoon Shadows: The Shifting Landscapes of Valluvanad&rdquo;</em>).
                      </p>
                    </div>

                    {/* Element 2: Excerpt / Dek */}
                    <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border-2 border-neutral-200 dark:border-neutral-700 space-y-2">
                      <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#E27A2B]">2. Excerpt / Dek</span>
                      <h4 className="font-serif font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-50">
                        The 2-Sentence Hook
                      </h4>
                      <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans">
                        This summary appears on feed cards and social shares. State the central argument or opening dilemma clearly in 30–45 words.
                      </p>
                    </div>

                    {/* Element 3: Narrative Arc */}
                    <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border-2 border-neutral-200 dark:border-neutral-700 space-y-2">
                      <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#E27A2B]">3. Body Sections</span>
                      <h4 className="font-serif font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-50">
                        Section Breaks &amp; Rhythm
                      </h4>
                      <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans">
                        Break long essays (1,200+ words) into readable movements using level-2 headers (<code className="font-mono text-xs font-bold bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded">## Subheading</code>). Introduce pull-quotes to punctuate key reflections.
                      </p>
                    </div>

                    {/* Element 4: Concluding Note */}
                    <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border-2 border-neutral-200 dark:border-neutral-700 space-y-2">
                      <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#E27A2B]">4. Conclusion</span>
                      <h4 className="font-serif font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-50">
                        The Lingering Reflection
                      </h4>
                      <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans">
                        Do not simply summarize what came before. Open the lens outward — what does this subject teach us about memory, society, or the human condition?
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MARKDOWN SYNTAX */}
              {activeTab === 'markdown' && (
                <div className="space-y-6">
                  <p className="text-sm sm:text-base text-neutral-800 dark:text-neutral-200 font-medium">
                    Standard Markdown formatting supported in the editor. Click <strong>Copy</strong> to use any snippet:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Headings */}
                    <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border-2 border-neutral-200 dark:border-neutral-700 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold uppercase text-neutral-900 dark:text-neutral-100">Headings &amp; Sections</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('## Major Section Heading\n### Minor Subheading', 'h')}
                          className="text-xs sm:text-sm text-[#E27A2B] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                        >
                          {copiedSnippet === 'h' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSnippet === 'h' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <code className="block p-3 text-xs sm:text-sm font-mono rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold leading-relaxed">
                        ## Major Section Heading<br />
                        ### Minor Sub-section
                      </code>
                    </div>

                    {/* Pull Quotes */}
                    <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border-2 border-neutral-200 dark:border-neutral-700 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold uppercase text-neutral-900 dark:text-neutral-100">Blockquotes &amp; Epigraphs</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('> "Literature is the memory of human experience."\n> — O.V. Vijayan', 'quote')}
                          className="text-xs sm:text-sm text-[#E27A2B] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                        >
                          {copiedSnippet === 'quote' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSnippet === 'quote' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <code className="block p-3 text-xs sm:text-sm font-mono rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold leading-relaxed">
                        &gt; &quot;Quoted passage from a character or text.&quot;<br />
                        &gt; — Attribution / Speaker
                      </code>
                    </div>

                    {/* Bold & Italic */}
                    <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border-2 border-neutral-200 dark:border-neutral-700 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold uppercase text-neutral-900 dark:text-neutral-100">Emphasis &amp; Italics</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('**Bold thesis statement** and *italicized term or title*', 'em')}
                          className="text-xs sm:text-sm text-[#E27A2B] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                        >
                          {copiedSnippet === 'em' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSnippet === 'em' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <code className="block p-3 text-xs sm:text-sm font-mono rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold leading-relaxed">
                        **Bold for key arguments**<br />
                        *Italics for book titles and foreign terms*
                      </code>
                    </div>

                    {/* Lists */}
                    <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border-2 border-neutral-200 dark:border-neutral-700 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold uppercase text-neutral-900 dark:text-neutral-100">Lists &amp; Points</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('- Observation one\n- Observation two\n\n1. Chronological step one\n2. Chronological step two', 'list')}
                          className="text-xs sm:text-sm text-[#E27A2B] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                        >
                          {copiedSnippet === 'list' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSnippet === 'list' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <code className="block p-3 text-xs sm:text-sm font-mono rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold leading-relaxed">
                        - Bullet point item<br />
                        1. Sequenced argument point
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MEDIA & QUOTES */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border-2 border-neutral-200 dark:border-neutral-700 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-[#E27A2B]" />
                          <span>Embedding In-Body Photos &amp; Illustrations</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('![Illustration caption or photo credit](https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80)', 'bodyimg')}
                          className="text-xs sm:text-sm text-[#E27A2B] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                        >
                          {copiedSnippet === 'bodyimg' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSnippet === 'bodyimg' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans">
                        To add an illustration or photograph in the flow of your article, place this Markdown tag on its own line:
                      </p>
                      <code className="block p-3 text-xs sm:text-sm font-mono rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold leading-relaxed break-all">
                        ![Photo credit: Kerala Lalithakala Akademi](https://images.unsplash.com/...)
                      </code>
                    </div>

                    <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border-2 border-neutral-200 dark:border-neutral-700 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                          <Quote className="w-4 h-4 text-[#E27A2B]" />
                          <span>Poetic Stanzas &amp; Indented Verses</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('> കാറ്റിൽ ഉലയുന്ന മാമ്പൂക്കൾ,<br />\n> ഭൂമിയുടെ ഓർമ്മകളിൽ ഒരു തണൽ.', 'verse')}
                          className="text-xs sm:text-sm text-[#E27A2B] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                        >
                          {copiedSnippet === 'verse' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSnippet === 'verse' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans">
                        For Malayalam poetry or verse quotations, use blockquotes with two spaces at line ends for soft breaks:
                      </p>
                      <code className="block p-3 text-xs sm:text-sm font-mono rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold leading-relaxed">
                        &gt; Line one of poem (add 2 trailing spaces)<br />
                        &gt; Line two of poem
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: VOICE & BILINGUAL STYLE */}
              {activeTab === 'style' && (
                <div className="space-y-6">
                  <div className="p-4 sm:p-5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 text-sm sm:text-base text-neutral-900 dark:text-neutral-100 font-medium leading-relaxed">
                    <strong className="text-[#E27A2B]">oldmangotree Editorial Voice:</strong> We are a webzine of critical essays, cultural inquiry, and literary storytelling. Write with precision, warmth, and intellectual curiosity.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border-2 border-neutral-200 dark:border-neutral-700 space-y-2">
                      <h4 className="font-serif font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-50">
                        Bilingual &amp; Malayalam Nuances
                      </h4>
                      <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans">
                        • Malayalam words (e.g. <em>Kaavu</em>, <em>Kettukazhcha</em>, <em>Chakyar</em>) should be italicized on first mention with a brief context clue.<br />
                        • Direct quotes in Malayalam script (മലയാളം) render beautifully in the reader&apos;s serif typography.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border-2 border-neutral-200 dark:border-neutral-700 space-y-2">
                      <h4 className="font-serif font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-50">
                        Tone &amp; Objectivity
                      </h4>
                      <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans">
                        • Favor analytical critique over partisan rhetoric.<br />
                        • Give voice to marginalized perspectives, grassroots ecology, and historical memory that mainstream publications neglect.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: READY-TO-USE WRITING TEMPLATES */}
              {activeTab === 'templates' && (
                <div className="space-y-6">
                  {/* Long-form Essay Template */}
                  <div className="p-5 sm:p-6 rounded-xl bg-neutral-900 text-neutral-100 space-y-3 border-2 border-neutral-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E27A2B]">
                        <PenTool className="w-4 h-4" />
                        <span>Template 1: Cultural &amp; Political Essay</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {onInsertTemplate && (
                          <button
                            type="button"
                            onClick={() => {
                              onInsertTemplate(essayTemplate);
                              setIsOpen(false);
                            }}
                            className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#E27A2B] hover:bg-[#d46a1d] text-xs sm:text-sm font-bold text-white transition-colors cursor-pointer"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>Apply to Editor</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(essayTemplate, 't1')}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs sm:text-sm font-bold text-neutral-200 transition-colors cursor-pointer"
                        >
                          {copiedSnippet === 't1' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Snippet</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <pre className="text-xs sm:text-sm font-mono text-neutral-200 bg-black/60 p-4 rounded-xl overflow-x-auto leading-relaxed border border-neutral-700 max-h-56 scrollbar-thin">
                      {essayTemplate}
                    </pre>
                  </div>

                  {/* Book & Film Review Template */}
                  <div className="p-5 sm:p-6 rounded-xl bg-neutral-900 text-neutral-100 space-y-3 border-2 border-neutral-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E27A2B]">
                        <BookOpen className="w-4 h-4" />
                        <span>Template 2: Book / Film / Art Review</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {onInsertTemplate && (
                          <button
                            type="button"
                            onClick={() => {
                              onInsertTemplate(reviewTemplate);
                              setIsOpen(false);
                            }}
                            className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#E27A2B] hover:bg-[#d46a1d] text-xs sm:text-sm font-bold text-white transition-colors cursor-pointer"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>Apply to Editor</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(reviewTemplate, 't2')}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs sm:text-sm font-bold text-neutral-200 transition-colors cursor-pointer"
                        >
                          {copiedSnippet === 't2' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Snippet</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <pre className="text-xs sm:text-sm font-mono text-neutral-200 bg-black/60 p-4 rounded-xl overflow-x-auto leading-relaxed border border-neutral-700 max-h-56 scrollbar-thin">
                      {reviewTemplate}
                    </pre>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950/60 text-xs sm:text-sm">
              <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                Press <kbd className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono text-xs font-bold">Esc</kbd> or <kbd className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono text-xs font-bold">?</kbd> to dismiss
              </span>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-[#0C2340] hover:bg-[#123157] text-[#E27A2B] font-bold transition-colors cursor-pointer border border-[#E27A2B]/40"
              >
                Back to Writing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
