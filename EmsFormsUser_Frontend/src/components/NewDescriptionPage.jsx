import React from 'react';

function NewDescriptionPage({ formData, setFormData, errors = {} }) {
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        [field]: value,
      },
    }));
  };

  const handleLabChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6 text-zinc-100">
      {/* 1. HALL REQUIREMENTS SECTION */}
      <div className="glass-card rounded-xl p-5 shadow-lg border border-zinc-800 bg-zinc-950/80">
        <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
          Hall Requirements
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Halls Required <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., 2"
              value={formData.form?.halls_required ?? '2'}
              onChange={(e) => handleChange('halls_required', e.target.value)}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs placeholder-zinc-500 transition-all"
            />
            {errors.halls_required && <p className="text-rose-400 text-xs mt-1">{errors.halls_required}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Preferred Halls <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Auditorium, Seminar Hall 1"
              value={formData.form?.preferred_halls || ''}
              onChange={(e) => handleChange('preferred_halls', e.target.value)}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs placeholder-zinc-500 transition-all"
            />
            {errors.preferred_halls && <p className="text-rose-400 text-xs mt-1">{errors.preferred_halls}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Reason for Halls <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Large capacity needed for final round, audio-visual equipment required"
              value={formData.form?.reason_for_halls || ''}
              onChange={(e) => handleChange('reason_for_halls', e.target.value)}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs placeholder-zinc-500 transition-all resize-none"
            />
          </div>

          <div className="pt-2">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!formData.form?.labs_required}
                onChange={(e) => handleChange('labs_required', e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-zinc-950"
              />
              <span>Labs Required?</span>
            </label>
          </div>

          {/* LAB ALLOTMENT & CONFIRMATION DETAILS */}
          {formData.form?.labs_required && (
            <div className="mt-4 p-4 bg-zinc-900/90 rounded-lg border border-sky-500/30 space-y-3">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider border-b border-zinc-800 pb-2">
                Lab Allotment &amp; Confirmation Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Lab Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. AI lab"
                    value={formData.form?.lab_name || ''}
                    onChange={(e) => handleLabChange('lab_name', e.target.value)}
                    className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Lab Block *</label>
                  <input
                    type="text"
                    placeholder="e.g. E block"
                    value={formData.form?.lab_block || ''}
                    onChange={(e) => handleLabChange('lab_block', e.target.value)}
                    className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Lab Floor *</label>
                  <input
                    type="text"
                    placeholder="e.g. 2"
                    value={formData.form?.lab_floor || ''}
                    onChange={(e) => handleLabChange('lab_floor', e.target.value)}
                    className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Lab No. (if any)</label>
                  <input
                    type="text"
                    placeholder="e.g. 123"
                    value={formData.form?.lab_no || ''}
                    onChange={(e) => handleLabChange('lab_no', e.target.value)}
                    className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Date (Allotted)</label>
                  <input
                    type="text"
                    placeholder="e.g. 14-03-2026"
                    value={formData.form?.date_allotted || ''}
                    onChange={(e) => handleLabChange('date_allotted', e.target.value)}
                    className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Duration (in hrs)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1"
                    value={formData.form?.duration_in_hrs || ''}
                    onChange={(e) => handleLabChange('duration_in_hrs', e.target.value)}
                    className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white text-xs outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. SLOT SECTION */}
      <div className="glass-card rounded-xl p-5 shadow-lg border border-zinc-800 bg-zinc-950/80">
        <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
          Slot <span className="text-rose-400">*</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { id: 'Slot 1 (9:30 to 12:30)', label: 'Slot 1 (9:30 to 12:30)' },
            { id: 'Slot 2 (1:30 to 4:30)', label: 'Slot 2 (1:30 to 4:30)' },
            { id: 'Full Day', label: 'Full Day' },
          ].map((slotOption) => (
            <label
              key={slotOption.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                formData.form?.slot === slotOption.id
                  ? 'bg-sky-950/60 border-sky-500 text-white font-medium'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <input
                type="radio"
                name="slot_option"
                value={slotOption.id}
                checked={formData.form?.slot === slotOption.id}
                onChange={() => handleChange('slot', slotOption.id)}
                className="w-4 h-4 text-sky-500 bg-zinc-950 border-zinc-700 focus:ring-sky-500"
              />
              <span className="text-xs">{slotOption.label}</span>
            </label>
          ))}
        </div>
        {errors.slot && <p className="text-rose-400 text-xs mt-2">{errors.slot}</p>}
      </div>

      {/* 3. EXTENSION BOX SECTION */}
      <div className="glass-card rounded-xl p-5 shadow-lg border border-zinc-800 bg-zinc-950/80">
        <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
          Extension Box
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Extension Box <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={formData.form?.extension_boxes ?? '0'}
              onChange={(e) => handleChange('extension_boxes', e.target.value)}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Reason for Extension Boxes <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Required for laptops and equipment, power supply for multiple stations"
              value={formData.form?.reason_for_extension_boxes || ''}
              onChange={(e) => handleChange('reason_for_extension_boxes', e.target.value)}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs placeholder-zinc-500 transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* 4. EVENT DAY & TEAM PARAMETERS */}
      <div className="glass-card rounded-xl p-5 shadow-lg border border-zinc-800 bg-zinc-950/80">
        <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
          Event Day &amp; Participation Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Event Day <span className="text-rose-400">*</span>
            </label>
            <select
              value={formData.form?.day || ''}
              onChange={(e) => handleChange('day', e.target.value)}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs transition-all"
            >
              <option value="" className="bg-zinc-900 text-zinc-400">Select Day</option>
              <option value="Day 1" className="bg-zinc-900 text-white">Day 1</option>
              <option value="Day 2" className="bg-zinc-900 text-white">Day 2</option>
            </select>
            {errors.day && <p className="text-rose-400 text-xs mt-1">{errors.day}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Duration <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 3 Hours"
              value={formData.form?.duration || ''}
              onChange={(e) => handleChange('duration', e.target.value)}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs placeholder-zinc-500 transition-all"
            />
            {errors.duration && <p className="text-rose-400 text-xs mt-1">{errors.duration}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Participant Type</label>
            <select
              value={formData.form?.participant_type || 'Solo'}
              onChange={(e) => handleChange('participant_type', e.target.value)}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs transition-all"
            >
              <option value="Solo" className="bg-zinc-900 text-white">Solo</option>
              <option value="Team" className="bg-zinc-900 text-white">Team</option>
              <option value="Dual" className="bg-zinc-900 text-white">Dual</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Min Team Size</label>
              <input
                type="number"
                min="1"
                value={formData.form?.team_min || 1}
                onChange={(e) => handleChange('team_min', parseInt(e.target.value) || 1)}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Max Team Size</label>
              <input
                type="number"
                min="1"
                value={formData.form?.team_max || 1}
                onChange={(e) => handleChange('team_max', parseInt(e.target.value) || 1)}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewDescriptionPage;
