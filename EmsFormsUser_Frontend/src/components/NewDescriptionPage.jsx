import React, { useState, useEffect } from 'react';

const SLOT_OPTIONS = [
  { id: 'Slot 1 (9:30 to 12:30)', label: 'Slot 1 (9:30 to 12:30)' },
  { id: 'Slot 2 (1:30 to 4:30)', label: 'Slot 2 (1:30 to 4:30)' },
  { id: 'Full Day', label: 'Full Day' },
];

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

  const handleDayCountChange = (isTwoDay) => {
    setFormData((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        is_two_day: isTwoDay,
        day: isTwoDay ? '' : prev.form?.day,
        slot: isTwoDay ? '' : prev.form?.slot,
        day1_slot: isTwoDay ? prev.form?.day1_slot : '',
        day2_slot: isTwoDay ? prev.form?.day2_slot : '',
      },
    }));
  };

  const handleLabDayCountChange = (isTwoDay) => {
    setFormData((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        is_two_day_lab: isTwoDay,
        lab_day: isTwoDay ? '' : prev.form?.lab_day,
        lab_session_slot: isTwoDay ? '' : prev.form?.lab_session_slot,
        lab_session_slot_day2: isTwoDay ? prev.form?.lab_session_slot_day2 : '',
      },
    }));
  };

  const [extBoxInput, setExtBoxInput] = useState(String(formData.form?.extension_boxes ?? 0));

  useEffect(() => {
    setExtBoxInput(String(formData.form?.extension_boxes ?? 0));
  }, [formData.form?.extension_boxes]);

  const applyExtensionBoxes = (rawNum) => {
    const num = Math.max(0, parseInt(rawNum, 10) || 0);
    setExtBoxInput(String(num));
    handleChange('extension_boxes', num);
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
            <div className="mt-5 p-5 bg-zinc-950/80 rounded-xl border border-sky-500/30 relative overflow-hidden transition-all duration-300 ease-in-out">
              <div className="absolute top-0 left-0 w-1 h-full bg-sky-500"></div>
              <h3 className="text-xs font-extrabold text-sky-400 uppercase tracking-widest border-b border-zinc-800 pb-3 mb-4">
                Lab Allotment &amp; Confirmation Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-sky-200/70 uppercase tracking-wide">Lab Name <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. AI Lab"
                    value={formData.form?.lab_name || ''}
                    onChange={(e) => handleLabChange('lab_name', e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder-zinc-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-sky-200/70 uppercase tracking-wide">Lab Block <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. E Block"
                    value={formData.form?.lab_block || ''}
                    onChange={(e) => handleLabChange('lab_block', e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder-zinc-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-sky-200/70 uppercase tracking-wide">Floor <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. 2nd Floor"
                    value={formData.form?.lab_floor || ''}
                    onChange={(e) => handleLabChange('lab_floor', e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder-zinc-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-sky-200/70 uppercase tracking-wide">Lab No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 123 (Optional)"
                    value={formData.form?.lab_no || ''}
                    onChange={(e) => handleLabChange('lab_no', e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder-zinc-500"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-[11px] font-bold text-sky-200/70 uppercase tracking-wide">Is the Lab required for 1-day or 2-days? <span className="text-rose-400">*</span></label>
                  <div className="grid grid-cols-2 gap-4 max-w-md mt-2">
                    {[
                      { id: false, label: '1 Day' },
                      { id: true, label: '2 Days' },
                    ].map((opt) => (
                      <label
                        key={String(opt.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                          Boolean(formData.form?.is_two_day_lab) === opt.id
                            ? 'bg-sky-950/60 border-sky-500 text-white font-medium'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="lab_day_count_option"
                          checked={Boolean(formData.form?.is_two_day_lab) === opt.id}
                          onChange={() => handleLabDayCountChange(opt.id)}
                          className="w-4 h-4 text-sky-500 bg-zinc-950 border-zinc-700 focus:ring-sky-500"
                        />
                        <span className="text-xs">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {!formData.form?.is_two_day_lab ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-sky-200/70 uppercase tracking-wide">Lab Day <span className="text-rose-400">*</span></label>
                      <select
                        value={formData.form?.lab_day || ''}
                        onChange={(e) => handleLabChange('lab_day', e.target.value)}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                      >
                        <option value="" disabled className="text-zinc-500">Select Day</option>
                        <option value="Day 1" className="bg-zinc-900 text-white">Day 1</option>
                        <option value="Day 2" className="bg-zinc-900 text-white">Day 2</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-[11px] font-bold text-sky-200/70 uppercase tracking-wide">Time Slot <span className="text-rose-400">*</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                        {[
                          { id: '1', label: 'Slot 1 (9:30 to 12:30)' },
                          { id: '2', label: 'Slot 2 (1:30 to 4:30)' },
                          { id: 'Both', label: 'Full Day' },
                        ].map((slotOpt) => (
                          <label
                            key={slotOpt.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                              formData.form?.lab_session_slot === slotOpt.id
                                ? 'bg-sky-950/60 border-sky-500 text-white font-medium'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="lab_session_slot"
                              checked={formData.form?.lab_session_slot === slotOpt.id}
                              onChange={() => handleLabChange('lab_session_slot', slotOpt.id)}
                              className="w-4 h-4 text-sky-500 bg-zinc-950 border-zinc-700 focus:ring-sky-500"
                            />
                            <span className="text-xs">{slotOpt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-5 md:col-span-2">
                    <div>
                      <label className="block text-[11px] font-bold text-sky-200/70 uppercase tracking-wide mb-2">Day 1 — Time Slot <span className="text-rose-400">*</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { id: '1', label: 'Slot 1 (9:30 to 12:30)' },
                          { id: '2', label: 'Slot 2 (1:30 to 4:30)' },
                          { id: 'Both', label: 'Full Day' },
                        ].map((slotOpt) => (
                          <label
                            key={slotOpt.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                              formData.form?.lab_session_slot === slotOpt.id
                                ? 'bg-sky-950/60 border-sky-500 text-white font-medium'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="lab_session_slot_d1"
                              checked={formData.form?.lab_session_slot === slotOpt.id}
                              onChange={() => handleLabChange('lab_session_slot', slotOpt.id)}
                              className="w-4 h-4 text-sky-500 bg-zinc-950 border-zinc-700 focus:ring-sky-500"
                            />
                            <span className="text-xs">{slotOpt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-sky-200/70 uppercase tracking-wide mb-2">Day 2 — Time Slot <span className="text-rose-400">*</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { id: '1', label: 'Slot 1 (9:30 to 12:30)' },
                          { id: '2', label: 'Slot 2 (1:30 to 4:30)' },
                          { id: 'Both', label: 'Full Day' },
                        ].map((slotOpt) => (
                          <label
                            key={slotOpt.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                              formData.form?.lab_session_slot_day2 === slotOpt.id
                                ? 'bg-sky-950/60 border-sky-500 text-white font-medium'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="lab_session_slot_d2"
                              checked={formData.form?.lab_session_slot_day2 === slotOpt.id}
                              onChange={() => handleLabChange('lab_session_slot_day2', slotOpt.id)}
                              className="w-4 h-4 text-sky-500 bg-zinc-950 border-zinc-700 focus:ring-sky-500"
                            />
                            <span className="text-xs">{slotOpt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. EVENT SCHEDULE SECTION */}
      <div className="glass-card rounded-xl p-5 shadow-lg border border-zinc-800 bg-zinc-950/80">
        <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
          Event Schedule <span className="text-rose-400">*</span>
        </h2>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-zinc-300 mb-2">
            Is this a 1-day or 2-day event? <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { id: false, label: '1 Day' },
              { id: true, label: '2 Days' },
            ].map((opt) => (
              <label
                key={String(opt.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                  Boolean(formData.form?.is_two_day) === opt.id
                    ? 'bg-sky-950/60 border-sky-500 text-white font-medium'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="day_count_option"
                  checked={Boolean(formData.form?.is_two_day) === opt.id}
                  onChange={() => handleDayCountChange(opt.id)}
                  className="w-4 h-4 text-sky-500 bg-zinc-950 border-zinc-700 focus:ring-sky-500"
                />
                <span className="text-xs">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {!formData.form?.is_two_day ? (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Event Day <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.form?.day || ''}
                onChange={(e) => handleChange('day', e.target.value)}
                className="w-full sm:w-64 p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs transition-all"
              >
                <option value="" className="bg-zinc-900 text-zinc-400">Select Day</option>
                <option value="Day 1" className="bg-zinc-900 text-white">Day 1</option>
                <option value="Day 2" className="bg-zinc-900 text-white">Day 2</option>
              </select>
              {errors.day && <p className="text-rose-400 text-xs mt-1">{errors.day}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                Time Slot <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {SLOT_OPTIONS.map((slotOption) => (
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
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                Day 1 — Time Slot <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {SLOT_OPTIONS.map((slotOption) => (
                  <label
                    key={slotOption.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                      formData.form?.day1_slot === slotOption.id
                        ? 'bg-sky-950/60 border-sky-500 text-white font-medium'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="day1_slot_option"
                      checked={formData.form?.day1_slot === slotOption.id}
                      onChange={() => handleChange('day1_slot', slotOption.id)}
                      className="w-4 h-4 text-sky-500 bg-zinc-950 border-zinc-700 focus:ring-sky-500"
                    />
                    <span className="text-xs">{slotOption.label}</span>
                  </label>
                ))}
              </div>
              {errors.day1_slot && <p className="text-rose-400 text-xs mt-2">{errors.day1_slot}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                Day 2 — Time Slot <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {SLOT_OPTIONS.map((slotOption) => (
                  <label
                    key={slotOption.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                      formData.form?.day2_slot === slotOption.id
                        ? 'bg-sky-950/60 border-sky-500 text-white font-medium'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="day2_slot_option"
                      checked={formData.form?.day2_slot === slotOption.id}
                      onChange={() => handleChange('day2_slot', slotOption.id)}
                      className="w-4 h-4 text-sky-500 bg-zinc-950 border-zinc-700 focus:ring-sky-500"
                    />
                    <span className="text-xs">{slotOption.label}</span>
                  </label>
                ))}
              </div>
              {errors.day2_slot && <p className="text-rose-400 text-xs mt-2">{errors.day2_slot}</p>}
            </div>
          </div>
        )}
      </div>

      {/* 3. EXTENSION BOX SECTION */}
      <div className="glass-card rounded-xl p-5 shadow-lg border border-zinc-800 bg-zinc-950/80">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Extension Box
          </h2>
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!formData.form?.needs_extension_boxes}
              onChange={(e) => {
                const checked = e.target.checked;
                setFormData((prev) => ({
                  ...prev,
                  form: {
                    ...prev.form,
                    needs_extension_boxes: checked,
                    extension_boxes: checked ? prev.form?.extension_boxes : 0,
                    reason_for_extension_boxes: checked ? prev.form?.reason_for_extension_boxes : '',
                  },
                }));
                if (!checked) setExtBoxInput('0');
              }}
              className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-zinc-950"
            />
            <span>Required?</span>
          </label>
        </div>

        {formData.form?.needs_extension_boxes && (
          <div className="space-y-4 pt-2 border-t border-zinc-800/50">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Number of Extension Boxes <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="1"
                value={extBoxInput}
                onChange={(e) => setExtBoxInput(e.target.value)}
                onBlur={() => applyExtensionBoxes(extBoxInput)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
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
        )}
      </div>

      {/* 4. PARTICIPATION DETAILS */}
      <div className="glass-card rounded-xl p-5 shadow-lg border border-zinc-800 bg-zinc-950/80">
        <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
          Participation Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            </select>
          </div>

          {formData.form?.participant_type === 'Team' && (
            <div className="grid grid-cols-2 gap-2 sm:col-span-2 sm:max-w-xs">
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
          )}
        </div>
      </div>
    </div>
  );
}

export default NewDescriptionPage;
