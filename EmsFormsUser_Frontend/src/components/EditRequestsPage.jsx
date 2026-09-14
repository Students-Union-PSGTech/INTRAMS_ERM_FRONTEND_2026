import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';
import { userAPI } from '../api/api';
import { Edit, RefreshCcw, Send, Loader2, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';

function EditRequestsPage() {
  const [events, setEvents] = useState([]);
  const [editRequests, setEditRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedType, setSelectedType] = useState('Event');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [reason, setReason] = useState('');

  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [eventsRes, reqsRes] = await Promise.all([
        userAPI.getMyEvents(),
        userAPI.getMyEditRequests().catch(() => ({ data: { data: [] } }))
      ]);

      const eventList = eventsRes.data?.events || eventsRes.data || [];
      const validEvents = Array.isArray(eventList) ? eventList : [];
      setEvents(validEvents);

      const serverReqs = reqsRes.data?.data || reqsRes.data || [];
      const validServerReqs = Array.isArray(serverReqs) ? serverReqs : [];

      if (validServerReqs.length > 0) {
        setEditRequests(validServerReqs);
      } else {
        // Fallback filter from events if no edit request records exist yet
        const fallbackList = validEvents.filter(
          (e) => e.edit_req_status || e.status === 'edit_requested' || e.status === 'draft' || e.editReason
        ).map(ev => ({
          _id: ev._id,
          submission_id: ev,
          message: ev.editReason || ev.about || 'Edit access requested',
          status: ev.edit_req_status || (ev.status === 'draft' ? 'approved' : 'pending'),
          request_type: 'event_edit'
        }));
        setEditRequests(fallbackList);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch edit requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedEventId) {
      alert('Please select an event to request edit access.');
      return;
    }
    if (!reason.trim()) {
      alert('Please provide a reason for editing this event.');
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');
    setError('');
    try {
      const reqType = selectedType === 'Lab' ? 'lab_edit' : 'event_edit';
      await userAPI.requestEditAccess(selectedEventId, reason, reqType);
      setSuccessMsg('✅ Edit access request submitted successfully!');
      setReason('');
      setSelectedEventId('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit edit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserLayout showSidebar={true}>
      <div className="relative z-10 min-h-full font-sans text-white space-y-4 max-w-4xl w-full mx-auto">
        {/* Header Box */}
        <div className="p-4 bg-zinc-950 border border-zinc-800 text-white rounded-lg shadow-sm">
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight uppercase">
            EDIT REQUESTS
          </h1>
          <p className="text-zinc-400 text-xs mt-0.5">
            View submitted edit requests and submit new ones
          </p>
        </div>

        {/* ALL SUBMITTED EDIT REQUESTS */}
        <div className="p-4 sm:p-5 bg-zinc-950 border border-zinc-800 text-white rounded-lg shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <h2 className="text-xs font-semibold text-white tracking-wider uppercase">
              ALL SUBMITTED EDIT REQUESTS ({editRequests.length})
            </h2>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded text-xs font-medium uppercase transition-all disabled:opacity-50"
            >
              <span>REFRESH</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
            </div>
          ) : editRequests.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-zinc-800 rounded bg-zinc-900/40">
              <p className="text-zinc-400 text-xs font-medium">No edit requests submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {editRequests.map((reqItem) => {
                const ev = reqItem.submission_id && typeof reqItem.submission_id === 'object' ? reqItem.submission_id : reqItem;
                const status = reqItem.status || ev.edit_req_status || (ev.status === 'draft' ? 'approved' : 'pending');
                const isApproved = status === 'approved' || ev.status === 'draft';
                const isPending = status === 'pending' || status === 'requested' || ev.status === 'edit_requested';
                const isLabReq = reqItem.request_type === 'lab_edit';

                return (
                  <div
                    key={reqItem._id || ev._id}
                    className="p-3 bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase border ${
                          isLabReq ? 'bg-purple-950 border-purple-500/30 text-purple-400' : 'bg-sky-950 border-sky-500/30 text-sky-400'
                        }`}>
                          {isLabReq ? 'LAB FORM' : 'EVENT'}
                        </span>
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-bold uppercase">
                            <CheckCircle2 className="w-3 h-3" /> APPROVED
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-950 border border-amber-500/30 text-amber-400 font-bold uppercase">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-rose-950 border border-rose-500/30 text-rose-400 font-bold uppercase">
                            <XCircle className="w-3 h-3" /> REJECTED
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-semibold text-white">{ev.event_name || ev.name || 'Untitled Event'}</h3>

                      <div className="text-[11px] text-zinc-400">
                        <span className="font-semibold text-zinc-300 uppercase">REASON: </span>
                        <span>{reqItem.message || ev.editReason || ev.about || 'Date / logistics update'}</span>
                      </div>
                    </div>

                    <div>
                      {isApproved ? (
                        <button
                          onClick={() => navigate(`/update-event/${ev._id}`, { state: ev })}
                          className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-black rounded text-xs font-semibold uppercase transition-all flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          <span>EDIT</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-3 py-1.5 bg-zinc-900 text-zinc-500 border border-zinc-800 rounded text-xs font-medium uppercase cursor-not-allowed opacity-60"
                        >
                          LOCKED
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>


        {/* SUBMIT NEW EDIT REQUEST */}

        <div className="p-4 sm:p-5 bg-zinc-950 border border-zinc-800 text-white rounded-lg shadow-sm space-y-3">
          <h2 className="text-xs font-semibold text-white tracking-wider uppercase border-b border-zinc-800 pb-2.5">
            SUBMIT NEW EDIT REQUEST
          </h2>

          {successMsg && (
            <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmitRequest} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                SELECT TYPE *
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded text-white text-xs outline-none focus:border-sky-500 font-medium"
              >
                <option value="Event">Event</option>
                <option value="Lab">Lab Confirmation Form</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                SELECT EVENT *
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded text-white text-xs outline-none focus:border-sky-500 font-medium"
              >
                <option value="">-- Select an event --</option>
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.name} ({ev.event_id || 'ID N/A'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                REASON FOR EDITING *
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a detailed reason for editing this event..."
                className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded text-white text-xs outline-none focus:border-sky-500 placeholder-zinc-500"
              />
              <p className="text-[10px] text-zinc-500 mt-0.5">This reason will be logged for audit purposes</p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-4 bg-white hover:bg-zinc-200 text-black font-semibold text-xs uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>SUBMIT EDIT REQUEST</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setReason('');
                  setSelectedEventId('');
                }}
                className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-medium text-xs uppercase tracking-wider rounded transition-all"
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      </div>
    </UserLayout>
  );
}

export default EditRequestsPage;
