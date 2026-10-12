import React from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { DashboardPreview } from '../components/DashboardPreview';

interface LandingProps {
  onNavigateToStudio: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onNavigateToStudio }) => {
  const videoUrl =
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260424_064411_9e9d7f84-9277-41f4-ab10-59172d89e6be.mp4';
  const posterUrl =
    'https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=60';

  return (
    <div className="min-h-screen w-full bg-[#ededed] p-3 sm:p-4 font-sans">
      {/* Hero container (clips everything inside) */}
      <div className="relative w-full h-[calc(100vh-24px)] sm:h-[calc(100vh-32px)] overflow-hidden bg-[#d9d9d9] rounded-2xl sm:rounded-3xl flex flex-col justify-between">
        {/* Background Video */}
        <video
          src={videoUrl}
          poster={posterUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disableRemotePlayback
          {...({ 'webkit-playsinline': 'true', 'x5-playsinline': 'true' } as any)}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Above the video overlay */}
        <div className="absolute inset-0 bg-white/10 pointer-events-none" />

        {/* Foreground content wrapper */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          {/* Navbar */}
          <Navbar onNavigateToStudio={onNavigateToStudio} />

          {/* Hero Content (centered) */}
          <div className="flex flex-col items-center px-4 pt-8 sm:pt-12 pb-6 sm:pb-10 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm text-[13px] font-medium text-neutral-800">
              <span className="w-2 h-2 rounded-full bg-[#ef4d23]" />
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#ef4d23]" />
                <span>AI-Powered Sketch to Image</span>
              </span>
            </div>

            {/* Headline */}
            <h1
              className="mt-4 sm:mt-5 max-w-4xl text-neutral-900"
              style={{
                fontSize: 'clamp(36px, 7.5vw, 68px)',
                lineHeight: 1.05,
                fontWeight: 500,
                letterSpacing: '-0.02em',
              }}
            >
              From Rough{' '}
              <span
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}
              >
                Sketch
              </span>
              <br />
              to Masterpiece
            </h1>

            {/* Subtitle */}
            <p
              className="mt-3 sm:mt-4 text-neutral-700 px-2 max-w-2xl"
              style={{
                fontSize: 'clamp(13px, 3.2vw, 16px)',
              }}
            >
              Transform your hand-drawn doodles and wireframes into stunning photorealistic photos, 3D renders, and digital art with FLUX in seconds.
            </p>

            {/* CTA button wired to /studio */}
            <button
              type="button"
              onClick={onNavigateToStudio}
              className="mt-5 sm:mt-6 inline-flex items-center gap-3 bg-[#0b0f1a] hover:bg-black text-white rounded-full pl-6 sm:pl-7 pr-2 py-2 sm:py-2.5 text-[14px] font-medium transition shadow-md group cursor-pointer"
            >
              <span>Start Creating Free</span>
              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 transition transform">
                <ChevronRight className="w-4 h-4 text-white" />
              </span>
            </button>
          </div>

          {/* Dashboard Preview (bleeds off bottom edge) */}
          <div className="w-full mt-auto translate-y-6 sm:translate-y-8">
            <DashboardPreview onNavigateToStudio={onNavigateToStudio} />
          </div>
        </div>
      </div>
    </div>
  );
};
