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
  List,
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
      {/* Floating Bottom-Corner Help Button - Visible ONLY on Content Writing Page */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-brand-700 hover:bg-brand-600 active:scale-95 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 border border-brand-500/30"
          aria-label="Open Content Writing Guide"
          title="Content Writing Guide & Formatting Manual"
        >
          {/* Subtle pulsating indicator ring */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>

          <HelpCircle className="w-5 h-5 text-white transition-transform group-hover:rotate-12" />

          <span className="text-xs font-bold tracking-wide hidden sm:inline-block">
            Writing Guide
          </span>

          <span className="hidden md:inline-flex items-center text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-brand-800/80 text-brand-200 border border-brand-400/20">
            Manual
          </span>
        </button>
      </div>

      {/* Fullscreen Overlay & Writing Guide Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="writing-guide-title"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between bg-neutral-50/70 dark:bg-neutral-950/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                    <PenTool className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 id="writing-guide-title" className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                      Content Writing Guide &amp; Editor Manual
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                      Editorial guidelines, essay architecture, typography, and Markdown syntax for oldmangotree writers.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Close writing guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 overflow-x-auto scrollbar-none border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/50 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('structure')}
                className={`px-3.5 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'structure'
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Essay Structure</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('markdown')}
                className={`px-3.5 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'markdown'
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Markdown Syntax</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('media')}
                className={`px-3.5 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'media'
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Images &amp; Quotes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('style')}
                className={`px-3.5 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'style'
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Voice &amp; Bilingual Style</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                className={`px-3.5 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'templates'
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Writing Templates</span>
              </button>
            </div>

            {/* Modal Body / Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-neutral-800 dark:text-neutral-200">

              {/* TAB 1: ESSAY STRUCTURE */}
              {activeTab === 'structure' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/50 flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-brand-700 dark:text-brand-300 shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-brand-900 dark:text-brand-200 leading-relaxed">
                      <strong>The Anatomy of an oldmangotree Essay:</strong> We prioritize narrative depth, nuance, and cultural insight. A memorable piece balances vivid storytelling with rigorous analytical reflection.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Element 1: Headline */}
                    <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">1. Headline / Title</span>
                      <h4 className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                        Evocative &amp; Specific
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        Avoid sensationalist clickbait. Choose titles that capture the spirit, conflict, or literary core of the piece. (e.g. <em>"Monsoon Shadows: The Shifting Landscapes of Valluvanad"</em>).
                      </p>
                    </div>

                    {/* Element 2: Excerpt / Dek */}
                    <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">2. Excerpt / Dek</span>
                      <h4 className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                        The 2-Sentence Hook
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        This summary appears on feed cards and social shares. State the central argument or opening dilemma in 30–45 words.
                      </p>
                    </div>

                    {/* Element 3: Narrative Arc */}
                    <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">3. Body Sections</span>
                      <h4 className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                        Section Breaks &amp; Rhythm
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        Break long essays (1,200+ words) into readable movements using level-2 headers (<code className="font-mono text-[11px]">## Subheading</code>). Introduce pull-quotes to punctuate key reflections.
                      </p>
                    </div>

                    {/* Element 4: Concluding Note */}
                    <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">4. Conclusion</span>
                      <h4 className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                        The Lingering Reflection
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        Do not simply summarize what came before. Open the lens outward — what does this subject teach us about memory, society, or the human condition?
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MARKDOWN SYNTAX */}
              {activeTab === 'markdown' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                      Standard Markdown formatting supported in the editor. Click <strong>Copy</strong> to use any snippet:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Headings */}
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Headings &amp; Sections</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('## Major Section Heading\n### Minor Subheading', 'h')}
                          className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          {copiedSnippet === 'h' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedSnippet === 'h' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <code className="block p-2.5 text-xs font-mono rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        ## Major Section Heading<br />
                        ### Minor Sub-section
                      </code>
                    </div>

                    {/* Pull Quotes */}
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Blockquotes &amp; Epigraphs</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('> "Literature is the memory of human experience."\n> — O.V. Vijayan', 'quote')}
                          className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          {copiedSnippet === 'quote' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedSnippet === 'quote' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <code className="block p-2.5 text-xs font-mono rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        &gt; &quot;Quoted passage from a character or text.&quot;<br />
                        &gt; — Attribution / Speaker
                      </code>
                    </div>

                    {/* Bold & Italic */}
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Emphasis &amp; Italics</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('**Bold thesis statement** and *italicized term or title*', 'em')}
                          className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          {copiedSnippet === 'em' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedSnippet === 'em' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <code className="block p-2.5 text-xs font-mono rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        **Bold for key arguments**<br />
                        *Italics for book titles and foreign terms*
                      </code>
                    </div>

                    {/* Lists */}
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Lists &amp; Points</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('- Observation one\n- Observation two\n\n1. Chronological step one\n2. Chronological step two', 'list')}
                          className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          {copiedSnippet === 'list' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedSnippet === 'list' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <code className="block p-2.5 text-xs font-mono rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        - Bullet point item<br />
                        1. Sequenced argument point
                      </code>
                    </div>

                    {/* Links */}
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Hyperlinks</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('[Read the archival report](https://example.com)', 'link')}
                          className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          {copiedSnippet === 'link' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedSnippet === 'link' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <code className="block p-2.5 text-xs font-mono rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        [Link text](https://example.com)
                      </code>
                    </div>

                    {/* Section Dividers */}
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Divider Rule</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('\n\n---\n\n', 'div')}
                          className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          {copiedSnippet === 'div' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedSnippet === 'div' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <code className="block p-2.5 text-xs font-mono rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        --- (three dashes on a blank line)
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MEDIA & QUOTES */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-brand-600" />
                          <span>Embedding In-Body Photos &amp; Illustrations</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('![Illustration caption or photo credit](https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80)', 'bodyimg')}
                          className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          {copiedSnippet === 'bodyimg' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedSnippet === 'bodyimg' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        To add an illustration or photograph in the flow of your article, place this Markdown tag on its own line:
                      </p>
                      <code className="block p-2.5 text-xs font-mono rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 break-all">
                        ![Photo credit: Kerala Lalithakala Akademi](https://images.unsplash.com/...)
                      </code>
                    </div>

                    <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                          <Quote className="w-4 h-4 text-brand-600" />
                          <span>Poetic Stanzas &amp; Indented Verses</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('> കാറ്റിൽ ഉലയുന്ന മാമ്പൂക്കൾ,<br />\n> ഭൂമിയുടെ ഓർമ്മകളിൽ ഒരു തണൽ.', 'verse')}
                          className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          {copiedSnippet === 'verse' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedSnippet === 'verse' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        For Malayalam poetry or verse quotations, use blockquotes with two spaces at line ends for soft breaks:
                      </p>
                      <code className="block p-2.5 text-xs font-mono rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
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
                  <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/50 text-xs sm:text-sm text-brand-900 dark:text-brand-200 leading-relaxed">
                    <strong>oldmangotree Editorial Voice:</strong> We are a webzine of critical essays, cultural inquiry, and literary storytelling. Write with precision, warmth, and intellectual curiosity.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                      <h4 className="font-serif font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        Bilingual &amp; Malayalam Nuances
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        • Malayalam words (e.g. <em>Kaavu</em>, <em>Kettukazhcha</em>, <em>Chakyar</em>) should be italicized on first mention with a brief context clue.<br />
                        • Direct quotes in Malayalam script (മലയാളം) render beautifully in the reader's serif typography.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                      <h4 className="font-serif font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        Tone &amp; Objectivity
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
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
                  <div className="p-5 rounded-2xl bg-neutral-900 text-neutral-100 space-y-3 border border-neutral-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400">
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
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition-colors shadow-sm"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>Apply to Editor</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(essayTemplate, 't1')}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition-colors"
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
                    <pre className="text-xs font-mono text-neutral-300 bg-neutral-950/80 p-3.5 rounded-xl overflow-x-auto leading-relaxed border border-neutral-800 max-h-48 scrollbar-thin">
                      {essayTemplate}
                    </pre>
                  </div>

                  {/* Book & Film Review Template */}
                  <div className="p-5 rounded-2xl bg-neutral-900 text-neutral-100 space-y-3 border border-neutral-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400">
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
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition-colors shadow-sm"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>Apply to Editor</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(reviewTemplate, 't2')}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition-colors"
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
                    <pre className="text-xs font-mono text-neutral-300 bg-neutral-950/80 p-3.5 rounded-xl overflow-x-auto leading-relaxed border border-neutral-800 max-h-48 scrollbar-thin">
                      {reviewTemplate}
                    </pre>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-950/40 text-xs">
              <span className="text-neutral-500">
                Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono text-[10px]">Esc</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono text-[10px]">?</kbd> to dismiss
              </span>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-bold transition-colors"
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
