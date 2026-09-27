const fs = require('fs');
const path = '/Users/vedavyaasmr/IdeaProjects/INTRAMS_ERM_BACKEND_2026/src/services/inventoryService.js';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `    if (updateData.price_per_unit !== undefined) item.price_per_unit = parseFloat(updateData.price_per_unit);
    if (updateData.reorder_level !== undefined) item.reorder_level = parseInt(updateData.reorder_level, 10);`;

const newCode = `    if (updateData.price_per_unit !== undefined && !isNaN(parseFloat(updateData.price_per_unit))) item.price_per_unit = parseFloat(updateData.price_per_unit);
    if (updateData.reorder_level !== undefined && !isNaN(parseInt(updateData.reorder_level, 10))) item.reorder_level = parseInt(updateData.reorder_level, 10);`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(path, content);
console.log('Patched inventoryService.js');
