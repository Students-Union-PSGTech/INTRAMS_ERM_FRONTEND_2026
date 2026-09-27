const fs = require('fs');
const path = '/Users/vedavyaasmr/IdeaProjects/INTRAMS_ERM_BACKEND_2026/src/services/eventService.js';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `      total_price: i.total_price,
      notes: i.notes,`;
const newCode = `      total_price: i.total_price,
      notes: i.notes,
      is_returnable: i.item_id ? Boolean(i.item_id.is_returnable) : false,`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(path, content);
console.log('Patched formattedItems to include is_returnable');
