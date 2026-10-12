import React, { useState } from 'react';
import {
  Download,
  RotateCw,
  Edit3,
  Clock,
  Sparkles,
  Maximize2,
  X,
  Loader2,
} from 'lucide-react';
import type { GenerateResponse } from '../../lib/api';

interface ResultPanelProps {
  result: GenerateResponse | null;
  isLoading: boolean;
  isRegenerating: boolean;
  elapsedSeconds: number;
  onRegenerate: () => void;
  onCancel: () => void;
  onEditSketch: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  isLoading,
  isRegenerating,
  elapsedSeconds,
  onRegenerate,
  onCancel,
  onEditSketch,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getImageSrc = (res: GenerateResponse | null): string => {
    if (!res) return '';
    if (res.image_url) return res.image_url;
    if (res.image_base64) {
      if (res.image_base64.startsWith('data:')) {
        return res.image_base64;
      }
      return `data:${res.mime_type || 'image/png'};base64,${res.image_base64}`;
    }
    return '';
  };

  const imageSrc = getImageSrc(result);

  // Trigger download of generated image
  const handleDownload = () => {
    const src = getImageSrc(result);
    if (!src) return;

    const link = document.createElement('a');
    link.href = src;
    link.download = `sketch-to-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // 1. Initial Loading State (No previous result yet)
  if (isLoading && !result) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-neutral-200 min-h-[440px] text-center shadow-xs">
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-full border-4 border-orange-100 border-t-[#ef4d23] animate-spin flex items-center justify-center" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#ef4d23] animate-pulse" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-neutral-800 mb-1">
          Generating your image…
        </h3>
        <p className="text-xs text-neutral-500 max-w-xs mb-4">
          Transforming your hand-drawn sketch and prompt into high-fidelity AI imagery.
        </p>

        {/* Elapsed Timer Counter */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-xs font-mono font-medium text-neutral-700 mb-6">
          <Clock className="w-3.5 h-3.5 text-neutral-500" />
          <span>Elapsed: {elapsedSeconds}s</span>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:bg-neutral-50 transition"
        >
          Cancel Generation
        </button>
      </div>
    );
  }

  // 2. Empty State (No generation attempted yet)
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-neutral-50/60 rounded-2xl border-2 border-dashed border-neutral-200 min-h-[440px] text-center">
        <div className="w-16 h-16 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-center mb-4 text-[#ef4d23]">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-neutral-800 mb-1">
          Ready to Bring Your Sketch to Life
        </h3>
        <p className="text-xs text-neutral-500 max-w-sm mb-6 leading-relaxed">
          Draw or upload your sketch on the left, add a descriptive prompt, choose your favorite artistic style, and click Generate.
        </p>
        <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-medium">
          <span>Structure Preserved</span>
          <span>•</span>
          <span>FLUX Powered</span>
          <span>•</span>
          <span>High Definition</span>
        </div>
      </div>
    );
  }

  // 3. Success / Result State (with in-flight regeneration overlay if active)
  return (
    <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs">
      {/* Result Image Viewport */}
      <div className="relative rounded-xl overflow-hidden bg-neutral-900 flex items-center justify-center min-h-[360px] max-h-[520px] group">
        <img
          src={imageSrc}
          alt="AI Generated result from sketch"
          className="w-full h-full object-contain max-h-[500px]"
        />

        {/* Fullscreen Expansion Button */}
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-sm"
          title="View Fullscreen"
          aria-label="View Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Regeneration in flight scrim overlay */}
        {isRegenerating && (
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 animate-in fade-in">
            <Loader2 className="w-8 h-8 animate-spin text-[#ef4d23] mb-2" />
            <span className="text-sm font-semibold mb-1">Regenerating variation…</span>
            <span className="text-xs text-white/80 font-mono mb-4">{elapsedSeconds}s elapsed</span>
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white/20 hover:bg-white/30 text-white transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Metadata Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100 text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-orange-50 text-[#ef4d23] font-semibold uppercase tracking-wider text-[10px]">
            {result.style}
          </span>
          <span className="text-neutral-400 font-mono text-[11px]">
            Seed: {result.seed}
          </span>
        </div>

        <div className="flex items-center gap-1 text-neutral-400 text-[11px]">
          <Clock className="w-3 h-3" />
          <span>{result.elapsed_ms} ms</span>
        </div>
      </div>

      {/* Action Buttons: Regenerate, Download, Edit Sketch */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
        <button
          type="button"
          onClick={onRegenerate}
          disabled={isLoading || isRegenerating}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ef4d23] hover:bg-[#d83f17] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          <span>Regenerate</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download PNG</span>
        </button>

        <button
          type="button"
          onClick={onEditSketch}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Sketch</span>
        </button>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
            aria-label="Close fullscreen modal"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={imageSrc}
            alt="Fullscreen AI result"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
