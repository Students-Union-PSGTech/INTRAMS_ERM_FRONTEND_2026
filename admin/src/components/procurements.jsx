import React, { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { adminAPI } from '../api';
import { getApiErrorMessage } from '../utils/apiError';
import { handlePdfBlob } from '../utils/pdf';
import { useToast } from '../context/ToastContext';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import Badge from './ui/Badge';
import EmptyState from './ui/EmptyState';
import { TableSkeleton } from './ui/LoadingState';

export default function Procurements() {
  const { showToast } = useToast();
  const [procurements, setProcurements] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pdfLoading, setPdfLoading] = useState('');

  const fetchProcurements = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminAPI.getProcurements();
      const data = res.data?.data || {};
      setProcurements(data.procurements || []);
      setItems(data.items || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load procurement records.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcurements();
  }, []);

  const pdf = async (eventId, preview) => {
    if (!eventId) {
      showToast('No event is linked to this procurement record.', 'warning');
      return;
    }
    try {
      setPdfLoading(eventId);
      const res = await adminAPI.getProcurementPDF(eventId);
      await handlePdfBlob(res, { filename: `Procurement_${eventId}.pdf`, preview });
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Unable to generate procurement PDF.'), 'error');
    } finally {
      setPdfLoading('');
    }
  };

  const handleStatusUpdate = async (procId, status) => {
    try {
      await adminAPI.updateProcurementStatus(procId, status);
      showToast(`Procurement status updated to ${status}.`, 'success');
      fetchProcurements();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to update procurement status.'), 'error');
    }
  };

  const filtered = procurements.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.submission_id?.event_name || '').toLowerCase().includes(term) ||
      (p.requested_by?.club_name || '').toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <PageHeader
        title="PROCUREMENT REQUISITIONS"
        subtitle="Shortage requisitions automatically logged when event requests exceed available SU inventory"
        actions={
          <Button variant="secondary" onClick={fetchProcurements}>
            REFRESH
          </Button>
        }
      />
      <div className="max-w-md mb-5">
        <Input placeholder="SEARCH EVENT OR ASSOCIATION..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      {loading && <TableSkeleton />}
      {error && <p className="text-[#FF4D67] text-[13px] font-bold border border-[#FF4D67]/40 bg-[#050505] p-3 mb-4">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <Card>
          <EmptyState icon={ShoppingCart} title="NO PROCUREMENT RECORDS" message="Shortages are automatically logged when item allocation demand exceeds available stock." />
        </Card>
      )}
      <div className="space-y-3">
        {filtered.map((proc) => {
          const reqItems = items.filter((i) => i.procurement_id === proc._id || i.procurement_id?._id === proc._id);
          const eventId = proc.submission_id?._id || proc.submission_id;
          return (
            <Card key={proc._id} className="p-5 border border-[#252525] bg-[#050505]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-heading font-bold text-[#FFFFFF] text-base">{`${proc.submission_id?.event_name || 'EVENT'} ${proc.submission_id?.event_id ? `(${proc.submission_id.event_id})` : ''}`.trim()}</p>
                  <p className="text-[12px] text-[#00AEEF] font-bold mt-0.5">{proc.requested_by?.club_name || 'ASSOCIATION'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge status={proc.status || 'requested'} />
                  {proc.status === 'requested' && (
                    <Button variant="secondary" onClick={() => handleStatusUpdate(proc._id, 'approved')}>
                      APPROVE
                    </Button>
                  )}
                  {proc.status === 'approved' && (
                    <Button variant="secondary" onClick={() => handleStatusUpdate(proc._id, 'supplied')}>
                      MARK SUPPLIED
                    </Button>
                  )}
                  {eventId && (
                    <>
                      <Button variant="secondary" loading={pdfLoading === eventId} onClick={() => pdf(eventId, true)}>
                        PREVIEW PDF
                      </Button>
                      <Button variant="secondary" loading={pdfLoading === eventId} onClick={() => pdf(eventId, false)}>
                        DOWNLOAD PDF
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 divide-y divide-[#252525] bg-[#000000] border border-[#252525] p-3">
                {reqItems.length === 0 && <p className="text-[13px] text-[#A0A0A0]">Shortage logged during allocation.</p>}
                {reqItems.map((item) => (
                  <div key={item._id} className="py-2.5 flex justify-between text-[13px]">
                    <span className="text-[#FFFFFF] font-bold">{item.item_name || item.item_id?.item_name}</span>
                    <span className="font-mono text-[#FF4D67] font-bold">REQUIRED SHORTAGE: {item.requested_quantity ?? item.shortage_quantity ?? '—'}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

