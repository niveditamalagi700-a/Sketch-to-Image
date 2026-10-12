import React, { useRef, useState, useCallback, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, X, RefreshCw, PenTool, AlertCircle } from 'lucide-react';
import { validateImageFile } from '../../lib/image';

interface UploadDropzoneProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  onEditOnCanvas?: (file: File) => void;
  error?: string | null;
  onErrorChange?: (error: string | null) => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  selectedFile,
  onFileSelect,
  onEditOnCanvas,
  error,
  onErrorChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; sizeStr: string } | null>(null);

  // Generate preview URL on file selection
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);

      const img = new Image();
      img.onload = () => {
        setImageMeta({
          width: img.naturalWidth,
          height: img.naturalHeight,
          sizeStr: `${sizeMB} MB`,
        });
      };
      img.src = url;

      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
      setImageMeta(null);
    }
  }, [selectedFile]);

  const processFile = useCallback(
    async (file: File) => {
      if (onErrorChange) onErrorChange(null);

      const validation = await validateImageFile(file);
      if (!validation.valid) {
        if (onErrorChange) onErrorChange(validation.error || 'Invalid image file.');
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect, onErrorChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClear = () => {
    onFileSelect(null);
    if (onErrorChange) onErrorChange(null);
  };

  return (
    <div className="flex flex-col w-full h-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleInputChange}
        className="hidden"
        id="sketch-file-input"
      />

      {/* When File is Selected: Preview State */}
      {selectedFile && previewUrl ? (
        <div className="relative flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs min-h-[340px] sm:min-h-[400px]">
          <div className="relative max-h-[280px] w-full flex items-center justify-center rounded-xl bg-neutral-100/70 p-2 overflow-hidden border border-neutral-200/60">
            <img
              src={previewUrl}
              alt="Uploaded sketch preview"
              className="max-h-[260px] max-w-full object-contain rounded-lg shadow-2xs"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-white text-neutral-600 hover:text-red-600 rounded-full shadow-sm transition border border-neutral-200"
              title="Remove image"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Metadata & Actions */}
          <div className="w-full mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#ef4d23]" />
              <span className="font-medium text-neutral-800 truncate max-w-[160px] sm:max-w-[200px]">
                {selectedFile.name}
              </span>
              {imageMeta && (
                <span className="text-neutral-400">
                  • {imageMeta.width}×{imageMeta.height} px • {imageMeta.sizeStr}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onEditOnCanvas && (
                <button
                  type="button"
                  onClick={() => onEditOnCanvas(selectedFile)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-[#ef4d23] hover:bg-orange-100 font-medium transition"
                  title="Load onto drawing canvas to draw over it"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Draw on top</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 font-medium transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Dropzone State */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 text-center cursor-pointer rounded-2xl border-2 border-dashed transition min-h-[340px] sm:min-h-[400px] ${
            isDragOver
              ? 'border-[#ef4d23] bg-orange-50/40 scale-[0.99]'
              : 'border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50/50'
          }`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label="Upload sketch image dropzone"
        >
          <div className="w-14 h-14 rounded-full bg-orange-50 text-[#ef4d23] flex items-center justify-center mb-4 shadow-2xs">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-neutral-800 mb-1">
            Drag and drop your sketch here
          </h3>
          <p className="text-xs text-neutral-500 max-w-xs mb-4">
            Supports PNG, JPG, or WEBP up to 8MB. Dimensions must be between 64px and 4096px.
          </p>
          <span className="px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-700 transition shadow-2xs">
            Browse file from computer
          </span>
        </div>
      )}

      {/* Inline Validation Error */}
      {error && (
        <div className="mt-2.5 flex items-center gap-2 p-2.5 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200/80 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
