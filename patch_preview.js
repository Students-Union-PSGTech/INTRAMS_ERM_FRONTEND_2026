const fs = require('fs');

function patchPreview(path) {
  let content = fs.readFileSync(path, 'utf8');

  const oldJudge = `{formData.contacts.judge?.name && (
              <div className="bg-slate-950/70 p-4 rounded-2xl text-xs text-slate-300 border border-slate-800">
                <span className="font-bold text-sky-400 block mb-1 uppercase tracking-wider">Judge</span>
                <div><span className="text-slate-400">Name:</span> {formData.contacts.judge.name}</div>
                <div><span className="text-slate-400">Designation:</span> {formData.contacts.judge.designation || 'N/A'}</div>
                <div><span className="text-slate-400">Contact:</span> {formData.contacts.judge.mobile || 'N/A'}</div>
              </div>
            )}`;

  const newJudge = `{(Array.isArray(formData.contacts?.judges) ? formData.contacts.judges : (formData.contacts?.judge ? [formData.contacts.judge] : [])).filter(j => j?.name).map((judge, idx) => (
              <div key={idx} className="bg-slate-950/70 p-4 rounded-2xl text-xs text-slate-300 border border-slate-800">
                <span className="font-bold text-sky-400 block mb-1 uppercase tracking-wider">Judge {idx + 1}</span>
                <div><span className="text-slate-400">Name:</span> {judge.name}</div>
                <div><span className="text-slate-400">Designation:</span> {judge.designation || 'N/A'}</div>
                <div><span className="text-slate-400">Contact:</span> {judge.mobile || 'N/A'}</div>
              </div>
            ))}`;

  content = content.replace(oldJudge, newJudge);
  fs.writeFileSync(path, content);
}

function patchDetails(path) {
  let content = fs.readFileSync(path, 'utf8');

  const oldJudge = `{event.contacts.judge?.name && (
                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 text-sm text-slate-300">
                    <span className="font-bold text-sky-400 block mb-2 uppercase tracking-wider">Judge</span>
                    <div><span className="text-slate-400">Name:</span> {event.contacts.judge.name}</div>
                    <div><span className="text-slate-400">Designation:</span> {event.contacts.judge.designation || 'N/A'}</div>
                    <div><span className="text-slate-400">Contact:</span> {event.contacts.judge.mobile || 'N/A'}</div>
                  </div>
                )}`;

  const newJudge = `{(Array.isArray(event.contacts?.judges) ? event.contacts.judges : (event.contacts?.judge ? [event.contacts.judge] : [])).filter(j => j?.name).map((judge, idx) => (
                  <div key={idx} className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 text-sm text-slate-300">
                    <span className="font-bold text-sky-400 block mb-2 uppercase tracking-wider">Judge {idx + 1}</span>
                    <div><span className="text-slate-400">Name:</span> {judge.name}</div>
                    <div><span className="text-slate-400">Designation:</span> {judge.designation || 'N/A'}</div>
                    <div><span className="text-slate-400">Contact:</span> {judge.mobile || 'N/A'}</div>
                  </div>
                ))}`;

  content = content.replace(oldJudge, newJudge);
  fs.writeFileSync(path, content);
}

patchPreview('EmsFormsUser_Frontend/src/components/EventPreview.jsx');
patchPreview('admin/src/components/EventPreview.jsx');
patchDetails('EmsFormsUser_Frontend/src/components/EventDetails.jsx');

console.log('Previews patched!');
