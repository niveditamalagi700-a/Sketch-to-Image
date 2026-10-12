import React from 'react';
import {
  AlertTriangle,
  WifiOff,
  Clock,
  ShieldAlert,
  RotateCw,
  X,
  ZapOff,
} from 'lucide-react';
import { ApiError } from '../../lib/api';

interface ErrorBannerProps {
  error: Error | ApiError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onRetry,
  onDismiss,
}) => {
  if (!error) return null;

  const isApiError = error instanceof ApiError;
  const errorCode = isApiError ? error.code : 'UNKNOWN';

  // Customize icon and title based on failure type
  let Icon = AlertTriangle;
  let errorTitle = 'Generation Failed';

  if (errorCode === 'NETWORK_ERROR') {
    Icon = WifiOff;
    errorTitle = 'Connection Error';
  } else if (errorCode === 'PROVIDER_TIMEOUT' || errorCode === 'TIMEOUT') {
    Icon = Clock;
    errorTitle = 'Request Timed Out';
  } else if (errorCode === 'RATE_LIMIT_EXCEEDED') {
    Icon = ZapOff;
    errorTitle = 'Rate Limit Reached';
  } else if (errorCode === 'MODERATION_REJECTED') {
    Icon = ShieldAlert;
    errorTitle = 'Content Notice';
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-red-50/90 border border-red-200 text-red-900 rounded-2xl shadow-xs transition animate-in fade-in"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-red-100 text-red-600 shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-red-700">
            {errorTitle}
          </span>
          <p className="text-xs text-red-800 font-medium mt-0.5 leading-relaxed">
            {error.message || 'An unexpected error occurred while generating your image.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto sm:ml-0 shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-2xs transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-100/60 transition"
            title="Dismiss error"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
