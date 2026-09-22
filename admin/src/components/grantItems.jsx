import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { adminAPI } from '../api';
import { getApiErrorMessage } from '../utils/apiError';
import PageHeader from './ui/PageHeader';
import Input from './ui/Input';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Badge from './ui/Badge';
import EmptyState from './ui/EmptyState';
import { TableSkeleton } from './ui/LoadingState';

import Card from './ui/Card';

export default function GrantItems() {
  const navigate = useNavigate();
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminAPI.getAssociations();
        setAssociations(res.data?.data || []);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Unable to load associations.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openAssociation = async (assoc) => {
    setSelected(assoc);
    setEvents([]);
    try {
      setEventsLoading(true);
      const res = await adminAPI.getEventsByAssociation(assoc._id);
      setEvents(res.data?.data || []);
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const filtered = associations.filter((assoc) => {
    const term = searchTerm.toLowerCase();
    return (
      (assoc.club_name || assoc.association_name || '').toLowerCase().includes(term) ||
      (assoc.username || '').toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <PageHeader
        title="GRANT ALLOCATION DIRECTORY"
        subtitle="Select a club association, choose an ERM proposal, and allocate SU inventory stock"
      />
      <div className="max-w-md mb-5">
        <Input placeholder="SEARCH ASSOCIATIONS..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      {loading && <TableSkeleton />}
      {error && <p className="text-[#FF4D67] text-[13px] font-bold border border-[#FF4D67]/40 bg-[#050505] p-3 mb-4">{error}</p>}
      {!loading && filtered.length === 0 && (
        <EmptyState icon={Gift} title="NO ASSOCIATIONS FOUND" message="Create club associations before allocating inventory." />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((assoc) => (
          <Card
            key={assoc._id}
            as="button"
            type="button"
            onClick={() => openAssociation(assoc)}
            className="text-left p-5 cursor-pointer hover:border-[#00AEEF] transition-all"
          >
            <p className="font-heading font-bold text-[#FFFFFF] text-base">{assoc.club_name || assoc.association_name}</p>
            <p className="text-[12px] text-[#00AEEF] font-mono font-bold mt-1">@{assoc.username}</p>
          </Card>
        ))}
      </div>

      <Modal
        open={Boolean(selected)}
        title={(selected?.club_name || 'PROPOSED EVENTS').toUpperCase()}
        onClose={() => setSelected(null)}
        wide
      >
        {eventsLoading && <TableSkeleton rows={4} />}
        {!eventsLoading && events.length === 0 && <EmptyState title="NO SUBMITTED ERM FORMS" />}
        <div className="space-y-3">
          {events.map((ev) => {
            const eventId = ev._id || ev.id;
            return (
              <div key={eventId} className="flex items-center justify-between gap-3 border border-[#252525] bg-[#000000] p-4">
                <div>
                  <p className="text-[#FFFFFF] text-[14px] font-bold">{`${ev.event_name || ev.name || 'UNTITLED'} ${ev.event_id ? `(${ev.event_id})` : ''}`.trim()}</p>
                  <div className="mt-1">
                    <Badge status={ev.status} />
                  </div>
                </div>
                <Button onClick={() => navigate(`/grant-allocation/${eventId}`)}>OPEN ALLOCATION</Button>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}

