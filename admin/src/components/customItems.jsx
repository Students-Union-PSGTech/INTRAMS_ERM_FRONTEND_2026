import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PackagePlus,
  CheckCircle,
  XCircle,
  Clock,
  Boxes,
  Building2,
  Calendar,
  Search,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
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

export default function CustomItems() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const fetchCustomItems = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminAPI.getCustomItems();
      const raw = res?.data?.data ?? [];
      setItems(Array.isArray(raw) ? raw : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load custom item requests.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomItems();
  }, []);

  const handleDecision = async (itemId, itemName, decision) => {
    const isApprove = decision === 'approved';
    const actionText = isApprove ? 'APPROVE' : 'REJECT';
    if (!window.confirm(`Are you sure you want to ${actionText} custom item "${itemName}"?`)) {
      return;
    }

    try {
      setUpdatingId(itemId);
      await adminAPI.updateCustomItemStatus(itemId, decision);
      showToast(`Custom item "${itemName}" has been ${decision}.`, 'success');
      await fetchCustomItems();
    } catch (err) {
      showToast(getApiErrorMessage(err, `Unable to ${decision} this item.`), 'error');
    } finally {
      setUpdatingId('');
    }
  };

  // Stats Counters
  const counts = useMemo(() => {
    const total = items.length;
    const pending = items.filter(i => (i.custom_status || 'pending').toLowerCase() === 'pending').length;
    const approved = items.filter(i => (i.custom_status || '').toLowerCase() === 'approved').length;
    const rejected = items.filter(i => (i.custom_status || '').toLowerCase() === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [items]);

  // Filter & Search
  const filtered = useMemo(() => {
    return items.filter((item) => {
      const status = (item.custom_status || 'pending').toLowerCase();
      if (filter !== 'all' && status !== filter) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const name = (item.item_name || '').toLowerCase();
      const club = (item.club?.club_name || item.club?.username || '').toLowerCase();
      const eventName = (item.event?.event_name || item.event?.event_id || '').toLowerCase();
      const notes = (item.notes || '').toLowerCase();
      return name.includes(q) || club.includes(q) || eventName.includes(q) || notes.includes(q);
    });
  }, [items, filter, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="CUSTOM ITEM REQUESTS"
        subtitle="Review, approve, or reject non-catalog custom items requested by clubs in event proposals"
        actions={
          <Button variant="secondary" onClick={fetchCustomItems}>
            REFRESH
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border border-[#252525] bg-[#050505] p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#A0A0A0]">TOTAL REQUESTS</div>
            <div className="text-2xl font-bold text-[#FFFFFF] mt-1">{counts.total}</div>
          </div>
          <Boxes className="w-6 h-6 text-[#A0A0A0]" />
        </div>

        <div className="border border-[#252525] bg-[#050505] p-4 flex items-center justify-between border-l-4 border-l-[#FFC107]">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#FFC107]">PENDING APPROVAL</div>
            <div className="text-2xl font-bold text-[#FFC107] mt-1">{counts.pending}</div>
          </div>
          <Clock className="w-6 h-6 text-[#FFC107]" />
        </div>

        <div className="border border-[#252525] bg-[#050505] p-4 flex items-center justify-between border-l-4 border-l-[#00D084]">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#00D084]">APPROVED</div>
            <div className="text-2xl font-bold text-[#00D084] mt-1">{counts.approved}</div>
          </div>
          <CheckCircle className="w-6 h-6 text-[#00D084]" />
        </div>

        <div className="border border-[#252525] bg-[#050505] p-4 flex items-center justify-between border-l-4 border-l-[#FF4D67]">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#FF4D67]">REJECTED</div>
            <div className="text-2xl font-bold text-[#FF4D67] mt-1">{counts.rejected}</div>
          </div>
          <XCircle className="w-6 h-6 text-[#FF4D67]" />
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'pending', label: `PENDING (${counts.pending})` },
            { key: 'approved', label: `APPROVED (${counts.approved})` },
            { key: 'rejected', label: `REJECTED (${counts.rejected})` },
            { key: 'all', label: `ALL (${counts.total})` }
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? 'primary' : 'secondary'}
              onClick={() => setFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0A0]" />
          <input
            type="text"
            placeholder="SEARCH ITEMS, CLUBS, EVENTS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#050505] border border-[#252525] focus:border-[#00AEEF] text-[#FFFFFF] text-[12px] font-bold pl-9 pr-3 py-2 outline-none uppercase placeholder:text-[#666666] tracking-wider"
          />
        </div>
      </div>

      {loading && <TableSkeleton />}

      {error && (
        <div className="p-3 bg-[#050505] border border-[#FF4D67]/40 text-[#FF4D67] text-[13px] font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <Card className="overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState
              icon={PackagePlus}
              title="NO CUSTOM ITEM REQUESTS"
              message={
                filter === 'pending'
                  ? 'No pending custom item requests waiting for admin decision.'
                  : `No custom item requests found for the selected "${filter.toUpperCase()}" filter.`
              }
            />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>ITEM NAME</Th>
                  <Th>CLUB / ASSOCIATION</Th>
                  <Th>EVENT</Th>
                  <Th>QTY</Th>
                  <Th>EST. UNIT / TOTAL</Th>
                  <Th>REASON / NOTES</Th>
                  <Th>STATUS</Th>
                  <Th className="text-right">ACTIONS</Th>
                </tr>
              </THead>
              <tbody>
                {filtered.map((item) => {
                  const status = (item.custom_status || 'pending').toLowerCase();
                  const eventObj = item.event || {};
                  const eventId = eventObj._id;
                  const unitPrice = Number(item.price_per_unit || 0);
                  const totalPrice = Number(item.total_price || (unitPrice * item.requested_quantity * 1.18));

                  return (
                    <Tr key={item._id}>
                      {/* Item Name */}
                      <Td>
                        <div className="font-bold text-[#FFFFFF] text-[13px] uppercase tracking-wide">
                          {item.item_name}
                        </div>
                        <div className="text-[10px] text-[#A0A0A0] font-mono mt-0.5">
                          ID: {String(item._id).slice(-6).toUpperCase()}
                        </div>
                      </Td>

                      {/* Club */}
                      <Td>
                        <div className="flex items-center gap-1.5 font-bold text-[#E5E5E5] text-[12px]">
                          <Building2 className="w-3.5 h-3.5 text-[#00AEEF] flex-shrink-0" />
                          <span>{item.club?.club_name || item.club?.username || '—'}</span>
                        </div>
                        {item.club?.email && (
                          <div className="text-[10px] text-[#A0A0A0] truncate max-w-[160px]">
                            {item.club.email}
                          </div>
                        )}
                      </Td>

                      {/* Event */}
                      <Td>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#FFFFFF] text-[12px] truncate max-w-[150px]">
                            {eventObj.event_name || 'Event Proposal'}
                          </span>
                        </div>
                        {eventObj.event_id && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded-none bg-[#0a192f] border border-[#00AEEF]/40 text-[#00AEEF] text-[9px] font-mono font-bold">
                            {eventObj.event_id}
                          </span>
                        )}
                      </Td>

                      {/* Quantity */}
                      <Td className="text-center font-mono font-bold text-[#FFFFFF] text-[13px]">
                        {item.requested_quantity || 1}
                      </Td>

                      {/* Estimated Price */}
                      <Td>
                        <div className="text-[12px] font-bold text-[#FFFFFF]">
                          ₹{unitPrice.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-[#A0A0A0] font-mono">
                          Tot: ₹{totalPrice.toFixed(2)}
                        </div>
                      </Td>

                      {/* Reason / Notes */}
                      <Td className="max-w-[180px]">
                        <span className="text-[11px] text-[#A0A0A0] italic line-clamp-2">
                          {item.notes || item.admin_notes || '—'}
                        </span>
                      </Td>

                      {/* Status */}
                      <Td>
                        <Badge status={status} />
                      </Td>

                      {/* Actions */}
                      <Td>
                        <div className="flex items-center justify-end gap-2">
                          {status === 'pending' ? (
                            <>
                              <Button
                                variant="success"
                                loading={updatingId === item._id}
                                onClick={() => handleDecision(item._id, item.item_name, 'approved')}
                              >
                                APPROVE
                              </Button>
                              <Button
                                variant="danger"
                                loading={updatingId === item._id}
                                onClick={() => handleDecision(item._id, item.item_name, 'rejected')}
                              >
                                REJECT
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              {status === 'approved' ? (
                                <Button
                                  variant="danger"
                                  loading={updatingId === item._id}
                                  onClick={() => handleDecision(item._id, item.item_name, 'rejected')}
                                >
                                  REVERT / REJECT
                                </Button>
                              ) : (
                                <Button
                                  variant="success"
                                  loading={updatingId === item._id}
                                  onClick={() => handleDecision(item._id, item.item_name, 'approved')}
                                >
                                  RE-APPROVE
                                </Button>
                              )}
                            </div>
                          )}

                          {eventId && (
                            <Button
                              variant="secondary"
                              onClick={() => navigate(`/events/${eventId}`)}
                              title="View Event Proposal"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
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
