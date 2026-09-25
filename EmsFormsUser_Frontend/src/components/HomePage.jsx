import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';
import { userAPI } from '../api/api';
import { generateEventPdf } from '../utils/generateEventPdf';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

function HomePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchMyEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await userAPI.getMyEvents();
      const data = response.data?.events || response.data || [];
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load club events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
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
        pdfBlob = await generateEventPdf(eventObj || { name: eventName });
      } catch (_) {
        const res = await userAPI.getEventPDF(eventId);
        pdfBlob = new Blob([res.data], { type: 'application/pdf' });
      }

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${eventName || 'Event_Proposal'}_DRAFT_ERM.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download PDF proposal.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <UserLayout showSidebar={true}>
      <div className="relative z-10 min-h-full font-sans space-y-6 max-w-5xl mx-auto w-full">
        {/* Top Banner Box */}
        <div className="relative z-10 p-6 sm:p-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 text-white rounded-2xl shadow-2xl shadow-sky-500/5 w-full flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
              DASHBOARD
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
              Centralized Event Management &amp; Control Center
            </p>
          </div>
          <img
            src="/intrams_logo.png"
            alt="INTRAMS 2026"
            className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_0_15px_rgba(56,189,248,0.4)] flex-shrink-0"
          />
        </div>

        {/* YOUR EVENTS Card */}
        <div className="relative z-10 p-6 sm:p-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 text-white rounded-2xl shadow-2xl space-y-5 w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-white tracking-wider uppercase">
              YOUR EVENTS
            </h2>
            <button
              onClick={fetchMyEvents}
              disabled={loading}
              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-all disabled:opacity-50"
            >
              <span>REFRESH</span>
            </button>
          </div>

          <div className="border-b border-slate-800/80 w-full my-2" />

          {error && (
            <div className="p-4 bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs text-center font-medium rounded-xl">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-7 h-7 animate-spin text-sky-400" />
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
              <p className="text-slate-400 text-xs sm:text-sm font-medium mb-4">No event proposals submitted yet for {user?.username}.</p>
              <button
                onClick={() => navigate('/create-event')}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs uppercase shadow-lg shadow-sky-500/20 transition-all"
              >
                Create First Proposal
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => (
                <div
                  key={ev._id}
                  className="p-4 sm:p-5 bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800/80 hover:border-sky-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl transition-all shadow-md"
                >
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">
                      {ev.name || 'Untitled Event'}
                    </h3>
                    {ev.tagline && <p className="text-slate-400 text-xs font-medium truncate">{ev.tagline}</p>}
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/event/${ev._id}`, { state: ev })}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-all"
                    >
                      VIEW
                    </button>

                    <button
                      onClick={() => handleDownloadPDF(ev._id, ev.name)}
                      disabled={downloadingId === ev._id}
                      className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold tracking-wider uppercase rounded-xl shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                    >
                      {downloadingId === ev._id ? 'LOADING' : 'PDF'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}

export default HomePage;
