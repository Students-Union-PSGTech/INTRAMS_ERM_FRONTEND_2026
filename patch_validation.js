const fs = require('fs');
const path = 'EmsFormsUser_Frontend/src/utils/stepValidation.js';
let content = fs.readFileSync(path, 'utf8');

const oldCheckJudgeCall = `    checkJudge(contacts.judge);`;
const newCheckJudgeCall = `    if (Array.isArray(contacts.judges)) {
      contacts.judges.forEach((j, idx) => {
        if (j.name || j.designation || j.mobile) {
          checkJudge(j, idx);
        }
      });
    } else {
      checkJudge(contacts.judge);
    }`;

content = content.replace(oldCheckJudgeCall, newCheckJudgeCall);

const oldCheckJudgeFunc = `    const checkJudge = (judge) => {
      if (!judge) return;
      const name = (judge.name || '').trim();
      const designation = (judge.designation || '').trim();
      const mobile = (judge.mobile || judge.phone || '').trim();

      if (name || designation || mobile) {
        if (!name) errors.judgeName = 'Judge name is required if details are provided';
        if (!designation) errors.judgeDesignation = 'Judge designation is required';
        if (!mobile) errors.judgeMobile = 'Judge mobile/email is required';
      }
    };`;

const newCheckJudgeFunc = `    const checkJudge = (judge, idx = '') => {
      if (!judge) return;
      const name = (judge.name || '').trim();
      const designation = (judge.designation || '').trim();
      const mobile = (judge.mobile || judge.phone || '').trim();

      if (name || designation || mobile) {
        const prefix = idx !== '' ? 'Judge ' + (idx + 1) + ' ' : 'Judge ';
        if (!name) errors['judgeName' + idx] = prefix + 'name is required if details are provided';
        if (!designation) errors['judgeDesignation' + idx] = prefix + 'designation is required';
        if (!mobile) errors['judgeMobile' + idx] = prefix + 'mobile/email is required';
      }
    };`;

content = content.replace(oldCheckJudgeFunc, newCheckJudgeFunc);

fs.writeFileSync(path, content);
console.log('Validation patched!');
