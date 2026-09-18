import React from 'react';
import { Calendar, Layers, Package, Building2, Cpu, Wrench, Users } from 'lucide-react';

function EventPreview({ formData }) {
  const form = formData?.form || {};

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6 text-slate-100">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-white font-heading">{formData.name || 'Untitled Event'}</h2>
        {formData.tagline && <p className="text-sky-300/80 font-medium text-sm mt-1">{formData.tagline}</p>}
        <p className="text-slate-300 text-sm mt-3">{formData.about}</p>
      </div>

      {formData.form && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2 font-heading">
            <Calendar className="w-4 h-4 text-sky-400" />
            Schedule, Venue &amp; Resource Specifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-950/70 p-4 rounded-2xl text-xs text-slate-300 border border-slate-800">
            <div><span className="font-semibold text-slate-400">Event Duration:</span> {form.is_two_day ? '2 Days' : '1 Day'}</div>
            {form.is_two_day ? (
              <>
                <div><span className="font-semibold text-slate-400">Day 1 Slot:</span> {form.day1_slot || 'N/A'}</div>
                <div><span className="font-semibold text-slate-400">Day 2 Slot:</span> {form.day2_slot || 'N/A'}</div>
              </>
            ) : (
              <>
                <div><span className="font-semibold text-slate-400">Event Day:</span> {form.day || 'N/A'}</div>
                <div><span className="font-semibold text-slate-400">Slot:</span> {form.slot || 'N/A'}</div>
              </>
            )}
            <div><span className="font-semibold text-slate-400">Duration:</span> {form.duration || 'N/A'}</div>
            <div><span className="font-semibold text-slate-400">Halls Required:</span> {form.halls_required || '2'}</div>
            <div><span className="font-semibold text-slate-400">Preferred Halls:</span> {form.preferred_halls || 'N/A'}</div>
            <div><span className="font-semibold text-slate-400">Participant Type:</span> {form.participant_type || 'Solo'}</div>
            {form.participant_type === 'Team' && (
              <div><span className="font-semibold text-slate-400">Team Size:</span> {form.team_min || 1} - {form.team_max || 1}</div>
            )}
            <div><span className="font-semibold text-slate-400">Extension Boxes:</span> {form.extension_boxes || '0'}</div>
            <div><span className="font-semibold text-slate-400">Labs Required:</span> {form.labs_required ? 'Yes' : 'No'}</div>
          </div>

          {form.reason_for_halls && (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="font-semibold text-slate-400">Reason for Halls:</span>
              <p className="text-slate-300 mt-1">{form.reason_for_halls}</p>
            </div>
          )}

          {form.reason_for_extension_boxes && (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="font-semibold text-slate-400">Reason for Extension Boxes:</span>
              <p className="text-slate-300 mt-1">{form.reason_for_extension_boxes}</p>
            </div>
          )}

          {form.labs_required && (
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-sky-500/30 text-xs space-y-2">
              <h4 className="font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5" /> Lab Allotment &amp; Confirmation Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300">
                <div><span className="text-slate-400">Lab Name:</span> {form.lab_name || 'AI lab'}</div>
                <div><span className="text-slate-400">Lab Block:</span> {form.lab_block || 'E block'}</div>
                <div><span className="text-slate-400">Lab Floor:</span> {form.lab_floor || '2'}</div>
                <div><span className="text-slate-400">Lab No:</span> {form.lab_no || '123'}</div>
                <div><span className="text-slate-400">Date Allotted:</span> {form.date_allotted || '14-03-2026'}</div>
                <div><span className="text-slate-400">Duration (hrs):</span> {form.duration_in_hrs || '1'}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {formData.contacts && (
        <div>
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2 font-heading">
            <Users className="w-4 h-4 text-sky-400" />
            Personnel Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Secretaries */}
            {((formData.contacts.secretaries && formData.contacts.secretaries.length > 0) ? formData.contacts.secretaries : (formData.contacts.secretary ? [formData.contacts.secretary] : []))
              .filter(s => s?.name)
              .map((sec, idx) => (
                <div key={`sec-${idx}`} className="bg-slate-950/70 p-4 rounded-2xl text-xs text-slate-300 border border-slate-800">
                  <span className="font-bold text-sky-400 block mb-1 uppercase tracking-wider">Secretary {idx + 1}</span>
                  <div><span className="text-slate-400">Name:</span> {sec.name}</div>
                  <div><span className="text-slate-400">Roll No:</span> {sec.roll_number || 'N/A'}</div>
                  <div><span className="text-slate-400">Mobile:</span> {sec.mobile || 'N/A'}</div>
                  {sec.department && <div><span className="text-slate-400">Dept:</span> {sec.department}</div>}
                </div>
            ))}

            {/* Convenors */}
            {((formData.contacts.convenors && formData.contacts.convenors.length > 0) ? formData.contacts.convenors : [])
              .filter(c => c?.name)
              .map((conv, idx) => (
                <div key={`conv-${idx}`} className="bg-slate-950/70 p-4 rounded-2xl text-xs text-slate-300 border border-slate-800">
                  <span className="font-bold text-sky-400 block mb-1 uppercase tracking-wider">Convenor {idx + 1}</span>
                  <div><span className="text-slate-400">Name:</span> {conv.name}</div>
                  <div><span className="text-slate-400">Roll No:</span> {conv.roll_number || 'N/A'}</div>
                  <div><span className="text-slate-400">Mobile:</span> {conv.mobile || 'N/A'}</div>
                </div>
            ))}

            {/* Volunteers */}
            {((formData.contacts.volunteers && formData.contacts.volunteers.length > 0) ? formData.contacts.volunteers : [])
              .filter(v => v?.name)
              .map((vol, idx) => (
                <div key={`vol-${idx}`} className="bg-slate-950/70 p-4 rounded-2xl text-xs text-slate-300 border border-slate-800">
                  <span className="font-bold text-sky-400 block mb-1 uppercase tracking-wider">Volunteer {idx + 1}</span>
                  <div><span className="text-slate-400">Name:</span> {vol.name}</div>
                  <div><span className="text-slate-400">Roll No:</span> {vol.roll_number || 'N/A'}</div>
                  <div><span className="text-slate-400">Mobile:</span> {vol.mobile || 'N/A'}</div>
                  {vol.department && <div><span className="text-slate-400">Dept:</span> {vol.department}</div>}
                </div>
            ))}

            {/* Faculty Advisor */}
            {formData.contacts.faculty_advisor?.name && (
              <div className="bg-slate-950/70 p-4 rounded-2xl text-xs text-slate-300 border border-slate-800">
                <span className="font-bold text-sky-400 block mb-1 uppercase tracking-wider">Faculty Advisor</span>
                <div><span className="text-slate-400">Name:</span> {formData.contacts.faculty_advisor.name}</div>
                <div><span className="text-slate-400">Designation:</span> {formData.contacts.faculty_advisor.designation || 'N/A'}</div>
                <div><span className="text-slate-400">Contact:</span> {formData.contacts.faculty_advisor.mobile || 'N/A'}</div>
              </div>
            )}
            
            {/* Judge */}
            {formData.contacts.judge?.name && (
              <div className="bg-slate-950/70 p-4 rounded-2xl text-xs text-slate-300 border border-slate-800">
                <span className="font-bold text-sky-400 block mb-1 uppercase tracking-wider">Judge</span>
                <div><span className="text-slate-400">Name:</span> {formData.contacts.judge.name}</div>
                <div><span className="text-slate-400">Designation:</span> {formData.contacts.judge.designation || 'N/A'}</div>
                <div><span className="text-slate-400">Contact:</span> {formData.contacts.judge.mobile || 'N/A'}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {Array.isArray(formData.rounds) && formData.rounds.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2 font-heading">
            <Layers className="w-4 h-4 text-sky-400" />
            Rounds ({formData.rounds.length})
          </h3>
          <div className="space-y-3">
            {formData.rounds.map((rd, idx) => (
              <div key={idx} className="bg-slate-950/70 p-4 rounded-2xl text-xs text-slate-300 border border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-white text-sm">{rd.name}</span>
                  {rd.num_participants && (
                    <span className="text-slate-400 flex-shrink-0">Participants: <span className="text-white font-semibold">{rd.num_participants}</span></span>
                  )}
                </div>
                <p className="mt-1 text-slate-300">{rd.description}</p>
                {Array.isArray(rd.rules) && rd.rules.length > 0 && (
                  <ul className="list-disc list-inside mt-2 space-y-0.5 text-slate-400">
                    {rd.rules.map((rule, rIdx) => rule && <li key={rIdx}>{rule}</li>)}
                  </ul>
                )}
                {rd.has_tie_breaker && (
                  <p className="mt-2 pt-2 border-t border-slate-800">
                    <span className="font-semibold text-slate-400">Tie-Breaker:</span> {rd.tie_breaker || 'Yes'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(formData.items) && formData.items.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2 font-heading">
            <Package className="w-4 h-4 text-sky-400" />
            Items ({formData.items.length})
          </h3>
          <div className="bg-slate-950/70 rounded-2xl p-3 border border-slate-800 text-xs">
            {formData.items.map((it, idx) => (
              <div key={idx} className="flex justify-between py-1 border-b last:border-0 border-slate-800">
                <span className="font-medium text-white">{it.item_name}</span>
                <span className="text-slate-400">Qty: {it.quantity} | ₹{it.price_per_unit || 0}/unit | Total: ₹{((it.quantity || 0) * (it.price_per_unit || 0) * 1.18).toFixed(2)} (inc 18% tax)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EventPreview;
