import "regenerator-runtime/runtime";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

function cleanText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[\r\n]+/g, ' ').replace(/[\t\f\v]/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

export async function generateItemsPdf({ data }) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  try {
    const tamilRes = await fetch('/fonts/NotoSansTamil-Regular.ttf');
    if (tamilRes.ok) {
      const tamilBytes = await tamilRes.arrayBuffer();
      if (!window.__pdfTamilFontLoaded) {
        try {
          const font = new FontFace('Noto Sans Tamil', tamilBytes);
          await font.load();
          document.fonts.add(font);
          window.__pdfTamilFontLoaded = true;
        } catch (e) {
          console.warn("Could not load FontFace", e);
        }
      }
    }
  } catch (e) {}

  const wrapFontWidth = (font) => {
    const origWidth = font.widthOfTextAtSize.bind(font);
    font.widthOfTextAtSize = (text, size) => {
      if (!text) return 0;
      const cleanStr = cleanText(text).replace(/\n/g, ' ');
      const hasTamil = /[\u0B80-\u0BFF]/.test(cleanStr);
      if (!hasTamil) return origWidth(cleanStr, size);
      
      const regexChunks = /[\u0B80-\u0BFF\u200C\u200D]+(?:[\s]+[\u0B80-\u0BFF\u200C\u200D]+)*|[^\u0B80-\u0BFF\u200C\u200D]+/g;
      const chunks = cleanStr.match(regexChunks) || [];
      let total = 0;
      
      const isBold = font === fontBold;
      if (!window.__pdfCanvasCtx) {
        const cvs = document.createElement('canvas');
        window.__pdfCanvasCtx = cvs.getContext('2d');
      }
      const ctx = window.__pdfCanvasCtx;
      
      for (const chunk of chunks) {
        if (/[\u0B80-\u0BFF]/.test(chunk)) {
          ctx.font = (isBold ? 'bold ' : '') + size + 'px "Noto Sans Tamil", Arial, sans-serif';
          total += ctx.measureText(chunk).width;
        } else {
          total += origWidth(chunk, size);
        }
      }
      return total;
    };
    return font;
  };

  wrapFontWidth(fontRegular);
  wrapFontWidth(fontBold);
  wrapFontWidth(fontItalic);

  
  const wrapText = (text, maxWidth, font, size) => {
    const words = String(text).split(' ');
    const lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = font.widthOfTextAtSize(currentLine + ' ' + word, size);
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const drawQueue = [];
  const genTime = new Date().toLocaleString('en-IN');

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  
  
  const originalAddPage = pdfDoc.addPage.bind(pdfDoc);
  pdfDoc.addPage = (...args) => {
    const page = originalAddPage(...args);
    const origDrawText = page.drawText.bind(page);
    const origDrawImage = page.drawImage.bind(page);
    
    page.drawText = (text, options) => {
      if (!text && text !== 0 && text !== '0') return;
      const cleanStr = cleanText(text).replace(/\n/g, ' ');
      const hasTamil = /[\u0B80-\u0BFF]/.test(cleanStr);
      
      if (hasTamil) {
        drawQueue.push({ type: 'tamil', origDrawText, origDrawImage, text: cleanStr, options, page });
      } else {
        const actualOptions = { ...options };
        drawQueue.push({ type: 'text', method: origDrawText, args: [cleanStr, actualOptions], page });
      }
    };
    return page;
  };

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);

  const drawPageBorder = (page) => {
    page.drawRectangle({
      x: 35, y: 35,
      width: pageWidth - 70, height: pageHeight - 70,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.5,
    });
  };

  const drawHeader = (page, isFirstPage = false, currentEventId = '') => {
    drawPageBorder(page);
    if (isFirstPage) {
      let titleY = pageHeight - 65;
      const titleText1 = 'PSG COLLEGE OF TECHNOLOGY';
      const w1 = fontBold.widthOfTextAtSize(titleText1, 16);
      page.drawText(titleText1, { x: (pageWidth - w1) / 2, y: titleY, size: 16, font: fontBold, color: rgb(0, 0, 0) });
      titleY -= 23;

      const titleText2 = 'STUDENTS UNION 2026-2027';
      const w2 = fontBold.widthOfTextAtSize(titleText2, 12);
      page.drawText(titleText2, { x: (pageWidth - w2) / 2, y: titleY, size: 12, font: fontBold, color: rgb(0, 0, 0) });
      titleY -= 22;

      const titleText3 = 'ITEM REQUEST & LOGISTICS INVOICE (ALL EVENTS)';
      const w3 = fontBold.widthOfTextAtSize(titleText3, 13);
      page.drawText(titleText3, { x: (pageWidth - w3) / 2, y: titleY, size: 13, font: fontBold, color: rgb(0, 0, 0) });
      page.drawLine({
        start: { x: (pageWidth - w3) / 2, y: titleY - 2 },
        end: { x: (pageWidth + w3) / 2, y: titleY - 2 },
        thickness: 1, color: rgb(0, 0, 0)
      });
    }

    // Add footer
    const footerY = 20;
    page.drawText(`Updated on: ${genTime}`, { x: 45, y: footerY, size: 9, font: fontItalic, color: rgb(0.3, 0.3, 0.3) });
    
    if (currentEventId) {
      const eventIdText = `Event ID: ${currentEventId}`;
      const wEId = fontItalic.widthOfTextAtSize(eventIdText, 9);
      page.drawText(eventIdText, { x: pageWidth - 45 - wEId, y: footerY, size: 9, font: fontItalic, color: rgb(0.3, 0.3, 0.3) });
    }
  };

  const eventsList = (Array.isArray(data) ? [...data] : []).sort((a, b) => {
    const clubA = (a.club_id?.club_name || a.club_name || a.association || a.clubName || 'General').trim();
    const clubB = (b.club_id?.club_name || b.club_name || b.association || b.clubName || 'General').trim();
    const comp = clubA.localeCompare(clubB, undefined, { sensitivity: 'base' });
    if (comp !== 0) return comp;
    const nameA = (a.event_name || a.name || a.eventName || '').trim();
    const nameB = (b.event_name || b.name || b.eventName || '').trim();
    return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
  });
  drawHeader(currentPage, true, eventsList.length > 0 ? (eventsList[0].event_id || eventsList[0].id || eventsList[0]._id || '') : '');

  let currentY = pageHeight - 155;
  const tX = 50;
  const tableWidth = pageWidth - 100;
  
  if (eventsList.length === 0) {
    currentPage.drawText('No items requested.', { x: tX + 15, y: currentY - 15, size: 10, font: fontItalic, color: rgb(0.4, 0.4, 0.4) });
  }

  eventsList.forEach((ev, evIndex) => {
    const clubName = ev.club_id?.club_name || ev.club_name || ev.association || ev.clubName || 'General';
    const eventName = ev.event_name || ev.name || ev.eventName || 'Event';
    const eventId = ev.event_id || ev.id || ev._id || '';
    
    if (evIndex > 0) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      drawHeader(currentPage, false, eventId);
      currentY = pageHeight - 60;
    }

    // Metadata card box
    const eventNameLines = wrapText('Event Name: ' + eventName, 240, fontBold, 10.5);
  const clubNameLines = wrapText('Association / Club: ' + clubName, tableWidth - 270 - 15, fontBold, 10.5);
  
  const leftLines = eventNameLines.length + 1; // +1 for Event Code
  const rightLines = clubNameLines.length + 1; // +1 for Status
  const maxLines = Math.max(leftLines, rightLines);
  
  const lineHeight = 15;
  const boxHeight = (maxLines * lineHeight) + 24;
  
  currentPage.drawRectangle({
    x: tX, y: currentY - boxHeight, width: tableWidth, height: boxHeight,
    borderColor: rgb(0.2, 0.2, 0.2), borderWidth: 1
  });
  
  let leftY = currentY - 12 - 10.5;
  eventNameLines.forEach(line => {
    currentPage.drawText(line, { x: tX + 15, y: leftY, size: 10.5, font: fontBold, color: rgb(0,0,0) });
    leftY -= lineHeight;
  });
  currentPage.drawText('Event Code: ' + eventId, { x: tX + 15, y: leftY, size: 10.5, font: fontBold, color: rgb(0,0,0) });
  
  let rightY = currentY - 12 - 10.5;
  clubNameLines.forEach(line => {
    currentPage.drawText(line, { x: tX + 270, y: rightY, size: 10.5, font: fontBold, color: rgb(0,0,0) });
    rightY -= lineHeight;
  });
  currentPage.drawText('Status: ' + (ev.status || 'SUBMITTED').toUpperCase(), { x: tX + 270, y: rightY, size: 10.5, font: fontBold, color: rgb(0,0,0) });

  currentY -= (boxHeight + 20);

  const itemColWidths = [30, 185.28, 35, 60, 85, 100];
  const itemHeaders = ['S.No', 'Item Name', 'Qty', 'Returnable', 'Unit Price', 'Amount'];

  const drawTableHeader = () => {
    currentPage.drawRectangle({ x: tX, y: currentY - 24, width: tableWidth, height: 24, color: rgb(0.95, 0.95, 0.95), borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
    let cellX = tX;
    itemHeaders.forEach((h, idx) => {
      const w = itemColWidths[idx];
      let xPos;
      const hw = fontBold.widthOfTextAtSize(h, 9.5);
      if (idx === 0 || idx === 2 || idx === 3) {
        xPos = cellX + (w - hw) / 2;
      } else if (idx === 1) {
        xPos = cellX + 8;
      } else if (idx === 4) {
        xPos = cellX + w - hw - 8;
      } else {
        xPos = cellX + w - hw - 10;
      }
      currentPage.drawText(h, { x: xPos, y: currentY - 16, size: 9.5, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
      cellX += w;
    });
    currentY -= 24;
  };

  drawTableHeader();

  const items = Array.isArray(ev.items) && ev.items.length > 0 ? ev.items : [];
  let subTotal = 0;

  if (items.length === 0) {
    currentPage.drawText('No items requested for this event proposal.', { x: tX + 15, y: currentY - 15, size: 10, font: fontItalic, color: rgb(0.4, 0.4, 0.4) });
    currentY -= 40;
  } else {
    items.forEach((it, iIdx) => {
      const qty = it.quantity || it.requested_quantity || 1;
      const unitPrice = Number(it.price_per_unit || 0);
      const total = qty * unitPrice;
      subTotal += total;

      const itemName = String(it.item_name || it.name || 'Unknown Item').trim();
      const maxNameWidth = itemColWidths[1] - 16;
      let fontSize = 9;
      
      const itemLines = wrapText(itemName, maxNameWidth, fontRegular, fontSize);
      
      const lineHeight = 12;
      const rowH = Math.max(24, (itemLines.length * lineHeight) + 8);

      if (currentY - rowH < 70) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader(currentPage, false, eventId);
        currentY = pageHeight - 60;
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

      const retX = qtyX + itemColWidths[2];
      const isRet = it.is_returnable;
      const retStr = isRet ? 'YES' : 'NO';
      const retColor = isRet ? rgb(0.18, 0.49, 0.20) : rgb(0.78, 0.16, 0.16);
      const retW = fontBold.widthOfTextAtSize(retStr, 9);
      currentPage.drawText(retStr, { x: retX + (itemColWidths[3] - retW) / 2, y: topY, size: 9, font: fontBold, color: retColor });

      const priceX = retX + itemColWidths[3];
      const priceStr = `Rs. ${unitPrice.toFixed(2)}`;
      const priceW = fontRegular.widthOfTextAtSize(priceStr, 9);
      currentPage.drawText(priceStr, { x: priceX + itemColWidths[4] - priceW - 8, y: topY, size: 9, font: fontRegular, color: rgb(0.06, 0.06, 0.06) });

      const amtX = priceX + itemColWidths[4];
      const amtStr = `Rs. ${total.toFixed(2)}`;
      const amtW = fontRegular.widthOfTextAtSize(amtStr, 9);
      currentPage.drawText(amtStr, { x: amtX + itemColWidths[5] - amtW - 10, y: topY, size: 9, font: fontRegular, color: rgb(0.06, 0.06, 0.06) });

      currentPage.drawLine({ start: { x: tX, y: currentY - rowH }, end: { x: tX + tableWidth, y: currentY - rowH }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
      currentY -= rowH;
    });

    const gstAmount = subTotal * 0.18;
    const grandTotal = subTotal + gstAmount;

    const summaryRows = [
      { label: 'Subtotal:', value: `Rs. ${subTotal.toFixed(2)}`, color: rgb(0.06, 0.06, 0.06), isGrand: false },
      { label: 'GST (18%):', value: `Rs. ${gstAmount.toFixed(2)}`, color: rgb(0.06, 0.06, 0.06), isGrand: false },
      { label: 'Grand Total (Inc. 18% GST):', value: `Rs. ${grandTotal.toFixed(2)}`, color: rgb(0, 0.33, 0.65), isGrand: true },
    ];

    const priceColX = tX + itemColWidths[0] + itemColWidths[1] + itemColWidths[2] + itemColWidths[3];
    const amtColX = priceColX + itemColWidths[4];

    summaryRows.forEach((sRow, sIdx) => {
      const sRowH = sRow.isGrand ? 24 : 20;
      const sSize = sRow.isGrand ? 10 : 9;
      const sY = currentY - (sRowH + sSize) / 2 - 2;

      const lblW = fontBold.widthOfTextAtSize(sRow.label, sSize);
      currentPage.drawText(sRow.label, { x: priceColX + itemColWidths[4] - lblW - 8, y: sY, size: sSize, font: fontBold, color: rgb(0.06, 0.06, 0.06) });

      const valW = fontBold.widthOfTextAtSize(sRow.value, sSize);
      currentPage.drawText(sRow.value, { x: amtColX + itemColWidths[5] - valW - 10, y: sY, size: sSize, font: fontBold, color: sRow.color });

      if (sIdx === 1) {
        currentPage.drawLine({ start: { x: priceColX, y: currentY - sRowH }, end: { x: tX + tableWidth, y: currentY - sRowH }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
      }
      currentY -= sRowH;
    });
  }

  
  }); // end of eventsList loop

  // Process canvas text (for Tamil support)
  for (const op of drawQueue) {
    if (op.type === 'text') {
      op.method(...op.args);
    } else if (op.type === 'tamil') {
      const { origDrawText, origDrawImage, text, options, page } = op;
      const regexChunks = /[\u0B80-\u0BFF\u200C\u200D]+(?:[\s]+[\u0B80-\u0BFF\u200C\u200D]+)*|[^\u0B80-\u0BFF\u200C\u200D]+/g;
      const chunks = text.match(regexChunks) || [];
      let currentX = options.x;
      
      const isBold = options.font === fontBold;
      if (!window.__pdfCanvasCtx) {
        const cvs = document.createElement('canvas');
        window.__pdfCanvasCtx = cvs.getContext('2d');
      }
      const ctx = window.__pdfCanvasCtx;
      
      for (const chunk of chunks) {
        if (/[\u0B80-\u0BFF]/.test(chunk)) {
          ctx.font = (isBold ? 'bold ' : '') + options.size + 'px "Noto Sans Tamil", Arial, sans-serif';
          const chunkWidth = ctx.measureText(chunk).width;
          
          const padding = 2;
          const scale = 4;
          const textW = Math.max(1, ctx.measureText(chunk).width);
          
          const cvs = document.createElement('canvas');
          cvs.width = Math.ceil(textW * scale) + padding * 2;
          cvs.height = Math.ceil(options.size * 1.8 * scale) + padding * 2;
          const cvsCtx = cvs.getContext('2d');
          cvsCtx.scale(scale, scale);
          cvsCtx.font = ctx.font;
          cvsCtx.textBaseline = 'alphabetic';
          
          let r = 0, g = 0, b = 0;
          if (options.color) {
            r = Math.round((options.color.red || 0) * 255);
            g = Math.round((options.color.green || 0) * 255);
            b = Math.round((options.color.blue || 0) * 255);
          }
          cvsCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          cvsCtx.fillText(chunk, padding / scale, options.size * 1.4);
          
          const dataUrl = cvs.toDataURL('image/png');
          const pngImage = await pdfDoc.embedPng(dataUrl);
          
          origDrawImage(pngImage, {
            x: currentX - (padding / scale),
            y: (options.y || 0) - (options.size * 0.4) - (padding / scale),
            width: cvs.width / scale,
            height: cvs.height / scale
          });
          
          currentX += chunkWidth;
        } else {
          origDrawText(chunk, { ...options, x: currentX });
          currentX += options.font.widthOfTextAtSize(chunk, options.size);
        }
      }
    }
  }
const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
