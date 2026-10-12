import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  Pen,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
} from 'lucide-react';
import { isCanvasBlank, canvasToBlob } from '../../lib/image';

export interface SketchCanvasHandle {
  getBlob: () => Promise<Blob>;
  isEmpty: () => boolean;
  clear: () => void;
  loadImage: (imageSource: string | File | Blob) => Promise<void>;
}

interface SketchCanvasProps {
  onStrokeEnd?: () => void;
  backgroundImageUrl?: string | null;
}

interface Point {
  x: number;
  y: number;
  pressure: number;
}

const PRESET_COLORS = [
  '#000000',
  '#4b5563',
  '#ef4d23', // Primary brand orange
  '#2563eb',
  '#059669',
  '#d97706',
  '#9333ea',
];

export const SketchCanvas = forwardRef<SketchCanvasHandle, SketchCanvasProps>(
  ({ onStrokeEnd, backgroundImageUrl }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [color, setColor] = useState<string>('#000000');
    const [brushSize, setBrushSize] = useState<number>(6);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [canUndo, setCanUndo] = useState<boolean>(false);
    const [canRedo, setCanRedo] = useState<boolean>(false);

    // Stroke points buffer for quadratic curve smoothing
    const pointsRef = useRef<Point[]>([]);

    // Undo/Redo history stack (capped at 30 states to keep memory lean)
    const historyRef = useRef<ImageData[]>([]);
    const redoRef = useRef<ImageData[]>([]);
    const maxHistory = 30;

    // Save current canvas state to undo stack
    const saveState = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current.push(currentState);
      if (historyRef.current.length > maxHistory) {
        historyRef.current.shift();
      }
      redoRef.current = []; // Clear redo on new action
      setCanUndo(true);
      setCanRedo(false);
    }, []);

    // Initialize white canvas background
    const initCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    // Resize handling while preserving existing pixels
    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const resizeObserver = new ResizeObserver(() => {
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const dpr = window.devicePixelRatio || 1;
        const targetWidth = Math.floor(rect.width * dpr);
        const targetHeight = Math.floor(rect.height * dpr);

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          // Backup existing pixels before resize
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx && canvas.width > 0 && canvas.height > 0) {
            tempCtx.drawImage(canvas, 0, 0);
          }

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            if (tempCanvas.width > 0 && tempCanvas.height > 0) {
              ctx.drawImage(
                tempCanvas,
                0,
                0,
                tempCanvas.width,
                tempCanvas.height,
                0,
                0,
                targetWidth,
                targetHeight
              );
            }
          }
        }
      });

      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }, []);

    // Initial white fill
    useEffect(() => {
      initCanvas();
    }, [initCanvas]);

    // Handle background image loading (draw on top of uploaded image)
    const loadBackgroundImage = useCallback(async (source: string | File | Blob) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let url = '';
      if (typeof source === 'string') {
        url = source;
      } else {
        url = URL.createObjectURL(source);
      }

      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          saveState();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Center and fit within canvas maintaining aspect ratio
          const scale = Math.min(
            canvas.width / img.width,
            canvas.height / img.height
          );
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const drawX = (canvas.width - drawW) / 2;
          const drawY = (canvas.height - drawH) / 2;

          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          if (typeof source !== 'string') {
            URL.revokeObjectURL(url);
          }
          if (onStrokeEnd) onStrokeEnd();
          resolve();
        };
        img.onerror = (e) => {
          if (typeof source !== 'string') URL.revokeObjectURL(url);
          reject(e);
        };
        img.src = url;
      });
    }, [saveState, onStrokeEnd]);

    useEffect(() => {
      if (backgroundImageUrl) {
        loadBackgroundImage(backgroundImageUrl).catch(() => {});
      }
    }, [backgroundImageUrl, loadBackgroundImage]);

    // Helper to get coordinates scaled to canvas resolution
    const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
        pressure: e.pressure && e.pressure > 0 ? e.pressure : 0.5,
      };
    };

    // Pointer Event Handlers
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      // Capture pointer so drawing does not drop outside canvas boundary
      e.currentTarget.setPointerCapture(e.pointerId);
      const point = getCoordinates(e);

      saveState();
      setIsDrawing(true);
      pointsRef.current = [point];

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const radius = (brushSize * dpr) / 2;

      ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const point = getCoordinates(e);
      const points = pointsRef.current;
      points.push(point);

      if (points.length < 3) {
        const b = points[0];
        ctx.beginPath();
        ctx.arc(b.x, b.y, (brushSize * (window.devicePixelRatio || 1)) / 2, 0, Math.PI * 2);
        ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.fill();
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const baseWidth = brushSize * dpr;
      // Pressure modulation: +/- 40% based on pointer pressure
      const dynamicWidth = point.pressure > 0 ? baseWidth * (0.6 + point.pressure * 0.8) : baseWidth;

      ctx.lineWidth = dynamicWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;

      // Quadratic curve smoothing between midpoints
      const i = points.length - 2;
      const p1 = points[i];
      const p2 = points[i + 1];
      const midPoint = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };

      ctx.beginPath();
      ctx.moveTo(points[i - 1].x, points[i - 1].y);
      ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
      ctx.stroke();
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture was lost
      }
      setIsDrawing(false);
      pointsRef.current = [];
      if (onStrokeEnd) onStrokeEnd();
    };

    const handleUndo = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas || historyRef.current.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Push current canvas state to redo stack
      const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
      redoRef.current.push(currentState);

      // Pop state from undo stack
      const previousState = historyRef.current.pop()!;
      ctx.putImageData(previousState, 0, 0);

      setCanUndo(historyRef.current.length > 0);
      setCanRedo(true);
      if (onStrokeEnd) onStrokeEnd();
    }, [onStrokeEnd]);

    const handleRedo = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas || redoRef.current.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Push current state to undo stack
      const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current.push(currentState);

      // Pop from redo stack
      const nextState = redoRef.current.pop()!;
      ctx.putImageData(nextState, 0, 0);

      setCanUndo(true);
      setCanRedo(redoRef.current.length > 0);
      if (onStrokeEnd) onStrokeEnd();
    }, [onStrokeEnd]);

    const handleClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      saveState();
      initCanvas();
      if (onStrokeEnd) onStrokeEnd();
    };

    // Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z / Cmd+Z, Cmd+Shift+Z)
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            e.preventDefault();
            handleUndo();
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
          e.preventDefault();
          handleRedo();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo]);

    // Imperative handle for parent component
    useImperativeHandle(ref, () => ({
      getBlob: async () => {
        if (!canvasRef.current) throw new Error('Canvas not mounted');
        return await canvasToBlob(canvasRef.current);
      },
      isEmpty: () => {
        if (!canvasRef.current) return true;
        return isCanvasBlank(canvasRef.current);
      },
      clear: () => {
        handleClear();
      },
      loadImage: async (source) => {
        await loadBackgroundImage(source);
      },
    }));

    return (
      <div className="flex flex-col w-full h-full bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-neutral-50/80 border-b border-neutral-200 select-none">
          {/* Tools: Pen / Eraser */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setTool('pen')}
              className={`p-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                tool === 'pen'
                  ? 'bg-[#ef4d23] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
              title="Pen tool"
              aria-label="Pen tool"
            >
              <Pen className="w-4 h-4" />
              <span className="hidden sm:inline">Pen</span>
            </button>
            <button
              type="button"
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                tool === 'eraser'
                  ? 'bg-[#ef4d23] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
              title="Eraser tool"
              aria-label="Eraser tool"
            >
              <Eraser className="w-4 h-4" />
              <span className="hidden sm:inline">Eraser</span>
            </button>
          </div>

          {/* Color Palette (Pen mode only) */}
          {tool === 'pen' && (
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-neutral-200/80">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border transition transform hover:scale-110 ${
                    color === c ? 'ring-2 ring-offset-1 ring-[#ef4d23] border-transparent' : 'border-neutral-300'
                  }`}
                  style={{ backgroundColor: c }}
                  title={`Color ${c}`}
                  aria-label={`Select color ${c}`}
                />
              ))}
              <label
                className="relative cursor-pointer flex items-center justify-center w-6 h-6 rounded-full border border-neutral-300 hover:border-neutral-500 overflow-hidden"
                title="Custom color"
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  aria-label="Choose custom color"
                />
                <span className="text-xs font-bold text-neutral-500">+</span>
              </label>
            </div>
          )}

          {/* Brush Size Slider */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-neutral-200/80">
            <span className="text-xs text-neutral-500 font-medium">Size</span>
            <input
              type="range"
              min={2}
              max={36}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-16 sm:w-20 accent-[#ef4d23] cursor-pointer"
              title={`Brush size: ${brushSize}px`}
              aria-label="Brush size"
            />
            <span className="text-xs font-mono font-semibold text-neutral-700 w-5 text-right">
              {brushSize}
            </span>
          </div>

          {/* Action buttons: Undo / Redo / Clear */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Redo (Ctrl+Shift+Z)"
              aria-label="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition"
              title="Clear Canvas"
              aria-label="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawing Surface */}
        <div
          ref={containerRef}
          className="relative flex-1 w-full min-h-[340px] sm:min-h-[400px] bg-white cursor-crosshair touch-none overflow-hidden"
          style={{ touchAction: 'none' }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute inset-0 w-full h-full block bg-white"
            aria-label="Drawing canvas for sketch"
            role="img"
          />
        </div>
      </div>
    );
  }
);

SketchCanvas.displayName = 'SketchCanvas';
