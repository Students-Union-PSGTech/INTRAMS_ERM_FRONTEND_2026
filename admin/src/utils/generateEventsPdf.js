import "regenerator-runtime/runtime";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export async function generateEventsPdf({ data }) {
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

  const cleanText = (text) => {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
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

  const pageWidth = 841.89; // Landscape A4 width
  const pageHeight = 595.28; // Landscape A4 height
  const outerMargin = 18;
  const tableX = 35;
  const tableWidth = pageWidth - tableX * 2; // 771.89 pt
  const colWidths = [40, 180, 120, 431.89]; // S.No, Club Name, Event ID, Event Name

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
      x: 200,
      y: 140,
      size: 80,
      font: fontBold,
      color: rgb(0.88, 0.88, 0.88),
      rotate: degrees(45),
    });
  };

  // Title and Timestamp Header Logic
  const title = 'List of Events By Club';
  const titleWidth = fontBold.widthOfTextAtSize(title, 20);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB'); // DD/MM/YYYY
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
  const generatedText = `Generated on ${dateStr}, ${timeStr}`;
  const generatedWidth = fontItalic.widthOfTextAtSize(generatedText, 10);

  const drawPageHeaders = (page) => {
    // Title Header
    page.drawText(title, {
      x: (pageWidth - titleWidth) / 2,
      y: pageHeight - 55,
      size: 20,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Timestamp Subtitle
    page.drawText(generatedText, {
      x: (pageWidth - generatedWidth) / 2,
      y: pageHeight - 74,
      size: 10,
      font: fontItalic,
      color: rgb(0, 0, 0),
    });
  };

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  drawWatermark(currentPage);
  drawPageBorder(currentPage);
  drawPageHeaders(currentPage);

  let currentY = pageHeight - 105;
  
  const eventsList = (Array.isArray(data) ? [...data] : []).sort((a, b) => {
    const clubA = (a.club_id?.club_name || a.club_name || a.association || a.clubName || 'General').trim();
    const clubB = (b.club_id?.club_name || b.club_name || b.association || b.clubName || 'General').trim();
    const comp = clubA.localeCompare(clubB, undefined, { sensitivity: 'base' });
    if (comp !== 0) return comp;
    const nameA = (a.event_name || a.name || a.eventName || '').trim();
    const nameB = (b.event_name || b.name || b.eventName || '').trim();
    return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
  });

  const checkAddPage = (requiredHeight) => {
    if (currentY - requiredHeight < outerMargin + 25) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      drawWatermark(currentPage);
      drawPageBorder(currentPage);
      drawPageHeaders(currentPage);
      currentY = pageHeight - 105;
    }
  };

  const headerHeight = 24;
  const rowHeight = 24;

  const drawHeaders = () => {
    // Table Header Row (Light Blue-Grey #d9e2ec, Black Text)
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

    const headerValues = ['S.No', 'Club Name', 'Event ID', 'Event Name'];
      let xPos = tableX;

      headerValues.forEach((header, index) => {
        const width = colWidths[index];
        const textWidth = fontBold.widthOfTextAtSize(header, 10);
        const isCentered = index === 0 || index === 2 || index === 3;
        const textX = isCentered ? xPos + (width - textWidth) / 2 : xPos + 8;

        currentPage.drawText(header, {
          x: textX,
          y: headerY + 7,
          size: 10,
          font: fontBold,
          color: rgb(0, 0, 0), // Black Text
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

  // Ensure space for header + at least 1 row
  checkAddPage(headerHeight + rowHeight);
  drawHeaders();

  // Member Data Rows (White Background, Black Text)
  eventsList.forEach((member, memberIndex) => {
      const prevPage = currentPage;
      checkAddPage(rowHeight);

      if (currentPage !== prevPage) {
        // Redraw headers on new page
        drawHeaders();
      }

      const rowTop = currentY;
      const rowBottom = rowTop - rowHeight;

      currentPage.drawRectangle({
        x: tableX,
        y: rowBottom,
        width: tableWidth,
        height: rowHeight,
        color: rgb(1, 1, 1), // White
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      const values = [
        String(memberIndex + 1),
        String(member.club_id?.club_name || member.club_name || member.association || member.clubName || 'General'),
        String(member.event_id || member.id || member._id || '—'),
        String(member.event_name || member.name || member.eventName || '—')
      ];

      let cellX = tableX;
      values.forEach((value, index) => {
        const width = colWidths[index];
        let displayValue = value;
        let size = 9.5;
        let textWidth = fontRegular.widthOfTextAtSize(displayValue, size);

        while (textWidth > (width - 8) && size > 5) {
          size -= 0.5;
          textWidth = fontRegular.widthOfTextAtSize(displayValue, size);
        }
        if (textWidth > width - 8) {
          while (textWidth > width - 8 && displayValue.length > 3) {
            displayValue = displayValue.slice(0, -1);
            textWidth = fontRegular.widthOfTextAtSize(displayValue + '...', size);
          }
          displayValue = displayValue + '...';
          textWidth = fontRegular.widthOfTextAtSize(displayValue, size);
        }

        const isCentered = index === 0 || index === 2 || index === 3;
        const textX = Math.max(cellX + 4, isCentered ? cellX + (width - textWidth) / 2 : cellX + 8);

        currentPage.drawText(displayValue, {
          x: textX,
          y: rowBottom + 7,
          size: size,
          font: fontRegular,
          color: rgb(0, 0, 0),
        });

        currentPage.drawLine({
          start: { x: cellX, y: rowTop },
          end: { x: cellX, y: rowBottom },
          thickness: 1,
          color: rgb(0, 0, 0),
        });

        cellX += width;
      });

      currentPage.drawLine({
        start: { x: cellX, y: rowTop },
        end: { x: cellX, y: rowBottom },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      currentY = rowBottom;
  });

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
            height: cvs.height / scale
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
