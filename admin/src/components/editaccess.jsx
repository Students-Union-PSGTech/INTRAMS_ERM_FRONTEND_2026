import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { adminAPI } from '../api';
import { getApiErrorMessage } from '../utils/apiError';
import { useToast } from '../context/ToastContext';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';
import EmptyState from './ui/EmptyState';
import { Table, THead, Th, Td, Tr } from './ui/Table';
import { TableSkeleton } from './ui/LoadingState';

export default function EditAccess() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [updating, setUpdating] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminAPI.getRequestedEvents();
      const raw = res?.data?.data ?? res?.data ?? [];
      setRequests(Array.isArray(raw) ? raw : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load edit requests.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const decide = async (id, decision) => {
    if (!window.confirm(`${decision === 'approve' ? 'Approve' : 'Reject'} this edit request?`)) return;
    try {
      setUpdating(id);
      await adminAPI.giveEditAccess(id, decision);
      showToast(`Request ${decision}d.`, 'success');
      await fetchRequests();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Unable to update this request.'), 'error');
    } finally {
      setUpdating('');
    }
  };

  const filtered = requests.filter((req) => {
    if (filter === 'all') return true;
    return String(req.status || 'pending').toLowerCase() === filter;
  });

  return (
    <div>
      <PageHeader
        title="CONVENOR EDIT ACCESS REQUESTS"
        subtitle="Approve or decline requests from convenors to reopen submitted ERM forms for edits"
        actions={
          <Button variant="secondary" onClick={fetchRequests}>
            REFRESH
          </Button>
        }
      />
      <div className="flex gap-2 mb-5">
        {['pending', 'approved', 'rejected', 'all'].map((s) => (
          <Button key={s} variant={filter === s ? 'primary' : 'secondary'} onClick={() => setFilter(s)}>
            {s.toUpperCase()}
          </Button>
        ))}
      </div>
      {loading && <TableSkeleton />}
      {error && <p className="text-[#FF4D67] text-[13px] font-bold border border-[#FF4D67]/40 bg-[#050505] p-3 mb-4">{error}</p>}
      {!loading && !error && (
        <Card className="overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="NO EDIT REQUESTS FOUND" message="Convenor edit requests will appear here after submission." />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>EVENT ID</Th>
                  <Th>EVENT</Th>
                  <Th>CLUB</Th>
                  <Th>REASON FOR EDIT</Th>
                  <Th>REQUEST DATE</Th>
                  <Th>STATUS</Th>
                  <Th></Th>
                </tr>
              </THead>
              <tbody>
                {filtered.map((req) => {
                  const status = String(req.status || 'pending').toLowerCase();
                  const eventId = req.submission_id?._id || req.submission_id;
                  return (
                    <Tr key={req._id}>
                      <Td className="font-mono text-[#00AEEF] font-bold">{req.submission_id?.event_id || '—'}</Td>
                      <Td className="text-[#FFFFFF] font-bold">{`${req.submission_id?.event_name || req.submission_id?.name || 'Event'}`.trim()}</Td>
                      <Td>{req.requested_by?.club_name || req.requested_by?.username || '—'}</Td>
                      <Td className="max-w-xs truncate">{req.message || req.reason || '—'}</Td>
                      <Td>{(req.created_at || req.createdAt) ? new Date(req.created_at || req.createdAt).toLocaleString('en-IN') : '—'}</Td>

                      <Td>
                        <Badge status={status} />
                      </Td>
                      <Td>
                        <div className="flex justify-end gap-2">
                          {status === 'pending' && (
                            <>
                              <Button variant="success" loading={updating === req._id} onClick={() => decide(req._id, 'approve')}>
                                APPROVE
                              </Button>
                              <Button variant="danger" loading={updating === req._id} onClick={() => decide(req._id, 'reject')}>
                                DECLINE
                              </Button>
                            </>
                          )}
                          {eventId && (
                            <Button variant="secondary" onClick={() => navigate(`/events/${eventId}`)}>
                              VIEW
                            </Button>
                          )}
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

