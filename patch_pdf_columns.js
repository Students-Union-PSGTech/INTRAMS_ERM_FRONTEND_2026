const fs = require('fs');

function patch(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Regex to match from `const itemColWidths = ` to the end of table drawing loop.
  // It's easier to use replace block by block.

  const oldHeaders = `    const itemColWidths = [35, 230.28, 45, 85, 100];
    const tableWidth = itemColWidths.reduce((a, b) => a + b, 0);
    const itemHeaders = ['S.No', 'Item Name', 'Qty', 'Unit Price', 'Amount'];`;

  const newHeaders = `    const itemColWidths = [35, 185.28, 45, 45, 85, 100];
    const tableWidth = itemColWidths.reduce((a, b) => a + b, 0);
    const itemHeaders = ['S.No', 'Item Name', 'Return', 'Qty', 'Unit Price', 'Amount'];`;
    
  content = content.replace(oldHeaders, newHeaders);

  const oldHeaderDraw = `        if (idx === 0) {
          xPos = cellX + (w - textW) / 2;
        } else if (idx === 1) {
          xPos = cellX + 8;
        } else if (idx === 2) {
          xPos = cellX + (w - textW) / 2;
        } else if (idx === 3) {
          xPos = cellX + w - textW - 8;
        } else {
          xPos = cellX + w - textW - 10;
        }`;

  const newHeaderDraw = `        if (idx === 0) {
          xPos = cellX + (w - textW) / 2;
        } else if (idx === 1) {
          xPos = cellX + 8;
        } else if (idx === 2) {
          xPos = cellX + (w - textW) / 2; // Return
        } else if (idx === 3) {
          xPos = cellX + (w - textW) / 2; // Qty
        } else if (idx === 4) {
          xPos = cellX + w - textW - 8; // Unit Price
        } else {
          xPos = cellX + w - textW - 10; // Amount
        }`;
        
  content = content.replace(oldHeaderDraw, newHeaderDraw);

  const oldItemNameLogic = `      const returnableTag = it.is_returnable ? ' (Returnable)' : (it.is_custom ? '' : ' (Not Returnable)');
      const itemName = String(it.item_name || it.name || 'Unknown Item').trim() + returnableTag;`;
      
  const newItemNameLogic = `      const itemName = String(it.item_name || it.name || 'Unknown Item').trim();`;
  content = content.replace(oldItemNameLogic, newItemNameLogic);

  // Replace Qty, Price, Amount drawing to shift index by 1 and insert Return
  const oldColsDraw = `      // Col 2: Qty (centered)
      const qtyX = tX + itemColWidths[0] + itemColWidths[1];
      const qtyStr = String(qty);
      const qtyW = fontRegular.widthOfTextAtSize(qtyStr, 9);
      currentPage.drawText(qtyStr, {
        x: qtyX + (itemColWidths[2] - qtyW) / 2,
        y: firstLineY,
        size: 9,
        font: fontRegular,
        color: rgb(0.1, 0.1, 0.1),
      });

      // Col 3: Unit Price (right aligned)
      const priceX = qtyX + itemColWidths[2];
      const priceStr = \`Rs. \${unitPrice.toFixed(2)}\`;
      const priceW = fontRegular.widthOfTextAtSize(priceStr, 9);
      currentPage.drawText(priceStr, {
        x: priceX + itemColWidths[3] - priceW - 8,
        y: firstLineY,
        size: 9,
        font: fontRegular,
        color: rgb(0.1, 0.1, 0.1),
      });

      // Col 4: Amount (right aligned)
      const amtX = priceX + itemColWidths[3];
      const amtStr = \`Rs. \${total.toFixed(2)}\`;
      const amtW = fontRegular.widthOfTextAtSize(amtStr, 9);
      currentPage.drawText(amtStr, {
        x: amtX + itemColWidths[4] - amtW - 10,
        y: firstLineY,
        size: 9,
        font: fontRegular,
        color: rgb(0.1, 0.1, 0.1),
      });`;

  const newColsDraw = `      // Col 2: Return (centered)
      const retX = tX + itemColWidths[0] + itemColWidths[1];
      const retStr = it.is_custom ? '-' : (it.is_returnable ? 'YES' : 'NO');
      const retW = fontRegular.widthOfTextAtSize(retStr, 9);
      currentPage.drawText(retStr, {
        x: retX + (itemColWidths[2] - retW) / 2,
        y: firstLineY,
        size: 9,
        font: fontBold, // making it bold for visibility
        color: it.is_returnable ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0), // green for yes, red for no
      });

      // Col 3: Qty (centered)
      const qtyX = retX + itemColWidths[2];
      const qtyStr = String(qty);
      const qtyW = fontRegular.widthOfTextAtSize(qtyStr, 9);
      currentPage.drawText(qtyStr, {
        x: qtyX + (itemColWidths[3] - qtyW) / 2,
        y: firstLineY,
        size: 9,
        font: fontRegular,
        color: rgb(0.1, 0.1, 0.1),
      });

      // Col 4: Unit Price (right aligned)
      const priceX = qtyX + itemColWidths[3];
      const priceStr = \`Rs. \${unitPrice.toFixed(2)}\`;
      const priceW = fontRegular.widthOfTextAtSize(priceStr, 9);
      currentPage.drawText(priceStr, {
        x: priceX + itemColWidths[4] - priceW - 8,
        y: firstLineY,
        size: 9,
        font: fontRegular,
        color: rgb(0.1, 0.1, 0.1),
      });

      // Col 5: Amount (right aligned)
      const amtX = priceX + itemColWidths[4];
      const amtStr = \`Rs. \${total.toFixed(2)}\`;
      const amtW = fontRegular.widthOfTextAtSize(amtStr, 9);
      currentPage.drawText(amtStr, {
        x: amtX + itemColWidths[5] - amtW - 10,
        y: firstLineY,
        size: 9,
        font: fontRegular,
        color: rgb(0.1, 0.1, 0.1),
      });`;

  content = content.replace(oldColsDraw, newColsDraw);
  fs.writeFileSync(path, content);
}

patch('admin/src/utils/generateEventPdf.js');
patch('EmsFormsUser_Frontend/src/utils/generateEventPdf.js');

console.log('PDF column patched!');
