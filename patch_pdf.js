const fs = require('fs');

function patchPdf(path) {
  let content = fs.readFileSync(path, 'utf8');

  const oldJudgeLogic = `  const judgeObj = ev.contacts?.judge || ev.judge || {};
  const judgeRows = judgeObj.name && judgeObj.name.trim() ? [
    [judgeObj.name || '', judgeObj.designation || '', judgeObj.mobile || judgeObj.phone || '']
  ] : [];`;

  const newJudgeLogic = `  const judgesArray = Array.isArray(ev.contacts?.judges) ? ev.contacts.judges : (ev.contacts?.judge ? [ev.contacts.judge] : (ev.judge ? [ev.judge] : []));
  const judgeRows = judgesArray.filter(j => j && j.name && j.name.trim()).map(j => [
    j.name || '', j.designation || '', j.mobile || j.phone || ''
  ]);`;

  content = content.replace(oldJudgeLogic, newJudgeLogic);
  fs.writeFileSync(path, content);
}

patchPdf('admin/src/utils/generateEventPdf.js');
patchPdf('EmsFormsUser_Frontend/src/utils/generateEventPdf.js');

console.log('PDFs patched!');
