
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

function cleanText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[\r\n]+/g, ' ').replace(/[\t\f\v]/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

export async function generateAllocationPdf(event) {
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
  const ev = event || {};
  const clubName = ev.club_name || ev.association || ev.clubName || 'Students Union';
  const eventName = ev.event_name || ev.name || ev.eventName || 'Event';
  const eventId = ev.event_id || ev.id || ev._id || 'EVNT';
  const genTime = new Date().toLocaleString('en-IN');
  const eventDateStr = ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-IN') : 'N/A';

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2; // 495.28

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
      x: 35, y: 35,
      width: pageWidth - 70, height: pageHeight - 70,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.5,
    });
  };

  const drawHeader = (page, isFirstPage = false) => {
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

      const titleText3 = 'ALLOCATION SUMMARY REPORT';
      const w3 = fontBold.widthOfTextAtSize(titleText3, 12);
      page.drawText(titleText3, { x: (pageWidth - w3) / 2, y: titleY, size: 12, font: fontBold, color: rgb(0, 0, 0) });
      page.drawLine({
        start: { x: (pageWidth - w3) / 2, y: titleY - 2 },
        end: { x: (pageWidth + w3) / 2, y: titleY - 2 },
        thickness: 1, color: rgb(0, 0, 0)
      });
    } else {
      let titleY = pageHeight - 55;
      const contText = 'ALLOCATION SUMMARY REPORT (CONTINUED)';
      const wc = fontBold.widthOfTextAtSize(contText, 11);
      page.drawText(contText, { x: (pageWidth - wc) / 2, y: titleY, size: 11, font: fontBold, color: rgb(0, 0, 0) });
    }

    const footerY = 20;
    page.drawText(`Generated on: ${genTime}   •   System generated allocation summary for PSG Students Union`, {
      x: margin,
      y: footerY,
      size: 7.5,
      font: fontItalic,
      color: rgb(0.4, 0.4, 0.4)
    });
  };

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  drawHeader(currentPage, true);

  let currentY = pageHeight - 150;
  const tX = margin;

  // Metadata Card
  const eventNameLines = wrapText('Event Name: ' + eventName, 230, fontBold, 10);
  const clubNameLines = wrapText('Club Name: ' + clubName, 230, fontBold, 10);

  const leftLines = eventNameLines.length + 1; // +1 for Event Code
  const rightLines = clubNameLines.length;
  const maxLines = Math.max(leftLines, rightLines);

  const lineHeight = 15;
  const boxHeight = (maxLines * lineHeight) + 20;

  currentPage.drawRectangle({
    x: tX, y: currentY - boxHeight, width: contentWidth, height: boxHeight,
    borderColor: rgb(0.2, 0.2, 0.2), borderWidth: 1
  });

  let leftY = currentY - 12 - 10;
  eventNameLines.forEach(line => {
    currentPage.drawText(line, { x: tX + 15, y: leftY, size: 10, font: fontBold, color: rgb(0, 0, 0) });
    leftY -= lineHeight;
  });
  currentPage.drawText('Event Code: ' + eventId, { x: tX + 15, y: leftY, size: 10, font: fontBold, color: rgb(0, 0, 0) });

  let rightY = currentY - 12 - 10;
  clubNameLines.forEach(line => {
    currentPage.drawText(line, { x: tX + 260, y: rightY, size: 10, font: fontBold, color: rgb(0, 0, 0) });
    rightY -= lineHeight;
  });

  currentY -= (boxHeight + 20);

  const colWidths = [35, 165.28, 70, 75, 80, 70];
  const headers = ['S.No', 'Item Name', 'Requested Qty', 'Approved Qty', 'Newly Allocated', 'Returnability'];

  const drawTableHeader = () => {
    currentPage.drawRectangle({
      x: tX,
      y: currentY - 24,
      width: contentWidth,
      height: 24,
      color: rgb(0.95, 0.95, 0.97),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });
    let cellX = tX;
    headers.forEach((h, idx) => {
      const w = colWidths[idx];
      const hw = fontBold.widthOfTextAtSize(h, 8.5);
      let xPos = cellX + (w - hw) / 2;
      currentPage.drawText(h, { x: xPos, y: currentY - 16, size: 8.5, font: fontBold, color: rgb(0, 0, 0) });
      if (idx > 0) {
        currentPage.drawLine({
          start: { x: cellX, y: currentY - 24 },
          end: { x: cellX, y: currentY },
          thickness: 1,
          color: rgb(0, 0, 0)
        });
      }
      cellX += w;
    });
    currentY -= 24;
  };

  drawTableHeader();

  const rawItems = Array.isArray(ev.items) ? ev.items : [];
  const items = rawItems.map((item, index) => {
    const isRetVal = item.is_returnable !== undefined ? item.is_returnable : item.item_id?.is_returnable;
    const isRet = (
      isRetVal === true ||
      String(isRetVal).toUpperCase() === 'YES' ||
      String(isRetVal).toUpperCase() === 'TRUE' ||
      String(isRetVal).toUpperCase() === 'RETURNABLE'
    );
    const newlyAllocVal = item.newly_allocated !== undefined && item.newly_allocated !== null
      ? String(item.newly_allocated).trim()
      : (item.newlyAllocated !== undefined && item.newlyAllocated !== null
        ? String(item.newlyAllocated).trim()
        : '');
    return {
      sno: `${index + 1}`,
      name: String(item.item_name || item.name || 'Unknown Item').trim(),
      requested: String(item.requested_quantity || item.quantity || 0),
      approved: String(item.approved_quantity !== undefined ? item.approved_quantity : (item.quantity_provided !== undefined ? item.quantity_provided : (item.quantity || 0))),
      newly_allocated: newlyAllocVal,
      returnability: isRet
    };
  });

  if (items.length < 8) {
    while (items.length < 8) {
      items.push({ sno: '', name: '', requested: '', approved: '', newly_allocated: '' });
    }
  }

  items.forEach((it) => {
    const maxNameWidth = colWidths[1] - 16;
    const itemLines = it.name ? wrapText(it.name, maxNameWidth, fontRegular, 9) : [''];
    const rowH = Math.max(22, (itemLines.length * 12) + 8);

    if (currentY - rowH < 120) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      drawHeader(currentPage, false);
      currentY = pageHeight - 80;
      drawTableHeader();
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

    // S.No
    if (it.sno) {
      const snoW = fontRegular.widthOfTextAtSize(it.sno, 9);
      currentPage.drawText(it.sno, { x: tX + (colWidths[0] - snoW) / 2, y: topY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
    }

    // Name
    if (it.name) {
      const nameX = tX + colWidths[0] + 8;
      let currentItemY = topY;
      itemLines.forEach(line => {
        currentPage.drawText(line, { x: nameX, y: currentItemY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
        currentItemY -= 12;
      });
    }

    // Requested
    if (it.requested) {
      const reqX = tX + colWidths[0] + colWidths[1];
      const reqW = fontRegular.widthOfTextAtSize(it.requested, 9);
      currentPage.drawText(it.requested, { x: reqX + (colWidths[2] - reqW) / 2, y: topY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
    }

    // Approved
    if (it.approved) {
      const appX = tX + colWidths[0] + colWidths[1] + colWidths[2];
      const appW = fontRegular.widthOfTextAtSize(it.approved, 9);
      currentPage.drawText(it.approved, { x: appX + (colWidths[3] - appW) / 2, y: topY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
    }

    // Newly Allocated
    if (it.newly_allocated) {
      const newX = tX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3];
      const newW = fontRegular.widthOfTextAtSize(it.newly_allocated, 9);
      currentPage.drawText(it.newly_allocated, { x: newX + (colWidths[4] - newW) / 2, y: topY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
    }

    // Returnability column
    if (it.name) {
      const retX = tX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4];
      const retStr = it.returnability ? 'Returnable' : 'Non-Returnable';
      const retColor = it.returnability ? rgb(0.18, 0.49, 0.20) : rgb(0.78, 0.16, 0.16);
      const retW = fontBold.widthOfTextAtSize(retStr, 8.5);
      currentPage.drawText(retStr, { x: retX + (colWidths[5] - retW) / 2, y: topY, size: 8.5, font: fontBold, color: retColor });
    }

    currentY -= rowH;
  });

  // Check if we need a new page for receiver details & signature block
  if (currentY - 95 < 70) {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    drawHeader(currentPage, false);
    currentY = pageHeight - 80;
  }

  // Draw Receiver details on left, Receiver signature with date and time on right
  const rightBlockWidth = 190;
  const rightX = tX + contentWidth - rightBlockWidth;
  const bottomY = Math.min(currentY - 45, 125);
  const lineY = Math.max(bottomY, 100);

  // Left End: Receiver details
  currentPage.drawText('Receiver Name: ___________________________', {
    x: tX,
    y: lineY,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0)
  });
  currentPage.drawText('Roll Number    : ___________________________', {
    x: tX,
    y: lineY - 18,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0)
  });
  currentPage.drawText('Phone No         : ___________________________', {
    x: tX,
    y: lineY - 36,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  // Right End: Receiver signature with date and time
  currentPage.drawLine({
    start: { x: rightX, y: lineY },
    end: { x: rightX + rightBlockWidth, y: lineY },
    thickness: 1,
    color: rgb(0, 0, 0)
  });

  const authText = 'Receiver Signature';
  const authW = fontBold.widthOfTextAtSize(authText, 10);
  currentPage.drawText(authText, {
    x: rightX + (rightBlockWidth - authW) / 2,
    y: lineY - 14,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  const dateText = 'Date: ____ / ____ / ________';
  const dateW = fontRegular.widthOfTextAtSize(dateText, 9.5);
  currentPage.drawText(dateText, {
    x: rightX + (rightBlockWidth - dateW) / 2,
    y: lineY - 30,
    size: 9.5,
    font: fontRegular,
    color: rgb(0, 0, 0)
  });

  const timeText = 'Time: ____ : ____';
  const timeW = fontRegular.widthOfTextAtSize(timeText, 9.5);
  currentPage.drawText(timeText, {
    x: rightX + (rightBlockWidth - timeW) / 2,
    y: lineY - 46,
    size: 9.5,
    font: fontRegular,
    color: rgb(0, 0, 0)
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
