const fs = require('fs');
const path = 'EmsFormsUser_Frontend/src/components/PersonnelDetailsPage.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const [hasJudge, setHasJudge] = React.useState(!!formData.contacts?.judge?.name);",
  "const [hasJudge, setHasJudge] = React.useState(Array.isArray(formData.contacts?.judges) ? formData.contacts.judges.some(j => j.name) : !!formData.contacts?.judge?.name);"
);

const oldUpdateJudge = `  const updateJudge = (field, value) => {
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
  };`;

const newUpdateJudge = `  const updateJudge = (index, field, value) => {
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
  };`;

content = content.replace(oldUpdateJudge, newUpdateJudge);

content = content.replace(
  "const judge = formData.contacts?.judge || { name: '', designation: '', mobile: '' };",
  "const judges = Array.isArray(formData.contacts?.judges) ? formData.contacts.judges : (formData.contacts?.judge ? [formData.contacts.judge] : [{ name: '', designation: '', mobile: '' }]);"
);

content = content.replace(
  `                if (!checked) {
                  updateJudge('name', '');
                  updateJudge('designation', '');
                  updateJudge('mobile', '');
                }`,
  `                if (!checked) {
                  setFormData(prev => ({
                    ...prev,
                    contacts: { ...prev.contacts, judges: [{ name: '', designation: '', mobile: '' }] }
                  }));
                }`
);

const oldJudgeForm = `{hasJudge && (
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
        )}`;

const newJudgeForm = `{hasJudge && (
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
        )}`;

content = content.replace(oldJudgeForm, newJudgeForm);

fs.writeFileSync(path, content);
console.log('Frontend patched!');
