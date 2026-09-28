import React, { useState } from 'react';
import EventPreview from './EventPreview';
import { Send, Loader2 } from 'lucide-react';

function ReviewSubmit({ formData, onSubmit, isSubmitting, isEdit = false }) {
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agreed) {
      alert('Please confirm that the submitted proposal information is accurate.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      <EventPreview formData={formData} />

      <div className="glass-card rounded-3xl p-6 shadow-2xl border border-slate-800 text-slate-100">
        <label className="flex items-start gap-3 cursor-pointer text-sm text-slate-300">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 text-sky-500 bg-slate-950 border-slate-800 rounded focus:ring-sky-500"
          />
          <span>
            I confirm that all details, round specifications, and item requests provided in this proposal are correct and approved by our club convenors.
          </span>
        </label>

        <div className="mt-6 flex flex-col sm:flex-row justify-end">
          <button
            onClick={handleSubmit}
            disabled={!agreed || isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm uppercase tracking-wider"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" /> {isEdit ? 'Update Event Proposal' : 'Submit Event Proposal'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewSubmit;
