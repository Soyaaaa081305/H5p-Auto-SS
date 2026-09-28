import React from 'react';
import { Logo } from './Logo';
import { Bookmark, Sun, Moon } from 'lucide-react';
import { useTheme } from '../lib/theme';

export const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  // 1-Click Bookmarklet code: triggers H5P download on Blackboard and opens H5P to PDF Website
  const bookmarkletCode = `javascript:(function(){var d=document,b=d.querySelector('.h5p-reuse')||d.querySelector('button[aria-label*="Reuse"]');if(!b){var f=d.querySelectorAll('iframe');for(var i=0;i<f.length;i++){try{var ib=f[i].contentDocument?.querySelector('.h5p-reuse')||f[i].contentDocument?.querySelector('button[aria-label*="Reuse"]');if(ib){b=ib;break;}}catch(e){}}}if(b){b.click();}window.open('https://soyaaaa081305.github.io/H5p-Auto-SS/','_blank');})();`;

  return (
    <header className="no-print bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        <Logo size={28} />

        <div className="flex items-center gap-3">
          {/* H5P to PDF Website Bookmarklet */}
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
              H5P to PDF Website Bookmarklet
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
              Drag this button to your Bookmarks Bar
            </span>
          </div>

          <a
            href={bookmarkletCode}
            onClick={(e) => {
              e.preventDefault();
              alert("Drag this button to your browser's Bookmarks Bar! (Cmd+Shift+B on Mac or Ctrl+Shift+B on Windows). When clicked on Blackboard, it downloads the .h5p module and opens H5P to PDF Website!");
            }}
            draggable={true}
            title="Drag this button to your Bookmarks Bar"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white font-medium text-xs shadow-xs transition-transform active:scale-95 cursor-grab active:cursor-grabbing flex-shrink-0"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>H5P to PDF Website</span>
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
    </header>
  );
};
