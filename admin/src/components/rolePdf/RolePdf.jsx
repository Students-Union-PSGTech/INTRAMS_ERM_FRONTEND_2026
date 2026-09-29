import React, { useState } from 'react';
import RoleSelector from './RoleSelector';
import ReportSummary from './ReportSummary';
import PdfPreviewModal from './PdfPreviewModal';
import { adminAPI } from '../../api';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../../context/ToastContext';
import { handlePdfBlob } from '../../utils/pdf';
import { generateRolePdf } from '../../utils/generateRolePdf';
import { generateEventsPdf } from '../../utils/generateEventsPdf';
import { generateItemsPdf } from '../../utils/generateItemsPdf';
import { generateConsolidatedPdf } from '../../utils/generateConsolidatedPdf';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';

const ROLES = [
  { id: 'event', label: 'Events' },
  { id: 'items', label: 'Requested Items' },
  { id: 'consolidated', label: 'Consolidated Event Requests' },
  { id: 'secretary', label: 'Secretary' },
  { id: 'convenor', label: 'Convenor' },
  { id: 'volunteer', label: 'Volunteer' },
];

export default function RolePdf() {
  const { showToast } = useToast();
  const [selected, setSelected] = useState(ROLES[0].id);
  const [busy, setBusy] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const onSelect = (role) => setSelected(role);

  const generateExactPdfBlob = async () => {
    if (selected === 'consolidated') {
      const res = await adminAPI.getConsolidatedItems();
      const items = res.data?.data || [];
      return await generateConsolidatedPdf({ data: items });
    }

    let rawData = [];
    try {
      if (selected === 'event' || selected === 'items') {
        const res = await adminAPI.getEvents();
        const events = res.data?.data || res.data || [];
        rawData = events.filter(e => e.status === 'submitted');
      } else {
        const res = await adminAPI.getRoleMembers(selected);
        rawData = res.data?.data || res.data || {};
      }
    } catch (_) {
      rawData = (selected === 'event' || selected === 'items') ? [] : {};
    }
    if (selected === 'items') {
      return await generateItemsPdf({ data: rawData });
    }
    if (selected === 'event') {
      return await generateEventsPdf({ data: rawData });
    }
    return await generateRolePdf({ role: selected, data: rawData });
  };

  const previewPdf = async () => {
    try {
      setBusy('preview');
      const pdfBlob = await generateExactPdfBlob();
      const url = await handlePdfBlob({ data: pdfBlob }, { filename: `Role_${selected}.pdf`, preview: true });
      if (url) {
        setPreviewUrl(url);
        setPreviewOpen(true);
      }
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Unable to generate PDF preview.'), 'error');
    } finally {
      setBusy('');
    }
  };

  const downloadPdf = async () => {
    try {
      setBusy('download');
      const pdfBlob = await generateExactPdfBlob();
      await handlePdfBlob({ data: pdfBlob }, { filename: `Role_${selected}.pdf` });
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Unable to download PDF.'), 'error');
    } finally {
      setBusy('');
    }
  };

  const exportCsv = async () => {
    try {
      setBusy('export');
      let flattenRows = [];
      let rawData;
      if (selected === 'consolidated') {
        const res = await adminAPI.getConsolidatedItems();
        const items = res.data?.data || [];
        flattenRows = items.map((it, index) => ({
          SNo: index + 1,
          ItemName: it.item_name || '',
          Category: it.is_returnable ? 'RETURNABLE' : 'CONSUMABLE',
          TotalRequested: `${it.total_requested_quantity || 0} ${it.unit || 'pcs'}`,
          UnitPrice: Number(it.price_per_unit || 0).toFixed(2),
          EstimatedTotal: Number(it.total_estimated_cost || 0).toFixed(2)
        }));
      } else if (selected === 'event' || selected === 'items') {
        const eventRes = await adminAPI.getEvents();
        const events = eventRes.data?.data || eventRes.data || [];
        rawData = events.filter(e => e.status === 'submitted');
      } else {
        const res = await adminAPI.getRoleMembers(selected);
        rawData = res?.data?.data || res?.data || {};
      }

      if (selected !== 'consolidated') {
        if (Array.isArray(rawData)) {
          if (selected === 'event') {
            const sortedEvents = [...rawData].sort((a, b) => {
              const clubA = (a.club_id?.club_name || a.club_name || a.association || a.clubName || 'General').trim();
              const clubB = (b.club_id?.club_name || b.club_name || b.association || b.clubName || 'General').trim();
              const comp = clubA.localeCompare(clubB, undefined, { sensitivity: 'base' });
              if (comp !== 0) return comp;
              const nameA = (a.event_name || a.name || a.eventName || '').trim();
              const nameB = (b.event_name || b.name || b.eventName || '').trim();
              return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
            });
            flattenRows = sortedEvents.map((e, index) => ({
              SNo: index + 1,
              Club: e.club_id?.club_name || e.club_name || e.association || e.clubName || 'General',
              EventID: e.event_id || e.id || e._id || '',
              EventName: e.event_name || e.name || e.eventName || ''
            }));
          } else if (selected === 'items') {
            let sn = 1;
            const sortedEvents = [...rawData].sort((a, b) => {
              const clubA = (a.club_id?.club_name || a.club_name || 'General').trim();
              const clubB = (b.club_id?.club_name || b.club_name || 'General').trim();
              const comp = clubA.localeCompare(clubB, undefined, { sensitivity: 'base' });
              if (comp !== 0) return comp;
              const nameA = (a.event_name || a.name || '').trim();
              const nameB = (b.event_name || b.name || '').trim();
              return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
            });
            sortedEvents.forEach(e => {
              const club = e.club_id?.club_name || e.club_name || 'General';
              const eventName = e.event_name || '';
              const items = e.items || [];
              items.forEach(it => {
                flattenRows.push({
                  SNo: sn++,
                  Club: club,
                  EventName: eventName,
                  ItemName: it.item_name || it.name || '',
                  Quantity: it.quantity || it.requested_quantity || 1
                });
              });
            });
          } else {
            flattenRows = rawData;
          }
        } else {
          Object.entries(rawData).forEach(([clubName, members]) => {
            if (Array.isArray(members)) {
              members.forEach(m => {
                flattenRows.push({
                  Club: clubName,
                  Name: m.name || '',
                  RollNumber: m.rollNo || m.roll_number || '',
                  Year: m.year || '',
                  Department: m.department || '',
                  Phone: m.phone || m.mobile || '',
                  Event: m.eventName || ''
                });
              });
            }
          });
        }
      }

      if (flattenRows.length === 0) {
        showToast('No personnel records found to export.', 'info');
        return;
      }

      const keys = Object.keys(flattenRows[0]);
      const escape = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
      const csvContent = [keys.join(',')].concat(flattenRows.map((r) => keys.map((k) => escape(r[k])).join(','))).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Role_${selected}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'CSV export failed.'), 'error');
    } finally {
      setBusy('');
    }
  };


  return (
    <div>
      <PageHeader
        title="ROLE-BASED PDF REPORTS"
        subtitle="Generate, preview, and export official personnel reports by role"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-5 bg-[#050505] border border-[#252525]">
          <h3 className="font-heading font-bold text-[#FFFFFF] text-sm uppercase tracking-wider mb-3">SELECT ROLE</h3>
          <RoleSelector roles={ROLES} selected={selected} onSelect={onSelect} />
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" loading={busy === 'preview'} onClick={previewPdf}>
              PREVIEW PDF
            </Button>
            <Button loading={busy === 'download'} onClick={downloadPdf}>
              DOWNLOAD PDF
            </Button>
            <Button variant="ghost" onClick={exportCsv} loading={busy === 'export'}>
              EXPORT CSV
            </Button>
          </div>
        </div>

        <div className="col-span-2 p-5 bg-[#050505] border border-[#252525]">
          <ReportSummary role={selected} />
        </div>
      </div>

      <PdfPreviewModal open={previewOpen} url={previewUrl} filename={`Role_${selected}.pdf`} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}

