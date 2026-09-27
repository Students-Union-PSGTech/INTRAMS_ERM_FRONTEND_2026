const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, 'EmsFormsUser_Frontend', 'public', 'psg_logo.png');
const b64 = fs.readFileSync(logoPath).toString('base64');
const content = `export const PSG_LOGO_BASE64 = 'data:image/png;base64,${b64}';\n`;

const target1 = path.join(__dirname, 'EmsFormsUser_Frontend', 'src', 'utils', 'psgLogoBase64.js');
const target2 = path.join(__dirname, 'admin', 'src', 'utils', 'psgLogoBase64.js');

fs.writeFileSync(target1, content);
fs.writeFileSync(target2, content);
console.log('Successfully created psgLogoBase64.js in both frontend apps!');
