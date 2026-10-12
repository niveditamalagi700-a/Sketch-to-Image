import React, { useState } from 'react';
import { ChevronDown, Sparkles, TrendingUp, X, Wand2 } from 'lucide-react';
import { Gauge } from './Gauge';

interface DashboardPreviewProps {
  onNavigateToStudio?: () => void;
}

export const DashboardPreview: React.FC<DashboardPreviewProps> = ({ onNavigateToStudio }) => {
  // Card 1 active tab toggle
  const [card1ActiveTab, setCard1ActiveTab] = useState<'structure' | 'creative'>('structure');

  // Card 2 state
  const [stylePreset, setStylePreset] = useState<string>('Photorealistic');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1 (Square)');

  // Card 3 active tab toggle
  const [card3ActiveTab, setCard3ActiveTab] = useState<'flux2' | 'canny'>('flux2');

  return (
    <div className="px-3 sm:px-4 w-full">
      <div className="bg-[#f5f2ee] rounded-3xl p-4 sm:p-6 w-full max-w-[880px] mx-auto shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1 — Sketch Structure Fidelity */}
          <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between text-[13px] mb-2 font-medium">
                <span className="text-[#ef4d23] font-semibold">Structure Fidelity</span>
                <span className="text-neutral-500">FLUX.2</span>
              </div>

              {/* Number and Pill */}
              <div className="flex items-baseline gap-2.5 mb-1">
                <span className="text-[28px] font-semibold text-neutral-900 tracking-tight leading-none">
                  94%
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5 text-[11px] font-medium">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  Preserved
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mb-4">Contours, proportions & layout</p>

              {/* Centered Target achieved label */}
              <div className="text-center text-xs font-medium text-neutral-600 mb-1">
                Sketch Shape Alignment
              </div>

              {/* Gauge */}
              <Gauge
                value={94}
                color="#ef4d23"
                showLabels={true}
                min="Strict"
                max="Creative"
              />
            </div>

            {/* Toggle pill bottom */}
            <div className="bg-neutral-100 rounded-full p-1 flex mt-4 text-xs font-medium">
              <button
                type="button"
                onClick={() => setCard1ActiveTab('structure')}
                className={`flex-1 py-1 px-2 rounded-full text-center transition ${
                  card1ActiveTab === 'structure'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Structure First
              </button>
              <button
                type="button"
                onClick={() => setCard1ActiveTab('creative')}
                className={`flex-1 py-1 px-2 rounded-full text-center transition ${
                  card1ActiveTab === 'creative'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Creative Flow
              </button>
            </div>
          </div>

          {/* Card 2 — Generation Setup */}
          <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col gap-3 justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-[13px] font-semibold text-neutral-900">
                <span>Preset Setup</span>
                <span className="text-[11px] font-normal text-neutral-400">7 Styles Available</span>
              </div>

              {/* Dropdown 1 */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-neutral-700 font-medium">
                  Artistic Style Preset
                </label>
                <div className="relative">
                  <select
                    value={stylePreset}
                    onChange={(e) => setStylePreset(e.target.value)}
                    className="w-full appearance-none bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-800 font-medium pr-8 focus:outline-none focus:border-neutral-400"
                  >
                    <option value="Photorealistic">Photorealistic</option>
                    <option value="3D Render">3D Render</option>
                    <option value="Anime">Anime Illustration</option>
                    <option value="Watercolor">Soft Watercolor</option>
                    <option value="Digital Art">Digital Art</option>
                    <option value="UI Mockup">UI/UX Wireframe</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Dropdown 2 */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-neutral-700 font-medium">
                  Aspect Ratio
                </label>
                <div className="relative">
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full appearance-none bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-800 font-medium pr-8 focus:outline-none focus:border-neutral-400"
                  >
                    <option value="1:1 (Square)">1:1 (Square - 1024x1024)</option>
                    <option value="16:9 (Widescreen)">16:9 (Widescreen)</option>
                    <option value="4:3 (Standard)">4:3 (Standard)</option>
                    <option value="9:16 (Story)">9:16 (Story)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Info chips */}
              <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
                <span>Default Fidelity: <strong className="text-neutral-700">0.70</strong></span>
                <span>Max Size: <strong className="text-neutral-700">8MB</strong></span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center pt-2">
              <button
                type="button"
                onClick={onNavigateToStudio}
                className="bg-[#ef4d23] hover:bg-[#d83f17] text-white rounded-lg px-4 py-2 text-xs font-semibold transition shadow-2xs flex items-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Try in Studio</span>
              </button>
              <button
                type="button"
                onClick={onNavigateToStudio}
                className="ml-3 text-xs text-neutral-600 underline hover:text-neutral-900 transition"
              >
                Explore
              </button>
              <button
                type="button"
                className="ml-auto text-neutral-400 hover:text-neutral-600 p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 3 — Speed & Latency */}
          <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between text-[13px] mb-2 font-medium">
                <span className="text-[#ef4d23] font-semibold">Render Speed</span>
                <span className="text-neutral-500">Live API</span>
              </div>

              {/* Big value and pill */}
              <div className="flex items-baseline gap-2.5 mb-1">
                <span className="text-[28px] font-semibold text-neutral-900 tracking-tight leading-none">
                  2.4s
                </span>
                <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5 text-[11px] font-medium">
                  <TrendingUp className="w-3 h-3 text-[#ef4d23]" />
                  Fast
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mb-4">Instant preview & high-res PNG</p>

              {/* Centered label */}
              <div className="text-center text-xs font-medium text-neutral-600 mb-1">
                Engine Responsiveness
              </div>

              {/* Gauge at 88% */}
              <Gauge
                value={88}
                color="#9ca3af"
                showLabels={false}
              />
            </div>

            {/* Toggle pill bottom */}
            <div className="bg-neutral-100 rounded-full p-1 flex mt-4 text-xs font-medium">
              <button
                type="button"
                onClick={() => setCard3ActiveTab('flux2')}
                className={`flex-1 py-1 px-2 rounded-full text-center transition ${
                  card3ActiveTab === 'flux2'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                FLUX.2 Reference
              </button>
              <button
                type="button"
                onClick={() => setCard3ActiveTab('canny')}
                className={`flex-1 py-1 px-2 rounded-full text-center transition ${
                  card3ActiveTab === 'canny'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                FLUX.1 Canny
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
