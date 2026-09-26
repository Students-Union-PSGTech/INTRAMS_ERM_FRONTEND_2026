import React from 'react';
import { Wrench } from 'lucide-react';

export default function Maintenance() {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-black overflow-hidden px-4 py-8">
      {/* Subtle radial ambient glow behind card */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none opacity-25 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(2,132,199,0.1) 40%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md bg-zinc-950/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-800/80 p-8 sm:p-10 flex flex-col items-center text-center">
        {/* INTRAMS ERM 2026 Branding */}
        <div className="mx-auto mb-6 flex items-center justify-center">
          <img
            src="/intrams_logo.png"
            alt="INTRAMS ERM 2026"
            className="h-20 sm:h-24 w-auto object-contain drop-shadow-[0_0_25px_rgba(56,189,248,0.45)] select-none"
          />
        </div>

        {/* Maintenance Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center mb-6 text-sky-400 shadow-lg shadow-sky-500/10">
          <Wrench className="w-7 h-7 text-sky-400" />
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/40 border border-sky-500/30 text-sky-400 text-xs font-semibold tracking-wider uppercase mb-4">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>Convenor Portal</span>
        </div>

        {/* Main Message */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3 font-heading">
          Portal Under Maintenance
        </h1>

        {/* Supporting Text */}
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-8 max-w-sm">
          The Convenor Portal will be back shortly.
        </p>

        {/* Bottom Branding / System Info */}
        <div className="w-full pt-6 border-t border-zinc-800/70 flex flex-col items-center gap-1 text-xs text-zinc-500">
          <span className="font-medium text-zinc-400">Students' Union • INTRAMS ERM 2026</span>
          <span>Event Resource Management System</span>
        </div>
      </div>
    </div>
  );
}
