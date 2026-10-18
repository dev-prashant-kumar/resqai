"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Radio } from "lucide-react";

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Check if running as an installed PWA
    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isPWA) {
      setLoading(true);

      // Trigger smooth fade-out right before removing from DOM
      const fadeTimer = setTimeout(() => {
        setFadingOut(true);
      }, 1400);

      const removeTimer = setTimeout(() => {
        setLoading(false);
      }, 1800);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, []);

  if (loading) {
    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#060709] p-8 text-white transition-opacity duration-500 antialiased selection:bg-none ${
          fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* Top Status Bar indicator */}
        <div className="flex w-full items-center justify-between pt-2 text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            RESQAI TELEMETRY
          </span>
          <span>SYSTEM VER 2.4</span>
        </div>

        {/* Center Graphic & Animated Brand Badge */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Glowing background blur rings */}
          <div className="absolute h-64 w-64 rounded-full bg-red-600/15 blur-[80px] pointer-events-none animate-pulse" />
          <div className="absolute h-40 w-40 rounded-full bg-cyan-500/10 blur-[60px] pointer-events-none" />

          {/* Icon Box with Radar Sweep ring */}
          <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-red-500/30 bg-gradient-to-b from-red-500/20 to-red-950/40 shadow-2xl shadow-red-600/20 backdrop-blur-2xl">
            <ShieldAlert className="h-11 w-11 text-red-500 animate-bounce" />
            
            {/* Corner radar markers */}
            <span className="absolute -top-1 -left-1 h-3 w-3 border-t-2 border-l-2 border-red-500/60 rounded-tl" />
            <span className="absolute -top-1 -right-1 h-3 w-3 border-t-2 border-r-2 border-red-500/60 rounded-tr" />
            <span className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-red-500/60 rounded-bl" />
            <span className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 border-red-500/60 rounded-br" />
          </div>

          {/* Title & Tagline */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black tracking-widest text-white uppercase font-sans">
              ResQ<span className="text-red-500">AI</span>
            </h1>
            <p className="text-xs font-medium tracking-wide text-zinc-400">
              AI-Driven Emergency Intelligence
            </p>
          </div>

          {/* Modern Progress Bar */}
          <div className="mt-8 w-44 space-y-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900 border border-white/10 p-[1px]">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-cyan-400 animate-pulse" />
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
              <span className="flex items-center gap-1">
                <Radio className="h-2.5 w-2.5 text-red-400 animate-spin" /> PostGIS Link
              </span>
              <span>READY</span>
            </div>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="pb-2 text-center text-[10px] font-mono text-zinc-600 tracking-wider">
          FASTAPI & SUPABASE SYNCED
        </div>
      </div>
    );
  }

  return <>{children}</>;
}