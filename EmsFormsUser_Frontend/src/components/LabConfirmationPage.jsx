import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';
import { userAPI } from '../api/api';
import { generateLabPdf } from '../utils/generateLabPdf';
import { useAuth } from '../context/AuthContext';
import { RefreshCcw, Loader2, FileCheck, Building2, Calendar, Clock, UserCheck, Download } from 'lucide-react';

function LabConfirmationPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchLabConfirmations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userAPI.getMyEvents();
      const eventList = res.data?.events || res.data || [];
      const validEvents = Array.isArray(eventList) ? eventList : [];
      const labEvents = validEvents.filter(ev => {
        const halls = ev.form?.preferred_halls || ev.preferred_halls || '';
        if (!halls || typeof halls !== 'string') return false;
        const trimmed = halls.trim().toLowerCase();
        return (
          trimmed !== '' &&
          trimmed !== 'none' &&
          trimmed !== 'n/a' &&
          trimmed !== 'no' &&
          trimmed !== 'false' &&
          trimmed !== 'nil'
        );
      });
      setEvents(labEvents);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch lab confirmation forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabConfirmations();
  }, []);

  const handleDownloadPDF = async (eventId, eventName) => {
    setDownloadingId(eventId);
    try {
      let eventObj = events.find((e) => e._id === eventId || e.id === eventId);
      if (!eventObj) {
        try {
          const res = await userAPI.getEventById(eventId);
          eventObj = res.data?.data || res.data;
        } catch (_) {
          eventObj = null;
        }
      }
      let pdfBlob;
      try {
        pdfBlob = await generateLabPdf(eventObj || { name: eventName });
      } catch (_) {
        const res = await userAPI.getEventPDF(eventId);
        pdfBlob = new Blob([res.data], { type: 'application/pdf' });
      }

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LabConfirmation_${eventName || 'Event'}_DRAFT_ERM.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download lab confirmation form.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <UserLayout showSidebar={true}>
      <div className="relative z-10 min-h-full font-sans text-white space-y-4 max-w-4xl w-full mx-auto">
        {/* Header Box */}
        <div className="p-4 bg-zinc-950 border border-zinc-800 text-white rounded-lg shadow-sm">
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight uppercase">
            LAB CONFIRMATION FORMS
          </h1>
          <p className="text-zinc-400 text-xs mt-0.5">
            Manage and view all lab confirmation requests
          </p>
        </div>

        {/* YOUR LAB CONFIRMATIONS */}
        <div className="p-4 sm:p-5 bg-zinc-950 border border-zinc-800 text-white rounded-lg shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <h2 className="text-xs font-semibold text-white tracking-wider uppercase">
              YOUR LAB CONFIRMATIONS ({events.length})
            </h2>
            <button
              onClick={fetchLabConfirmations}
              disabled={loading}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded text-xs font-medium uppercase transition-all disabled:opacity-50"
            >
              <span>REFRESH</span>
            </button>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-zinc-800 rounded-none bg-zinc-900/40">
              <p className="text-zinc-400 text-xs font-medium" style={{ color: '#a1a1aa' }}>No lab confirmation requests submitted yet.</p>
              <p className="text-zinc-500 text-[11px] mt-1" style={{ color: '#71717a' }}>Only event proposals that request lab or hall allocations will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev) => {
                const formSpecs = ev.form || {};
                const convenors = ev.contacts?.convenors || [];
                const isApproved = formSpecs.lab_status === 'approved' || formSpecs.lab_status === 'confirmed' || ev.lab_status === 'approved' || ev.status === 'approved';

                return (
                  <div
                    key={ev._id}
                    className="p-5 bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-4 rounded-none shadow-md"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-200 font-mono font-bold uppercase tracking-widest border border-zinc-700" style={{ color: '#e4e4e7' }}>
                          LABCONFIRM
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 border font-mono font-bold uppercase tracking-wider ${
                          (formSpecs.lab_status === 'confirmed' || formSpecs.lab_status === 'approved')
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : formSpecs.lab_status === 'rejected'
                            ? 'bg-rose-950 text-rose-400 border-rose-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}>
                          {formSpecs.lab_status ? formSpecs.lab_status.toUpperCase() : 'PENDING'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white leading-tight uppercase tracking-tight" style={{ color: '#ffffff' }}>
                          {ev.name || ev.event_name || 'Untitled Event'}
                        </h3>
                        <p className="text-xs text-zinc-400 font-medium mt-1" style={{ color: '#a1a1aa' }}>
                          {user?.username ? `${user.username.toUpperCase()} • Students Union` : 'Students Union'}
                        </p>
                      </div>

                      <div className="text-xs text-zinc-300 space-y-2 pt-3 border-t border-zinc-800">
                        {formSpecs.preferred_halls && (
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-medium text-zinc-400 flex-shrink-0" style={{ color: '#a1a1aa' }}>Lab / Hall:</span>
                            <span className="font-mono font-bold text-white bg-zinc-800 px-2 py-0.5 border border-zinc-700 text-xs truncate max-w-[180px]" style={{ color: '#ffffff' }}>
                              {formSpecs.preferred_halls}
                            </span>
                          </div>
                        )}
                        {formSpecs.day && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-zinc-400" style={{ color: '#a1a1aa' }}>Day / Date:</span>
                            <span className="font-mono text-white" style={{ color: '#ffffff' }}>
                              {formSpecs.day}
                            </span>
                          </div>
                        )}
                        {formSpecs.slot && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-zinc-400" style={{ color: '#a1a1aa' }}>Session / Slot:</span>
                            <span className="font-mono text-white" style={{ color: '#ffffff' }}>
                              {formSpecs.slot}
                            </span>
                          </div>
                        )}
                        {formSpecs.duration && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-zinc-400" style={{ color: '#a1a1aa' }}>Duration:</span>
                            <span className="font-mono text-white" style={{ color: '#ffffff' }}>
                              {formSpecs.duration}
                            </span>
                          </div>
                        )}
                      </div>

                      {convenors.length > 0 && (
                        <div className="pt-2 border-t border-zinc-800">
                          <p className="text-[10px] font-semibold text-zinc-400 mb-1" style={{ color: '#a1a1aa' }}>Convenors:</p>
                          <div className="flex flex-wrap gap-1">
                            {convenors.map((c, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 bg-zinc-950 text-zinc-300 font-medium border border-zinc-800"
                                style={{ color: '#d4d4d8' }}
                              >
                                {c.name} {c.mobile ? `(${c.mobile})` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-zinc-400">
                        {isApproved ? 'Approved by Admin' : 'Awaiting Admin Approval'}
                      </span>
                      <button
                        onClick={() => handleDownloadPDF(ev._id, ev.name || ev.event_name)}
                        disabled={!isApproved || downloadingId === ev._id}
                        title={!isApproved ? 'PDF auto-generates after admin approval' : 'Download Lab Confirmation Form PDF'}
                        className={`px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                          isApproved
                            ? 'bg-white hover:bg-zinc-200 text-black cursor-pointer'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>
                          {downloadingId === ev._id
                            ? 'LOADING...'
                            : isApproved
                            ? 'DOWNLOAD PDF'
                            : 'AWAITING APPROVAL'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}

export default LabConfirmationPage;
