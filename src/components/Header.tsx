import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Logo } from './Logo';
import { Bookmark, Sun, Moon, Check, X, Sparkles } from 'lucide-react';
import { useTheme } from '../lib/theme';

export const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [showBookmarkHelp, setShowBookmarkHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  // 1-Click Bookmarklet code: triggers H5P download on Blackboard and opens H5P to PDF Website
  const bookmarkletCode = `javascript:(function(){var d=document,b=d.querySelector('.h5p-reuse')||d.querySelector('button[aria-label*="Reuse"]');if(!b){var f=d.querySelectorAll('iframe');for(var i=0;i<f.length;i++){try{var ib=f[i].contentDocument?.querySelector('.h5p-reuse')||f[i].contentDocument?.querySelector('button[aria-label*="Reuse"]');if(ib){b=ib;break;}}catch(e){}}}if(b){b.click();}window.open('https://soyaaaa081305.github.io/H5p-Auto-SS/','_blank','noopener,noreferrer');})();`;

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(bookmarkletCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.warn('Could not copy automatically:', err);
    }
    setShowBookmarkHelp(true);
  };

  return (
    <header className="no-print bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        <Logo size={28} />

        <div className="flex items-center gap-3">
          {/* Bookmarklet Button (Click to copy & view confirmation, or drag to Bookmarks bar) */}
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
              H5P to PDF Bookmarklet
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
              Click to add or drag to Bookmarks
            </span>
          </div>

          <a
            href={bookmarkletCode}
            onClick={handleBookmarkClick}
            draggable={true}
            title="Click to copy bookmarklet, or drag to your Bookmarks Bar"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white font-medium text-xs shadow-xs transition-transform active:scale-95 cursor-grab active:cursor-grabbing flex-shrink-0"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">H5P to PDF Website</span><span className="sm:hidden">Bookmark</span>
          </a>

          {/* Dark / Light Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>
        </div>
      </div>

      {/* Bookmark Confirmation & Drag Modal */}
      {showBookmarkHelp &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] overflow-y-auto bg-zinc-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowBookmarkHelp(false);
            }}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative z-[10000] p-6 space-y-5 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans">
                      Blackboard Bookmarklet
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                      1-click H5P downloader for Blackboard modules
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBookmarkHelp(false)}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Banner */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-950 dark:text-emerald-200 font-medium">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>
                  {copied
                    ? 'Bookmark code copied to your clipboard automatically!'
                    : 'Bookmark code ready — drag below or paste into URL!'}
                </span>
              </div>

              {/* 2 Ways to Add */}
              <div className="space-y-3 text-xs">
                {/* Option 1: Drag */}
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      Option 1: Drag to Bookmarks Bar (Instant)
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">Recommended</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Make sure your browser's bookmarks bar is visible (<kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono text-[10px]">Cmd+Shift+B</kbd> on Mac or <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono text-[10px]">Ctrl+Shift+B</kbd> on Windows), then drag this button directly onto it:
                  </p>
                  <div className="pt-1 flex justify-center">
                    <a
                      href={bookmarkletCode}
                      draggable={true}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white font-semibold text-xs shadow-md cursor-grab active:cursor-grabbing transition-transform hover:scale-105 active:scale-95"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Bookmark className="w-4 h-4" />
                      <span>Drag Me to Bookmarks Bar</span>
                    </a>
                  </div>
                </div>

                {/* Option 2: Add Bookmark */}
                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                    Option 2: Add Bookmark via Browser Shortcut
                  </span>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">Cmd+D</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">Ctrl+D</kbd>, name it <strong>H5P to PDF</strong>, and paste into the <strong>URL</strong> field.
                  </p>
                </div>
              </div>

              {/* How to use */}
              <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs flex items-start gap-2 leading-relaxed">
                <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>When on Blackboard:</strong> Click your new bookmark while on any H5P slide module. It triggers the reuse download and opens this site for instant conversion!
                </span>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowBookmarkHelp(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white font-semibold text-xs shadow-xs transition-colors"
                >
                  Got It!
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};
