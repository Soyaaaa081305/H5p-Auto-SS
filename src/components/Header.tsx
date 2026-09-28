import React from 'react';
import { Logo } from './Logo';

export const Header: React.FC = () => {
  return (
    <header className="no-print bg-white border-b border-zinc-200/80 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Logo size={28} />

        <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
          <span className="hidden sm:inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Local Sandbox
          </span>
          <span className="hidden sm:inline text-zinc-300">|</span>
          <span className="text-[11px] text-zinc-400">1080p Slide Compiler</span>
        </div>
      </div>
    </header>
  );
};
