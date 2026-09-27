const fs = require('fs');
const path = '/Users/vedavyaasmr/IdeaProjects/INTRAMS_ERM_BACKEND_2026/src/services/inventoryService.js';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `  static async deleteItem(itemId) {
    const item = await Item.findById(itemId);
    if (!item) throw { status: 404, message: 'Item not found' };
    item.is_active = false;
    await item.save();
    return true;
  }`;

const newCode = `  static async deleteItem(itemId) {
    const item = await Item.findById(itemId);
    if (!item) throw { status: 404, message: 'Item not found' };
    
    // Fix for legacy items without item_code throwing validation errors on delete
    if (!item.item_code) {
      item.item_code = \`ITM-\${(item.item_name || 'ITEM').replace(/\\s+/g, '').substring(0, 4).toUpperCase()}-\${Math.floor(100 + Math.random() * 900)}\`;
    }
    
    item.is_active = false;
    await item.save();
    return true;
  }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(path, content);
console.log('Patched inventoryService.js for deleteItem validation');
