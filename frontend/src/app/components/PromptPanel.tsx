import React from 'react';
import { Sparkles, X, AlertCircle } from 'lucide-react';

interface PromptPanelProps {
  prompt: string;
  onChange: (value: string) => void;
  error?: string | null;
}

const EXAMPLE_PROMPTS = [
  'A cozy rustic cottage with chimney smoke in autumn pine woods',
  'A futuristic electric sports car driving on city street at dusk',
  'Clean modern SaaS analytics web dashboard interface layout',
  'Delicate watercolor painting of alpine peaks under morning sun',
  'Cute fluffy kitten relaxing on a velvet armchair',
  'Minimalist Scandinavian oak chair in sunlit living room',
];

export const PromptPanel: React.FC<PromptPanelProps> = ({
  prompt,
  onChange,
  error,
}) => {
  const maxLength = 1000;

  const handleSelectExample = (example: string) => {
    onChange(example);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <label
          htmlFor="prompt-textarea"
          className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#ef4d23]" />
          <span>Prompt Description</span>
        </label>
        <span
          className={`text-xs font-mono font-medium ${
            prompt.length > 950 ? 'text-amber-600 font-bold' : 'text-neutral-400'
          }`}
        >
          {prompt.length} / {maxLength}
        </span>
      </div>

      {/* Textarea container */}
      <div className="relative">
        <textarea
          id="prompt-textarea"
          rows={3}
          value={prompt}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe what you want the AI to create from your sketch (e.g. A photorealistic sports car, glowing headlights, wet asphalt reflection)..."
          className={`w-full p-3.5 text-sm rounded-xl border bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition resize-none shadow-2xs ${
            error
              ? 'border-red-400 focus:ring-2 focus:ring-red-200'
              : 'border-neutral-200 focus:border-[#ef4d23] focus:ring-2 focus:ring-orange-100'
          }`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'prompt-error' : undefined}
        />
        {prompt.length > 0 && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-3 right-3 p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition"
            title="Clear prompt"
            aria-label="Clear prompt"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Inline Error */}
      {error && (
        <div id="prompt-error" className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Example Prompt Chips */}
      <div className="flex flex-col gap-1.5 mt-1">
        <span className="text-[11px] font-medium text-neutral-500">Need inspiration? Try an example:</span>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_PROMPTS.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectExample(ex)}
              className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 transition border border-neutral-200/60 truncate max-w-[280px] text-left shadow-3xs"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
