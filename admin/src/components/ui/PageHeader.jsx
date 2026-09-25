import React from 'react';

export default function PageHeader({ title, subtitle, actions, showLogo = false }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 pb-4 border-b border-[#252525]">
      <div className="flex items-center gap-4">
        {showLogo && (
          <img
            src="/intrams_logo.png"
            alt="INTRAMS 2026"
            className="h-12 sm:h-14 w-auto object-contain drop-shadow-[0_0_12px_rgba(0,174,239,0.35)] flex-shrink-0"
          />
        )}
        <div>
          <h1 className="text-[26px] sm:text-[28px] leading-tight font-bold uppercase tracking-wider text-[#FFFFFF] font-heading border-l-4 border-[#00AEEF] pl-3">
            {title}
          </h1>
          {subtitle && <p className="text-[13px] text-[#A0A0A0] mt-1 pl-4 uppercase font-bold tracking-wide">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

