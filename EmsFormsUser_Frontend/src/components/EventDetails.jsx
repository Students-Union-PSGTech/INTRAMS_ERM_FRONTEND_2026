import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import UserLayout from './UserLayout';
import AnnexureUploadModal from './AnnexureUploadModal';
import { userAPI } from '../api/api';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Layers, Package, Tag, Paperclip, Loader2 } from 'lucide-react';

function EventDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [event, setEvent] = useState(location.state || null);
  const [fetching, setFetching] = useState(!location.state);
  const [showAnnexureModal, setShowAnnexureModal] = useState(false);

  useEffect(() => {
    if (!event && id) {
      setFetching(true);
      userAPI.getEventById(id)
        .then(res => {
          const data = res.data?.data || res.data;
          if (data) {
            setEvent(data);
          }
        })
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [id, event]);

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
          <p className="text-slate-300 font-medium">Loading proposal details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="glass-card rounded-3xl p-8 max-w-md text-center border border-sky-500/20">
          <p className="text-slate-300 font-medium mb-4">No proposal data found.</p>
          <button
            onClick={() => navigate('/view-events')}
            className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-sky-500/20"
          >
            Back to Proposals
          </button>
        </div>
      </div>
    );
  }

  return (
    <UserLayout showSidebar={true}>
      <div className="max-w-5xl w-full mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-sky-200 rounded-xl text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to List
          </button>
          <button
            onClick={() => setShowAnnexureModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-sky-500/20 transition-all"
          >
            <Paperclip className="w-4 h-4" /> Supporting Annexures
          </button>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-sky-500/20">
          <div className="border-b border-slate-800 pb-6 mb-6">
            <span className="text-xs px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-400 font-mono font-bold border border-cyan-500/30 uppercase tracking-wider">
              {event.event_id || 'ID N/A'}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 font-heading">{event.name}</h1>
            {event.tagline && <p className="text-lg text-sky-300/80 font-medium mt-1">{event.tagline}</p>}
            <p className="text-slate-300 mt-4 leading-relaxed text-sm sm:text-base">{event.about}</p>
          </div>

          {/* Form Specifications */}
          {event.form && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-heading">
                <Calendar className="w-5 h-5 text-sky-400" />
                Schedule & Venue Specifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800 text-sm text-slate-300">
                {event.form.is_two_day ? (
                  <>
                    <div><span className="font-semibold text-slate-400">Day 1 Slot:</span> {event.form.day1_slot || 'N/A'}</div>
                    <div><span className="font-semibold text-slate-400">Day 2 Slot:</span> {event.form.day2_slot || 'N/A'}</div>
                  </>
                ) : (
                  <>
                    <div><span className="font-semibold text-slate-400">Event Day:</span> {event.form.day || 'N/A'}</div>
                    <div><span className="font-semibold text-slate-400">Slot:</span> {event.form.slot || 'N/A'}</div>
                  </>
                )}
                <div><span className="font-semibold text-slate-400">Duration:</span> {event.form.duration || 'N/A'}</div>
                <div><span className="font-semibold text-slate-400">Participant Type:</span> {event.form.participant_type || 'N/A'}</div>
                <div><span className="font-semibold text-slate-400">Team Size:</span> {event.form.team_min || 1} - {event.form.team_max || 1}</div>
                <div><span className="font-semibold text-slate-400">Preferred Halls:</span> {event.form.preferred_halls || 'N/A'}</div>
              </div>
            </div>
          )}

          {/* Personnel Details */}
          {event.contacts && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-heading">
                <Users className="w-5 h-5 text-sky-400" />
                Personnel Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Secretaries */}
                {((event.contacts.secretaries && event.contacts.secretaries.length > 0) ? event.contacts.secretaries : (event.contacts.secretary ? [event.contacts.secretary] : []))
                  .filter(s => s?.name)
                  .map((sec, idx) => (
                    <div key={`sec-${idx}`} className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 text-sm text-slate-300">
                      <span className="font-bold text-sky-400 block mb-2 uppercase tracking-wider">Secretary {idx + 1}</span>
                      <div><span className="text-slate-400">Name:</span> {sec.name}</div>
                      <div><span className="text-slate-400">Roll No:</span> {sec.roll_number || 'N/A'}</div>
                      <div><span className="text-slate-400">Mobile:</span> {sec.mobile || 'N/A'}</div>
                      {sec.department && <div><span className="text-slate-400">Dept:</span> {sec.department}</div>}
                    </div>
                ))}

                {/* Convenors */}
                {((event.contacts.convenors && event.contacts.convenors.length > 0) ? event.contacts.convenors : [])
                  .filter(c => c?.name)
                  .map((conv, idx) => (
                    <div key={`conv-${idx}`} className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 text-sm text-slate-300">
                      <span className="font-bold text-sky-400 block mb-2 uppercase tracking-wider">Convenor {idx + 1}</span>
                      <div><span className="text-slate-400">Name:</span> {conv.name}</div>
                      <div><span className="text-slate-400">Roll No:</span> {conv.roll_number || 'N/A'}</div>
                      <div><span className="text-slate-400">Mobile:</span> {conv.mobile || 'N/A'}</div>
                    </div>
                ))}

                {/* Faculty Advisor */}
                {event.contacts.faculty_advisor?.name && (
                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 text-sm text-slate-300">
                    <span className="font-bold text-sky-400 block mb-2 uppercase tracking-wider">Faculty Advisor</span>
                    <div><span className="text-slate-400">Name:</span> {event.contacts.faculty_advisor.name}</div>
                    <div><span className="text-slate-400">Designation:</span> {event.contacts.faculty_advisor.designation || 'N/A'}</div>
                    <div><span className="text-slate-400">Contact:</span> {event.contacts.faculty_advisor.mobile || 'N/A'}</div>
                  </div>
                )}
                
                {/* Judge */}
                {event.contacts.judge?.name && (
                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 text-sm text-slate-300">
                    <span className="font-bold text-sky-400 block mb-2 uppercase tracking-wider">Judge</span>
                    <div><span className="text-slate-400">Name:</span> {event.contacts.judge.name}</div>
                    <div><span className="text-slate-400">Designation:</span> {event.contacts.judge.designation || 'N/A'}</div>
                    <div><span className="text-slate-400">Contact:</span> {event.contacts.judge.mobile || 'N/A'}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rounds */}
          {Array.isArray(event.rounds) && event.rounds.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-heading">
                <Layers className="w-5 h-5 text-sky-400" />
                Rounds & Rules
              </h3>
              <div className="space-y-4">
                {event.rounds.map((round, idx) => (
                  <div key={idx} className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-white text-base">{round.name || `Round ${idx + 1}`}</h4>
                    <p className="text-slate-300 text-sm mt-1">{round.description}</p>
                    {Array.isArray(round.rules) && round.rules.length > 0 && (
                      <div className="mt-3">
                        <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Rules:</span>
                        <ul className="list-disc list-inside text-sm text-slate-300 mt-1 space-y-1">
                          {round.rules.map((rule, rIdx) => (
                            <li key={rIdx}>{rule}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {round.has_tie_breaker && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <h5 className="font-bold text-sky-400 text-sm mb-2 uppercase tracking-wider">
                          Tie-Breaker: {round.tie_breaker_name || 'Sudden Death'}
                        </h5>
                        {round.tie_breaker_participants ? (
                          <p className="text-xs text-slate-400 mb-2">Participants: <span className="text-white font-semibold">{round.tie_breaker_participants}</span></p>
                        ) : null}
                        {round.tie_breaker_description && (
                          <p className="text-slate-300 text-sm mb-3">{round.tie_breaker_description}</p>
                        )}
                        {Array.isArray(round.tie_breaker_rules) && round.tie_breaker_rules.length > 0 && (
                          <div>
                            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">Tie-Breaker Rules:</span>
                            <ul className="list-disc list-inside text-sm text-slate-300 mt-1 space-y-1">
                              {round.tie_breaker_rules.map((rule, rIdx) => (
                                <li key={rIdx}>{rule}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          {Array.isArray(event.items) && event.items.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-heading">
                <Package className="w-5 h-5 text-sky-400" />
                Requested Items / Equipment
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300 bg-slate-950/60 rounded-2xl overflow-hidden border border-slate-800">
                  <thead className="bg-slate-900 text-sky-300 font-semibold font-mono text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Item Name</th>
                      <th className="p-3.5">Quantity</th>
                      <th className="p-3.5">Price / Unit</th>
                      <th className="p-3.5">Total (inc. 18% Tax)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {event.items.map((item, iIdx) => (
                      <tr key={iIdx}>
                        <td className="p-3.5 font-medium text-white">{item.item_name}</td>
                        <td className="p-3.5">{item.quantity}</td>
                        <td className="p-3.5">₹{item.price_per_unit || 0}</td>
                        <td className="p-3.5 font-bold text-sky-400">
                          ₹{((item.quantity || 0) * (item.price_per_unit || 0) * 1.18).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {showAnnexureModal && (
          <AnnexureUploadModal
            eventId={event._id || event.id}
            eventName={event.name || event.event_name}
            onClose={() => setShowAnnexureModal(false)}
          />
        )}
      </div>
    </UserLayout>
  );
}

export default EventDetails;
