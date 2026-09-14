import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminAPI, resolveAssetUrl } from '../api';
import { getApiErrorMessage } from '../utils/apiError';
import { handlePdfBlob } from '../utils/pdf';
import { generateEventPdf } from '../utils/generateEventPdf';
import { getAllocated, getRequested } from '../utils/allocation';
import { useToast } from '../context/ToastContext';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { Table, THead, Th, Td, Tr } from './ui/Table';
import EmptyState from './ui/EmptyState';
import { TableSkeleton } from './ui/LoadingState';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getEventById(id);
      setEvent(res.data?.data || res.data);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Unable to load event details.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchEvent();
  }, [id]);

  const handleStatus = async (status) => {
    if (!event) return;
    try {
      setStatusLoading(true);
      await adminAPI.updateEventStatus(event._id, status);
      showToast(`Event marked as ${status}.`, 'success');
      await fetchEvent();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Unable to update event status.'), 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePdf = async (type) => {
    if (!event) return;
    try {
      setPdfLoading(type);
      const filename = type === 'event'
        ? `Event_${event.name || event.event_name || event._id}_DRAFT_ERM.pdf`
        : `${type}_${event.event_id || event._id}.pdf`;

      if (type === 'event') {
        let pdfBlob;
        try {
          pdfBlob = await generateEventPdf(event);
        } catch (_) {
          const res = await adminAPI.getEventPDF(event._id);
          pdfBlob = new Blob([res.data], { type: 'application/pdf' });
        }
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const map = {
          items: () => adminAPI.getEventItemsPDF(event._id),
          procurement: () => adminAPI.getProcurementPDF(event._id),
        };
        const res = await map[type]();
        await handlePdfBlob(res, { filename });
      }
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Unable to generate PDF.'), 'error');
    } finally {
      setPdfLoading('');
    }
  };

  const handleDelete = async () => {
    if (!event || !window.confirm('Delete this event proposal?')) return;
    try {
      await adminAPI.deleteEvent(event._id);
      showToast('Event deleted.', 'success');
      navigate('/events');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Unable to delete event.'), 'error');
    }
  };

  if (loading) return <TableSkeleton />;
  if (!event) return <EmptyState title="EVENT NOT FOUND" />;

  const itemsList = Array.isArray(event.items) ? event.items : [];
  const contacts = event.contacts || {};

  return (
    <div>
      <Button variant="ghost" className="mb-4 px-0 border-none" onClick={() => navigate('/events')}>
        ← BACK TO EVENTS
      </Button>
      <PageHeader
        title={(event.name || event.event_name || 'EVENT').toUpperCase()}
        subtitle={`${(event.club_name || 'ASSOCIATION').toUpperCase()} · ${event.event_id || ''}`}
        actions={
          <>
            <Button onClick={() => navigate(`/grant-allocation/${event._id}`)}>ALLOCATE ITEMS</Button>
            <Button variant="secondary" loading={pdfLoading === 'event'} onClick={() => handlePdf('event')}>
              EVENT PDF
            </Button>
            <Button variant="secondary" loading={pdfLoading === 'items'} onClick={() => handlePdf('items')}>
              ITEMS PDF
            </Button>
            <Button variant="secondary" loading={pdfLoading === 'procurement'} onClick={() => handlePdf('procurement')}>
              PROCUREMENT PDF
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-[#FFFFFF]">EVENT INFORMATION</h2>
              <Badge status={event.status} />
            </div>
            {event.tagline && <p className="text-[13px] text-[#00AEEF] italic mb-3">{event.tagline}</p>}
            <p className="text-[14px] text-[#E5E5E5] leading-relaxed">{event.description || event.about || 'No description provided.'}</p>
            <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-[#252525] text-[13px]">
              <div>
                <p className="text-[#A0A0A0] text-[11px] font-bold uppercase">EVENT TYPE</p>
                <p className="text-[#FFFFFF] font-bold mt-0.5">{event.event_type || 'GENERAL'}</p>
              </div>
              <div>
                <p className="text-[#A0A0A0] text-[11px] font-bold uppercase">PARTICIPANT MODE</p>
                <p className="text-[#FFFFFF] font-bold mt-0.5">{event.form?.participant_type || '—'}</p>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-[#252525] bg-[#000000]">
              <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-[#FFFFFF]">REQUESTED EQUIPMENT ITEMS</h2>
            </div>
            {itemsList.length === 0 ? (
              <EmptyState title="NO REQUESTED ITEMS" />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>ITEM NAME</Th>
                    <Th numeric>REQUESTED</Th>
                    <Th numeric>ALLOCATED</Th>
                    <Th numeric>REMAINING</Th>
                  </tr>
                </THead>
                <tbody>
                  {itemsList.map((item) => {
                    const requested = getRequested(item);
                    const allocated = getAllocated(item);
                    return (
                      <Tr key={item._id || item.item_name}>
                        <Td className="text-[#FFFFFF] font-bold">{item.item_name}</Td>
                        <Td numeric>{requested}</Td>
                        <Td numeric>{allocated}</Td>
                        <Td numeric className="text-[#00AEEF] font-bold">{Math.max(0, requested - allocated)}</Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-[#FFFFFF] mb-3">ASSOCIATION DETAILS</h3>
            <p className="text-[#00AEEF] text-[14px] font-bold">{event.club_name || '—'}</p>
            {contacts.faculty_advisor?.name && (
              <p className="text-[13px] text-[#E5E5E5] mt-2 font-bold">ADVISOR: <span className="text-[#A0A0A0]">{contacts.faculty_advisor.name}</span></p>
            )}
            {contacts.secretary?.name && (
              <p className="text-[13px] text-[#E5E5E5] mt-1 font-bold">SECRETARY: <span className="text-[#A0A0A0]">{contacts.secretary.name}</span></p>
            )}
          </Card>

          {Array.isArray(event.annexures) && event.annexures.length > 0 && (
            <Card className="p-5">
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-[#FFFFFF] mb-3">
                SUPPORTING ANNEXURES ({event.annexures.length})
              </h3>
              <div className="space-y-2">
                {event.annexures.map((ann, idx) => (
                  <a
                    key={ann._id || idx}
                    href={resolveAssetUrl(ann.file_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2.5 bg-[#000000] border border-[#252525] hover:border-[#00AEEF] rounded text-xs font-medium text-[#E5E5E5] hover:text-white transition-colors truncate"
                  >
                    📎 {ann.original_name || ann.file_name || `Annexure ${idx + 1}`}
                  </a>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5 space-y-2">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-[#FFFFFF] mb-3">ADMINISTRATIVE ACTIONS</h3>
            <Button className="w-full" variant="success" loading={statusLoading} disabled={event.status === 'approved'} onClick={() => handleStatus('approved')}>
              APPROVE PROPOSAL
            </Button>
            <Button className="w-full" variant="danger" loading={statusLoading} disabled={event.status === 'rejected'} onClick={() => handleStatus('rejected')}>
              REJECT PROPOSAL
            </Button>
            <Button className="w-full" variant="ghost" onClick={handleDelete}>
              DELETE PROPOSAL
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

