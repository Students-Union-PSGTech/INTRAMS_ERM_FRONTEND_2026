const fs = require('fs');

function patchPdf(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Replace judgeRows declaration
  const oldJudgeRows = `  const judgesArray = Array.isArray(ev.contacts?.judges) ? ev.contacts.judges : (ev.contacts?.judge ? [ev.contacts.judge] : (ev.judge ? [ev.judge] : []));
  const judgeRows = judgesArray.filter(j => j && j.name && j.name.trim()).map(j => [
    j.name || '', j.designation || '', j.mobile || j.phone || ''
  ]);`;

  const newJudgeRows = `  const judgesArray = Array.isArray(ev.contacts?.judges) ? ev.contacts.judges : (ev.contacts?.judge ? [ev.contacts.judge] : (ev.judge ? [ev.judge] : []));
  const validJudges = judgesArray.filter(j => j && j.name && j.name.trim());
  const hasMultipleJudges = validJudges.length > 1;
  const judgeRows = hasMultipleJudges
    ? validJudges.map((j, idx) => [\`Judge \${idx + 1}\`, j.name || '', j.designation || '', j.mobile || j.phone || ''])
    : validJudges.map(j => [j.name || '', j.designation || '', j.mobile || j.phone || '']);`;

  content = content.replace(oldJudgeRows, newJudgeRows);

  // Replace drawing logic
  const oldDrawJudge = `  if (judgeRows.length > 0) {
    drawPage3Section('Judge Details', p3ColWidths3, ['Name', 'Designation', 'Contact Details'], judgeRows);
  }`;

  const newDrawJudge = `  if (judgeRows.length > 0) {
    if (hasMultipleJudges) {
      const p3ColWidthsJudge = [75, 140, 140, 140.28];
      drawPage3Section('Judge Details', p3ColWidthsJudge, ['Judge', 'Name', 'Designation', 'Contact Details'], judgeRows);
    } else {
      drawPage3Section('Judge Details', p3ColWidths3, ['Name', 'Designation', 'Contact Details'], judgeRows);
    }
  }`;

  content = content.replace(oldDrawJudge, newDrawJudge);
  fs.writeFileSync(path, content);
}

patchPdf('admin/src/utils/generateEventPdf.js');
patchPdf('EmsFormsUser_Frontend/src/utils/generateEventPdf.js');

console.log('PDFs patched for multiple judge columns!');
