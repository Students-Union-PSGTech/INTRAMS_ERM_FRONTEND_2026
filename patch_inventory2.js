const fs = require('fs');
const path = '/Users/vedavyaasmr/IdeaProjects/INTRAMS_ERM_BACKEND_2026/src/services/inventoryService.js';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `    item.updated_by = adminId;
    await item.save();`;

const newCode = `    item.updated_by = adminId;
    if (!item.item_code) {
      item.item_code = \`ITM-\${(item.item_name || 'ITEM').replace(/\\s+/g, '').substring(0, 4).toUpperCase()}-\${Math.floor(100 + Math.random() * 900)}\`;
    }
    await item.save();`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(path, content);
console.log('Patched inventoryService.js for item_code validation fallback');
