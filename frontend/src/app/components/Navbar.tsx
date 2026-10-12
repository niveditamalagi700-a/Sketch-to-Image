import React, { useState } from 'react';
import { ChevronRight, Menu, Sparkles, X, Wand2 } from 'lucide-react';

interface NavbarProps {
  onNavigateToStudio?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateToStudio }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex justify-center pt-4 sm:pt-6 px-3 sm:px-4 w-full">
      <div className="bg-white rounded-full shadow-sm border border-neutral-200 pl-3 pr-2 py-2 w-full max-w-[780px] relative flex items-center">
        {/* Logo (left, shrink-0) */}
        <div
          onClick={onNavigateToStudio}
          className="flex items-center gap-2 cursor-pointer select-none shrink-0"
        >
          <svg
            className="w-7 h-7 sm:w-8 sm:h-8 text-[#ef4d23]"
            viewBox="0 0 32 32"
            fill="currentColor"
            aria-label="SketchAI Logo"
          >
            <circle cx="16" cy="16" r="3.5" />
            <circle cx="26" cy="16" r="3.5" />
            <circle cx="23.07" cy="23.07" r="3.5" />
            <circle cx="16" cy="26" r="3.5" />
            <circle cx="8.93" cy="23.07" r="3.5" />
            <circle cx="6" cy="16" r="3.5" />
            <circle cx="8.93" cy="8.93" r="3.5" />
            <circle cx="16" cy="6" r="3.5" />
            <circle cx="23.07" cy="8.93" r="3.5" />
          </svg>
          <span className="font-bold text-sm sm:text-base text-neutral-900 tracking-tight">
            Sketch<span className="text-[#ef4d23]">AI</span>
          </span>
        </div>

        {/* Desktop Links (hidden md:flex, gap-6, 14px) */}
        <nav className="hidden md:flex items-center gap-6 text-[14px] font-medium text-neutral-800 ml-8">
          <button
            type="button"
            onClick={onNavigateToStudio}
            className="inline-flex items-center gap-1.5 hover:text-[#ef4d23] transition text-neutral-900 font-semibold"
          >
            <span>Studio</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4d23]" />
          </button>
          <button
            type="button"
            onClick={onNavigateToStudio}
            className="hover:text-[#ef4d23] text-neutral-600 transition"
          >
            Art Styles
          </button>
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigateToStudio) onNavigateToStudio();
            }}
            className="hover:text-[#ef4d23] text-neutral-600 transition"
          >
            FLUX Engine
          </a>
          <button
            type="button"
            onClick={onNavigateToStudio}
            className="inline-flex items-center gap-1 text-[#ef4d23] hover:opacity-80 transition font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Free</span>
          </button>
        </nav>

        {/* Right cluster (ml-auto) */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Orange #ef4d23 rounded-full button */}
          <button
            type="button"
            onClick={onNavigateToStudio}
            className="bg-[#ef4d23] hover:bg-[#d83f17] text-white rounded-full pl-3.5 sm:pl-4 pr-1.5 py-1.5 text-xs sm:text-[13px] font-semibold flex items-center gap-2 transition shadow-xs group"
          >
            <Wand2 className="w-3.5 h-3.5 hidden sm:inline" />
            <span className="hidden sm:inline">Open Studio</span>
            <span className="sm:hidden">Studio</span>
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition transform">
              <ChevronRight className="w-3.5 h-3.5 text-white" />
            </span>
          </button>

          {/* Mobile-only hamburger button (md:hidden) */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-neutral-700 hover:text-neutral-950 rounded-full hover:bg-neutral-100 transition"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown panel */}
        {isOpen && (
          <div className="absolute top-full left-2 right-2 mt-2 bg-white rounded-2xl shadow-lg border border-neutral-200 p-3 z-20 flex flex-col gap-2 md:hidden animate-in fade-in">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onNavigateToStudio) onNavigateToStudio();
              }}
              className="px-3 py-2 rounded-xl hover:bg-neutral-50 text-sm font-semibold text-neutral-900 flex items-center justify-between text-left"
            >
              <span>Canvas Studio</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ef4d23]" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onNavigateToStudio) onNavigateToStudio();
              }}
              className="px-3 py-2 rounded-xl hover:bg-neutral-50 text-sm font-medium text-neutral-700 text-left"
            >
              7 Artistic Styles
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onNavigateToStudio) onNavigateToStudio();
              }}
              className="px-3 py-2 rounded-xl hover:bg-neutral-50 text-sm font-medium text-neutral-700 text-left"
            >
              FLUX Model Conditioning
            </button>
            <div className="pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigateToStudio) onNavigateToStudio();
                }}
                className="w-full bg-[#ef4d23] text-white py-2.5 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Launch Studio (/studio)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
