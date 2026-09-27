const fs = require('fs');
let content = fs.readFileSync('admin/src/utils/generateEventItemsPdf.js', 'utf8');

const oldItemDraw = `
      const itemName = String(it.item_name || it.name || 'Unknown Item').trim();
      const maxNameWidth = itemColWidths[1] - 16;
      let fontSize = 9;
      let nameWidth = fontRegular.widthOfTextAtSize(itemName, fontSize);
      let dValue = itemName;
      
      if (nameWidth > maxNameWidth) {
        while (nameWidth > maxNameWidth && dValue.length > 3) {
          dValue = dValue.slice(0, -1);
          nameWidth = fontRegular.widthOfTextAtSize(dValue + '...', fontSize);
        }
        dValue = dValue + '...';
      }

      const rowH = 24;

      if (currentY - rowH < 70) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader(currentPage);
        currentY = pageHeight - 120;
        drawTableHeader();
      }

      const topY = currentY - 16;
      const snoStr = String(iIdx + 1);
      const snoW = fontRegular.widthOfTextAtSize(snoStr, 9);
      currentPage.drawText(snoStr, { x: tX + (itemColWidths[0] - snoW) / 2, y: topY, size: 9, font: fontRegular, color: rgb(0.06, 0.06, 0.06) });

      const nameX = tX + itemColWidths[0] + 8;
      currentPage.drawText(dValue, { x: nameX, y: topY, size: 9, font: fontRegular, color: rgb(0,0,0) });

      const qtyX = tX + itemColWidths[0] + itemColWidths[1];
      const qtyStr = String(qty);
      const qtyW = fontRegular.widthOfTextAtSize(qtyStr, 9);
      currentPage.drawText(qtyStr, { x: qtyX + (itemColWidths[2] - qtyW) / 2, y: topY, size: 9, font: fontRegular, color: rgb(0.06, 0.06, 0.06) });

      const priceX = qtyX + itemColWidths[2];
      const priceStr = \`Rs. \${unitPrice.toFixed(2)}\`;
      const priceW = fontRegular.widthOfTextAtSize(priceStr, 9);
      currentPage.drawText(priceStr, { x: priceX + itemColWidths[3] - priceW - 8, y: topY, size: 9, font: fontRegular, color: rgb(0.06, 0.06, 0.06) });

      const amtX = priceX + itemColWidths[3];
      const amtStr = \`Rs. \${total.toFixed(2)}\`;
      const amtW = fontRegular.widthOfTextAtSize(amtStr, 9);
      currentPage.drawText(amtStr, { x: amtX + itemColWidths[4] - amtW - 10, y: topY, size: 9, font: fontRegular, color: rgb(0.06, 0.06, 0.06) });

      currentPage.drawLine({ start: { x: tX, y: currentY - rowH }, end: { x: tX + tableWidth, y: currentY - rowH }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
      currentY -= rowH;
`;

const newItemDraw = `
      const itemName = String(it.item_name || it.name || 'Unknown Item').trim();
      const maxNameWidth = itemColWidths[1] - 16;
      let fontSize = 9;
      
      const itemLines = wrapText(itemName, maxNameWidth, fontRegular, fontSize);
      
      const lineHeight = 12;
      const rowH = Math.max(24, (itemLines.length * lineHeight) + 8);

      if (currentY - rowH < 70) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader(currentPage);
        currentY = pageHeight - 120;
        drawTableHeader();
      }

      const topY = currentY - 14;
      
      const snoStr = String(iIdx + 1);
      const snoW = fontRegular.widthOfTextAtSize(snoStr, 9);
      currentPage.drawText(snoStr, { x: tX + (itemColWidths[0] - snoW) / 2, y: topY, size: 9, font: fontRegular, color: rgb(0.06, 0.06, 0.06) });

      const nameX = tX + itemColWidths[0] + 8;
      let currentItemY = topY;
      itemLines.forEach(line => {
        currentPage.drawText(line, { x: nameX, y: currentItemY, size: 9, font: fontRegular, color: rgb(0,0,0) });
        currentItemY -= lineHeight;
      });

      const qtyX = tX + itemColWidths[0] + itemColWidths[1];
      const qtyStr = String(qty);
      const qtyW = fontRegular.widthOfTextAtSize(qtyStr, 9);
      currentPage.drawText(qtyStr, { x: qtyX + (itemColWidths[2] - qtyW) / 2, y: topY, size: 9, font: fontRegular, color: rgb(0.06, 0.06, 0.06) });

      const priceX = qtyX + itemColWidths[2];
      const priceStr = \`Rs. \${unitPrice.toFixed(2)}\`;
      const priceW = fontRegular.widthOfTextAtSize(priceStr, 9);
      currentPage.drawText(priceStr, { x: priceX + itemColWidths[3] - priceW - 8, y: topY, size: 9, font: fontRegular, color: rgb(0.06, 0.06, 0.06) });

      const amtX = priceX + itemColWidths[3];
      const amtStr = \`Rs. \${total.toFixed(2)}\`;
      const amtW = fontRegular.widthOfTextAtSize(amtStr, 9);
      currentPage.drawText(amtStr, { x: amtX + itemColWidths[4] - amtW - 10, y: topY, size: 9, font: fontRegular, color: rgb(0.06, 0.06, 0.06) });

      currentPage.drawLine({ start: { x: tX, y: currentY - rowH }, end: { x: tX + tableWidth, y: currentY - rowH }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
      currentY -= rowH;
`;

if (content.includes("dValue = dValue.slice(0, -1);")) {
  content = content.replace(oldItemDraw.trim(), newItemDraw.trim());
  fs.writeFileSync('admin/src/utils/generateEventItemsPdf.js', content);
}
