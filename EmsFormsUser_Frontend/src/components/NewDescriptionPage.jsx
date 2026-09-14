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

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5 shadow-lg border border-zinc-800 text-zinc-100">
      <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Schedule, Venue & Parameters</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">
            Event Day <span className="text-rose-400">*</span>
          </label>
          <select
            value={formData.form?.day || ''}
            onChange={(e) => handleChange('day', e.target.value)}
            className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs transition-all"
          >
            <option value="" className="bg-zinc-900 text-zinc-400">Select Day</option>
            <option value="Day 1" className="bg-zinc-900 text-white">Day 1</option>
            <option value="Day 2" className="bg-zinc-900 text-white">Day 2</option>
            <option value="Both Days" className="bg-zinc-900 text-white">Both Days (Day 1 &amp; Day 2)</option>
          </select>
          {errors.day && <p className="text-rose-400 text-xs mt-1">{errors.day}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">
            Time Slot <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 09:30 AM - 12:30 PM"
            value={formData.form?.slot || ''}
            onChange={(e) => handleChange('slot', e.target.value)}
            className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs placeholder-zinc-500 transition-all"
          />
          {errors.slot && <p className="text-rose-400 text-xs mt-1">{errors.slot}</p>}
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
            className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs placeholder-zinc-500 transition-all"
          />
          {errors.duration && <p className="text-rose-400 text-xs mt-1">{errors.duration}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">Participant Type</label>
          <select
            value={formData.form?.participant_type || 'Solo'}
            onChange={(e) => handleChange('participant_type', e.target.value)}
            className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs transition-all"
          >
            <option value="Solo" className="bg-zinc-900 text-white">Solo</option>
            <option value="Team" className="bg-zinc-900 text-white">Team</option>
            <option value="Dual" className="bg-zinc-900 text-white">Dual</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">Min Team Size</label>
          <input
            type="number"
            min="1"
            value={formData.form?.team_min || 1}
            onChange={(e) => handleChange('team_min', parseInt(e.target.value) || 1)}
            className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">Max Team Size</label>
          <input
            type="number"
            min="1"
            value={formData.form?.team_max || 1}
            onChange={(e) => handleChange('team_max', parseInt(e.target.value) || 1)}
            className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs transition-all"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-zinc-300 mb-1">Preferred Halls / Venues</label>
          <input
            type="text"
            placeholder="e.g. IT Block Lab 3, Main Auditorium"
            value={formData.form?.preferred_halls || ''}
            onChange={(e) => handleChange('preferred_halls', e.target.value)}
            className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-white text-xs placeholder-zinc-500 transition-all"
          />
        </div>
      </div>

      {/* Contact Persons Section */}
      <h3 className="text-sm font-semibold text-white mt-6 mb-3 border-t border-zinc-800 pt-4 uppercase tracking-wider">Contact Persons</h3>

      <div className="space-y-4">
        {/* Secretary */}
        <div className="p-3.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
          <h4 className="text-xs font-semibold text-sky-400 mb-2">Secretary Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Secretary Name"
              value={formData.contacts?.secretary?.name || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                contacts: {
                  ...prev.contacts,
                  secretary: { ...(prev.contacts?.secretary || {}), name: e.target.value }
                }
              }))}
              className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              type="text"
              placeholder="Roll Number"
              value={formData.contacts?.secretary?.roll_number || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                contacts: {
                  ...prev.contacts,
                  secretary: { ...(prev.contacts?.secretary || {}), roll_number: e.target.value }
                }
              }))}
              className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              type="text"
              placeholder="Mobile Number"
              value={formData.contacts?.secretary?.mobile || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                contacts: {
                  ...prev.contacts,
                  secretary: { ...(prev.contacts?.secretary || {}), mobile: e.target.value }
                }
              }))}
              className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Convenor */}
        <div className="p-3.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
          <h4 className="text-xs font-semibold text-sky-400 mb-2">Convenor Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Convenor Name"
              value={formData.contacts?.convenors?.[0]?.name || ''}
              onChange={(e) => setFormData(prev => {
                const convs = [...(prev.contacts?.convenors || [{ name: '', roll_number: '', mobile: '' }])];
                convs[0] = { ...convs[0], name: e.target.value };
                return { ...prev, contacts: { ...prev.contacts, convenors: convs } };
              })}
              className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              type="text"
              placeholder="Roll Number"
              value={formData.contacts?.convenors?.[0]?.roll_number || ''}
              onChange={(e) => setFormData(prev => {
                const convs = [...(prev.contacts?.convenors || [{ name: '', roll_number: '', mobile: '' }])];
                convs[0] = { ...convs[0], roll_number: e.target.value };
                return { ...prev, contacts: { ...prev.contacts, convenors: convs } };
              })}
              className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              type="text"
              placeholder="Mobile Number"
              value={formData.contacts?.convenors?.[0]?.mobile || ''}
              onChange={(e) => setFormData(prev => {
                const convs = [...(prev.contacts?.convenors || [{ name: '', roll_number: '', mobile: '' }])];
                convs[0] = { ...convs[0], mobile: e.target.value };
                return { ...prev, contacts: { ...prev.contacts, convenors: convs } };
              })}
              className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Faculty Advisor */}
        <div className="p-3.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
          <h4 className="text-xs font-semibold text-sky-400 mb-2">Faculty Advisor Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Faculty Advisor Name"
              value={formData.contacts?.faculty_advisor?.name || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                contacts: {
                  ...prev.contacts,
                  faculty_advisor: { ...(prev.contacts?.faculty_advisor || {}), name: e.target.value }
                }
              }))}
              className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              type="text"
              placeholder="Department / Designation"
              value={formData.contacts?.faculty_advisor?.department || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                contacts: {
                  ...prev.contacts,
                  faculty_advisor: { ...(prev.contacts?.faculty_advisor || {}), department: e.target.value }
                }
              }))}
              className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              type="text"
              placeholder="Mobile Number"
              value={formData.contacts?.faculty_advisor?.mobile || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                contacts: {
                  ...prev.contacts,
                  faculty_advisor: { ...(prev.contacts?.faculty_advisor || {}), mobile: e.target.value }
                }
              }))}
              className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewDescriptionPage;
