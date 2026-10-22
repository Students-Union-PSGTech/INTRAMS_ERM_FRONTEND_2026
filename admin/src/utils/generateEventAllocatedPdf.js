import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

function cleanText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[\r\n]+/g, ' ').replace(/[\t\f\v]/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

export async function generateEventAllocatedPdf({ data, day = 'Both' }) {
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
  const margin = 40;
  const contentWidth = pageWidth - margin * 2; // 515.28

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

  const drawPageBorder = (page) => {
    page.drawRectangle({
      x: 30, y: 30,
      width: pageWidth - 60, height: pageHeight - 60,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.5,
    });
  };

  const drawHeader = (page, isFirstPage = false, currentEventId = '') => {
    drawPageBorder(page);
    if (isFirstPage) {
      let titleY = pageHeight - 65;
      const titleText1 = 'PSG COLLEGE OF TECHNOLOGY';
      const w1 = fontBold.widthOfTextAtSize(titleText1, 15);
      page.drawText(titleText1, { x: (pageWidth - w1) / 2, y: titleY, size: 15, font: fontBold, color: rgb(0, 0, 0) });
      titleY -= 22;

      const titleText2 = 'STUDENTS UNION 2026-27';
      const w2 = fontBold.widthOfTextAtSize(titleText2, 11);
      page.drawText(titleText2, { x: (pageWidth - w2) / 2, y: titleY, size: 11, font: fontBold, color: rgb(0, 0, 0) });
      titleY -= 22;

      const titleText3 = 'EVENT LOGISTICS REPORT';
      const w3 = fontBold.widthOfTextAtSize(titleText3, 12);
      page.drawText(titleText3, { x: (pageWidth - w3) / 2, y: titleY, size: 12, font: fontBold, color: rgb(0, 0, 0) });
      page.drawLine({
        start: { x: (pageWidth - w3) / 2, y: titleY - 2 },
        end: { x: (pageWidth + w3) / 2, y: titleY - 2 },
        thickness: 1, color: rgb(0, 0, 0)
      });
    } else {
      let titleY = pageHeight - 55;
      const contText = 'EVENT LOGISTICS REPORT (CONTINUED)';
      const wc = fontBold.widthOfTextAtSize(contText, 11);
      page.drawText(contText, { x: (pageWidth - wc) / 2, y: titleY, size: 11, font: fontBold, color: rgb(0, 0, 0) });
    }

    const footerY = 18;
    const eventIdSuffix = currentEventId ? `   •   Event ID: ${currentEventId}` : '';
    page.drawText(`Generated on: ${genTime}${eventIdSuffix}   •   Official Event Logistics Report - PSG Students Union`, {
      x: margin,
      y: footerY,
      size: 7.5,
      font: fontItalic,
      color: rgb(0.4, 0.4, 0.4)
    });
  };

  // Columns: Item Name (315.28), Qty (100), Returnable (100) = 515.28
  const colWidths = [315.28, 100, 100];
  const headers = ['Item Name', 'Qty', 'Returnable'];

  const drawTableHeader = (page, y) => {
    page.drawRectangle({
      x: margin,
      y: y - 24,
      width: contentWidth,
      height: 24,
      color: rgb(0.95, 0.95, 0.97),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });
    let cellX = margin;
    headers.forEach((h, idx) => {
      const w = colWidths[idx];
      const hw = fontBold.widthOfTextAtSize(h, 9);
      let xPos = (idx === 0) ? cellX + 10 : cellX + (w - hw) / 2;
      page.drawText(h, { x: xPos, y: y - 16, size: 9, font: fontBold, color: rgb(0, 0, 0) });
      if (idx > 0) {
        page.drawLine({
          start: { x: cellX, y: y - 24 },
          end: { x: cellX, y: y },
          thickness: 1,
          color: rgb(0, 0, 0)
        });
      }
      cellX += w;
    });
    return y - 24;
  };

  const drawSignatureBlock = (page, y) => {
    const tX = margin;
    const rightBlockWidth = 190;
    const rightX = tX + contentWidth - rightBlockWidth;
    const bottomY = Math.min(y - 40, 125);
    const lineY = Math.max(bottomY, 95);

    // Left End: Receiver details
    page.drawText('Receiver Name: ___________________________', {
      x: tX,
      y: lineY,
      size: 9.5,
      font: fontBold,
      color: rgb(0, 0, 0)
    });
    page.drawText('Roll Number    : ___________________________', {
      x: tX,
      y: lineY - 18,
      size: 9.5,
      font: fontBold,
      color: rgb(0, 0, 0)
    });
    page.drawText('Phone No         : ___________________________', {
      x: tX,
      y: lineY - 36,
      size: 9.5,
      font: fontBold,
      color: rgb(0, 0, 0)
    });

    // Right End: Receiver signature
    page.drawLine({
      start: { x: rightX, y: lineY },
      end: { x: rightX + rightBlockWidth, y: lineY },
      thickness: 1,
      color: rgb(0, 0, 0)
    });

    const authText = 'Receiver Signature';
    const authW = fontBold.widthOfTextAtSize(authText, 9.5);
    page.drawText(authText, {
      x: rightX + (rightBlockWidth - authW) / 2,
      y: lineY - 14,
      size: 9.5,
      font: fontBold,
      color: rgb(0, 0, 0)
    });

    const dateText = 'Date: ____ / ____ / ________';
    const dateW = fontRegular.widthOfTextAtSize(dateText, 9);
    page.drawText(dateText, {
      x: rightX + (rightBlockWidth - dateW) / 2,
      y: lineY - 30,
      size: 9,
      font: fontRegular,
      color: rgb(0, 0, 0)
    });

    const timeText = 'Time: ____ : ____';
    const timeW = fontRegular.widthOfTextAtSize(timeText, 9);
    page.drawText(timeText, {
      x: rightX + (rightBlockWidth - timeW) / 2,
      y: lineY - 46,
      size: 9,
      font: fontRegular,
      color: rgb(0, 0, 0)
    });
  };

  // Filter clubs that have events with allocated items
  const clubGroups = (Array.isArray(data) ? data : []).filter(c => Array.isArray(c.events) && c.events.length > 0);

  if (clubGroups.length === 0) {
    const emptyPage = pdfDoc.addPage([pageWidth, pageHeight]);
    drawHeader(emptyPage, true);
    emptyPage.drawText('No allocated item records found.', {
      x: margin,
      y: pageHeight - 180,
      size: 11,
      font: fontItalic,
      color: rgb(0.5, 0.5, 0.5)
    });
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  // Each club in sorted order; each event's items start on a separate page
  clubGroups.forEach((club) => {
    const clubName = String(club.club_name || club.name || 'Students Union').trim();

    club.events.forEach((ev) => {
      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      const eventId = String(ev.event_id || '—').trim();
      const eventName = String(ev.event_name || 'Event').trim();

      drawHeader(currentPage, true, eventId);

      let currentY = pageHeight - 150;
      const tX = margin;

      const rawItems = Array.isArray(ev.items) ? ev.items : [];
      const totalQty = rawItems.reduce((sum, it) => sum + (Number(it.qty !== undefined ? it.qty : (it.requested !== undefined ? it.requested : (it.requested_quantity !== undefined ? it.requested_quantity : (it.quantity || 0)))) || 0), 0);

      // Metadata card for this specific event
      const clubLines = wrapText('Association / Club: ' + clubName, 255, fontBold, 10);
      const eventLines = wrapText('Event Name: ' + eventName, 255, fontBold, 10);

      const codeLine = `Event Code: ${eventId}`;
      const summaryLine = `Total Requested Qty: ${totalQty}`;

      const leftLinesCount = clubLines.length + eventLines.length;
      const rightLinesCount = 2;
      const maxCardLines = Math.max(leftLinesCount, rightLinesCount);

      const cardLineHeight = 14;
      const cardBoxHeight = (maxCardLines * cardLineHeight) + 20;

      currentPage.drawRectangle({
        x: tX, y: currentY - cardBoxHeight, width: contentWidth, height: cardBoxHeight,
        borderColor: rgb(0.2, 0.2, 0.2), borderWidth: 1
      });

      // Left column: Club + Event Name
      let leftY = currentY - 10 - 10;
      clubLines.forEach(line => {
        currentPage.drawText(line, { x: tX + 12, y: leftY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });
        leftY -= cardLineHeight;
      });
      eventLines.forEach(line => {
        currentPage.drawText(line, { x: tX + 12, y: leftY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });
        leftY -= cardLineHeight;
      });

      // Right column: Event Code and Requested Summary (Status removed)
      let rightY = currentY - 10 - 10;
      currentPage.drawText(codeLine, { x: tX + 275, y: rightY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });
      rightY -= cardLineHeight;
      currentPage.drawText(summaryLine, { x: tX + 275, y: rightY, size: 9.5, font: fontBold, color: rgb(0, 0, 0) });

      currentY -= (cardBoxHeight + 18);

      // Table Header
      currentY = drawTableHeader(currentPage, currentY);

      const items = rawItems.map((item) => {
        const isRetVal = item.returnability !== undefined ? item.returnability : item.is_returnable;
        const isRet = (
          isRetVal === true ||
          String(isRetVal).toUpperCase() === 'YES' ||
          String(isRetVal).toUpperCase() === 'TRUE' ||
          String(isRetVal).toUpperCase() === 'RETURNABLE'
        );
        const reqQuantity = item.qty !== undefined
          ? item.qty
          : (item.requested !== undefined
            ? item.requested
            : (item.requested_quantity !== undefined ? item.requested_quantity : (item.quantity !== undefined ? item.quantity : 0)));
        return {
          name: String(item.name || item.item_name || 'Unknown Item').trim(),
          qty: String(reqQuantity),
          returnability: isRet
        };
      });

      // Pad up to 6 visual rows for aesthetic presentation if few items
      if (items.length < 6) {
        while (items.length < 6) {
          items.push({ name: '', qty: '' });
        }
      }

      // Render items of this event
      items.forEach((it) => {
        const maxNameWidth = colWidths[0] - 20;
        const itemLines = it.name ? wrapText(it.name, maxNameWidth, fontRegular, 9.5) : [''];
        const rowLineH = 13;
        const rowH = Math.max(22, (itemLines.length * rowLineH) + 8);

        // If items exceed page, continue this event onto the next page
        if (currentY - rowH < 125) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          drawHeader(currentPage, false, eventId);
          currentY = pageHeight - 80;
          currentY = drawTableHeader(currentPage, currentY);
        }

        currentPage.drawRectangle({
          x: tX,
          y: currentY - rowH,
          width: contentWidth,
          height: rowH,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1
        });

        let cellX = tX;
        colWidths.forEach((w, idx) => {
          if (idx > 0) {
            currentPage.drawLine({
              start: { x: cellX, y: currentY - rowH },
              end: { x: cellX, y: currentY },
              thickness: 1,
              color: rgb(0, 0, 0)
            });
          }
          cellX += w;
        });

        const topY = currentY - 14;

        // Column 0: Item Name
        if (it.name) {
          const nameX = tX + 10;
          let currentItemY = topY;
          itemLines.forEach(line => {
            currentPage.drawText(line, { x: nameX, y: currentItemY, size: 9.5, font: fontRegular, color: rgb(0, 0, 0) });
            currentItemY -= rowLineH;
          });
        }

        // Column 1: Qty (requested quantity)
        if (it.qty !== '' && it.qty !== undefined && it.qty !== null) {
          const qtyStr = String(it.qty);
          const qtyX = tX + colWidths[0];
          const qtyW = fontRegular.widthOfTextAtSize(qtyStr, 9.5);
          currentPage.drawText(qtyStr, { x: qtyX + (colWidths[1] - qtyW) / 2, y: topY, size: 9.5, font: fontRegular, color: rgb(0, 0, 0) });
        }

        // Column 2: Returnable
        if (it.name) {
          const retX = tX + colWidths[0] + colWidths[1];
          const retStr = it.returnability ? 'Returnable' : 'Non-Returnable';
          const retColor = it.returnability ? rgb(0.18, 0.49, 0.20) : rgb(0.78, 0.16, 0.16);
          const retW = fontBold.widthOfTextAtSize(retStr, 9);
          currentPage.drawText(retStr, { x: retX + (colWidths[2] - retW) / 2, y: topY, size: 9, font: fontBold, color: retColor });
        }

        currentY -= rowH;
      });

      // Signature block on each event's final page
      if (currentY - 95 < 60) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader(currentPage, false, eventId);
        currentY = pageHeight - 80;
      }

      drawSignatureBlock(currentPage, currentY);
    });
  });

  // Process Tamil font drawQueue
  for (const op of drawQueue) {
    if (op.type === 'text') {
      op.method(...op.args);
    } else if (op.type === 'tamil') {
      const { origDrawText, origDrawImage, text, options, page } = op;
      const regexChunks = /[\u0B80-\u0BFF\u200C\u200D]+(?:[\s]+[\u0B80-\u0BFF\u200C\u200D]+)*|[^\u0B80-\u0BFF\u200C\u200D]+/g;
      const chunks = text.match(regexChunks) || [];
      let curChunkX = options.x;

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
            x: curChunkX - (padding / scale),
            y: (options.y || 0) - (options.size * 0.4) - (padding / scale),
            width: cvs.width / scale,
            height: cvs.height / scale
          });

          curChunkX += chunkWidth;
        } else {
          origDrawText(chunk, { ...options, x: curChunkX });
          curChunkX += options.font.widthOfTextAtSize(chunk, options.size);
        }
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
