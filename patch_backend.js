const fs = require('fs');
const path = '/Users/vedavyaasmr/IdeaProjects/INTRAMS_ERM_BACKEND_2026/src/services/eventService.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const judge = contacts.find(c => c.role === 'Judge') || {};",
  "const judges = contacts.filter(c => c.role === 'Judge');\n    const judge = judges[0] || {};"
);

content = content.replace(
  "volunteers: volunteers.map(v => ({ name: v.name, roll_number: v.roll_number, department: v.department, year: v.year, mobile: v.mobile })),",
  "volunteers: volunteers.map(v => ({ name: v.name, roll_number: v.roll_number, department: v.department, year: v.year, mobile: v.mobile })),\n        judges: judges.map(j => ({ name: j.name, designation: j.designation, mobile: j.mobile })),"
);

const oldCreateJudge = `    if (contacts.judge?.name) {
      contactPersons.push({
        submission_id: eventId,
        role: 'Judge',
        name: contacts.judge.name,
        designation: contacts.judge.designation || '',
        mobile: contacts.judge.mobile || ''
      });
    }`;
const newCreateJudge = `    if (Array.isArray(contacts.judges)) {
      for (const j of contacts.judges) {
        if (j.name && j.name.trim()) {
          contactPersons.push({
            submission_id: eventId,
            role: 'Judge',
            name: j.name,
            designation: j.designation || '',
            mobile: j.mobile || ''
          });
        }
      }
    } else if (contacts.judge?.name) {
      contactPersons.push({
        submission_id: eventId,
        role: 'Judge',
        name: contacts.judge.name,
        designation: contacts.judge.designation || '',
        mobile: contacts.judge.mobile || ''
      });
    }`;
content = content.replace(oldCreateJudge, newCreateJudge);

const oldUpdateJudge = `      if (contacts.judge?.name) {
        contactPersons.push({
          submission_id: eventId,
          role: 'Judge',
          name: contacts.judge.name,
          designation: contacts.judge.designation || '',
          mobile: contacts.judge.mobile || ''
        });
      }`;
const newUpdateJudge = `      if (Array.isArray(contacts.judges)) {
        for (const j of contacts.judges) {
          if (j.name && j.name.trim()) {
            contactPersons.push({
              submission_id: eventId,
              role: 'Judge',
              name: j.name,
              designation: j.designation || '',
              mobile: j.mobile || ''
            });
          }
        }
      } else if (contacts.judge?.name) {
        contactPersons.push({
          submission_id: eventId,
          role: 'Judge',
          name: contacts.judge.name,
          designation: contacts.judge.designation || '',
          mobile: contacts.judge.mobile || ''
        });
      }`;
content = content.replace(oldUpdateJudge, newUpdateJudge);

fs.writeFileSync(path, content);
console.log('Backend eventService.js patched!');
