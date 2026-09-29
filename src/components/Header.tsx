import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Logo } from './Logo';
import { Bookmark, Sun, Moon, Check, X, Sparkles } from 'lucide-react';
import { useTheme } from '../lib/theme';

// Resilient Bookmarklet: auto-clicks H5P reuse/download, resolves H5PIntegration export URLs,
// excludes Blackboard system iframes (like MS Teams API), and guides students to the LTI tab
const BOOKMARKLET_CODE =
  "javascript:(function(){" +
  "function n(t,m,u,l){" +
  "var i='h5p-toast',o=document.getElementById(i);if(o)o.remove();" +
  "var b=document.createElement('div');b.id=i;" +
  "b.style.cssText='position:fixed;top:20px;right:20px;z-index:9999999;background:#18181b;color:#fafafa;padding:16px;border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,0.35);max-width:380px;border:1px solid #3f3f46;line-height:1.4;';" +
  "b.innerHTML='<div style=\"font-weight:700;font-size:13px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;\"><span>'+t+'</span><button onclick=\"document.getElementById(\\''+i+'\\').remove()\" style=\"background:none;border:none;color:#a1a1aa;cursor:pointer;font-size:16px;\">&times;</button></div><p style=\"font-size:12px;color:#d4d4d8;margin:0 0 10px 0;\">'+m+'</p>'+(u?'<div style=\"display:flex;gap:8px;\"><a href=\"'+u+'\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"background:#4f46e5;color:#fff;text-decoration:none;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;\">'+(l||'Open')+' &nearr;</a><button onclick=\"document.getElementById(\\''+i+'\\').remove()\" style=\"background:#27272a;color:#a1a1aa;border:none;padding:6px 10px;border-radius:8px;font-size:12px;cursor:pointer;\">Dismiss</button></div>':'');" +
  "document.body.appendChild(b);" +
  "if(!u)setTimeout(function(){if(b.parentNode)b.remove();},7000);" +
  "}" +
  "function isH5P(u){" +
  "if(!u)return false;" +
  "var l=u.toLowerCase();" +
  "if(l.indexOf('teams')!==-1||l.indexOf('blackboard.com/ready')!==-1||l.indexOf('telemetry')!==-1||l.indexOf('analytics')!==-1)return false;" +
  "return l.indexOf('h5p.com')!==-1||l.indexOf('h5p.org')!==-1||l.indexOf('/h5p/')!==-1||l.indexOf('h5p-')!==-1||l.indexOf('.h5p')!==-1;" +
  "}" +
  "function r(d){" +
  "try{" +
  "var w=d.defaultView||window;" +
  "if(w.H5PIntegration&&w.H5PIntegration.contents){" +
  "for(var k in w.H5PIntegration.contents){" +
  "var c=w.H5PIntegration.contents[k];" +
  "if(c&&c.exportUrl){" +
  "var a=d.createElement('a');a.href=c.exportUrl;a.download=(c.metadata&&c.metadata.title?c.metadata.title:'module')+'.h5p';" +
  "d.body.appendChild(a);a.click();a.remove();return true;" +
  "}" +
  "}" +
  "}" +
  "}catch(e){}" +
  "var btn=d.querySelector('.h5p-reuse,button.h5p-reuse,button[aria-label*=\"Reuse\" i],.h5p-export,a.h5p-export');" +
  "if(btn){" +
  "btn.click();" +
  "var at=0,tm=setInterval(function(){" +
  "at++;" +
  "var dl=d.querySelector('.h5p-download-button,a[href*=\".h5p\"],button[class*=\"download\"],.h5p-reuse-dialog button');" +
  "if(dl){clearInterval(tm);dl.click();}" +
  "else if(at>25){clearInterval(tm);}" +
  "},100);" +
  "return true;" +
  "}" +
  "return false;" +
  "}" +
  "if(r(document)){" +
  "n('✅ H5P Download Triggered','Module downloading! Opening H5P to PDF Converter...','https://soyaaaa081305.github.io/H5p-Auto-SS/','Go to Converter');" +
  "setTimeout(function(){window.open('https://soyaaaa081305.github.io/H5p-Auto-SS/','_blank');},1500);" +
  "return;" +
  "}" +
  "var dlLink=document.querySelector('a[href*=\".h5p\"]');" +
  "if(dlLink&&dlLink.href){" +
  "n('✅ Direct H5P Link Found','Starting download and opening converter...','https://soyaaaa081305.github.io/H5p-Auto-SS/','Go to Converter');" +
  "var a2=document.createElement('a');a2.href=dlLink.href;a2.download='';" +
  "document.body.appendChild(a2);a2.click();a2.remove();" +
  "setTimeout(function(){window.open('https://soyaaaa081305.github.io/H5p-Auto-SS/','_blank');},1500);" +
  "return;" +
  "}" +
  "var fs=document.querySelectorAll('iframe'),h5pFrame=null;" +
  "for(var i=0;i<fs.length;i++){" +
  "try{" +
  "var fd=fs[i].contentDocument||(fs[i].contentWindow&&fs[i].contentWindow.document);" +
  "if(fd&&r(fd)){" +
  "n('✅ H5P Download Triggered','Module found inside frame! Downloading...','https://soyaaaa081305.github.io/H5p-Auto-SS/','Go to Converter');" +
  "setTimeout(function(){window.open('https://soyaaaa081305.github.io/H5p-Auto-SS/','_blank');},1500);" +
  "return;" +
  "}" +
  "}catch(e){" +
  "var s=fs[i].src||fs[i].getAttribute('src')||'';" +
  "if(isH5P(s)){" +
  "h5pFrame=s;" +
  "}" +
  "}" +
  "}" +
  "if(h5pFrame){" +
  "n('🔒 H5P Slide In Frame','Click below to open the H5P player in a clean tab, then click this bookmark on that page:',h5pFrame,'Open H5P Slide');" +
  "return;" +
  "}" +
  "n('⚠️ H5P Slide Not Detected On This Tab','If Blackboard opened the slide in an \"LTI Launch\" tab, please switch to that tab and click this bookmark! Or look for the ⎘ Reuse button at the bottom-left of the slide.');" +
  "})();";

