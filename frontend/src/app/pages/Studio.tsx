import React, { useState, useRef, useEffect } from 'react';
import {
  PenTool,
  UploadCloud,
  Wand2,
  ArrowLeft,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import {
  type AspectRatio,
  type GenerateResponse,
  type StylePreset,
  generateImage,
  regenerateImage,
  checkHealth,
  ApiError,
} from '../../lib/api';
import { SketchCanvas, type SketchCanvasHandle } from '../components/SketchCanvas';
import { UploadDropzone } from '../components/UploadDropzone';
import { PromptPanel } from '../components/PromptPanel';
import { StyleSelector } from '../components/StyleSelector';
import { ResultPanel } from '../components/ResultPanel';
import { ErrorBanner } from '../components/ErrorBanner';

interface StudioProps {
  onNavigateToLanding: () => void;
}

export const Studio: React.FC<StudioProps> = ({ onNavigateToLanding }) => {
  // Input tabs: 'draw' or 'upload'
  const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw');

  // Input states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [style, setStyle] = useState<StylePreset>('photorealistic');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [strength, setStrength] = useState<number>(0.7);

  // Validation errors
  const [promptError, setPromptError] = useState<string | null>(null);
  const [sketchError, setSketchError] = useState<string | null>(null);

  // Generation status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [apiError, setApiError] = useState<ApiError | Error | null>(null);

  // Health state
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  // References
  const canvasRef = useRef<SketchCanvasHandle | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<any>(null);
  const studioLeftRef = useRef<HTMLDivElement | null>(null);

  // Check backend health on mount
  useEffect(() => {
    checkHealth()
      .then(() => setBackendHealthy(true))
      .catch(() => setBackendHealthy(false));
  }, []);

  // Elapsed timer ticker
  useEffect(() => {
    if (isLoading || isRegenerating) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading, isRegenerating]);

  // Handle Draw-On-Top from uploaded image
  const handleEditOnCanvas = async (file: File) => {
    setActiveTab('draw');
    // Load image onto canvas
    setTimeout(async () => {
      if (canvasRef.current) {
        await canvasRef.current.loadImage(file);
      }
    }, 100);
  };

  // Cancel generation in flight
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
    setIsRegenerating(false);
  };

  // Perform Generation
  const handleGenerate = async () => {
    // 1. Client-Side Validation
    let hasError = false;
    setApiError(null);

    if (!prompt.trim() || prompt.trim().length < 3) {
      setPromptError('Please enter a descriptive prompt with at least 3 characters.');
      hasError = true;
    } else {
      setPromptError(null);
    }

    let sketchBlob: Blob | File | null = null;
    if (activeTab === 'draw') {
      if (!canvasRef.current || canvasRef.current.isEmpty()) {
        setSketchError('The drawing canvas is blank. Please sketch something or upload an image.');
        hasError = true;
      } else {
        setSketchError(null);
        try {
          sketchBlob = await canvasRef.current.getBlob();
        } catch {
          setSketchError('Failed to capture canvas sketch.');
          hasError = true;
        }
      }
    } else {
      if (!uploadedFile) {
        setSketchError('Please upload an image file or switch to the Draw tab.');
        hasError = true;
      } else {
        setSketchError(null);
        sketchBlob = uploadedFile;
      }
    }

    if (hasError || !sketchBlob) return;

    // 2. Execute Request
    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await generateImage(
        {
          sketch: sketchBlob,
          prompt: prompt.trim(),
          style,
          aspect_ratio: aspectRatio,
          strength,
        },
        abortControllerRef.current.signal
      );

      setResult(response);
    } catch (err: any) {
      if (err.name !== 'AbortError' && err.code !== 'CANCELLED') {
        setApiError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Perform Regeneration with new seed
  const handleRegenerate = async () => {
    if (!result) return;

    let sketchBlob: Blob | File | null = null;
    if (activeTab === 'draw') {
      if (canvasRef.current) {
        sketchBlob = await canvasRef.current.getBlob();
      }
    } else {
      sketchBlob = uploadedFile;
    }

    if (!sketchBlob) return;

    setIsRegenerating(true);
    setApiError(null);
    abortControllerRef.current = new AbortController();

    try {
      const response = await regenerateImage(
        {
          sketch: sketchBlob,
          prompt: prompt.trim(),
          style,
          aspect_ratio: aspectRatio,
          strength,
          previous_request_id: result.request_id,
        },
        abortControllerRef.current.signal
      );

      setResult(response);
    } catch (err: any) {
      if (err.name !== 'AbortError' && err.code !== 'CANCELLED') {
        setApiError(err);
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleScrollToSketch = () => {
    studioLeftRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#ededed] p-3 sm:p-5 flex flex-col font-sans">
      {/* Studio Header */}
      <header className="w-full max-w-7xl mx-auto mb-4 bg-white rounded-2xl px-4 sm:px-6 py-3.5 border border-neutral-200 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToLanding}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition p-1.5 rounded-lg hover:bg-neutral-100"
            title="Return to marketing landing"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Landing</span>
          </button>

          <div className="h-4 w-px bg-neutral-200" />

          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 text-[#ef4d23]"
              viewBox="0 0 32 32"
              fill="currentColor"
            >
              <circle cx="16" cy="6" r="3.5" />
              <circle cx="23.07" cy="8.93" r="3.5" />
              <circle cx="26" cy="16" r="3.5" />
              <circle cx="23.07" cy="23.07" r="3.5" />
              <circle cx="16" cy="26" r="3.5" />
              <circle cx="8.93" cy="23.07" r="3.5" />
              <circle cx="6" cy="16" r="3.5" />
              <circle cx="8.93" cy="8.93" r="3.5" />
              <circle cx="16" cy="16" r="3.5" />
            </svg>
            <span className="font-bold text-sm sm:text-base text-neutral-900 tracking-tight">
              Sketch<span className="text-[#ef4d23]">AI</span> <span className="text-neutral-500 font-normal">Studio</span>
            </span>
          </div>
        </div>

        {/* Health status badge */}
        <div className="flex items-center gap-2 text-xs">
          {backendHealthy === true ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Backend API</span> Ready
            </span>
          ) : backendHealthy === false ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Backend Offline
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-neutral-400">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              Connecting…
            </span>
          )}
        </div>
      </header>

      {/* Main Studio Body: Two Columns on Desktop, Stacked on Mobile */}
      <main className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Sketch Input, Prompt, Style, Generate CTA */}
        <div
          ref={studioLeftRef}
          className="lg:col-span-7 flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-neutral-200 shadow-xs"
        >
          {/* Sketch Source Tabs */}
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('draw');
                  setSketchError(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'draw'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 text-[#ef4d23]" />
                <span>Draw Sketch</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  setSketchError(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'upload'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#ef4d23]" />
                <span>Upload Image</span>
              </button>
            </div>

            <span className="text-[11px] text-neutral-400 font-medium hidden sm:inline">
              {activeTab === 'draw' ? 'Pointer & Touch Enabled' : 'PNG, JPG, WEBP'}
            </span>
          </div>

          {/* Active Sketch Tab Content */}
          <div className="w-full">
            {activeTab === 'draw' ? (
              <SketchCanvas
                ref={canvasRef}
                onStrokeEnd={() => setSketchError(null)}
              />
            ) : (
              <UploadDropzone
                selectedFile={uploadedFile}
                onFileSelect={(f) => {
                  setUploadedFile(f);
                  setSketchError(null);
                }}
                onEditOnCanvas={handleEditOnCanvas}
                error={sketchError}
                onErrorChange={setSketchError}
              />
            )}
          </div>

          {/* Sketch Validation Warning */}
          {sketchError && activeTab === 'draw' && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200/80">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{sketchError}</span>
            </div>
          )}

          {/* Prompt Panel */}
          <PromptPanel
            prompt={prompt}
            onChange={(val) => {
              setPrompt(val);
              if (promptError && val.trim().length >= 3) setPromptError(null);
            }}
            error={promptError}
          />

          {/* Style & Setting Selector */}
          <StyleSelector
            selectedStyle={style}
            onStyleChange={setStyle}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            strength={strength}
            onStrengthChange={setStrength}
          />

          {/* Generate CTA Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || isRegenerating}
            className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#0b0f1a] hover:bg-neutral-800 disabled:opacity-50 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2.5 group"
          >
            <Wand2 className={`w-4 h-4 text-[#ef4d23] ${isLoading ? 'animate-spin' : 'group-hover:rotate-12 transition transform'}`} />
            <span>{isLoading ? 'Generating Sketch + Prompt…' : 'Generate AI Image'}</span>
          </button>
        </div>

        {/* Right Column: Output / Result Panel and Error Banners */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-5">
          {/* Error Banner when failure occurs */}
          {apiError && (
            <ErrorBanner
              error={apiError}
              onRetry={result ? handleRegenerate : handleGenerate}
              onDismiss={() => setApiError(null)}
            />
          )}

          {/* Result Viewport */}
          <ResultPanel
            result={result}
            isLoading={isLoading}
            isRegenerating={isRegenerating}
            elapsedSeconds={elapsedSeconds}
            onRegenerate={handleRegenerate}
            onCancel={handleCancel}
            onEditSketch={handleScrollToSketch}
          />
        </div>
      </main>
    </div>
  );
};
