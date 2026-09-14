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
        <div className="relative z-10 p-5 sm:p-6 bg-zinc-950 border border-zinc-800 text-white rounded-none shadow-md w-full">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight uppercase">
            DASHBOARD
          </h1>
          <p className="text-zinc-400 text-xs font-medium mt-1">
            Centralized Event Management & Control Center
          </p>
        </div>

        {/* YOUR EVENTS Card */}
        <div className="relative z-10 p-5 sm:p-6 bg-zinc-950 border border-zinc-800 text-white rounded-none shadow-md space-y-4 w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-white tracking-wider uppercase">
              YOUR EVENTS
            </h2>
            <button
              onClick={fetchMyEvents}
              disabled={loading}
              className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold tracking-wider uppercase rounded-none transition-all disabled:opacity-50"
            >
              <span>REFRESH</span>
            </button>
          </div>

          <div className="border-b border-zinc-800 w-full my-2" />

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-zinc-800 rounded-none bg-zinc-900/40">
              <p className="text-zinc-400 text-xs font-medium mb-3">No event proposals submitted yet for {user?.username}.</p>
              <button
                onClick={() => navigate('/create-event')}
                className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-bold rounded-none text-xs uppercase transition-all"
              >
                Create First Proposal
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => (
                <div
                  key={ev._id}
                  className="p-4 bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-none"
                >
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-xs font-bold text-white truncate">
                      {ev.name || 'Untitled Event'}
                    </h3>
                    {ev.tagline && <p className="text-zinc-400 text-[11px] font-medium truncate">{ev.tagline}</p>}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/event/${ev._id}`, { state: ev })}
                      className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold tracking-wider uppercase rounded-none transition-all"
                    >
                      VIEW
                    </button>

                    <button
                      onClick={() => handleDownloadPDF(ev._id, ev.name)}
                      disabled={downloadingId === ev._id}
                      className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold tracking-wider uppercase rounded-none transition-all disabled:opacity-50"
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
