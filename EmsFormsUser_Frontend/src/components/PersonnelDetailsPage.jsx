import React from 'react';
import { Users, UserCheck, ShieldCheck, Award } from 'lucide-react';

const ENGINEERING_DEPARTMENTS = [
  'Apparel & Fashion Design',
  'Applied Science',
  'Automobile Engineering',
  'Biomedical Engineering',
  'Biotechnology',
  'Civil Engineering',
  'Computational Sciences',
  'Computer Applications (MCA)',
  'Computer Science & Engineering',
  'Electrical & Electronics Engineering',
  'Electronics & Communication Engineering',
  'Fashion Technology',
  'Information Technology',
  'Instrumentation & Control Systems Engineering',
  'Management Studies (MBA)',
  'Mechanical Engineering',
  'Metallurgical Engineering',
  'Production Engineering',
  'Robotics & Automation Engineering',
  'Textile Technology'
];

const MSC_PROGRAMMES = [
  'M.Sc. Applied Mathematics',
  'M.Sc. Computational Finance',
  'M.Sc. Cyber Security',
  'M.Sc. Data Science',
  'M.Sc. Software Systems',
  'M.Sc. Theoretical Computer Science',
  'M.Sc. Fashion Design & Merchandising'
];

const DEPARTMENTS = [
  'Select Department',
  ...ENGINEERING_DEPARTMENTS,
  ...MSC_PROGRAMMES
];

const YEARS = ['Select Year', 'I Year', 'II Year', 'III Year', 'IV Year', 'V Year', 'M.Sc 5-yr'];

