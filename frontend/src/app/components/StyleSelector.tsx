import React from 'react';
import {
  Camera,
  Palette,
  Droplets,
  Sparkles,
  Box,
  Pencil,
  Layout,
  Sliders,
  Ratio,
} from 'lucide-react';
import type { AspectRatio, StylePreset } from '../../lib/api';

interface StyleSelectorProps {
  selectedStyle: StylePreset;
  onStyleChange: (style: StylePreset) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  strength: number;
  onStrengthChange: (strength: number) => void;
}

interface StyleOption {
  key: StylePreset;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    key: 'photorealistic',
    name: 'Photorealistic',
    desc: 'Natural lighting & real textures',
    icon: Camera,
  },
  {
    key: 'digital_art',
    name: 'Digital Art',
    desc: 'Polished concept illustration',
    icon: Palette,
  },
  {
    key: 'watercolor',
    name: 'Watercolor',
    desc: 'Paper texture & soft pigment',
    icon: Droplets,
  },
  {
    key: 'anime',
    name: 'Anime',
    desc: 'Clean cel lines & vibrant palette',
    icon: Sparkles,
  },
  {
    key: '3d_render',
    name: '3D Render',
    desc: 'Studio lighting & depth',
    icon: Box,
  },
  {
    key: 'pencil_realistic',
    name: 'Pencil Sketch',
    desc: 'Graphite shading & fine hatching',
    icon: Pencil,
  },
  {
    key: 'ui_mockup',
    name: 'UI/UX Mockup',
    desc: 'Clean vector app interface',
    icon: Layout,
  },
];

const ASPECT_RATIOS: { key: AspectRatio; label: string; ratioHint: string }[] = [
  { key: '1:1', label: '1:1', ratioHint: 'Square' },
  { key: '4:3', label: '4:3', ratioHint: 'Standard' },
  { key: '3:4', label: '3:4', ratioHint: 'Portrait' },
  { key: '16:9', label: '16:9', ratioHint: 'Widescreen' },
  { key: '9:16', label: '9:16', ratioHint: 'Vertical' },
];

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyle,
  onStyleChange,
  aspectRatio,
  onAspectRatioChange,
  strength,
  onStrengthChange,
}) => {
  const getFidelityLabel = (val: number) => {
    if (val <= 0.35) return 'Strict Sketch Adherence';
    if (val <= 0.65) return 'Balanced Harmony';
    if (val <= 0.8) return 'Balanced / Creative (Recommended)';
    return 'High Creative Freedom';
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Style Selection Grid */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-[#ef4d23]" />
          <span>Artistic Style Preset</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {STYLE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedStyle === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onStyleChange(opt.key)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition relative ${
                  isSelected
                    ? 'border-[#ef4d23] bg-orange-50/50 ring-1 ring-[#ef4d23] shadow-2xs'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isSelected ? 'bg-[#ef4d23] text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#ef4d23]" />
                  )}
                </div>
                <span className="text-xs font-semibold text-neutral-900 leading-tight">
                  {opt.name}
                </span>
                <span className="text-[10px] text-neutral-500 mt-0.5 line-clamp-1">
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Aspect Ratio Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
          <Ratio className="w-3.5 h-3.5 text-[#ef4d23]" />
          <span>Output Aspect Ratio</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {ASPECT_RATIOS.map((ar) => {
            const isSelected = aspectRatio === ar.key;
            return (
              <button
                key={ar.key}
                type="button"
                onClick={() => onAspectRatioChange(ar.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                  isSelected
                    ? 'border-[#ef4d23] bg-[#ef4d23] text-white shadow-xs'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span>{ar.label}</span>
                <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                  ({ar.ratioHint})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sketch Fidelity vs Creativity Slider */}
      <div className="flex flex-col gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200/80">
        <div className="flex items-center justify-between">
          <label
            htmlFor="fidelity-slider"
            className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-[#ef4d23]" />
            <span>Sketch fidelity ↔ Creativity</span>
          </label>
          <span className="text-xs font-mono font-bold text-[#ef4d23]">
            {strength.toFixed(2)}
          </span>
        </div>

        <input
          id="fidelity-slider"
          type="range"
          min={0.1}
          max={1.0}
          step={0.05}
          value={strength}
          onChange={(e) => onStrengthChange(parseFloat(e.target.value))}
          className="w-full accent-[#ef4d23] cursor-pointer"
          aria-label="Sketch fidelity vs creativity slider"
        />

        <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
          <span>Strict Sketch (0.1)</span>
          <span className="text-[#ef4d23] font-semibold">{getFidelityLabel(strength)}</span>
          <span>Creative Freedom (1.0)</span>
        </div>
      </div>
    </div>
  );
};
