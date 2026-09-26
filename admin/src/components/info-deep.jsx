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
import EventPreview from './EventPreview';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState('');

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

  const handlePdf = async (type) => {
    if (!event) return;
    try {
      setPdfLoading(type);
      const filename = type === 'event'
        ? `Event_${event.name || event.event_name || event._id}${event.event_id ? `_${event.event_id}` : ''}_DRAFT_ERM.pdf`
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
        title={`${(event.name || event.event_name || 'EVENT').toUpperCase()} ${event.event_id ? `(${event.event_id})` : ''}`.trim()}
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
          <EventPreview formData={event} />
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden border border-[#252525] bg-[#050505]/50 backdrop-blur-md shadow-2xl">
            <div className="px-5 py-4 border-b border-[#252525] bg-[#000000]/80">
              <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-[#FFFFFF] flex items-center gap-2">
                REQUESTED EQUIPMENT ITEMS
              </h2>
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

          {Array.isArray(event.annexures) && event.annexures.length > 0 && (
            <Card className="p-6 border border-[#252525] bg-[#050505]/50 backdrop-blur-md shadow-2xl">
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-[#FFFFFF] mb-4 flex items-center gap-2">
                SUPPORTING ANNEXURES ({event.annexures.length})
              </h3>
              <div className="space-y-3">
                {event.annexures.map((ann, idx) => (
                  <a
                    key={ann._id || idx}
                    href={resolveAssetUrl(ann.file_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#00AEEF] hover:bg-[#00AEEF]/5 rounded-xl text-[13px] font-medium text-[#E5E5E5] hover:text-white transition-all truncate"
                  >
                    <span className="truncate">{ann.original_name || ann.file_name || `Annexure ${idx + 1}`}</span>
                  </a>
                ))}
              </div>
            </Card>
          )}


        </div>
      </div>
    </div>
  );
}

