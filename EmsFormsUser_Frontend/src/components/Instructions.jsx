import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Instructions({ onNext }) {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-slate-100 font-sans">
      {/* Header Box */}
      <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 text-center shadow-2xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading uppercase tracking-wider">
          Instructions to be Read
        </h1>
        <p className="text-xs font-semibold text-sky-400 mt-1">Before Filling the Form</p>
      </div>

      {/* IMPORTANT Box */}
      <div className="bg-slate-950 text-white p-6 rounded-3xl border border-sky-500/30 shadow-2xl space-y-4">
        <h2 className="text-sm font-extrabold tracking-wider uppercase text-sky-400 border-b border-slate-800 pb-2 flex items-center gap-2 font-heading">
          <ShieldCheck className="w-4 h-4 text-sky-400" /> IMPORTANT GUIDELINES
        </h2>
        <ol className="list-decimal list-inside space-y-3 text-xs leading-relaxed font-medium text-slate-200">
          <li>
            If <strong className="text-sky-300 font-bold">TWO DIFFERENT events</strong> are to be conducted then fill the above form for each event separately and submit it.
          </li>
          <li>
            If the same event continues on both the days (i.e. Preliminary round on first day and final round on second day), then fill the needed requirement in the <strong className="text-sky-300 font-bold">SAME FORM</strong>.
          </li>
        </ol>
      </div>

      {/* INSTRUCTIONS Box */}
      <div className="bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
        <h2 className="text-sm font-extrabold tracking-wider uppercase text-white border-b border-slate-800 pb-2 font-heading">
          INSTRUCTIONS
        </h2>
        <ol className="list-decimal list-inside space-y-3 text-xs text-slate-300 leading-relaxed font-medium">
          <li>"No cash prize / memento" or any other form of prizes should be given by clubs to the event winners.</li>
          <li>Memento for the external chief guest will be provided by the Students Union if filled-in the items required table.</li>
          <li>Certificates to the winners, runners, convenors & volunteers of each event will be provided by the Students Union.</li>
          <li>If any materials are required prior to the day of the event, please mention "Required in advance" near that material in the "Item Name" column.</li>
          <li>Printouts required by the clubs must be taken by the clubs themselves.</li>
          <li>Any events in the form of "Treasure Hunt" should be avoided.</li>
          <li>Events should be conducted only in specified halls.</li>
          <li>Materials sourced or purchased directly by the club will not be reimbursed through the Students Union.</li>
          <li>The Students Union is not obliged to provide all items requested by the club, only approved items will be provided.</li>
          <li>Halls will be allotted on the basis of availability.</li>
          <li>Mic will only be provided on the basis of event and number of participants.</li>
          <li>The projector will not be provided by the Students Union, use the projector available in the hall.</li>
          <li>HDMI cables / VGA converter will not be provided.</li>
          <li>Take enough copies of the Form, for your reference.</li>
          <li>Send it to the point of contact allotted to your club.</li>
          <li>For more details contact your respective point of contact.</li>
        </ol>
      </div>

      {/* Terms Agreement & Controls */}
      <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500"
          />
          <span className="text-xs font-bold text-slate-200">I agree to the terms and conditions</span>
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 font-extrabold text-xs uppercase tracking-wider rounded-xl border border-slate-800 transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK
          </button>
          <button
            onClick={onNext}
            disabled={!agreed}
            className="px-8 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-sky-500/25 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>PROCEED</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Instructions;
