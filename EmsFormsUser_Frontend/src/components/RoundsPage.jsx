import React from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';

function RoundsPage({ formData, setFormData, errors = {} }) {
  const addRound = () => {
    setFormData((prev) => {
      const currentRounds = prev.rounds || [];
      const newRound = {
        name: '',
        description: '',
        rules: [''],
        num_participants: 50,
        has_tie_breaker: false,
        tie_breaker_name: '',
        tie_breaker_description: '',
        tie_breaker_rules: [''],
        tie_breaker_participants: ''
      };
      return {
        ...prev,
        rounds: [...currentRounds, newRound],
        form: {
          ...prev.form,
          num_rounds: currentRounds.length + 1,
        },
      };
    });
  };

  const removeRound = (index) => {
    setFormData((prev) => {
      const updated = prev.rounds.filter((_, i) => i !== index);
      return {
        ...prev,
        rounds: updated,
        form: {
          ...prev.form,
          num_rounds: updated.length,
        },
      };
    });
  };

  const updateRound = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.rounds || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, rounds: updated };
    });
  };

  const handleParticipantCountChange = (roundIdx, rawValue) => {
    const stringValue = String(rawValue ?? '').trim();

    if (stringValue === '') {
      updateRound(roundIdx, 'num_participants', '');
      return;
    }

    const parsed = Number.parseInt(String(rawValue), 10);
    const safeValue = Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
    updateRound(roundIdx, 'num_participants', safeValue);
  };

  const adjustParticipantCount = (roundIdx, direction) => {
    const currentValue = Number(formData.rounds?.[roundIdx]?.num_participants ?? 1);
    const nextValue = Math.max(1, currentValue + direction);
    updateRound(roundIdx, 'num_participants', nextValue);
  };

  const addRule = (roundIdx) => {
    setFormData((prev) => {
      const updated = [...prev.rounds];
      updated[roundIdx].rules = [...(updated[roundIdx].rules || []), ''];
      return { ...prev, rounds: updated };
    });
  };

  const updateRule = (roundIdx, ruleIdx, value) => {
    setFormData((prev) => {
      const updated = [...prev.rounds];
      const rules = [...updated[roundIdx].rules];
      rules[ruleIdx] = value;
      updated[roundIdx].rules = rules;
      return { ...prev, rounds: updated };
    });
  };

  const removeRule = (roundIdx, ruleIdx) => {
    setFormData((prev) => {
      const updated = [...prev.rounds];
      updated[roundIdx].rules = updated[roundIdx].rules.filter((_, i) => i !== ruleIdx);
      return { ...prev, rounds: updated };
    });
  };

  const addTieBreakerRule = (roundIdx) => {
    setFormData((prev) => {
      const updated = [...prev.rounds];
      const rules = updated[roundIdx].tie_breaker_rules || [];
      updated[roundIdx].tie_breaker_rules = [...rules, ''];
      return { ...prev, rounds: updated };
    });
  };

  const updateTieBreakerRule = (roundIdx, ruleIdx, value) => {
    setFormData((prev) => {
      const updated = [...prev.rounds];
      const rules = [...(updated[roundIdx].tie_breaker_rules || [])];
      rules[ruleIdx] = value;
      updated[roundIdx].tie_breaker_rules = rules;
      return { ...prev, rounds: updated };
    });
  };

  const removeTieBreakerRule = (roundIdx, ruleIdx) => {
    setFormData((prev) => {
      const updated = [...prev.rounds];
      const rules = updated[roundIdx].tie_breaker_rules || [];
      updated[roundIdx].tie_breaker_rules = rules.filter((_, i) => i !== ruleIdx);
      return { ...prev, rounds: updated };
    });
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans max-w-4xl mx-auto">
      {/* Round Details Header */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading uppercase flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-400" /> Round Details
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Specify structure, rules, participant caps, and tie-breakers for each round
          </p>
        </div>
        <button
          type="button"
          onClick={addRound}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all shadow-lg shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" /> ADD ROUND
        </button>
      </div>

      {errors.rounds && <p className="text-rose-400 text-xs font-bold px-2">{errors.rounds}</p>}

      <div className="space-y-6">
        {formData.rounds?.map((round, rIdx) => (
          <div key={rIdx} className="glass-card border border-slate-800 rounded-3xl p-6 sm:p-8 relative shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider font-heading">
                Round {rIdx + 1}
              </h3>
              {formData.rounds.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRound(rIdx)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-sky-200/90 uppercase tracking-wider mb-1.5">
                Round Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder={`Round ${rIdx + 1}`}
                value={round.name || ''}
                onChange={(e) => updateRound(rIdx, 'name', e.target.value)}
                className="w-full p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none text-white text-sm placeholder-slate-500 font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sky-200/90 uppercase tracking-wider mb-1.5">
                Round Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g., An initial screening round where participants present their ideas..."
                value={round.description || ''}
                onChange={(e) => updateRound(rIdx, 'description', e.target.value)}
                className="w-full p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none text-white text-sm placeholder-slate-500 font-medium transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-sky-200/90 uppercase tracking-wider">
                  Round Rules <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => addRule(rIdx)}
                  className="text-xs text-sky-400 font-bold hover:underline"
                >
                  + Add Rule
                </button>
              </div>
              <div className="space-y-2">
                {round.rules?.map((rule, ruleIdx) => (
                  <div key={ruleIdx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="e.g., 1. Time limit: 5 minutes per team 2. No external assistance allowed"
                      value={rule}
                      onChange={(e) => updateRule(rIdx, ruleIdx, e.target.value)}
                      className="flex-1 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none text-white placeholder-slate-500 font-medium transition-all"
                    />
                    {round.rules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRule(rIdx, ruleIdx)}
                        className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-sky-200/90 uppercase tracking-wider mb-1.5">
                  Number of Participants <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g., 50"
                    value={round.num_participants ?? ''}
                    onChange={(e) => handleParticipantCountChange(rIdx, e.target.value)}
                    onBlur={(e) => handleParticipantCountChange(rIdx, e.target.value === '' ? 1 : e.target.value)}
                    className="w-full h-[52px] p-3.5 pr-9 bg-slate-950/80 border border-slate-800 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none text-white text-sm font-medium transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 flex flex-col w-6 border-l border-slate-700 overflow-hidden rounded-r-xl bg-slate-800/90">
                    <button
                      type="button"
                      onClick={() => adjustParticipantCount(rIdx, 1)}
                      className="flex-1 flex items-center justify-center text-[8px] leading-none text-slate-300 bg-slate-800/95 hover:bg-slate-700 hover:text-sky-300 transition-colors rounded-tr-xl"
                      aria-label="Increase participant count"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustParticipantCount(rIdx, -1)}
                      className="flex-1 flex items-center justify-center text-[8px] leading-none text-slate-300 bg-slate-800/95 hover:bg-slate-700 hover:text-sky-300 transition-colors border-t border-slate-700 rounded-br-xl"
                      aria-label="Decrease participant count"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-transparent mb-1.5 select-none" aria-hidden="true">
                  Toggle
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl w-full h-[52px]">
                  <input
                    type="checkbox"
                    checked={round.has_tie_breaker || false}
                    onChange={(e) => updateRound(rIdx, 'has_tie_breaker', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-xs font-bold text-slate-200">This round has a Tie-Breaker</span>
                </label>
              </div>
            </div>

            {round.has_tie_breaker && (
              <div className="mt-6 p-5 bg-slate-900/50 border border-slate-700/50 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider border-b border-slate-700 pb-2">
                  Tie-Breaker Configuration
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-sky-200/90 uppercase tracking-wider mb-1">
                      Tie-Breaker Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Sudden Death Round"
                      value={round.tie_breaker_name || ''}
                      onChange={(e) => updateRound(rIdx, 'tie_breaker_name', e.target.value)}
                      className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-sky-200/90 uppercase tracking-wider mb-1">
                      Participants (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g., 2"
                      value={round.tie_breaker_participants || ''}
                      onChange={(e) => updateRound(rIdx, 'tie_breaker_participants', e.target.value)}
                      className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-sky-200/90 uppercase tracking-wider mb-1">
                    Tie-Breaker Description <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g., A quick round where participants answer rapid fire questions..."
                    value={round.tie_breaker_description || ''}
                    onChange={(e) => updateRound(rIdx, 'tie_breaker_description', e.target.value)}
                    className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-sky-200/90 uppercase tracking-wider">
                      Tie-Breaker Rules <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => addTieBreakerRule(rIdx)}
                      className="text-[11px] text-sky-400 font-bold hover:underline"
                    >
                      + Add Rule
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(round.tie_breaker_rules || ['']).map((rule, ruleIdx) => (
                      <div key={ruleIdx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="e.g., 1. Only top 2 teams will participate"
                          value={rule}
                          onChange={(e) => updateTieBreakerRule(rIdx, ruleIdx, e.target.value)}
                          className="flex-1 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none text-white placeholder-slate-500 font-medium transition-all"
                        />
                        {(round.tie_breaker_rules || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTieBreakerRule(rIdx, ruleIdx)}
                            className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoundsPage;
