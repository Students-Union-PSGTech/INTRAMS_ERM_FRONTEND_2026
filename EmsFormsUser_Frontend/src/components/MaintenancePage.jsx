import React from 'react';
import { Clock } from 'lucide-react';

function MaintenancePage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-white px-4 py-8 relative selection:bg-sky-500 selection:text-white">
      {/* Subtle background ambient glow matching the Convenor theme */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(56, 189, 248, 0.15) 0%, rgba(0, 0, 0, 0) 70%)'
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md bg-zinc-950/90 border border-zinc-800 rounded-2xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center">
        {/* INTRAMS 2026 Branding */}
        <div className="flex justify-center mb-6">
          <img
            src="/intrams_logo.png"
            alt="INTRAMS ERM 2026"
            className="h-20 sm:h-24 w-auto object-contain drop-shadow-[0_0_25px_rgba(56,189,248,0.4)]"
          />
        </div>

        {/* Portal Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/70 border border-sky-500/30 text-sky-400 text-xs font-medium tracking-wider uppercase mb-5">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>INTRAMS ERM 2026 • Convenor Portal</span>
        </div>

        {/* Main Message */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
          Portal Under Maintenance
        </h1>

        {/* Supporting Text */}
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-8">
          The Convenor Portal will be back shortly.
        </p>

        {/* Informational notice */}
        <div className="pt-6 border-t border-zinc-800/80 text-xs text-zinc-500 space-y-1">
          <p>Scheduled maintenance is currently in progress.</p>
          <p>We apologize for any temporary inconvenience.</p>
        </div>

        {/* Footer Organization Tag */}
        <div className="mt-6 text-[11px] text-zinc-600 font-medium tracking-wide">
          Students' Union • PSG College of Technology
        </div>
      </div>
    </div>
  );
}

export default MaintenancePage;
