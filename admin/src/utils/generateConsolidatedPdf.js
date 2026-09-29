import "regenerator-runtime/runtime";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export async function generateConsolidatedPdf({ data }) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  let tamilFont = null;
  try {
    const tamilRes = await fetch('/fonts/NotoSansTamil-Regular.ttf');
    if (tamilRes.ok) {
      const tamilBytes = await tamilRes.arrayBuffer();
      tamilFont = await pdfDoc.embedFont(tamilBytes);

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
  } catch (err) {
    console.warn("Could not load Tamil font", err);
  }

  const drawQueue = [];

  const cleanText = (text) => {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const wrapFontWidth = (font) => {
    const origWidth = font.widthOfTextAtSize.bind(font);
    font.widthOfTextAtSize = (text, size) => {
      if (!text) return 0;
      const cleanStr = cleanText(text).replace(/\n/g, ' ');
      const hasTamil = /[\u0B80-\u0BFF]/.test(cleanStr);
      if (hasTamil) {
        if (!window.__pdfCanvasCtx) {
          const cvs = document.createElement('canvas');
          window.__pdfCanvasCtx = cvs.getContext('2d');
        }
        const ctx = window.__pdfCanvasCtx;
        const isBold = font === fontBold;
        ctx.font = (isBold ? 'bold ' : '') + size + 'px "Noto Sans Tamil", Arial, sans-serif';

        const chunks = cleanStr.match(/[\u0B80-\u0BFF\u200C\u200D]+(?:[\s]+[\u0B80-\u0BFF\u200C\u200D]+)*|[^\u0B80-\u0BFF\u200C\u200D]+/g) || [];
        let totalWidth = 0;
        for (const chunk of chunks) {
          if (!chunk) continue;
          const isTamilChunk = /[\u0B80-\u0BFF]/.test(chunk);
          if (isTamilChunk) {
            totalWidth += ctx.measureText(chunk).width;
          } else {
            try { totalWidth += origWidth(chunk, size); }
            catch (e) { totalWidth += chunk.length * size * 0.55; }
          }
        }
        return totalWidth;
      }
      try {
        return origWidth(cleanStr, size);
      } catch (_) {
        const asciiOnly = cleanStr.replace(/[^\x20-\x7E\u0B80-\u0BFF]/g, ' ');
        try {
          return origWidth(asciiOnly, size);
        } catch (_) {
          return cleanStr.length * size * 0.55;
        }
      }
    };
  };

  wrapFontWidth(fontRegular);
  wrapFontWidth(fontBold);
  wrapFontWidth(fontItalic);

  const wrapText = (text, maxWidth, font, size) => {
    if (!text) return [];
    const words = String(text).split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const width = font.widthOfTextAtSize(testLine, size);
      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
          currentLine = '';
        }
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  const originalAddPage = pdfDoc.addPage.bind(pdfDoc);
  pdfDoc.addPage = (...args) => {
    const page = originalAddPage(...args);
    const origDrawText = page.drawText.bind(page);
    const origDrawRectangle = page.drawRectangle.bind(page);
    const origDrawLine = page.drawLine.bind(page);
    const origDrawImage = page.drawImage.bind(page);
    const origDrawCircle = page.drawCircle.bind(page);

    page.drawText = (text, options) => {
      if (!text && text !== 0 && text !== '0') return;
      const cleanStr = cleanText(text).replace(/\n/g, ' ');
      const hasTamil = /[\u0B80-\u0BFF]/.test(cleanStr);

      if (hasTamil) {
        drawQueue.push({ type: 'tamil', origDrawText, origDrawImage, text: cleanStr, options });
      } else {
        const actualOptions = { ...options };
        drawQueue.push({ type: 'text', method: origDrawText, args: [cleanStr, actualOptions] });
      }
    };

    page.drawRectangle = (opts) => drawQueue.push({ type: 'op', method: origDrawRectangle, args: [opts] });
    page.drawLine = (opts) => drawQueue.push({ type: 'op', method: origDrawLine, args: [opts] });
    page.drawImage = (img, opts) => drawQueue.push({ type: 'op', method: origDrawImage, args: [img, opts] });
    page.drawCircle = (opts) => drawQueue.push({ type: 'op', method: origDrawCircle, args: [opts] });

    return page;
  };

  const pageWidth = 841.89; // Landscape A4
  const pageHeight = 595.28;
  const outerMargin = 18;
  const tableX = 35;
  const tableWidth = pageWidth - tableX * 2; // 771.89 pt

  // Column definitions totaling 771.89 pt
  // S.No(40), Item Name(351.89), Category(90), Total Requested(100), Unit Price(95), Est. Total(95)
  const colWidths = [40, 351.89, 90, 100, 95, 95];
  const headerLabels = [
    'S.No',
    'Item Name',
    'Category',
    'Total Requested',
    'Unit Price',
    'Est. Total'
  ];

  const drawPageBorder = (page) => {
    page.drawRectangle({
      x: outerMargin,
      y: outerMargin,
      width: pageWidth - outerMargin * 2,
      height: pageHeight - outerMargin * 2,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.5,
    });
  };

  const drawWatermark = (page) => {
    page.drawText('INTRAMS 2026', {
      x: 210,
      y: 140,
      size: 80,
      font: fontBold,
      color: rgb(0.92, 0.92, 0.92),
      rotate: degrees(45),
    });
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB');
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const generatedText = `Generated on ${dateStr}, ${timeStr}`;
  const generatedWidth = fontItalic.widthOfTextAtSize(generatedText, 9);

  const drawPageHeaders = (page, isFirst = true) => {
    if (isFirst) {
      const title1 = 'PSG COLLEGE OF TECHNOLOGY';
      const w1 = fontBold.widthOfTextAtSize(title1, 15);
      page.drawText(title1, {
        x: (pageWidth - w1) / 2,
        y: pageHeight - 48,
        size: 15,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      const title2 = 'STUDENTS UNION 2026-2027';
      const w2 = fontBold.widthOfTextAtSize(title2, 11);
      page.drawText(title2, {
        x: (pageWidth - w2) / 2,
        y: pageHeight - 65,
        size: 11,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      const title3 = 'CONSOLIDATED EVENT ITEM REQUIREMENTS REPORT';
      const w3 = fontBold.widthOfTextAtSize(title3, 13);
      page.drawText(title3, {
        x: (pageWidth - w3) / 2,
        y: pageHeight - 84,
        size: 13,
        font: fontBold,
        color: rgb(0.12, 0.31, 0.47), // #1F4E79
      });

      page.drawText(generatedText, {
        x: (pageWidth - generatedWidth) / 2,
        y: pageHeight - 99,
        size: 9,
        font: fontItalic,
        color: rgb(0.35, 0.35, 0.35),
      });
    } else {
      const headerText = 'PSG COLLEGE OF TECHNOLOGY - CONSOLIDATED EVENT ITEM REQUIREMENTS (CONT.)';
      const hw = fontBold.widthOfTextAtSize(headerText, 11);
      page.drawText(headerText, {
        x: (pageWidth - hw) / 2,
        y: pageHeight - 45,
        size: 11,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      page.drawText(generatedText, {
        x: (pageWidth - generatedWidth) / 2,
        y: pageHeight - 59,
        size: 8.5,
        font: fontItalic,
        color: rgb(0.35, 0.35, 0.35),
      });
    }

    // Footer on each page
    page.drawText('PSG College of Technology | Students Union 2026-2027 | Official Consolidated Event Logistics', {
      x: tableX,
      y: 22,
      size: 8,
      font: fontItalic,
      color: rgb(0.4, 0.4, 0.4),
    });
  };

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  drawWatermark(currentPage);
  drawPageBorder(currentPage);
  drawPageHeaders(currentPage, true);

  let currentY = pageHeight - 114;
  const headerHeight = 22;

  const checkAddPage = (requiredHeight) => {
    if (currentY - requiredHeight < outerMargin + 25) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      drawWatermark(currentPage);
      drawPageBorder(currentPage);
      drawPageHeaders(currentPage, false);
      currentY = pageHeight - 74;
      return true;
    }
    return false;
  };

  const drawTableHeader = () => {
    const headerY = currentY - headerHeight;
    currentPage.drawRectangle({
      x: tableX,
      y: headerY,
      width: tableWidth,
      height: headerHeight,
      color: rgb(0.85, 0.89, 0.93), // Light grey-blue #d9e2ec
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    let xPos = tableX;
    headerLabels.forEach((header, index) => {
      const width = colWidths[index];
      const textWidth = fontBold.widthOfTextAtSize(header, 9.5);
      const isCentered = index === 0 || index === 2 || index === 3;
      const isRight = index === 4 || index === 5;

      let textX;
      if (isCentered) {
        textX = xPos + (width - textWidth) / 2;
      } else if (isRight) {
        textX = xPos + width - textWidth - 8;
      } else {
        textX = xPos + 8;
      }

      currentPage.drawText(header, {
        x: textX,
        y: headerY + 6.5,
        size: 9.5,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      currentPage.drawLine({
        start: { x: xPos, y: headerY },
        end: { x: xPos, y: headerY + headerHeight },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      xPos += width;
    });

    currentPage.drawLine({
      start: { x: xPos, y: headerY },
      end: { x: xPos, y: headerY + headerHeight },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    currentY -= headerHeight;
  };

  checkAddPage(headerHeight + 25);
  drawTableHeader();

  const itemsList = Array.isArray(data) ? data : [];

  if (itemsList.length === 0) {
    currentPage.drawText('No consolidated item requests found across submitted event proposals.', {
      x: tableX + 12,
      y: currentY - 20,
      size: 10,
      font: fontItalic,
      color: rgb(0.4, 0.4, 0.4),
    });
  } else {
    let grandTotalRequested = 0;
    let grandTotalCost = 0;

    itemsList.forEach((item, itemIndex) => {
      const reqQty = Number(item.total_requested_quantity || 0);
      const unitPrice = Number(item.price_per_unit || 0);
      const estCost = Number(item.total_estimated_cost || 0);

      grandTotalRequested += reqQty;
      grandTotalCost += estCost;

      const itemName = String(item.item_name || 'Unnamed Item').trim();
      const itemLines = wrapText(itemName, colWidths[1] - 16, fontRegular, 9.5);

      const lineCount = Math.max(itemLines.length, 1);
      const lineHeight = 12;
      const rowHeight = Math.max(22, (lineCount * lineHeight) + 8);

      const prevPage = currentPage;
      checkAddPage(rowHeight);
      if (currentPage !== prevPage) {
        drawTableHeader();
      }

      const rowTop = currentY;
      const rowBottom = rowTop - rowHeight;

      const isEven = itemIndex % 2 === 0;
      currentPage.drawRectangle({
        x: tableX,
        y: rowBottom,
        width: tableWidth,
        height: rowHeight,
        color: isEven ? rgb(1, 1, 1) : rgb(0.97, 0.98, 0.99),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      const topTextY = rowTop - 13;

      let cellX = tableX;

      // 0: S.No
      const snoStr = String(itemIndex + 1);
      const snoW = fontRegular.widthOfTextAtSize(snoStr, 9);
      currentPage.drawText(snoStr, {
        x: cellX + (colWidths[0] - snoW) / 2,
        y: topTextY,
        size: 9,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });
      currentPage.drawLine({ start: { x: cellX, y: rowTop }, end: { x: cellX, y: rowBottom }, thickness: 1, color: rgb(0, 0, 0) });
      cellX += colWidths[0];

      // 1: Item Name (multi-line)
      let curItemY = topTextY;
      itemLines.forEach(line => {
        currentPage.drawText(line, {
          x: cellX + 8,
          y: curItemY,
          size: 9.5,
          font: fontRegular,
          color: rgb(0, 0, 0),
        });
        curItemY -= lineHeight;
      });
      currentPage.drawLine({ start: { x: cellX, y: rowTop }, end: { x: cellX, y: rowBottom }, thickness: 1, color: rgb(0, 0, 0) });
      cellX += colWidths[1];

      // 2: Category (Returnable vs Consumable)
      const isRet = item.is_returnable !== false;
      const catText = isRet ? 'Returnable' : 'Consumable';
      const catW = fontBold.widthOfTextAtSize(catText, 8.5);
      const catColor = isRet ? rgb(0.12, 0.45, 0.2) : rgb(0.35, 0.35, 0.35);
      currentPage.drawText(catText, {
        x: cellX + (colWidths[2] - catW) / 2,
        y: topTextY,
        size: 8.5,
        font: fontBold,
        color: catColor,
      });
      currentPage.drawLine({ start: { x: cellX, y: rowTop }, end: { x: cellX, y: rowBottom }, thickness: 1, color: rgb(0, 0, 0) });
      cellX += colWidths[2];

      // 3: Total Requested
      const reqStr = `${reqQty} ${item.unit || 'pcs'}`;
      const reqW = fontBold.widthOfTextAtSize(reqStr, 9);
      currentPage.drawText(reqStr, {
        x: cellX + (colWidths[3] - reqW) / 2,
        y: topTextY,
        size: 9,
        font: fontBold,
        color: rgb(0.05, 0.38, 0.65),
      });
      currentPage.drawLine({ start: { x: cellX, y: rowTop }, end: { x: cellX, y: rowBottom }, thickness: 1, color: rgb(0, 0, 0) });
      cellX += colWidths[3];

      // 4: Unit Price
      const upStr = `Rs. ${unitPrice.toFixed(2)}`;
      const upW = fontRegular.widthOfTextAtSize(upStr, 9);
      currentPage.drawText(upStr, {
        x: cellX + colWidths[4] - upW - 8,
        y: topTextY,
        size: 9,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });
      currentPage.drawLine({ start: { x: cellX, y: rowTop }, end: { x: cellX, y: rowBottom }, thickness: 1, color: rgb(0, 0, 0) });
      cellX += colWidths[4];

      // 5: Est Total
      const totStr = `Rs. ${estCost.toFixed(2)}`;
      const totW = fontBold.widthOfTextAtSize(totStr, 9);
      currentPage.drawText(totStr, {
        x: cellX + colWidths[5] - totW - 8,
        y: topTextY,
        size: 9,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      currentPage.drawLine({ start: { x: cellX, y: rowTop }, end: { x: cellX, y: rowBottom }, thickness: 1, color: rgb(0, 0, 0) });
      cellX += colWidths[5];

      currentY = rowBottom;
    });

    // Summary Grand Total Row
    const sumRowHeight = 24;
    const prevPage = currentPage;
    checkAddPage(sumRowHeight);
    if (currentPage !== prevPage) {
      drawTableHeader();
    }

    const sTop = currentY;
    const sBottom = sTop - sumRowHeight;

    currentPage.drawRectangle({
      x: tableX,
      y: sBottom,
      width: tableWidth,
      height: sumRowHeight,
      color: rgb(0.88, 0.92, 0.96), // Slightly darker blue-grey for summary
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Col 0-2 (span width = 40 + 351.89 + 90 = 481.89)
    const sumSpanWidth = colWidths[0] + colWidths[1] + colWidths[2];
    const sumLabel = `GRAND TOTAL (${itemsList.length} DISTINCT ITEMS)`;
    const sumLabelW = fontBold.widthOfTextAtSize(sumLabel, 9.5);
    currentPage.drawText(sumLabel, {
      x: tableX + sumSpanWidth - sumLabelW - 10,
      y: sBottom + 7,
      size: 9.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    let sCellX = tableX + sumSpanWidth;
    currentPage.drawLine({ start: { x: sCellX, y: sTop }, end: { x: sCellX, y: sBottom }, thickness: 1, color: rgb(0, 0, 0) });

    // Req Qty sum
    const sumReqStr = String(grandTotalRequested);
    const sumReqW = fontBold.widthOfTextAtSize(sumReqStr, 9.5);
    currentPage.drawText(sumReqStr, {
      x: sCellX + (colWidths[3] - sumReqW) / 2,
      y: sBottom + 7,
      size: 9.5,
      font: fontBold,
      color: rgb(0.05, 0.38, 0.65),
    });
    sCellX += colWidths[3];
    currentPage.drawLine({ start: { x: sCellX, y: sTop }, end: { x: sCellX, y: sBottom }, thickness: 1, color: rgb(0, 0, 0) });

    // Unit Price blank
    sCellX += colWidths[4];
    currentPage.drawLine({ start: { x: sCellX, y: sTop }, end: { x: sCellX, y: sBottom }, thickness: 1, color: rgb(0, 0, 0) });

    // Grand Total Cost
    const sumCostStr = `Rs. ${grandTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const sumCostW = fontBold.widthOfTextAtSize(sumCostStr, 9.5);
    currentPage.drawText(sumCostStr, {
      x: sCellX + colWidths[5] - sumCostW - 8,
      y: sBottom + 7,
      size: 9.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    sCellX += colWidths[5];
    currentPage.drawLine({ start: { x: sCellX, y: sTop }, end: { x: sCellX, y: sBottom }, thickness: 1, color: rgb(0, 0, 0) });

    currentY = sBottom;
  }

  // Process canvas drawing queue (handling Tamil text & preserving draw order)
  for (const op of drawQueue) {
    if (op.type === 'tamil') {
      const { origDrawText, origDrawImage, text, options } = op;
      const chunks = text.match(/[\u0B80-\u0BFF\u200C\u200D]+(?:[\s]+[\u0B80-\u0BFF\u200C\u200D]+)*|[^\u0B80-\u0BFF\u200C\u200D]+/g) || [];
      let currentX = options.x || 0;
      const size = options.size || 12;

      for (const chunk of chunks) {
        if (!chunk) continue;
        const isTamilChunk = /[\u0B80-\u0BFF]/.test(chunk);

        if (isTamilChunk) {
          if (!window.__pdfCanvasCtx) {
            const cvs = document.createElement('canvas');
            window.__pdfCanvasCtx = cvs.getContext('2d');
          }
          const ctx = window.__pdfCanvasCtx;
          const isBold = options.font === fontBold;
          const fontStr = (isBold ? 'bold ' : '') + size + 'px "Noto Sans Tamil", Arial, sans-serif';
          ctx.font = fontStr;

          const padding = 2;
          const scale = 4;
          const textW = Math.max(1, ctx.measureText(chunk).width);

          const cvs = document.createElement('canvas');
          cvs.width = Math.ceil(textW * scale) + padding * 2;
          cvs.height = Math.ceil(size * 1.8 * scale) + padding * 2;
          const cvsCtx = cvs.getContext('2d');
          cvsCtx.scale(scale, scale);
          cvsCtx.font = fontStr;
          cvsCtx.textBaseline = 'alphabetic';

          let r = 0, g = 0, b = 0;
          if (options.color) {
            r = Math.round((options.color.red || 0) * 255);
            g = Math.round((options.color.green || 0) * 255);
            b = Math.round((options.color.blue || 0) * 255);
          }
          cvsCtx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
          cvsCtx.fillText(chunk, padding / scale, size * 1.4);

          const dataUrl = cvs.toDataURL('image/png');
          const pngImage = await pdfDoc.embedPng(dataUrl);

          origDrawImage(pngImage, {
            x: currentX - (padding / scale),
            y: (options.y || 0) - (size * 0.4) - (padding / scale),
            width: cvs.width / scale,
            height: cvs.height / scale,
          });

          currentX += textW;
        } else {
          const currentFont = options.font || fontRegular;
          const actualOptions = { ...options, font: currentFont, x: currentX };
          try { origDrawText(chunk, actualOptions); } catch (e) { }

          try {
            currentX += currentFont.widthOfTextAtSize(chunk, size);
          } catch (e) {
            currentX += chunk.length * size * 0.55;
          }
        }
      }
    } else {
      try { op.method(...op.args); } catch (e) { }
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
