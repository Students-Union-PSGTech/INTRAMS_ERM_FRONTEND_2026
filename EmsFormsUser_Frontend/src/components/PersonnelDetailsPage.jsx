import React from 'react';
import { Users, UserCheck, ShieldCheck, Award } from 'lucide-react';

const DEPARTMENTS = [
  'Select Department',
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

const YEARS = ['Select Year', 'I Year', 'II Year', 'III Year', 'IV Year', 'M.Sc 5-yr'];

function PersonnelDetailsPage({ formData, setFormData, errors = {} }) {
  const [hasJudge, setHasJudge] = React.useState(!!formData.contacts?.judge?.name);

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

  const updateJudge = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      contacts: {
        ...(prev.contacts || {}),
        judge: {
          ...(prev.contacts?.judge || {}),
          [field]: value
        }
      }
    }));
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
  const judge = formData.contacts?.judge || { name: '', designation: '', mobile: '' };

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
            {DEPARTMENTS.map((dept, i) => (
              <option key={i} value={dept === 'Select Department' ? '' : dept} className="bg-slate-900 text-white">
                {dept}
              </option>
            ))}
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
        {renderStudentForm('Secretary 2', secs[1] || {}, (f, v) => updateSecretary(1, f, v), false)}
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
                  updateJudge('name', '');
                  updateJudge('designation', '');
                  updateJudge('mobile', '');
                }
              }}
            />
            Include Judge Details
          </label>
        </div>

        {hasJudge && (
          <div className="glass-card border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-sky-200/90 uppercase mb-1">
                Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Judge Name"
                value={judge.name || ''}
                onChange={(e) => updateJudge('name', e.target.value)}
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
                value={judge.designation || ''}
                onChange={(e) => updateJudge('designation', e.target.value)}
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
                value={judge.mobile || ''}
                onChange={(e) => updateJudge('mobile', e.target.value)}
                className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500"
              />
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PersonnelDetailsPage;
