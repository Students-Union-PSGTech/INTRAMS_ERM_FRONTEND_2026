import React, { useEffect, useState } from 'react';
import { FlaskConical, Download } from 'lucide-react';
import { adminAPI } from '../api';
import { getApiErrorMessage } from '../utils/apiError';
import { useToast } from '../context/ToastContext';
import { generateLabPdf } from '../utils/generateLabPdf';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import Badge from './ui/Badge';
import EmptyState from './ui/EmptyState';
import { Table, THead, Th, Td, Tr } from './ui/Table';
import { TableSkeleton } from './ui/LoadingState';

export default function LabConfirmation() {
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState('');
  const [downloadingId, setDownloadingId] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminAPI.getEvents();
      setEvents(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load lab confirmation data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDownloadPDF = async (eventObj) => {
    try {
      setDownloadingId(eventObj._id || eventObj.id);
      const pdfBlob = await generateLabPdf(eventObj);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LabConfirmation_${eventObj.name || eventObj.event_name || 'Event'}${eventObj.event_id ? `_${eventObj.event_id}` : ''}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Lab Confirmation PDF downloaded successfully.', 'success');
    } catch (err) {
      showToast('Failed to generate Lab Confirmation PDF.', 'error');
    } finally {
      setDownloadingId('');
    }
  };

  const updateStatus = async (eventId, lab_status) => {
    try {
      setUpdating(eventId);
      await adminAPI.updateLabStatus(eventId, { lab_status });
      showToast(`Lab status set to ${lab_status}.`, 'success');
      await fetchEvents();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Unable to update lab status.'), 'error');
    } finally {
      setUpdating('');
    }
  };

  const filtered = events.filter((event) => {
    const halls = event.form?.preferred_halls || event.preferred_halls || '';
    const hallsStr = Array.isArray(halls) ? halls.join(', ') : String(halls);
    const term = searchTerm.toLowerCase();
    return (
      (event.name || event.event_name || '').toLowerCase().includes(term) ||
      (event.club_name || '').toLowerCase().includes(term) ||
      hallsStr.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <PageHeader
        title="LAB & VENUE CONFIRMATIONS"
        subtitle="Review preferred event venues, computer labs, and confirm or reject hall allocations"
        actions={
          <Button variant="secondary" onClick={fetchEvents}>
            REFRESH
          </Button>
        }
      />
      <div className="max-w-md mb-5">
        <Input placeholder="SEARCH EVENT, ASSOCIATION OR VENUE..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      {loading && <TableSkeleton />}
      {error && <p className="text-[#FF4D67] text-[13px] font-bold border border-[#FF4D67]/40 bg-[#050505] p-3 mb-4">{error}</p>}
      {!loading && !error && (
        <Card className="overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={FlaskConical} title="NO LAB VENUE RECORDS" message="Events requesting specific computer labs or halls will appear here." />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>EVENT</Th>
                  <Th>ASSOCIATION</Th>
                  <Th>PREFERRED VENUE / LAB</Th>
                  <Th>LAB STATUS</Th>
                  <Th></Th>
                </tr>
              </THead>
              <tbody>
                {filtered.map((event) => {
                  const labStatus = event.form?.lab_status || event.lab_status || 'pending';
                  const halls = event.form?.preferred_halls || event.preferred_halls || 'Not specified';
                  return (
                    <Tr key={event._id}>
                      <Td className="text-[#FFFFFF] font-bold">{`${event.name || event.event_name || 'UNTITLED'} ${event.event_id ? `(${event.event_id})` : ''}`.trim()}</Td>
                      <Td>{event.club_name || '—'}</Td>
                      <Td className="text-[#00AEEF] font-bold">{Array.isArray(halls) ? halls.join(', ') : halls}</Td>
                      <Td>
                        <Badge status={labStatus} />
                      </Td>
                      <Td>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            loading={downloadingId === event._id}
                            onClick={() => handleDownloadPDF(event)}
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            PDF
                          </Button>
                          <Button
                            variant="success"
                            loading={updating === event._id}
                            disabled={labStatus === 'approved' || labStatus === 'confirmed'}
                            onClick={() => updateStatus(event._id, 'approved')}
                          >
                            CONFIRM
                          </Button>
                          <Button
                            variant="danger"
                            loading={updating === event._id}
                            disabled={labStatus === 'rejected'}
                            onClick={() => updateStatus(event._id, 'rejected')}
                          >
                            REJECT
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}

