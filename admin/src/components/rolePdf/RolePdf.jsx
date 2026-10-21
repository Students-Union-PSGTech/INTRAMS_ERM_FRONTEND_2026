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
import { generateAllEventsPdf } from '../../utils/generateAllEventsPdf';
import { generateItemsPdf } from '../../utils/generateItemsPdf';
import { generateConsolidatedPdf } from '../../utils/generateConsolidatedPdf';
import { generateAllAllocatedPdf } from '../../utils/generateAllAllocatedPdf';
import { generatePendingAllocatedPdf } from '../../utils/generatePendingAllocatedPdf';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';

const ROLES = [
  { id: 'event', label: 'Events' },
  { id: 'all_event_pdfs', label: 'All Event PDFs' },
  { id: 'all_allocated_items', label: 'All Allocated Items' },
  { id: 'pending_allocated_items', label: 'Pending Items to be Allocated' },
  { id: 'items', label: 'Requested Items' },
  { id: 'consolidated', label: 'Consolidated Event Requests' },
  { id: 'secretary', label: 'Secretary' },
  { id: 'convenor', label: 'Convenor' },
  { id: 'volunteer', label: 'Volunteer' },
];

export const isEventOnDay = (ev, targetDay) => {
  if (!targetDay || targetDay === 'Both' || targetDay === 'both' || targetDay === 'all') return true;

  const form = ev.form || ev.form_specs || {};
  const isTwoDay = Boolean(
    form.is_two_day ||
    form.is_two_day_lab ||
    ev.is_two_day ||
    ev.is_two_day_lab ||
    (form.day1_slot && form.day2_slot)
  );

  // 2-day events take place on both Day 1 and Day 2
  if (isTwoDay) return true;

  const dayStr = String(
    form.day ||
    form.event_day ||
    form.lab_day ||
    ev.day ||
    ev.event_day ||
    ev.lab_day ||
    ''
  ).trim().toLowerCase();

  const target = String(targetDay).trim().toLowerCase();

  if (target.includes('2') || target === 'day 2') {
    return dayStr.includes('2') || dayStr.includes('day 2');
  }

  if (target.includes('1') || target === 'day 1') {
    return dayStr.includes('1') || dayStr.includes('day 1') || dayStr === '';
  }

  return true;
};

