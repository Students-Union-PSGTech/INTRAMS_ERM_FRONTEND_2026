const fs = require('fs');

function patchPdfItems(path) {
  let content = fs.readFileSync(path, 'utf8');

  const oldCode = `      const itemName = String(it.item_name || it.name || 'Unknown Item').trim();`;
  const newCode = `      const returnableTag = it.is_returnable ? ' (Returnable)' : (it.is_custom ? '' : ' (Not Returnable)');
      const itemName = String(it.item_name || it.name || 'Unknown Item').trim() + returnableTag;`;

  content = content.replace(oldCode, newCode);
  fs.writeFileSync(path, content);
}

patchPdfItems('admin/src/utils/generateEventPdf.js');
patchPdfItems('EmsFormsUser_Frontend/src/utils/generateEventPdf.js');

console.log('PDF items patched!');
