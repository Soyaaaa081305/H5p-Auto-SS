import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Bespoke Geometric Emblem */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Base layer sheet */}
        <rect
          x="4"
          y="4"
          width="20"
          height="26"
          rx="3.5"
          fill="#09090b"
        />
        {/* Second overlay sheet */}
        <rect
          x="9"
          y="7"
          width="20"
          height="24"
          rx="3.5"
          fill="#27272a"
        />
        {/* Front active sheet with folded corner */}
        <path
          d="M14 10.5C14 8.567 15.567 7 17.5 7H28.5C29.6046 7 30.5 7.89543 30.5 9V27C30.5 28.6569 29.1569 30 27.5 30H17.5C15.567 30 14 28.433 14 26.5V10.5Z"
          fill="#fafafa"
          stroke="#09090b"
          strokeWidth="1.25"
        />
        {/* Precision editorial grid lines on front sheet */}
        <line x1="18" y1="13" x2="26.5" y2="13" stroke="#09090b" strokeWidth="1.75" strokeLinecap="round" />
        <line x1="18" y1="17.5" x2="24" y2="17.5" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="22" x2="26" y2="22" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" />
        {/* Accent focal dot */}
        <circle cx="27" cy="17.5" r="1.5" fill="#ef4444" />
      </svg>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold tracking-tight text-zinc-900 text-sm font-sans">
            H5P<span className="text-zinc-400 font-light">/</span>PDF
          </span>
          <span className="text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
            Studio
          </span>
        </div>
      </div>
    </div>
  );
};
