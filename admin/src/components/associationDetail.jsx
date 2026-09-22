import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { adminAPI } from '../api';
import { getApiErrorMessage } from '../utils/apiError';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';
import EmptyState from './ui/EmptyState';
import { Table, THead, Th, Td, Tr } from './ui/Table';
import { TableSkeleton } from './ui/LoadingState';

export default function AssociationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [association, setAssociation] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [assocRes, eventsRes] = await Promise.all([
          adminAPI.getAssociations(),
          adminAPI.getEventsByAssociation(id),
        ]);
        const clubs = assocRes.data?.data || assocRes.data?.associations || [];
        setAssociation(clubs.find((c) => c._id === id) || null);
        setEvents(eventsRes.data?.data || []);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Unable to load association details.'));
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) return <TableSkeleton />;

  const submittedCount = events.filter((ev) =>
    ['submitted', 'approved', 'under_review', 'edit_requested'].includes(String(ev.status || '').toLowerCase())
  ).length;

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/associations')} className="mb-4 px-0 border-none">
        ← BACK TO ASSOCIATIONS
      </Button>
      <PageHeader
        title={(association?.club_name || association?.name || 'ASSOCIATION').toUpperCase()}
        subtitle="ASSOCIATION INFORMATION, EVENTS AND SUBMITTED ERM FORMS"
      />
      {error && <p className="text-[#FF4D67] text-[13px] font-bold mb-4 border border-[#FF4D67]/40 bg-[#050505] p-3">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4 bg-[#050505] border border-[#252525]">
          <p className="text-[11px] uppercase font-bold text-[#A0A0A0]">USERNAME</p>
          <p className="text-[#00AEEF] mt-1 font-mono font-bold text-[13px]">@{association?.username || '—'}</p>
        </Card>
        <Card className="p-4 bg-[#050505] border border-[#252525]">
          <p className="text-[11px] uppercase font-bold text-[#A0A0A0]">EMAIL ADDRESS</p>
          <p className="text-[#FFFFFF] mt-1 text-[13px] truncate font-bold">{association?.email || '—'}</p>
        </Card>
        <Card className="p-4 bg-[#050505] border border-[#252525]">
          <p className="text-[11px] uppercase font-bold text-[#A0A0A0]">FACULTY ADVISOR</p>
          <p className="text-[#FFFFFF] mt-1 text-[13px] font-bold">{association?.faculty_advisor || '—'}</p>
        </Card>
        <Card className="p-4 bg-[#050505] border border-[#252525]">
          <p className="text-[11px] uppercase font-bold text-[#A0A0A0]">ACCOUNT STATUS</p>
          <div className="mt-1">
            <Badge status={association?.is_active === false ? 'rejected' : 'active'}>
              {association?.is_active === false ? 'INACTIVE' : 'ACTIVE'}
            </Badge>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-[#252525] bg-[#000000] flex justify-between items-center">
          <h2 className="font-heading font-bold text-sm text-[#FFFFFF] uppercase tracking-wider">PROPOSED EVENTS ({events.length})</h2>
          <span className="text-[11px] font-bold text-[#00AEEF] uppercase">{submittedCount} SUBMITTED</span>
        </div>
        {events.length === 0 ? (
          <EmptyState icon={Calendar} title="NO EVENTS FOUND" message="This association has not submitted ERM forms yet." />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>EVENT NAME</Th>
                <Th>EVENT ID</Th>
                <Th>ERM STATUS</Th>
                <Th numeric>REQUESTED ITEMS</Th>
                <Th></Th>
              </tr>
            </THead>
            <tbody>
              {events.map((ev) => {
                const eventId = ev._id || ev.id;
                const submitted = ['submitted', 'approved', 'under_review', 'edit_requested'].includes(
                  String(ev.status || '').toLowerCase()
                );
                return (
                  <Tr key={eventId}>
                    <Td className="text-[#FFFFFF] font-bold">{`${ev.event_name || ev.name || 'UNTITLED'} ${ev.event_id ? `(${ev.event_id})` : ''}`.trim()}</Td>
                    <Td className="font-mono text-[#A0A0A0]">{ev.event_id || '—'}</Td>
                    <Td>
                      <Badge status={ev.status} />
                    </Td>
                    <Td numeric>{Array.isArray(ev.items) ? ev.items.length : 0}</Td>
                    <Td>
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => navigate(`/events/${eventId}`)}>
                          DETAILS
                        </Button>
                        {submitted && (
                          <Button onClick={() => navigate(`/grant-allocation/${eventId}`)}>ALLOCATE</Button>
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
    </div>
  );
}

