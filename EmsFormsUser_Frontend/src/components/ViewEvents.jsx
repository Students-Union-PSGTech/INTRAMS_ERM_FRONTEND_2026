import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';
import EmptyState from './EmptyState';
import LoadingSkeleton from './LoadingSkeleton';
import { userAPI } from '../api/api';
import { PlusCircle, Search, Edit, Eye, Lock, Loader2, AlertCircle } from 'lucide-react';

function ViewEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [requestingId, setRequestingId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await userAPI.getMyEvents();
      const data = response.data?.events || response.data || [];
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch event proposals');
    } finally {
      setLoading(false);
    }
  };

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editModalEvent, setEditModalEvent] = useState(null);
  const [editReason, setEditReason] = useState('');

  const openEditModal = (ev) => {
    setEditModalEvent(ev);
    setEditReason('');
  };

  const handleRequestEditAccess = async () => {
    if (!editModalEvent) return;
    setRequestingId(editModalEvent._id);
    try {
      await userAPI.requestEditAccess(editModalEvent._id, editReason || 'Requested edit access for proposal update');
      alert('✅ Edit access requested successfully! Admin will review your request.');
      setEditModalEvent(null);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request edit access.');
    } finally {
      setRequestingId(null);
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.event_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <UserLayout showSidebar={true}>
      <div className="relative z-10 min-h-full max-w-6xl w-full mx-auto space-y-6">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white font-heading">My Event Proposals</h1>
            <p className="text-sky-300/70 text-sm mt-1">Manage and track your submitted INTRAMS event proposals</p>
          </div>
          <button
            onClick={() => navigate('/create-event')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-sky-500/25 transition-all transform hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" /> Create Proposal
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search events by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 outline-none transition-all shadow-xl"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3.5 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none font-semibold text-sm shadow-xl"
          >
            <option value="ALL">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="edit_requested">Edit Requested</option>
          </select>
        </div>

        {loading ? (
          <LoadingSkeleton count={4} />
        ) : error ? (
          <div className="bg-rose-950/60 border border-rose-800 text-rose-300 rounded-3xl p-8 text-center backdrop-blur-xl">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-400" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            title="No Proposals Found"
            description="Create your association's event proposal to see it listed here."
            actionLabel="Create Event Proposal"
            onAction={() => navigate('/create-event')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.map((ev) => {
              const isEditable = ev.edit_req_status === 'approved' || ev.isEditable || ev.status === 'draft';
              return (
                <div key={ev._id} className="glass-card rounded-3xl p-6 shadow-2xl border border-sky-500/15 flex flex-col justify-between hover:border-sky-500/40 transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-white font-heading">{ev.name || 'Untitled Event'}</h3>
                      <span className="text-xs px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-400 font-mono font-bold border border-cyan-500/30 uppercase tracking-wider">
                        {ev.event_id || 'ID N/A'}
                      </span>
                    </div>
                    {ev.tagline && <p className="text-sky-300/80 text-sm font-medium mb-3">{ev.tagline}</p>}
                    <p className="text-slate-300 text-sm line-clamp-3 mb-4">{ev.about}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-2 items-center justify-between">
                    <button
                      onClick={() => navigate(`/event/${ev._id}`, { state: ev })}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-sky-200 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-4 h-4 text-sky-400" /> View Details
                    </button>

                    {isEditable ? (
                      <button
                        onClick={() => navigate(`/update-event/${ev._id}`, { state: ev })}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-500/20 transition-all"
                      >
                        <Edit className="w-4 h-4" /> Edit Event
                      </button>
                    ) : (
                      <button
                        onClick={() => openEditModal(ev)}
                        disabled={requestingId === ev._id || ev.edit_req_status === 'requested' || ev.status === 'edit_requested'}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl text-xs font-semibold hover:text-white transition-all disabled:opacity-50"
                      >
                        {requestingId === ev._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-500" />
                        )}
                        {ev.edit_req_status === 'requested' || ev.status === 'edit_requested' ? 'Request Pending' : 'Request Edit'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Request Reason Modal */}
        {editModalEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg">
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-[2rem] p-8 max-w-md w-full shadow-[0_0_40px_rgba(14,165,233,0.15)] space-y-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500"></div>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
                  <Edit className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-2xl font-extrabold text-white font-heading">Request Edit Access</h3>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">
                Provide a clear reason for unlocking <span className="text-white font-bold px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700">{editModalEvent.name}</span> for modifications.
              </p>

              <div className="relative group">
                <textarea
                  rows={4}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g., We need to update the estimated duration and add a new convenor to the list..."
                  className="w-full p-4 bg-slate-950/60 border border-slate-700 rounded-2xl text-white text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all resize-none placeholder-slate-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setEditModalEvent(null)}
                  className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-colors border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestEditAccess}
                  disabled={requestingId === editModalEvent._id || !editReason.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-95"
                >
                  {requestingId === editModalEvent._id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}

export default ViewEvents;
