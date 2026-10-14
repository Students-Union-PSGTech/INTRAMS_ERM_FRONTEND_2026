import React from 'react';

export default function ReportSummary({ role, memberCount = 0 }) {
  const getRoleDisplayName = () => {
    if (role === 'all_event_pdfs') return 'ALL EVENT PDFS';
    if (role === 'all_allocated_items') return 'ALL ALLOCATED ITEMS';
    if (role === 'consolidated') return 'CONSOLIDATED EVENT REQUESTS';
    if (role === 'items') return 'REQUESTED ITEMS';
    if (role === 'event') return 'EVENTS';
    return String(role || '').toUpperCase();
  };

  const getRoleDescription = () => {
    if (role === 'all_event_pdfs') {
      return 'Comprehensive official compilation of all event resource forms arranged alphabetically by club. Each event starts on a new page with complete logistics matrix, contacts, descriptions, round rules, and items with full English and Tamil support.';
    }
    if (role === 'all_allocated_items') {
      return 'Official allocation summary report of all equipment and resources granted across all club associations, grouped club-wise with returnability status, requested quantities, and approved quantities.';
    }
    if (role === 'consolidated') {
      return 'Consolidated event item requirements report aggregating total quantities requested, unit prices, and estimated budget totals across all club proposals.';
    }
    if (role === 'items') {
      return 'Official logistics invoice of requested items grouped by event proposals with detailed cost and GST breakdowns.';
    }
    if (role === 'event') {
      return 'Official list of submitted club events with unique event identifiers and association details.';
    }
    return '';
  };

  const description = getRoleDescription();

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
          <div className="mt-1 text-xs font-bold text-[#00D084] uppercase">
            {role === 'all_event_pdfs' ? 'INTRAMS COMPLETE EVENT DOSSIERS (PORTRAIT)' : role === 'all_allocated_items' ? 'INTRAMS ALLOCATION REPORT (PORTRAIT)' : 'INTRAMS OFFICIAL LANDSCAPE REPORT'}
          </div>
        </div>
      </div>

      {description ? (
        <p className="text-xs text-[#A0A0A0] leading-relaxed uppercase">
          {description}
        </p>
      ) : null}
    </div>
  );
}

