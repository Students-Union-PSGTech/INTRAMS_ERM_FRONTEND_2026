import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

function cleanText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[\r\n]+/g, ' ').replace(/[\t\f\v]/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

export async function generateAllAllocatedPdf({ data }) {
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

      const titleText3 = 'ALL CLUBS ALLOCATED ITEMS REPORT';
      const w3 = fontBold.widthOfTextAtSize(titleText3, 12);
      page.drawText(titleText3, { x: (pageWidth - w3) / 2, y: titleY, size: 12, font: fontBold, color: rgb(0, 0, 0) });
      page.drawLine({
        start: { x: (pageWidth - w3) / 2, y: titleY - 2 },
        end: { x: (pageWidth + w3) / 2, y: titleY - 2 },
        thickness: 1, color: rgb(0, 0, 0)
      });
    } else {
      let titleY = pageHeight - 55;
      const contText = 'ALL CLUBS ALLOCATED ITEMS REPORT (CONTINUED)';
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

  const colWidths = [45, 200, 90, 90, 70];
  const headers = ['S.No', 'Item Name', 'Requested Qty', 'Approved Qty', 'Returnability'];

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
      let xPos = cellX + (w - hw) / 2;
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

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  drawHeader(currentPage, true);
  let currentY = pageHeight - 140;
  const tX = margin;

  // Group items by club
  // `data` can be an array of club groups: { club_name, items: [{ sno, name, requested, approved, returnability, event_name }] }
  const clubGroups = Array.isArray(data) ? data : [];

  if (clubGroups.length === 0) {
    currentPage.drawText('No allocated item records found.', {
      x: margin,
      y: currentY - 30,
      size: 11,
      font: fontItalic,
      color: rgb(0.5, 0.5, 0.5)
    });
  }

  clubGroups.forEach((club, cIdx) => {
    const clubName = String(club.club_name || club.name || 'Unknown Club').trim();
    const clubItems = Array.isArray(club.items) ? club.items : [];

    // Check if we need a new page for the club card and table header
    const neededSpace = 120 + Math.min(clubItems.length, 3) * 25;
    if (currentY - neededSpace < 80) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      drawHeader(currentPage, false);
      currentY = pageHeight - 80;
    }

    // Club Header Banner
    const bannerHeight = 26;
    currentPage.drawRectangle({
      x: tX,
      y: currentY - bannerHeight,
      width: contentWidth,
      height: bannerHeight,
      color: rgb(0.1, 0.1, 0.1),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });

    const clubTitle = `${cIdx + 1}. CLUB: ${clubName.toUpperCase()}`;
    currentPage.drawText(clubTitle, {
      x: tX + 10,
      y: currentY - 18,
      size: 10.5,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    const totalAllocated = clubItems.reduce((sum, it) => sum + (Number(it.approved || it.approved_quantity || 0) || 0), 0);
    const countText = `Total Allocated Qty: ${totalAllocated}   |   Items: ${clubItems.length}`;
    const countW = fontRegular.widthOfTextAtSize(countText, 9);
    currentPage.drawText(countText, {
      x: tX + contentWidth - countW - 10,
      y: currentY - 17,
      size: 9,
      font: fontRegular,
      color: rgb(0.85, 0.85, 0.85)
    });

    currentY -= (bannerHeight + 4);

    // Draw Table Header for this club
    currentY = drawTableHeader(currentPage, currentY);

    if (clubItems.length === 0) {
      // Empty placeholder row
      const emptyRowH = 24;
      currentPage.drawRectangle({
        x: tX,
        y: currentY - emptyRowH,
        width: contentWidth,
        height: emptyRowH,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1
      });
      currentPage.drawText('No items currently allocated for this club.', {
        x: tX + 15,
        y: currentY - 16,
        size: 9,
        font: fontItalic,
        color: rgb(0.5, 0.5, 0.5)
      });
      currentY -= (emptyRowH + 20);
      return;
    }

    // Render items for this club
    clubItems.forEach((it, iIdx) => {
      const maxNameWidth = colWidths[1] - 16;
      const displayName = String(it.name || it.item_name || 'Unknown Item').trim() + (it.event_name ? ` (${it.event_name})` : '');
      const itemLines = displayName ? wrapText(displayName, maxNameWidth, fontRegular, 9) : [''];
      const rowH = Math.max(22, (itemLines.length * 12) + 8);

      if (currentY - rowH < 80) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader(currentPage, false);
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

      // S.No
      const snoStr = String(it.sno || iIdx + 1);
      const snoW = fontRegular.widthOfTextAtSize(snoStr, 9);
      currentPage.drawText(snoStr, { x: tX + (colWidths[0] - snoW) / 2, y: topY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });

      // Item Name
      const nameX = tX + colWidths[0] + 8;
      let currentItemY = topY;
      itemLines.forEach(line => {
        currentPage.drawText(line, { x: nameX, y: currentItemY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
        currentItemY -= 12;
      });

      // Requested Qty
      const reqStr = String(it.requested !== undefined ? it.requested : (it.requested_quantity || 0));
      const reqW = fontRegular.widthOfTextAtSize(reqStr, 9);
      currentPage.drawText(reqStr, { x: tX + colWidths[0] + colWidths[1] + (colWidths[2] - reqW) / 2, y: topY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });

      // Approved Qty
      const appStr = String(it.approved !== undefined ? it.approved : (it.approved_quantity || 0));
      const appW = fontRegular.widthOfTextAtSize(appStr, 9);
      currentPage.drawText(appStr, { x: tX + colWidths[0] + colWidths[1] + colWidths[2] + (colWidths[3] - appW) / 2, y: topY, size: 9, font: fontRegular, color: rgb(0, 0, 0) });

      // Returnability
      const isRet = Boolean(
        it.returnability === true ||
        it.is_returnable === true ||
        String(it.returnability || it.is_returnable).toUpperCase() === 'YES' ||
        String(it.returnability || it.is_returnable).toUpperCase() === 'TRUE' ||
        String(it.returnability || it.is_returnable).toUpperCase() === 'RETURNABLE'
      );
      const retX = tX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3];
      const retStr = isRet ? 'Returnable' : 'Non-Returnable';
      const retColor = isRet ? rgb(0.18, 0.49, 0.20) : rgb(0.78, 0.16, 0.16);
      const retW = fontBold.widthOfTextAtSize(retStr, 9);
      currentPage.drawText(retStr, { x: retX + (colWidths[4] - retW) / 2, y: topY, size: 9, font: fontBold, color: retColor });

      currentY -= rowH;
    });

    currentY -= 20; // spacing between clubs
  });

  // End of Report Acknowledgment / Signature block
  if (currentY - 95 < 70) {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    drawHeader(currentPage, false);
    currentY = pageHeight - 80;
  }

  const rightBlockWidth = 190;
  const rightX = tX + contentWidth - rightBlockWidth;
  const bottomY = Math.min(currentY - 30, 125);
  const lineY = Math.max(bottomY, 95);

  currentPage.drawText('Verified By: ___________________________', {
    x: tX,
    y: lineY,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0)
  });
  currentPage.drawText('Designation: ___________________________', {
    x: tX,
    y: lineY - 18,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  currentPage.drawLine({
    start: { x: rightX, y: lineY },
    end: { x: rightX + rightBlockWidth, y: lineY },
    thickness: 1,
    color: rgb(0, 0, 0)
  });

  const authText = 'Authorized Signature';
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