export const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [showBookmarkHelp, setShowBookmarkHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(BOOKMARKLET_CODE);
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
            href={BOOKMARKLET_CODE}
            onClick={handleBookmarkClick}
            draggable={true}
            title="Click to copy bookmarklet, or drag to your Bookmarks Bar"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white font-medium text-xs shadow-xs transition-transform active:scale-95 cursor-grab active:cursor-grabbing flex-shrink-0"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">H5P Bookmarklet</span><span className="sm:hidden">Bookmark</span>
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
                      href={BOOKMARKLET_CODE}
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
              <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs space-y-2.5 leading-relaxed">
                <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
                  <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>How to get your .h5p file from Blackboard:</span>
                </div>
                
                <div className="space-y-1 text-zinc-700 dark:text-zinc-300">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Method 1: Direct 2-Click Download (Fastest & 100% Reliable)
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-zinc-600 dark:text-zinc-400">
                    <li>Open your H5P slide or module (or the <strong>"LTI Launch"</strong> tab) on Blackboard.</li>
                    <li>Look at the bottom-left corner of the slide for the <strong>Reuse</strong> button (⎘ Reuse).</li>
                    <li>Click <strong>Reuse</strong> ➔ click <strong>"Download as an .h5p file"</strong>.</li>
                    <li>Drop the downloaded file right here to view all answers & study PDF!</li>
                  </ol>
                </div>

                <div className="space-y-1 text-zinc-700 dark:text-zinc-300 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Method 2: 1-Click Bookmarklet
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    When viewing your H5P slide (or on the <strong>LTI Launch</strong> tab), click your <strong>H5P to PDF</strong> bookmark. It automatically clicks Reuse and downloads your file!
                  </p>
                </div>
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