export default function RolePdf() {
  const { showToast } = useToast();
  const [selected, setSelected] = useState(ROLES[0].id);
  const [selectedDay, setSelectedDay] = useState('Both');
  const [busy, setBusy] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const onSelect = (role) => setSelected(role);

  const generateExactPdfBlob = async () => {
    if (selected === 'all_event_pdfs') {
      const res = await adminAPI.getEvents();
      const events = res.data?.data || res.data || [];
      const submitted = events.filter(e => e.status === 'submitted');
      const targetData = submitted.length > 0 ? submitted : events;
      return await generateAllEventsPdf({ data: targetData });
    }

    if (selected === 'consolidated') {
      const res = await adminAPI.getConsolidatedItems();
      const items = res.data?.data || [];
      return await generateConsolidatedPdf({ data: items });
    }

    if (selected === 'all_allocated_items') {
      const [eventsRes, itemsRes, assocRes] = await Promise.all([
        adminAPI.getEvents().catch(() => ({ data: { data: [] } })),
        adminAPI.getItems().catch(() => ({ data: { data: [] } })),
        adminAPI.getAssociations().catch(() => ({ data: { data: [] } }))
      ]);
      const events = eventsRes.data?.data || eventsRes.data || [];
      const masterItems = itemsRes.data?.data || itemsRes.data || [];
      const associations = assocRes.data?.data || assocRes.data || [];

      const masterMap = {};
      masterItems.forEach(mi => {
        if (mi.item_name) masterMap[mi.item_name.trim().toLowerCase()] = mi;
      });

      const clubMap = {};
      associations.forEach(a => {
        const cName = (a.club_name || a.association_name || '').trim();
        if (cName && !clubMap[cName]) {
          clubMap[cName] = { club_name: cName, items: [] };
        }
      });

      const targetEvents = selectedDay === 'Both'
        ? events
        : events.filter(ev => isEventOnDay(ev, selectedDay));

      targetEvents.forEach(ev => {
        const cName = (ev.club_id?.club_name || ev.club_name || ev.association || ev.associationName || ev.clubName || 'General').trim();
        if (!clubMap[cName]) {
          clubMap[cName] = { club_name: cName, items: [] };
        }
        const evItems = Array.isArray(ev.items) ? ev.items : [];
        evItems.forEach(it => {
          const appQty = Number(it.approved_quantity !== undefined ? it.approved_quantity : 0);
          const newQty = Number(it.newly_allocated !== undefined ? it.newly_allocated : (it.newlyAllocated !== undefined ? it.newlyAllocated : 0));
          const totalApp = Number(it.allocated_quantity !== undefined ? it.allocated_quantity : (it.quantity_provided !== undefined ? it.quantity_provided : (appQty + newQty)));
          const reqQty = Number(it.requested_quantity || it.quantity || 0);
          if (totalApp > 0 || reqQty > 0) {
            const master = masterMap[(it.item_name || it.name || '').trim().toLowerCase()];
            const isRetVal = it.is_returnable !== undefined ? it.is_returnable : master?.is_returnable;
            const isRet = (
              isRetVal === true ||
              String(isRetVal).toUpperCase() === 'YES' ||
              String(isRetVal).toUpperCase() === 'TRUE' ||
              String(isRetVal).toUpperCase() === 'RETURNABLE'
            );
            clubMap[cName].items.push({
              name: String(it.item_name || it.name || 'Unknown Item').trim(),
              event_name: ev.event_name || ev.name || '',
              requested: reqQty,
              approved: appQty,
              newly_allocated: newQty > 0 ? newQty : (it.newly_allocated || ''),
              returnability: isRet
            });
          }
        });
      });

      const sortedClubs = Object.values(clubMap)
        .map(c => ({
          ...c,
          items: c.items.filter(it => (Number(it.approved) || 0) + (Number(it.newly_allocated) || 0) > 0).map((it, idx) => ({
            ...it,
            sno: `${idx + 1}`
          }))
        }))
        .filter(c => c.items.length > 0)
        .sort((a, b) => a.club_name.localeCompare(b.club_name, undefined, { sensitivity: 'base' }));

      return await generateAllAllocatedPdf({ data: sortedClubs });
    }

    if (selected === 'pending_allocated_items') {
      const [eventsRes, itemsRes, assocRes] = await Promise.all([
        adminAPI.getEvents().catch(() => ({ data: { data: [] } })),
        adminAPI.getItems().catch(() => ({ data: { data: [] } })),
        adminAPI.getAssociations().catch(() => ({ data: { data: [] } }))
      ]);
      const events = eventsRes.data?.data || eventsRes.data || [];
      const masterItems = itemsRes.data?.data || itemsRes.data || [];
      const associations = assocRes.data?.data || assocRes.data || [];

      const masterMap = {};
      masterItems.forEach(mi => {
        if (mi.item_name) masterMap[mi.item_name.trim().toLowerCase()] = mi;
      });

      const clubMap = {};
      associations.forEach(a => {
        const cName = (a.club_name || a.association_name || '').trim();
        if (cName && !clubMap[cName]) {
          clubMap[cName] = { club_name: cName, items: [] };
        }
      });

      const targetEvents = selectedDay === 'Both'
        ? events
        : events.filter(ev => isEventOnDay(ev, selectedDay));

      targetEvents.forEach(ev => {
        const cName = (ev.club_id?.club_name || ev.club_name || ev.association || ev.associationName || ev.clubName || 'General').trim();
        if (!clubMap[cName]) {
          clubMap[cName] = { club_name: cName, items: [] };
        }
        const evItems = Array.isArray(ev.items) ? ev.items : [];
        evItems.forEach(it => {
          const appQty = Number(it.approved_quantity !== undefined ? it.approved_quantity : 0);
          const newQty = Number(it.newly_allocated !== undefined ? it.newly_allocated : (it.newlyAllocated !== undefined ? it.newlyAllocated : 0));
          const totalAlloc = (appQty + newQty > 0) ? (appQty + newQty) : Number(it.allocated_quantity !== undefined ? it.allocated_quantity : (it.quantity_provided !== undefined ? it.quantity_provided : 0));
          const reqQty = Number(it.requested_quantity || it.quantity || 0);
          const pendingQty = Math.max(0, reqQty - totalAlloc);
          if (pendingQty > 0) {
            const master = masterMap[(it.item_name || it.name || '').trim().toLowerCase()];
            const isRetVal = it.is_returnable !== undefined ? it.is_returnable : master?.is_returnable;
            const isRet = (
              isRetVal === true ||
              String(isRetVal).toUpperCase() === 'YES' ||
              String(isRetVal).toUpperCase() === 'TRUE' ||
              String(isRetVal).toUpperCase() === 'RETURNABLE'
            );

            clubMap[cName].items.push({
              name: String(it.item_name || it.name || 'Unknown Item').trim(),
              event_name: ev.event_name || ev.name || '',
              allocated: totalAlloc,
              pending: pendingQty,
              total: reqQty,
              requested: reqQty,
              returnability: isRet,
              is_returnable: isRet
            });
          }
        });
      });

      const sortedClubs = Object.values(clubMap)
        .map(c => ({
          ...c,
          items: c.items.map((it, idx) => ({
            ...it,
            sno: `${idx + 1}`
          }))
        }))
        .filter(c => c.items.length > 0)
        .sort((a, b) => a.club_name.localeCompare(b.club_name, undefined, { sensitivity: 'base' }));

      return await generatePendingAllocatedPdf({ data: sortedClubs });
    }

    let rawData = [];
    try {
      if (selected === 'event' || selected === 'items') {
        const res = await adminAPI.getEvents();
        const events = res.data?.data || res.data || [];
        rawData = events.filter(e => e.status === 'submitted');
        if (rawData.length === 0) rawData = events;
      } else {
        const res = await adminAPI.getRoleMembers(selected);
        rawData = res.data?.data || res.data || {};
      }
    } catch (_) {
      rawData = (selected === 'event' || selected === 'items') ? [] : {};
    }
    if (selected === 'items') {
      const filtered = selectedDay === 'Both'
        ? rawData
        : (Array.isArray(rawData) ? rawData : []).filter(e => isEventOnDay(e, selectedDay));
      return await generateItemsPdf({ data: filtered, day: selectedDay });
    }
    if (selected === 'event') {
      return await generateEventsPdf({ data: rawData });
    }
    return await generateRolePdf({ role: selected, data: rawData });
  };

  const getPdfFilename = () => {
    if (selected === 'items') {
      if (selectedDay === 'Both') {
        return 'Requested_Items_Both_Days.pdf';
      }
      return `Requested_Items_${selectedDay.replace(/\s+/g, '_')}.pdf`;
    }
    if (selected === 'all_allocated_items') {
      if (selectedDay === 'Both') {
        return 'All_Allocated_Items_Both_Days.pdf';
      }
      return `All_Allocated_Items_${selectedDay.replace(/\s+/g, '_')}.pdf`;
    }
    if (selected === 'pending_allocated_items') {
      if (selectedDay === 'Both') {
        return 'Pending_Items_to_be_Allocated_Both_Days.pdf';
      }
      return `Pending_Items_to_be_Allocated_${selectedDay.replace(/\s+/g, '_')}.pdf`;
    }
    return `Role_${selected}.pdf`;
  };

  const previewPdf = async () => {
    try {
      setBusy('preview');
      const pdfBlob = await generateExactPdfBlob();
      const filename = getPdfFilename();
      const url = await handlePdfBlob({ data: pdfBlob }, { filename, preview: true });
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
      const filename = getPdfFilename();
      await handlePdfBlob({ data: pdfBlob }, { filename });
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
          TotalRequested: Number(it.total_requested_quantity || 0),
          UnitPrice: Number(it.price_per_unit || 0).toFixed(2),
          EstimatedTotal: Number(it.total_estimated_cost || 0).toFixed(2)
        }));
      } else if (selected === 'all_event_pdfs' || selected === 'event' || selected === 'items' || selected === 'all_allocated_items' || selected === 'pending_allocated_items') {
        const eventRes = await adminAPI.getEvents();
        const events = eventRes.data?.data || eventRes.data || [];
        const submitted = events.filter(e => e.status === 'submitted');
        rawData = submitted.length > 0 ? submitted : events;
      } else {
        const res = await adminAPI.getRoleMembers(selected);
        rawData = res?.data?.data || res?.data || {};
      }

      if (selected !== 'consolidated') {
        if (Array.isArray(rawData)) {
          if (selected === 'all_event_pdfs') {
            const sortedEvents = [...rawData].sort((a, b) => {
              const clubA = (a.club_id?.club_name || a.club_name || a.associationName || a.clubName || '').trim();
              const clubB = (b.club_id?.club_name || b.club_name || b.associationName || b.clubName || '').trim();
              const comp = clubA.localeCompare(clubB, undefined, { sensitivity: 'base' });
              if (comp !== 0) return comp;
              const nameA = (a.event_name || a.name || a.eventName || '').trim();
              const nameB = (b.event_name || b.name || a.eventName || '').trim();
              return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
            });
            flattenRows = sortedEvents.map((e, index) => {
              const sec = Array.isArray(e.contacts?.secretaries) ? e.contacts.secretaries[0] : (e.contacts?.secretary || {});
              const fac = e.contacts?.faculty_advisor || e.facultyAdvisor || {};
              return {
                SNo: index + 1,
                Club: e.club_id?.club_name || e.club_name || e.associationName || 'General',
                EventID: e.event_id || '',
                EventName: e.event_name || e.name || '',
                Day: e.form?.is_two_day ? '2 Days' : (e.form?.day || e.form?.event_day || 'Day 1'),
                RoundsCount: Array.isArray(e.rounds) ? e.rounds.length : 1,
                ExpectedParticipants: e.participant_count || e.expectedParticipants || '—',
                Secretary: sec?.name || '',
                FacultyAdvisor: fac?.name || '',
                ItemsCount: Array.isArray(e.items) ? e.items.length : 0
              };
            });
          } else if (selected === 'event') {
            const sortedEvents = [...rawData].sort((a, b) => {
              const clubA = (a.club_id?.club_name || a.club_name || '').trim();
              const clubB = (b.club_id?.club_name || b.club_name || '').trim();
              const comp = clubA.localeCompare(clubB, undefined, { sensitivity: 'base' });
              if (comp !== 0) return comp;
              const nameA = (a.event_name || a.name || '').trim();
              const nameB = (b.event_name || b.name || '').trim();
              return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
            });
            flattenRows = sortedEvents.map((e, index) => ({
              SNo: index + 1,
              Club: e.club_id?.club_name || e.club_name || 'General',
              EventID: e.event_id || '',
              EventName: e.event_name || ''
            }));
          } else if (selected === 'items') {
            let sn = 1;
            const targetEvents = selectedDay === 'Both'
              ? rawData
              : rawData.filter(e => isEventOnDay(e, selectedDay));
            const sortedEvents = [...targetEvents].sort((a, b) => {
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
              const dayText = e.form?.is_two_day ? '2 Days' : (e.form?.day || e.form?.event_day || 'Day 1');
              const items = e.items || [];
              items.forEach(it => {
                flattenRows.push({
                  SNo: sn++,
                  Club: club,
                  EventName: eventName,
                  Day: dayText,
                  ItemName: it.item_name || it.name || '',
                  Quantity: it.quantity || it.requested_quantity || 1
                });
              });
            });
          } else if (selected === 'all_allocated_items') {
            let sn = 1;
            const itemsRes = await adminAPI.getItems().catch(() => ({ data: { data: [] } }));
            const masterItems = itemsRes.data?.data || itemsRes.data || [];
            const masterMap = {};
            masterItems.forEach(mi => {
              if (mi.item_name) masterMap[mi.item_name.trim().toLowerCase()] = mi;
            });
            const targetEvents = selectedDay === 'Both'
              ? rawData
              : rawData.filter(e => isEventOnDay(e, selectedDay));
            const sortedEvents = [...targetEvents].sort((a, b) => {
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
                const appQty = Number(it.approved_quantity !== undefined ? it.approved_quantity : 0);
                const newQty = Number(it.newly_allocated !== undefined ? it.newly_allocated : (it.newlyAllocated !== undefined ? it.newlyAllocated : 0));
                const totalApp = Number(it.allocated_quantity !== undefined ? it.allocated_quantity : (it.quantity_provided !== undefined ? it.quantity_provided : (appQty + newQty)));
                const reqQty = Number(it.requested_quantity || it.quantity || 0);
                if (totalApp > 0) {
                  const master = masterMap[(it.item_name || it.name || '').trim().toLowerCase()];
                  const isRetVal = it.is_returnable !== undefined ? it.is_returnable : master?.is_returnable;
                  flattenRows.push({
                    SNo: sn++,
                    Club: club,
                    EventName: eventName,
                    ItemName: it.item_name || it.name || '',
                    RequestedQuantity: reqQty,
                    ApprovedQuantity: appQty,
                    NewlyAllocated: newQty,
                    TotalAllocated: totalApp,
                    Returnability: isRetVal ? 'Returnable' : 'Non-Returnable'
                  });
                }
              });
            });
          } else if (selected === 'pending_allocated_items') {
            let sn = 1;
            const targetEvents = selectedDay === 'Both'
              ? rawData
              : rawData.filter(e => isEventOnDay(e, selectedDay));
            const sortedEvents = [...targetEvents].sort((a, b) => {
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
                const appQty = Number(it.approved_quantity !== undefined ? it.approved_quantity : 0);
                const newQty = Number(it.newly_allocated !== undefined ? it.newly_allocated : (it.newlyAllocated !== undefined ? it.newlyAllocated : 0));
                const totalAlloc = (appQty + newQty > 0) ? (appQty + newQty) : Number(it.allocated_quantity !== undefined ? it.allocated_quantity : (it.quantity_provided !== undefined ? it.quantity_provided : 0));
                const reqQty = Number(it.requested_quantity || it.quantity || 0);
                const pendingQty = Math.max(0, reqQty - totalAlloc);
                if (pendingQty > 0) {
                  const isRet = (
                    it.is_returnable === true ||
                    String(it.is_returnable).toUpperCase() === 'YES' ||
                    String(it.is_returnable).toUpperCase() === 'TRUE' ||
                    String(it.is_returnable).toUpperCase() === 'RETURNABLE'
                  );
                  flattenRows.push({
                    SNo: sn++,
                    Club: club,
                    EventName: eventName,
                    ItemName: it.item_name || it.name || '',
                    Allocated: totalAlloc,
                    Pending: pendingQty,
                    Total: reqQty,
                    Returnability: isRet ? 'Returnable' : 'Non-Returnable'
                  });
                }
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
      a.download = selected === 'items'
        ? (selectedDay === 'Both' ? 'Requested_Items_Both_Days.csv' : `Requested_Items_${selectedDay.replace(/\s+/g, '_')}.csv`)
        : selected === 'all_allocated_items'
        ? (selectedDay === 'Both' ? 'All_Allocated_Items_Both_Days.csv' : `All_Allocated_Items_${selectedDay.replace(/\s+/g, '_')}.csv`)
        : selected === 'pending_allocated_items'
        ? (selectedDay === 'Both' ? 'Pending_Items_to_be_Allocated_Both_Days.csv' : `Pending_Items_to_be_Allocated_${selectedDay.replace(/\s+/g, '_')}.csv`)
        : `Role_${selected}.csv`;
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
          <ReportSummary role={selected} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
        </div>
      </div>

      <PdfPreviewModal open={previewOpen} url={previewUrl} filename={getPdfFilename()} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}

