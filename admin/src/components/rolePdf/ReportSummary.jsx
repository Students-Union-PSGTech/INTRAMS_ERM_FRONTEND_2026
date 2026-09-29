import React from 'react';

export default function ReportSummary({ role, memberCount = 0 }) {
  const getRoleDisplayName = () => {
    if (role === 'consolidated') return 'CONSOLIDATED EVENT REQUESTS';
    if (role === 'items') return 'REQUESTED ITEMS';
    if (role === 'event') return 'EVENTS';
    return String(role || '').toUpperCase();
  };

  const getRoleDescription = () => {
    if (role === 'consolidated') {
      return 'Consolidated event item requirements report aggregating total quantities requested, unit prices, and estimated budget totals across all club proposals.';
    }
    if (role === 'items') {
      return 'Official logistics invoice of requested items grouped by event proposals with detailed cost and GST breakdowns.';
    }
    if (role === 'event') {
      return 'Official list of submitted club events with unique event identifiers and association details.';
    }
    return 'Generated reports group personnel by association header banners (#1F4E79) with structured table data (#D9E1F2 column headers and black grid borders).';
  };

  return (
    <div className="space-y-4">
      <h3 className="font-heading font-bold text-[#FFFFFF] text-sm uppercase tracking-wider">REPORT SUMMARY</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 bg-[#000000] border border-[#252525]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0A0]">SELECTED REPORT</div>
          <div className="mt-1 text-base font-bold text-[#00AEEF] uppercase">{getRoleDisplayName()}</div>
        </div>
        <div className="p-4 bg-[#000000] border border-[#252525]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0A0]">FORMAT SPECIFICATION</div>
          <div className="mt-1 text-xs font-bold text-[#00D084] uppercase">INTRAMS OFFICIAL LANDSCAPE REPORT</div>
        </div>
      </div>

      <p className="text-xs text-[#A0A0A0] leading-relaxed uppercase">
        {getRoleDescription()}
      </p>
    </div>
  );
}