function PersonnelDetailsPage({ formData, setFormData, errors = {} }) {
  const [hasJudge, setHasJudge] = React.useState(Array.isArray(formData.contacts?.judges) ? formData.contacts.judges.some(j => j.name) : !!formData.contacts?.judge?.name);
  const [hasChiefGuest, setHasChiefGuest] = React.useState(Array.isArray(formData.contacts?.chief_guests) ? formData.contacts.chief_guests.some(c => c.name) : !!formData.contacts?.chief_guest?.name);

  const updateChiefGuest = (index, field, value) => {
    setFormData((prev) => {
      const currentChiefs = Array.isArray(prev.contacts?.chief_guests) 
        ? [...prev.contacts.chief_guests] 
        : (prev.contacts?.chief_guest ? [{...prev.contacts.chief_guest}] : [{ name: '', designation: '', remuneration: '', accommodation_required: false, travel_required: false, short_note: '' }]);
      
      if (!currentChiefs[index]) currentChiefs[index] = { name: '', designation: '', remuneration: '', accommodation_required: false, travel_required: false, short_note: '' };
      currentChiefs[index] = { ...currentChiefs[index], [field]: value };
      
      return {
        ...prev,
        contacts: {
          ...(prev.contacts || {}),
          chief_guests: currentChiefs
        }
      };
    });
  };

  const addChiefGuest = () => {
    setFormData((prev) => {
      const currentChiefs = Array.isArray(prev.contacts?.chief_guests) 
        ? [...prev.contacts.chief_guests] 
        : (prev.contacts?.chief_guest ? [{...prev.contacts.chief_guest}] : [{ name: '', designation: '', remuneration: '', accommodation_required: false, travel_required: false, short_note: '' }]);
      
      return {
        ...prev,
        contacts: {
          ...(prev.contacts || {}),
          chief_guests: [...currentChiefs, { name: '', designation: '', remuneration: '', accommodation_required: false, travel_required: false, short_note: '' }]
        }
      };
    });
  };

  const removeChiefGuest = (index) => {
    setFormData((prev) => {
      const currentChiefs = Array.isArray(prev.contacts?.chief_guests) 
        ? [...prev.contacts.chief_guests] 
        : [];
      
      if (currentChiefs.length <= 1) return prev;
      
      const newChiefs = currentChiefs.filter((_, i) => i !== index);
      return {
        ...prev,
        contacts: {
          ...(prev.contacts || {}),
          chief_guests: newChiefs
        }
      };
    });
  };

  const updateSecretary = (index, field, value) => {
    setFormData((prev) => {
      const currentSecs = [...(prev.contacts?.secretaries || [
        { name: '', roll_number: '', mobile: '', department: '', year: '' },
        { name: '', roll_number: '', mobile: '', department: '', year: '' }
      ])];
      currentSecs[index] = { ...(currentSecs[index] || {}), [field]: value };
      return {
        ...prev,
        contacts: {
          ...(prev.contacts || {}),
          secretaries: currentSecs,
          secretary: currentSecs[0]
        }
      };
    });
  };

  const updateConvenor = (index, field, value) => {
    setFormData((prev) => {
      const currentConvs = [...(prev.contacts?.convenors || [
        { name: '', roll_number: '', mobile: '', department: '', year: '' },
        { name: '', roll_number: '', mobile: '', department: '', year: '' }
      ])];
      currentConvs[index] = { ...(currentConvs[index] || {}), [field]: value };
      return {
        ...prev,
        contacts: {
          ...(prev.contacts || {}),
          convenors: currentConvs
        }
      };
    });
  };

  const updateVolunteer = (index, field, value) => {
    setFormData((prev) => {
      const currentVols = [...(prev.contacts?.volunteers || [
        { name: '', roll_number: '', mobile: '', department: '', year: '' },
        { name: '', roll_number: '', mobile: '', department: '', year: '' }
      ])];
      currentVols[index] = { ...(currentVols[index] || {}), [field]: value };
      return {
        ...prev,
        contacts: {
          ...(prev.contacts || {}),
          volunteers: currentVols
        }
      };
    });
  };

  const updateFacultyAdvisor = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      contacts: {
        ...(prev.contacts || {}),
        faculty_advisor: {
          ...(prev.contacts?.faculty_advisor || {}),
          [field]: value
        }
      }
    }));
  };

  const updateJudge = (index, field, value) => {
    setFormData((prev) => {
      const currentJudges = Array.isArray(prev.contacts?.judges) 
        ? [...prev.contacts.judges] 
        : (prev.contacts?.judge ? [{...prev.contacts.judge}] : [{ name: '', designation: '', mobile: '' }]);
      
      if (!currentJudges[index]) currentJudges[index] = { name: '', designation: '', mobile: '' };
      currentJudges[index] = { ...currentJudges[index], [field]: value };
      
      return {
        ...prev,
        contacts: {
          ...(prev.contacts || {}),
          judges: currentJudges
        }
      };
    });
  };

  const addJudge = () => {
    setFormData((prev) => {
      const currentJudges = Array.isArray(prev.contacts?.judges) 
        ? [...prev.contacts.judges] 
        : (prev.contacts?.judge ? [{...prev.contacts.judge}] : [{ name: '', designation: '', mobile: '' }]);
      
      return {
        ...prev,
        contacts: {
          ...(prev.contacts || {}),
          judges: [...currentJudges, { name: '', designation: '', mobile: '' }]
        }
      };
    });
  };

  const removeJudge = (index) => {
    setFormData((prev) => {
      const currentJudges = Array.isArray(prev.contacts?.judges) 
        ? [...prev.contacts.judges] 
        : [];
      
      if (currentJudges.length <= 1) return prev;
      
      const newJudges = currentJudges.filter((_, i) => i !== index);
      return {
        ...prev,
        contacts: {
          ...(prev.contacts || {}),
          judges: newJudges
        }
      };
    });
  };

  const secs = formData.contacts?.secretaries || [
    formData.contacts?.secretary || { name: '', roll_number: '', mobile: '', department: '', year: '' },
    { name: '', roll_number: '', mobile: '', department: '', year: '' }
  ];
  const convs = formData.contacts?.convenors || [
    { name: '', roll_number: '', mobile: '', department: '', year: '' },
    { name: '', roll_number: '', mobile: '', department: '', year: '' }
  ];
  const vols = formData.contacts?.volunteers || [
    { name: '', roll_number: '', mobile: '', department: '', year: '' },
    { name: '', roll_number: '', mobile: '', department: '', year: '' }
  ];
  const faculty = formData.contacts?.faculty_advisor || { name: '', designation: '', mobile: '' };
  const judges = Array.isArray(formData.contacts?.judges) ? formData.contacts.judges : (formData.contacts?.judge ? [formData.contacts.judge] : [{ name: '', designation: '', mobile: '' }]);
  const chief_guests = Array.isArray(formData.contacts?.chief_guests) ? formData.contacts.chief_guests : (formData.contacts?.chief_guest ? [formData.contacts.chief_guest] : [{ name: '', designation: '', remuneration: '', accommodation_required: false, travel_required: false, short_note: '' }]);

  const renderStudentForm = (title, data, onUpdate, isRequired = true) => (
    <div className="glass-card border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
      <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-slate-800 pb-2 font-heading">
        {title} {isRequired && <span className="text-rose-400">*</span>}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-sky-200/90 uppercase mb-1">
            Name {isRequired && <span className="text-rose-400">*</span>}
          </label>
          <input
            type="text"
            placeholder="e.g. John Doe"
            value={data.name || ''}
            onChange={(e) => onUpdate('name', e.target.value)}
            className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-sky-200/90 uppercase mb-1">
            Roll Number {isRequired && <span className="text-rose-400">*</span>}
          </label>
          <input
            type="text"
            placeholder="e.g. 21CS001"
            value={data.roll_number || ''}
            onChange={(e) => onUpdate('roll_number', e.target.value)}
            className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-sky-200/90 uppercase mb-1">
            Mobile No {isRequired && <span className="text-rose-400">*</span>}
          </label>
          <input
            type="text"
            placeholder="10 digits"
            value={data.mobile || ''}
            onChange={(e) => onUpdate('mobile', e.target.value)}
            className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-sky-200/90 uppercase mb-1">
            Department {isRequired && <span className="text-rose-400">*</span>}
          </label>
          <select
            value={data.department || ''}
            onChange={(e) => onUpdate('department', e.target.value)}
            className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none"
          >
            <option value="" className="bg-slate-900 text-white">Select Department</option>
            <optgroup label="Departments / Engineering" className="bg-slate-900 text-sky-400 font-bold">
              {ENGINEERING_DEPARTMENTS.map((dept, i) => (
                <option key={`eng-${i}`} value={dept} className="bg-slate-900 text-white font-normal">
                  {dept}
                </option>
              ))}
            </optgroup>
            <optgroup label="M.Sc. Programmes" className="bg-slate-900 text-sky-400 font-bold">
              {MSC_PROGRAMMES.map((dept, i) => (
                <option key={`msc-${i}`} value={dept} className="bg-slate-900 text-white font-normal">
                  {dept}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-sky-200/90 uppercase mb-1">
            Year {isRequired && <span className="text-rose-400">*</span>}
          </label>
          <select
            value={data.year || ''}
            onChange={(e) => onUpdate('year', e.target.value)}
            className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none"
          >
            {YEARS.map((yr, i) => (
              <option key={i} value={yr === 'Select Year' ? '' : yr} className="bg-slate-900 text-white">
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 text-slate-100 font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 shadow-2xl text-center">
        <h2 className="text-2xl font-extrabold text-white font-heading uppercase flex items-center justify-center gap-2">
          <Users className="w-6 h-6 text-sky-400" /> Personnel Details
        </h2>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Fill in the complete information for event personnel
        </p>
      </div>

      {/* Secretary Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-heading">Secretary Details</h3>
        {renderStudentForm('Secretary 1', secs[0] || {}, (f, v) => updateSecretary(0, f, v), true)}
        {renderStudentForm('Secretary 2', secs[1] || {}, (f, v) => updateSecretary(1, f, v), true)}
      </div>

      {/* Convenor Details */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-heading">Convenor Details</h3>
        {renderStudentForm('Convenor 1', convs[0] || {}, (f, v) => updateConvenor(0, f, v), true)}
        {renderStudentForm('Convenor 2', convs[1] || {}, (f, v) => updateConvenor(1, f, v), true)}
      </div>

      {/* Volunteer Details */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-heading">Volunteer Details</h3>
        {renderStudentForm('Volunteer 1', vols[0] || {}, (f, v) => updateVolunteer(0, f, v), true)}
        {renderStudentForm('Volunteer 2', vols[1] || {}, (f, v) => updateVolunteer(1, f, v), false)}
      </div>

      {/* Faculty Advisor Details */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 font-heading">
          Faculty Advisor Details <span className="text-rose-400">*</span>
        </h3>
        <div className="glass-card border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-sky-200/90 uppercase mb-1">
                Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Faculty Name"
                value={faculty.name || ''}
                onChange={(e) => updateFacultyAdvisor('name', e.target.value)}
                className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-sky-200/90 uppercase mb-1">
                Designation <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Associate Professor"
                value={faculty.designation || ''}
                onChange={(e) => updateFacultyAdvisor('designation', e.target.value)}
                className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-sky-200/90 uppercase mb-1">
                Contact Details <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Mobile or Email"
                value={faculty.mobile || ''}
                onChange={(e) => updateFacultyAdvisor('mobile', e.target.value)}
                className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
              />
            </div>
          </div>
        </div>
      </div>


      {/* Judge Details */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 font-heading">
            Judge Details
          </h3>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-sky-200">
            <input 
              type="checkbox" 
              className="accent-sky-500 w-4 h-4"
              checked={hasJudge}
              onChange={(e) => {
                const checked = e.target.checked;
                setHasJudge(checked);
                if (!checked) {
                  setFormData(prev => ({
                    ...prev,
                    contacts: { ...prev.contacts, judges: [{ name: '', designation: '', mobile: '' }] }
                  }));
                }
              }}
            />
            Include Judge Details
          </label>
        </div>

        {hasJudge && (
          <div className="space-y-3">
            {judges.map((j, index) => (
              <div key={index} className="glass-card border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative">
                {judges.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeJudge(index)}
                    className="absolute top-4 right-4 text-rose-400 hover:text-rose-300 bg-rose-400/10 hover:bg-rose-400/20 p-1.5 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                )}
                <h4 className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-3">Judge {index + 1}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-sky-200/90 uppercase mb-1">
                      Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Judge Name"
                      value={j.name || ''}
                      onChange={(e) => updateJudge(index, 'name', e.target.value)}
                      className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-sky-200/90 uppercase mb-1">
                      Designation <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Architect / Professor"
                      value={j.designation || ''}
                      onChange={(e) => updateJudge(index, 'designation', e.target.value)}
                      className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-sky-200/90 uppercase mb-1">
                      Contact Details <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Mobile or Email"
                      value={j.mobile || ''}
                      onChange={(e) => updateJudge(index, 'mobile', e.target.value)}
                      className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-end mt-2">
              <button 
                type="button" 
                onClick={addJudge}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-xl text-xs font-bold uppercase transition-colors"
              >
                <span className="text-lg leading-none">+</span> Add Another Judge
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chief Guest Details */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 font-heading">
            Chief Guest Details
          </h3>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-sky-200">
            <input 
              type="checkbox" 
              className="accent-sky-500 w-4 h-4"
              checked={hasChiefGuest}
              onChange={(e) => {
                const checked = e.target.checked;
                setHasChiefGuest(checked);
                if (!checked) {
                  setFormData(prev => ({
                    ...prev,
                    contacts: { ...prev.contacts, chief_guests: [{ name: '', designation: '', remuneration: '', accommodation_required: false, travel_required: false, short_note: '' }] }
                  }));
                }
              }}
            />
            Include Chief Guest Details
          </label>
        </div>

        {hasChiefGuest && (
          <div className="space-y-3">
            {chief_guests.map((cg, index) => (
              <div key={index} className="glass-card border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative">
                {chief_guests.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeChiefGuest(index)}
                    className="absolute top-4 right-4 text-rose-400 hover:text-rose-300 bg-rose-400/10 hover:bg-rose-400/20 p-1.5 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                )}
                <h4 className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-3">Chief Guest {index + 1}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-sky-200/90 uppercase mb-1">
                      Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Chief Guest Name"
                      value={cg.name || ''}
                      onChange={(e) => updateChiefGuest(index, 'name', e.target.value)}
                      className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-sky-200/90 uppercase mb-1">
                      Designation <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CEO / Director"
                      value={cg.designation || ''}
                      onChange={(e) => updateChiefGuest(index, 'designation', e.target.value)}
                      className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-sky-200/90 uppercase mb-1">
                      Remuneration <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5000 or None"
                      value={cg.remuneration || ''}
                      onChange={(e) => updateChiefGuest(index, 'remuneration', e.target.value)}
                      className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-sky-200/90 uppercase cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-sky-500 w-4 h-4"
                        checked={cg.accommodation_required || false}
                        onChange={(e) => updateChiefGuest(index, 'accommodation_required', e.target.checked)}
                      />
                      Accommodation required
                    </label>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-sky-200/90 uppercase cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-sky-500 w-4 h-4"
                        checked={cg.travel_required || false}
                        onChange={(e) => updateChiefGuest(index, 'travel_required', e.target.checked)}
                      />
                      Travel required
                    </label>
                  </div>
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                    <label className="block text-[11px] font-bold text-sky-200/90 uppercase mb-1">
                      Short note on the Chief guest
                    </label>
                    <textarea
                      placeholder="Brief note about the chief guest..."
                      value={cg.short_note || ''}
                      onChange={(e) => updateChiefGuest(index, 'short_note', e.target.value)}
                      className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500 resize-none h-20"
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-end mt-2">
              <button 
                type="button" 
                onClick={addChiefGuest}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-xl text-xs font-bold uppercase transition-colors"
              >
                <span className="text-lg leading-none">+</span> Add Another Chief Guest
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PersonnelDetailsPage;
