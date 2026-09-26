import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { PSG_LOGO_BASE64 } from './psgLogoBase64.js';
import { INTRAMS_LOGO_BASE64 } from './intramsLogoBase64.js';

/**
 * Generates exact high-fidelity 5-Page EVENT RESOURCE FORM PDF matching official PSG College of Technology INTRAMS standard.
 */
export async function generateEventPdf(eventData = {}) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const cleanText = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u2022\u25CF\u00B7]/g, '-')
      .replace(/\u00A0/g, ' ')
      .replace(/\t/g, '    ');
  };

  const wrapFontWidth = (font) => {
    const origWidth = font.widthOfTextAtSize.bind(font);
    font.widthOfTextAtSize = (text, size) => {
      if (!text) return 0;
      const cleanStr = cleanText(text).replace(/\n/g, ' ');
      try {
        return origWidth(cleanStr, size);
      } catch (_) {
        const asciiOnly = cleanStr.replace(/[^\x20-\x7E]/g, ' ');
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

  const originalAddPage = pdfDoc.addPage.bind(pdfDoc);
  pdfDoc.addPage = (...args) => {
    const page = originalAddPage(...args);
    const origDrawText = page.drawText.bind(page);
    page.drawText = (text, options) => {
      if (!text && text !== 0 && text !== '0') return;
      const cleanStr = cleanText(text).replace(/\n/g, ' ');
      try {
        origDrawText(cleanStr, options);
      } catch (_) {
        const asciiOnly = cleanStr.replace(/[^\x20-\x7E]/g, ' ');
        try {
          origDrawText(asciiOnly, options);
        } catch (e) {
          // ignore to prevent crashing whole PDF
        }
      }
    };
    return page;
  };

  const pageWidth = 595.28; // A4 Portrait width
  const pageHeight = 841.89; // A4 Portrait height
  const margin = 35;
  const contentWidth = pageWidth - margin * 2; // 525.28

  // Load PSG Crest Emblem
  let psgLogo = null;
  try {
    const cleanBase64 = PSG_LOGO_BASE64.replace(/^data:image\/png;base64,/, '');
    const bytes = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));
    psgLogo = await pdfDoc.embedPng(bytes);
  } catch (_) {
    try {
      const res = await fetch('/psg_logo.png');
      if (res.ok) {
        const bytes = await res.arrayBuffer();
        psgLogo = await pdfDoc.embedPng(bytes);
      }
    } catch (_) { /* ignore */ }
  }

  // Load INTRAMS Festival Logo
  let intramsLogo = null;
  try {
    const cleanBase64 = INTRAMS_LOGO_BASE64.replace(/^data:image\/[a-z]+;base64,/, '');
    const bytes = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));
    try {
      intramsLogo = await pdfDoc.embedJpg(bytes);
    } catch (_) {
      intramsLogo = await pdfDoc.embedPng(bytes);
    }
  } catch (_) {
    try {
      const res = await fetch('/intrams_logo.jpg');
      if (res.ok) {
        const bytes = await res.arrayBuffer();
        intramsLogo = await pdfDoc.embedJpg(bytes);
      }
    } catch (_) {
      try {
        const resPng = await fetch('/intrams_logo.png');
        if (resPng.ok) {
          const bytes = await resPng.arrayBuffer();
          intramsLogo = await pdfDoc.embedPng(bytes);
        }
      } catch (_) { /* ignore */ }
    }
  }

  // Draw Page Border Frame
  const drawPageBorder = (page) => {
    page.drawRectangle({
      x: margin,
      y: margin,
      width: contentWidth,
      height: pageHeight - margin * 2,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.5,
    });
  };

  // Light INTRAMS 2026 Background Watermark
  const drawWatermark = (page) => {
    // Watermark removed
  };

  // Draw Bottom Signature Lines (Secretary & Faculty Advisor)
  const drawFooterSignatures = (page, showColon = false) => {
    const colonStr = showColon ? ':' : '';
    const secText = `Signature of the Secretary${colonStr}`;
    const facText = `Signature of the Faculty Advisor${colonStr}`;
    const secWidth = fontRegular.widthOfTextAtSize(secText, 10.5);
    const facWidth = fontRegular.widthOfTextAtSize(facText, 10.5);

    page.drawText(secText, {
      x: (pageWidth / 4) - (secWidth / 2),
      y: margin + 25,
      size: 10.5,
      font: fontRegular,
      color: rgb(0, 0, 0),
    });
    page.drawText(facText, {
      x: (3 * pageWidth / 4) - (facWidth / 2),
      y: margin + 25,
      size: 10.5,
      font: fontRegular,
      color: rgb(0, 0, 0),
    });
  };

  // Extract Event Data fields safely
  const ev = eventData || {};
  const formSpecs = ev.form || ev.form_specs || {};
  const clubName = ev.associationName || ev.club_name || ev.clubName || ev.association || formSpecs.associationName || ev.club_id?.club_name || 'Students Union';
  const eventId = ev.event_id || ev.id || ev._id || 'EVNT47';
  const rawEventName = ev.name || ev.event_name || ev.eventName || formSpecs.eventName || 'sample_event';
  const eventName = eventId && !rawEventName.includes(eventId) ? `${rawEventName} (${eventId})` : rawEventName;
  const tagline = ev.tagline || formSpecs.tagline || '—';
  const about = ev.about || ev.description || formSpecs.about || '—';

  const formatYear = (yearStr, rollNo = '') => {
    if (yearStr) {
      const y = String(yearStr).trim().toUpperCase();
      if (y.includes('MSC')) return y;
      if (y === '1' || y.startsWith('1ST') || y === 'I' || y === 'I YEAR') return 'I YEAR';
      if (y === '2' || y.startsWith('2ND') || y === 'II' || y === 'II YEAR') return 'II YEAR';
      if (y === '3' || y.startsWith('3RD') || y === 'III' || y === 'III YEAR') return 'III YEAR';
      if (y === '4' || y.startsWith('4TH') || y === 'IV' || y === 'IV YEAR') return 'IV YEAR';
      if (y === '5' || y.startsWith('5TH') || y === 'V' || y === 'V YEAR') return 'V YEAR';
      if (y) return y.includes('YEAR') ? y : `${y} YEAR`;
    }

    if (rollNo) {
      const rollMatch = String(rollNo).trim().match(/^(\d{2})/);
      if (rollMatch) {
        const batch = parseInt(rollMatch[1], 10);
        if (batch === 25) return 'I YEAR';
        if (batch === 24) return 'II YEAR';
        if (batch === 23) return 'III YEAR';
        if (batch === 22) return 'IV YEAR';
        if (batch === 21) return 'V YEAR';
      }
    }

    return '—';
  };

  const rawSec = ev.contacts?.secretaries || ev.secretaries || ev.contacts?.secretary || ev.secretary;
  const secretarialList = rawSec ? (Array.isArray(rawSec) ? rawSec : [rawSec]) : [];
  const validSecs = secretarialList.filter(s => s && ((s.name && s.name.trim()) || (s.roll_number && String(s.roll_number).trim())));
  const secRows = validSecs.length > 0
    ? validSecs.map(s => [s.name || '', s.roll_number || s.rollNo || '', s.mobile || s.phone || '', s.department || '', formatYear(s.year, s.roll_number || s.rollNo)])
    : [
      ['', '', '', '', '']
    ];

  const rawConv = ev.contacts?.convenors || ev.convenors || ev.contacts?.convenor || ev.convenor;
  const convenorList = rawConv ? (Array.isArray(rawConv) ? rawConv : [rawConv]) : [];
  const validConvs = convenorList.filter(c => c && ((c.name && c.name.trim()) || (c.roll_number && String(c.roll_number).trim())));
  const convRows = validConvs.length > 0
    ? validConvs.map(c => [c.name || '', c.roll_number || c.rollNo || '', c.mobile || c.phone || '', c.department || '', formatYear(c.year, c.roll_number || c.rollNo)])
    : [
      ['', '', '', '', '']
    ];

  const rawVol = ev.contacts?.volunteers || ev.volunteers || ev.contacts?.volunteer || ev.volunteer;
  const volunteerList = rawVol ? (Array.isArray(rawVol) ? rawVol : [rawVol]) : [];
  const validVols = volunteerList.filter(v => v && ((v.name && v.name.trim()) || (v.roll_number && String(v.roll_number).trim())));
  const volRows = validVols.length > 0
    ? validVols.map(v => [v.name || '', v.roll_number || v.rollNo || '', v.mobile || v.phone || '', v.department || '', formatYear(v.year, v.roll_number || v.rollNo)])
    : [
      ['', '', '', '', '']
    ];

  const facultyObj = ev.contacts?.faculty_advisor || ev.facultyAdvisor || ev.contacts?.facultyAdvisor || {};
  const facRows = (facultyObj.name && facultyObj.name.trim()) ? [
    [facultyObj.name || '', facultyObj.designation || '', facultyObj.mobile || facultyObj.phone || '']
  ] : [
    ['', '', '']
  ];

  const judgeObj = ev.contacts?.judge || ev.judge || {};
  const judgeRows = judgeObj.name && judgeObj.name.trim() ? [
    [judgeObj.name || '', judgeObj.designation || '', judgeObj.mobile || judgeObj.phone || '']
  ] : [];

  const chiefGuestObj = ev.contacts?.chief_guest || ev.chief_guest || ev.contacts?.chiefGuest || {};
  const chiefGuestRows = chiefGuestObj.name && chiefGuestObj.name.trim() ? [
    [
      chiefGuestObj.name || '',
      chiefGuestObj.designation || '',
      String(chiefGuestObj.remuneration || '—'),
      chiefGuestObj.accommodation_required ? 'Yes' : 'No',
      chiefGuestObj.travel_required ? 'Yes' : 'No',
      chiefGuestObj.short_note || '—'
    ]
  ] : [];

  let currentPage;
  let currentY;

  const createNewPage = () => {
    if (currentPage) {
      drawFooterSignatures(currentPage, true);
    }
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    drawWatermark(currentPage);
    drawPageBorder(currentPage);
    currentY = pageHeight - margin - 35;
  };

  const ensureSpace = (requiredSpace) => {
    // 95 is reserved for footer signatures (margin + 25 + some padding)
    if (currentY - requiredSpace < 95) {
      createNewPage();
    }
  };

  // Helper to draw bordered table supporting dynamic pagination
  const drawPage3Table = (startX, colWidths, headers, rows) => {
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const headerH = 22;
    const rowH = 22;

    const renderHeader = () => {
      currentPage.drawRectangle({
        x: startX,
        y: currentY - headerH,
        width: tableWidth,
        height: headerH,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.2,
        color: rgb(0.89, 0.95, 0.98),
      });

      let cellX = startX;
      headers.forEach((h, idx) => {
        const w = colWidths[idx];
        const textW = fontBold.widthOfTextAtSize(h, 9.5);
        currentPage.drawText(h, {
          x: cellX + (w - textW) / 2,
          y: currentY - 15,
          size: 9.5,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
        if (idx < headers.length - 1) {
          currentPage.drawLine({
            start: { x: cellX + w, y: currentY },
            end: { x: cellX + w, y: currentY - headerH },
            thickness: 1,
            color: rgb(0, 0, 0),
          });
        }
        cellX += w;
      });

      currentY -= headerH;
    };

    // Header Row
    ensureSpace(headerH + rowH);
    renderHeader();

    // Data Rows
    rows.forEach((row) => {
      if (currentY - rowH < 95) {
        createNewPage();
        renderHeader();
      }

      currentPage.drawRectangle({
        x: startX,
        y: currentY - rowH,
        width: tableWidth,
        height: rowH,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.2,
      });

      let cellXData = startX;
      row.forEach((val, idx) => {
        const w = colWidths[idx];
        let strVal = String(val || '');
        let size = 9;
        let textW = fontRegular.widthOfTextAtSize(strVal, size);
        while (textW > (w - 8) && size > 5) {
          size -= 0.5;
          textW = fontRegular.widthOfTextAtSize(strVal, size);
        }
        if (textW > w - 8) {
          while (textW > w - 8 && strVal.length > 3) {
            strVal = strVal.slice(0, -1);
            textW = fontRegular.widthOfTextAtSize(strVal + '...', size);
          }
          strVal = strVal + '...';
          textW = fontRegular.widthOfTextAtSize(strVal, size);
        }
        const xPos = Math.max(cellXData + 4, cellXData + (w - textW) / 2);
        currentPage.drawText(strVal, {
          x: xPos,
          y: currentY - 15,
          size: size,
          font: fontRegular,
          color: rgb(0, 0, 0),
        });
        if (idx < row.length - 1) {
          currentPage.drawLine({
            start: { x: cellXData + w, y: currentY },
            end: { x: cellXData + w, y: currentY - rowH },
            thickness: 1,
            color: rgb(0, 0, 0),
          });
        }
        cellXData += w;
      });

      currentY -= rowH;
    });
  };

  // Helper to draw radio circle (open or filled)
  const drawRadioCircle = (cx, cy, isSelected) => {
    currentPage.drawCircle({
      x: cx,
      y: cy,
      size: 6,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.2,
      color: rgb(1, 1, 1),
    });
    if (isSelected) {
      currentPage.drawCircle({
        x: cx,
        y: cy,
        size: 3.5,
        color: rgb(0, 0, 0),
      });
    }
  };

  // ==========================================
  // PAGE 1: COVER PAGE
  // ==========================================
  createNewPage();

  // Top Left PSG Crest Logo
  if (psgLogo) {
    currentPage.drawImage(psgLogo, {
      x: 160,
      y: 728,
      width: 48,
      height: 60,
    });
  }

  // Header College Text
  currentPage.drawText('PSG College of', { x: 218, y: 760, size: 17, font: fontRegular, color: rgb(0, 0, 0) });
  currentPage.drawText('Technology, Coimbatore', { x: 218, y: 738, size: 17, font: fontRegular, color: rgb(0, 0, 0) });

  // STUDENTS UNION 2026-2027
  const unionText = 'STUDENTS UNION 2026-2027';
  const unionW = fontBold.widthOfTextAtSize(unionText, 20);
  currentPage.drawText(unionText, {
    x: (pageWidth - unionW) / 2,
    y: 675,
    size: 20,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // INTRAMS 2K26 Festival Logo
  if (intramsLogo) {
    const logoW = 210;
    const logoH = 140;
    currentPage.drawImage(intramsLogo, {
      x: (pageWidth - logoW) / 2,
      y: 518,
      width: logoW,
      height: logoH,
    });
  }

  // INTRAMS 2026 Header
  const intramsText = 'INTRAMS 2026';
  const intramsW = fontBold.widthOfTextAtSize(intramsText, 18);
  currentPage.drawText(intramsText, {
    x: (pageWidth - intramsW) / 2,
    y: 485,
    size: 18,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Event Resource Form Subtitle
  const formSub = 'Event Resource Form';
  const formSubW = fontBold.widthOfTextAtSize(formSub, 16);
  currentPage.drawText(formSub, {
    x: (pageWidth - formSubW) / 2,
    y: 450,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Helper to shrink text
  const getShrinkSize = (text, maxW, defaultSize, font) => {
    let size = defaultSize;
    let w = font.widthOfTextAtSize(text, size);
    while (w > maxW && size > 5) {
      size -= 0.5;
      w = font.widthOfTextAtSize(text, size);
    }
    return size;
  };

  // Helper to wrap text cleanly and safely
  const wrapText = (text, maxWidth, font, fontSize) => {
    if (!text) return [];
    const cleaned = cleanText(text);
    const paragraphs = cleaned.split('\n');
    const lines = [];

    for (const para of paragraphs) {
      const trimmedPara = para.trim();
      if (!trimmedPara) continue;

      const words = trimmedPara.split(/\s+/).filter(Boolean);
      let currentLine = '';

      for (let i = 0; i < words.length; i++) {
        let word = words[i];
        // If a single word itself exceeds maxWidth, break it down safely
        while (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
          let fitCount = word.length - 1;
          while (fitCount > 0 && font.widthOfTextAtSize(word.substring(0, fitCount), fontSize) > maxWidth) {
            fitCount--;
          }
          if (fitCount > 0) {
            if (currentLine) {
              lines.push(currentLine);
              currentLine = '';
            }
            lines.push(word.substring(0, fitCount));
            word = word.substring(fitCount);
          } else {
            break;
          }
        }

        if (!currentLine) {
          currentLine = word;
        } else {
          const testLine = currentLine + ' ' + word;
          if (font.widthOfTextAtSize(testLine, fontSize) <= maxWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
      }
      if (currentLine) lines.push(currentLine);
    }
    return lines;
  };

  // ASSOCIATION/CLUB NAME
  const assocStr = `CLUB NAME : ${clubName}`;
  const assocSize = getShrinkSize(assocStr, 480, 13.5, fontBold);
  currentPage.drawText(assocStr, {
    x: 55,
    y: 380,
    size: assocSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // EVENT NAME
  const eventStr = `EVENT NAME : ${eventName}`;
  const eventSize = getShrinkSize(eventStr, 480, 13.5, fontBold);
  currentPage.drawText(eventStr, {
    x: 55,
    y: 340,
    size: eventSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // EVENT ID
  const eventIdStr = `EVENT ID : ${eventId}`;
  const eventIdSize = getShrinkSize(eventIdStr, 480, 13.5, fontBold);
  currentPage.drawText(eventIdStr, {
    x: 55,
    y: 300,
    size: eventIdSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // UPDATED TIME
  const updatedTime = ev.updatedAt || ev.updated_at ? new Date(ev.updatedAt || ev.updated_at).toLocaleString('en-IN') : 'N/A';
  const updatedTimeStr = `UPDATED TIME : ${updatedTime}`;
  const updatedTimeSize = getShrinkSize(updatedTimeStr, 480, 13.5, fontBold);
  currentPage.drawText(updatedTimeStr, {
    x: 55,
    y: 260,
    size: updatedTimeSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  });



  // ==========================================
  // PAGE 2: INSTRUCTIONS & GUIDELINES
  // ==========================================
  createNewPage();

  const instHeader = 'INSTRUCTIONS';
  const instHeaderW = fontBold.widthOfTextAtSize(instHeader, 16);
  currentPage.drawText(instHeader, {
    x: (pageWidth - instHeaderW) / 2,
    y: currentY,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  // Underline
  currentPage.drawLine({
    start: { x: (pageWidth - instHeaderW) / 2, y: currentY - 3 },
    end: { x: (pageWidth + instHeaderW) / 2, y: currentY - 3 },
    thickness: 1.2,
    color: rgb(0, 0, 0),
  });

  currentY -= 30;

  const subTitle = '(TO BE READ BEFORE FILLING THE FORM)';
  const subTitleW = fontBold.widthOfTextAtSize(subTitle, 11);
  currentPage.drawText(subTitle, {
    x: (pageWidth - subTitleW) / 2,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  currentY -= 35;

  currentPage.drawText('* If two different events are to be conducted then fill the above form for each event separately and submit it.', {
    x: margin + 15,
    y: currentY,
    size: 10,
    font: fontItalic,
    color: rgb(0, 0, 0),
  });
  currentY -= 18;

  currentPage.drawText('** If the same event continues on both the days (i.e.) Preliminary round on first day and final round on second day,', {
    x: margin + 15,
    y: currentY,
    size: 10,
    font: fontItalic,
    color: rgb(0, 0, 0),
  });
  currentY -= 15;
  currentPage.drawText('then fill the needed requirement in the same form.', {
    x: margin + 15,
    y: currentY,
    size: 10,
    font: fontItalic,
    color: rgb(0, 0, 0),
  });

  currentY -= 35;

  currentPage.drawText('Instructions:', {
    x: margin + 15,
    y: currentY,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  currentY -= 22;

  const guidelinesList = [
    '1. "No cash prize / memento" or any other form of prizes should be given by clubs to the event winners.',
    '2. Memento for the external chief guest will be provided by the Students Union if filled-in the items required table.',
    '3. Certificates to the winners, runners, convenors & volunteers of each event will be provided by the Students Union.',
    '4. If any materials are required prior to the day of the event, please mention "Required in advance" near that material in the "Item Name" column.',
    '5. Printouts required by the clubs must be taken by the clubs themselves.',
    '6. Any events in the form of "Treasure Hunt" should be avoided.',
    '7. Events should be conducted only in specified halls.',
    '8. Materials sourced or purchased directly by the club will not be reimbursed through the Students Union.',
    '9. The Students Union is not obliged to provide all items requested by the club, only approved items will be provided.',
    '10. Halls will be allotted on the basis of availability.',
    '11. Mic will only be provided on the basis of event and number of participants.',
    '12. The projector will not be provided by the Students Union, use the projector available in the hall.',
    '13. HDMI cables / VGA converter will not be provided.',
    '14. Take enough copies of the Form, for your reference.',
    '15. Send it to the point of contact allotted to your club.',
    '16. For more details contact your respective point of contact.',
  ];

  guidelinesList.forEach((guide) => {
    const lines = wrapText(guide, 460, fontRegular, 9.5);
    lines.forEach((line, index) => {
      const indent = index === 0 ? 0 : 12;
      currentPage.drawText(line, { x: margin + 25 + indent, y: currentY, size: 9.5, font: fontRegular, color: rgb(0, 0, 0) });
      currentY -= 14;
    });
    currentY -= 4;
  });

  // ==========================================
  // PAGE 3: PERSONNEL & CONTACT TABLES
  // ==========================================
  createNewPage();

  const prevTitle = `Event Preview: ${eventId}`;
  const prevTitleW = fontBold.widthOfTextAtSize(prevTitle, 16);
  currentPage.drawText(prevTitle, {
    x: (pageWidth - prevTitleW) / 2,
    y: currentY,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  currentY -= 40;

  const tX = margin + 15;
  const p3ColWidths5 = [105, 85, 95, 125, 85.28];
  const p3ColWidths3 = [165, 165, 165.28];
  const p3ColWidths6 = [85, 95, 80, 50, 50, 135.28];

  const drawPage3Section = (title, colWidths, headers, rows) => {
    if (!rows || rows.length === 0) return;
    const headerH = 22;
    const rowH = 22;
    const titleGap = 14;
    const postGap = 16;
    const neededSpace = titleGap + headerH + (rows.length * rowH) + postGap;

    // Check if entire section fits; if not, cleanly move to next page
    if (currentY - neededSpace < 95) {
      createNewPage();
    }

    currentPage.drawText(title, { x: tX, y: currentY, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    currentY -= titleGap;
    drawPage3Table(tX, colWidths, headers, rows);
    currentY -= postGap;
  };

  // Secretary Details
  drawPage3Section('Secretary Details', p3ColWidths5, ['Name', 'Roll Number', 'Mobile No', 'Department', 'Year'], secRows);

  // Convenor Details
  drawPage3Section('Convenor Details', p3ColWidths5, ['Name', 'Roll Number', 'Mobile No', 'Department', 'Year'], convRows);

  // Volunteer Details
  drawPage3Section('Volunteer Details', p3ColWidths5, ['Name', 'Roll Number', 'Mobile No', 'Department', 'Year'], volRows);

  // Faculty Advisor Details
  drawPage3Section('Faculty Advisor Details', p3ColWidths3, ['Name', 'Designation', 'Contact Details'], facRows);

  // Judge Details
  if (judgeRows.length > 0) {
    drawPage3Section('Judge Details', p3ColWidths3, ['Name', 'Designation', 'Contact Details'], judgeRows);
  }

  // Chief Guest Details
  if (chiefGuestRows.length > 0) {
    drawPage3Section('Chief Guest Details', p3ColWidths6, ['Name', 'Designation', 'Remuneration', 'Accomm.', 'Travel', 'Note'], chiefGuestRows);
  }

  // ==========================================
  // PAGE 4: EVENT DETAILS & RESOURCE MATRIX
  // ==========================================
  createNewPage();

  const detTitle = 'Event Details';
  const detTitleW = fontBold.widthOfTextAtSize(detTitle, 16);
  currentPage.drawText(detTitle, {
    x: (pageWidth - detTitleW) / 2,
    y: currentY,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  currentY -= 35;

  const gridBoxX = margin + 15;
  const gridBoxWidth = 495.28;

  const box1H = 38;
  ensureSpace(box1H + 10);
  currentPage.drawRectangle({
    x: gridBoxX,
    y: currentY - box1H,
    width: gridBoxWidth,
    height: box1H,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  const eventDayText = formSpecs.is_two_day ? '2 Days Event' : (formSpecs.day || formSpecs.event_day || 'Day 1');
  currentPage.drawText(`Event Day: ${eventDayText}`, { x: gridBoxX + 15, y: currentY - 24, size: 11, font: fontBold, color: rgb(0, 0, 0) });

  currentY -= box1H;

  // Box 2: Parameters
  const box2H = 75;
  ensureSpace(box2H + 10);
  currentPage.drawRectangle({
    x: gridBoxX,
    y: currentY - box2H,
    width: gridBoxWidth,
    height: box2H,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  const roundsCount = Array.isArray(ev.rounds) && ev.rounds.length > 0 ? ev.rounds.length : (formSpecs.num_rounds || 1);
  const getExpectedParticipants = () => {
    if (ev.expectedParticipants && ev.expectedParticipants !== '—' && ev.expectedParticipants !== 0) return ev.expectedParticipants;
    if (formSpecs.expectedParticipants && formSpecs.expectedParticipants !== '—' && formSpecs.expectedParticipants !== 0) return formSpecs.expectedParticipants;
    if (ev.expected_participants && ev.expected_participants !== '—' && ev.expected_participants !== 0) return ev.expected_participants;
    if (formSpecs.expected_participants && formSpecs.expected_participants !== '—' && formSpecs.expected_participants !== 0) return formSpecs.expected_participants;
    if (formSpecs.participant_count && formSpecs.participant_count > 0) return formSpecs.participant_count;
    if (ev.participant_count && ev.participant_count > 0) return ev.participant_count;
    if (Array.isArray(ev.rounds) && ev.rounds.length > 0) {
      const maxR = ev.rounds.reduce((m, r) => Math.max(m, parseInt(r.participant_count, 10) || 0), 0);
      if (maxR > 0) return maxR;
    }
    return '—';
  };
  const expectedParticipants = getExpectedParticipants();
  const durationText = formSpecs.duration || ev.duration || formSpecs.duration_in_hrs || '—';

  currentPage.drawText(`No. of Rounds: ${roundsCount}`, { x: gridBoxX + 15, y: currentY - 22, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  currentPage.drawText(`Expected no of Participants: ${expectedParticipants}`, { x: gridBoxX + 15, y: currentY - 42, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  currentPage.drawText(`Duration of the event: ${durationText}`, { x: gridBoxX + 15, y: currentY - 62, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });

  currentY -= box2H;

  // Box 3: Individual vs Team
  const box3H = 50;
  ensureSpace(box3H + 10);
  currentPage.drawRectangle({
    x: gridBoxX,
    y: currentY - box3H,
    width: gridBoxWidth,
    height: box3H,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  // Vertical Divider in Box 3
  currentPage.drawLine({
    start: { x: gridBoxX + 240, y: currentY },
    end: { x: gridBoxX + 240, y: currentY - box3H },
    thickness: 1.2,
    color: rgb(0, 0, 0),
  });

  const pType = String(formSpecs.participant_type || ev.participant_type || ev.event_type || 'Solo').toLowerCase();
  const isTeam = pType.includes('team');
  currentPage.drawText('Individual:', { x: gridBoxX + 15, y: currentY - 30, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  drawRadioCircle(gridBoxX + 85, currentY - 26, !isTeam);

  currentPage.drawText('Team:', { x: gridBoxX + 255, y: currentY - 20, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  drawRadioCircle(gridBoxX + 310, currentY - 16, isTeam);
  currentPage.drawText(`Min Size: ${formSpecs.team_min || formSpecs.minimum_team_size || (isTeam ? 2 : 1)}`, { x: gridBoxX + 255, y: currentY - 35, size: 9.5, font: fontRegular, color: rgb(0, 0, 0) });
  currentPage.drawText(`Max Size: ${formSpecs.team_max || formSpecs.maximum_team_size || (isTeam ? 3 : 1)}`, { x: gridBoxX + 255, y: currentY - 47, size: 9.5, font: fontRegular, color: rgb(0, 0, 0) });

  currentY -= box3H;

  // Box 4: Halls Required (Dynamic Height based on text content)
  const hallsCount = formSpecs.halls_required || formSpecs.hallsRequired || 1;
  const preferredHalls = formSpecs.preferred_halls || ev.preferred_halls || (Array.isArray(formSpecs.preferredHalls) ? formSpecs.preferredHalls.join(', ') : '—');
  const reasonForHalls = formSpecs.reason_for_halls || formSpecs.hall_requirement_reason || formSpecs.reasonForHalls || '—';

  const maxBoxContentW = gridBoxWidth - 30; // 465.28 pt
  const prefLines = wrapText(`Preferred Halls: ${preferredHalls}`, maxBoxContentW, fontRegular, 10);
  const reasonLines = wrapText(`Reason: ${reasonForHalls}`, maxBoxContentW, fontRegular, 10);

  const lineStep = 13.5;
  const box4ContentH = 12 + 15 + 4 + (prefLines.length * lineStep) + 4 + (reasonLines.length * lineStep) + 10;
  const box4H = Math.max(75, box4ContentH);

  ensureSpace(box4H + 10);
  currentPage.drawRectangle({
    x: gridBoxX,
    y: currentY - box4H,
    width: gridBoxWidth,
    height: box4H,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  let curY = currentY - 12;
  currentPage.drawText(`No of Halls Required: ${hallsCount}`, { x: gridBoxX + 15, y: curY - 8, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  curY -= (15 + 4);

  prefLines.forEach((pLine) => {
    currentPage.drawText(pLine, { x: gridBoxX + 15, y: curY - 8, size: 10, font: fontRegular, color: rgb(0, 0, 0) });
    curY -= lineStep;
  });
  curY -= 4;

  reasonLines.forEach((rLine) => {
    currentPage.drawText(rLine, { x: gridBoxX + 15, y: curY - 8, size: 10, font: fontRegular, color: rgb(0, 0, 0) });
    curY -= lineStep;
  });

  currentY -= box4H;

  // Box 5: Slot Details
  const box5H = 65;
  ensureSpace(box5H + 10);
  currentPage.drawRectangle({
    x: gridBoxX,
    y: currentY - box5H,
    width: gridBoxWidth,
    height: box5H,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  currentPage.drawText('Slot Details:', { x: gridBoxX + 15, y: currentY - 20, size: 11, font: fontBold, color: rgb(0, 0, 0) });

  if (formSpecs.is_two_day) {
    currentPage.drawText(`Day 1 Slot: ${formSpecs.day1_slot || formSpecs.day1Slot || 'N/A'}`, { x: gridBoxX + 35, y: currentY - 40, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
    currentPage.drawText(`Day 2 Slot: ${formSpecs.day2_slot || formSpecs.day2Slot || 'N/A'}`, { x: gridBoxX + 250, y: currentY - 40, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  } else {
    const dStr = formSpecs.day || formSpecs.event_day || '';
    const sStr = formSpecs.slot || formSpecs.time_slot || formSpecs.timeSlot || 'N/A';
    currentPage.drawText(`Time Slot: ${dStr ? dStr + ' - ' : ''}${sStr}`, { x: gridBoxX + 35, y: currentY - 40, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  }

  currentY -= box5H;

  // Box 6: Extension Boxes (Dynamic Height based on text content)
  const extBoxesCount = formSpecs.extension_boxes || formSpecs.extension_box_count || formSpecs.extensionBoxes || 0;
  const reasonExt = formSpecs.reason_for_extension_boxes || formSpecs.extension_requirement_reason || formSpecs.reasonForExtensionBoxes || (extBoxesCount > 0 ? 'Required for event equipment' : '—');
  const reasonExtLines = wrapText(`Reason: ${reasonExt}`, maxBoxContentW, fontRegular, 10);

  const box6ContentH = 12 + 15 + 4 + (reasonExtLines.length * lineStep) + 10;
  const box6H = Math.max(55, box6ContentH);

  ensureSpace(box6H + 10);
  currentPage.drawRectangle({
    x: gridBoxX,
    y: currentY - box6H,
    width: gridBoxWidth,
    height: box6H,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  let curY6 = currentY - 12;
  currentPage.drawText(`Extension Boxes: ${extBoxesCount > 0 ? extBoxesCount : '0'}`, { x: gridBoxX + 15, y: curY6 - 8, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  curY6 -= (15 + 4);

  reasonExtLines.forEach((rLine) => {
    currentPage.drawText(rLine, { x: gridBoxX + 15, y: curY6 - 8, size: 10, font: fontRegular, color: rgb(0, 0, 0) });
    curY6 -= lineStep;
  });

  currentY -= box6H;

  // Optional Box 7: Lab Requirements (Dynamic Height based on text content)
  if (formSpecs.labs_required || formSpecs.lab_name || formSpecs.lab_allocated_venue || formSpecs.labsRequired) {
    const lName = formSpecs.lab_name || formSpecs.lab_allocated_venue || formSpecs.labName;
    const labNameStr = lName ? `${lName} (${formSpecs.lab_block || formSpecs.labBlock || ''}, Floor: ${formSpecs.lab_floor || formSpecs.labFloor || 'N/A'}, Lab No: ${formSpecs.lab_no || formSpecs.labNo || 'N/A'})` : 'Yes';
    const labSlotStr = (formSpecs.is_two_day_lab || formSpecs.isTwoDayLab) 
      ? `Day 1: ${formSpecs.lab_session_slot || formSpecs.labSessionSlot || 'Slot 1'}, Day 2: ${formSpecs.lab_session_slot_day2 || formSpecs.labSessionSlotDay2 || 'Slot 2'}` 
      : `${formSpecs.lab_day || formSpecs.labDay || 'Day 1'} - ${formSpecs.lab_session_slot || formSpecs.labSessionSlot || 'Slot 1'}`;

    const labLines = wrapText(`Allotted Lab: ${labNameStr}`, maxBoxContentW - 20, fontRegular, 10);
    const slotLines = wrapText(`Lab Schedule: ${labSlotStr}`, maxBoxContentW - 20, fontRegular, 10);

    const box7ContentH = 12 + 15 + 4 + (labLines.length * lineStep) + 4 + (slotLines.length * lineStep) + 10;
    const box7H = Math.max(65, box7ContentH);

    ensureSpace(box7H + 10);
    currentPage.drawRectangle({
      x: gridBoxX,
      y: currentY - box7H,
      width: gridBoxWidth,
      height: box7H,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.2,
    });

    let curY7 = currentY - 12;
    currentPage.drawText('Lab Requirements:', { x: gridBoxX + 15, y: curY7 - 8, size: 11, font: fontBold, color: rgb(0, 0, 0) });
    curY7 -= (15 + 4);

    labLines.forEach((lLine) => {
      currentPage.drawText(lLine, { x: gridBoxX + 35, y: curY7 - 8, size: 10, font: fontRegular, color: rgb(0, 0, 0) });
      curY7 -= lineStep;
    });
    curY7 -= 4;

    slotLines.forEach((sLine) => {
      currentPage.drawText(sLine, { x: gridBoxX + 35, y: curY7 - 8, size: 10, font: fontRegular, color: rgb(0, 0, 0) });
      curY7 -= lineStep;
    });

    currentY -= box7H;
  }

  // ==========================================
  // PAGE 5: EVENT DESCRIPTION & ROUND RULES
  // ==========================================
  createNewPage();

  const descHeader = 'EVENT DESCRIPTION';
  const descHeaderW = fontBold.widthOfTextAtSize(descHeader, 16);
  currentPage.drawText(descHeader, {
    x: (pageWidth - descHeaderW) / 2,
    y: currentY,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  // Underline
  currentPage.drawLine({
    start: { x: (pageWidth - descHeaderW) / 2, y: currentY - 3 },
    end: { x: (pageWidth + descHeaderW) / 2, y: currentY - 3 },
    thickness: 1.2,
    color: rgb(0, 0, 0),
  });

  currentY -= 35;

  const drawSectionHeader = (pageObj, text, yPos) => {
    const boxH = 24;
    pageObj.drawRectangle({
      x: 50,
      y: yPos - boxH + 6,
      width: 495.28,
      height: boxH,
      color: rgb(0.15, 0.22, 0.32),
    });
    pageObj.drawText(text.toUpperCase(), {
      x: 60,
      y: yPos - 8,
      size: 12,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    return yPos - boxH - 10;
  };

  const drawSubHeader = (pageObj, text, yPos) => {
    pageObj.drawText(text.toUpperCase(), {
      x: 55,
      y: yPos,
      size: 11,
      font: fontBold,
      color: rgb(0.4, 0.4, 0.4),
    });
    return yPos - 16;
  };

  ensureSpace(40);
  currentY = drawSectionHeader(currentPage, 'EVENT PROFILE', currentY);

  ensureSpace(40);
  currentY = drawSubHeader(currentPage, 'Event Name', currentY);
  const evNameLines = wrapText(eventName, 480, fontBold, 14);
  evNameLines.forEach(line => {
    ensureSpace(20);
    currentPage.drawText(line, { x: 55, y: currentY, size: 14, font: fontBold, color: rgb(0, 0, 0) });
    currentY -= 18;
  });
  currentY -= 10;

  ensureSpace(40);
  currentY = drawSubHeader(currentPage, 'Tagline', currentY);
  const tagLines = wrapText(tagline, 480, fontRegular, 12);
  tagLines.forEach(line => {
    ensureSpace(20);
    currentPage.drawText(line, { x: 55, y: currentY, size: 12, font: fontRegular, color: rgb(0, 0, 0) });
    currentY -= 16;
  });
  currentY -= 10;

  ensureSpace(40);
  currentY = drawSubHeader(currentPage, 'Event Description', currentY);
  const aboutLines = wrapText(about, 480, fontRegular, 12);
  aboutLines.forEach(line => {
    ensureSpace(20);
    currentPage.drawText(line, { x: 55, y: currentY, size: 12, font: fontRegular, color: rgb(0, 0, 0) });
    currentY -= 16;
  });
  currentY -= 20;

  const roundsList = Array.isArray(ev.rounds) && ev.rounds.length > 0 ? ev.rounds : [
    { name: 'Round 1', description: '—', rules: ['Rules to be announced'] }
  ];

  roundsList.forEach((rd, rIdx) => {
    ensureSpace(100);

    currentY -= 10;
    currentY = drawSectionHeader(currentPage, `ROUND ${rIdx + 1} : ${rd.name || `Round ${rIdx + 1}`}`, currentY);

    if (rd.description) {
      ensureSpace(40);
      currentY = drawSubHeader(currentPage, 'Description', currentY);
      const descLines = wrapText(rd.description, 480, fontRegular, 11);
      descLines.forEach(line => {
        ensureSpace(18);
        currentPage.drawText(line, { x: 55, y: currentY, size: 11, font: fontRegular, color: rgb(0, 0, 0) });
        currentY -= 16;
      });
      currentY -= 10;
    }

    ensureSpace(40);
    currentY = drawSubHeader(currentPage, 'Round Rules', currentY);
    const rules = Array.isArray(rd.rules) && rd.rules.length > 0 ? rd.rules : ['None'];
    rules.forEach((rl) => {
      const rlLines = wrapText(rl, 470, fontRegular, 11);
      rlLines.forEach((line, lIdx) => {
        ensureSpace(18);
        if (lIdx === 0) {
          currentPage.drawCircle({ x: 58, y: currentY + 3.5, size: 2.2, color: rgb(0.2, 0.2, 0.2) });
        }
        currentPage.drawText(line, { x: 68, y: currentY, size: 11, font: fontRegular, color: rgb(0, 0, 0) });
        currentY -= 16;
      });
    });
    currentY -= 15;

    if (rd.has_tie_breaker) {
      ensureSpace(60);

      currentPage.drawRectangle({
        x: 50,
        y: currentY - 18,
        width: 495.28,
        height: 20,
        color: rgb(0.92, 0.94, 0.96),
      });
      currentPage.drawText(`TIE-BREAKER : ${rd.tie_breaker_name || 'Sudden Death'}`, { x: 60, y: currentY - 12, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      if (rd.tie_breaker_participants) {
        currentPage.drawText(`(Participants: ${rd.tie_breaker_participants})`, { x: 300, y: currentY - 12, size: 10, font: fontItalic, color: rgb(0.3, 0.3, 0.3) });
      }
      currentY -= 30;

      if (rd.tie_breaker_description) {
        const tbDescLines = wrapText(rd.tie_breaker_description, 480, fontRegular, 11);
        tbDescLines.forEach(line => {
          ensureSpace(18);
          currentPage.drawText(line, { x: 55, y: currentY, size: 11, font: fontRegular, color: rgb(0, 0, 0) });
          currentY -= 16;
        });
        currentY -= 10;
      }

      const tbRules = Array.isArray(rd.tie_breaker_rules) && rd.tie_breaker_rules.length > 0 ? rd.tie_breaker_rules : [];
      if (tbRules.length > 0) {
        ensureSpace(40);
        currentY = drawSubHeader(currentPage, 'Tie-Breaker Rules', currentY);
        tbRules.forEach((rl) => {
          const tbrLines = wrapText(rl, 470, fontRegular, 11);
          tbrLines.forEach((line, lIdx) => {
            ensureSpace(18);
            if (lIdx === 0) {
              currentPage.drawCircle({ x: 58, y: currentY + 3.5, size: 2.2, color: rgb(0.2, 0.2, 0.2) });
            }
            currentPage.drawText(line, { x: 68, y: currentY, size: 11, font: fontRegular, color: rgb(0, 0, 0) });
            currentY -= 16;
          });
        });
      }
    }
    currentY -= 15;
  });

  if (Array.isArray(ev.items) && ev.items.length > 0) {
    createNewPage(); // Items always get a clean new page as requested

    const reqText = 'INVOICE / REQUESTED LOGISTICS';
    const reqW = fontBold.widthOfTextAtSize(reqText, 16);
    currentPage.drawText(reqText, { x: (pageWidth - reqW) / 2, y: currentY, size: 16, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

    currentY -= 40;

    const tX = margin + 15;
    const itemColWidths = [35, 230.28, 45, 85, 100];
    const tableWidth = itemColWidths.reduce((a, b) => a + b, 0);
    const itemHeaders = ['S.No', 'Item Name', 'Qty', 'Unit Price', 'Amount'];

    let tableY = currentY;

    const drawTableHeader = () => {
      currentPage.drawRectangle({
        x: tX,
        y: tableY - 24,
        width: tableWidth,
        height: 24,
        color: rgb(0.95, 0.95, 0.95),
      });

      let cellX = tX;
      itemHeaders.forEach((h, idx) => {
        const w = itemColWidths[idx];
        const textW = fontBold.widthOfTextAtSize(h, 9.5);
        let xPos;
        if (idx === 0) {
          xPos = cellX + (w - textW) / 2;
        } else if (idx === 1) {
          xPos = cellX + 8;
        } else if (idx === 2) {
          xPos = cellX + (w - textW) / 2;
        } else if (idx === 3) {
          xPos = cellX + w - textW - 8;
        } else {
          xPos = cellX + w - textW - 10;
        }
        currentPage.drawText(h, {
          x: xPos,
          y: tableY - 16,
          size: 9.5,
          font: fontBold,
          color: rgb(0.2, 0.2, 0.2),
        });
        cellX += w;
      });

      currentPage.drawLine({
        start: { x: tX, y: tableY - 24 },
        end: { x: tX + tableWidth, y: tableY - 24 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      tableY -= 24;
    };

    drawTableHeader();

    let subTotal = 0;
    const lineHeight = 12;

    ev.items.forEach((it, iIdx) => {
      const qty = it.quantity || it.requested_quantity || 1;
      const unitPrice = Number(it.price_per_unit || 0);
      const total = qty * unitPrice;
      subTotal += total;

      const itemName = String(it.item_name || it.name || 'Unknown Item').trim();
      const maxNameWidth = itemColWidths[1] - 16;
      let nameLines = wrapText(itemName, maxNameWidth, fontRegular, 9);
      if (nameLines.length === 0) nameLines = ['Unknown Item'];

      const dynamicRowH = Math.max(24, nameLines.length * lineHeight + 10);

      if (tableY - dynamicRowH < 100) {
        createNewPage();
        tableY = currentY;
        drawTableHeader();
      }

      const firstLineY = tableY - 15;

      // Col 0: S.No (centered)
      const snoStr = String(iIdx + 1);
      const snoW = fontRegular.widthOfTextAtSize(snoStr, 9);
      currentPage.drawText(snoStr, {
        x: tX + (itemColWidths[0] - snoW) / 2,
        y: firstLineY,
        size: 9,
        font: fontRegular,
        color: rgb(0.1, 0.1, 0.1),
      });

      // Col 1: Item Name (left aligned, multi-line wrapped)
      const nameX = tX + itemColWidths[0] + 8;
      nameLines.forEach((line, lIdx) => {
        currentPage.drawText(line, {
          x: nameX,
          y: firstLineY - (lIdx * lineHeight),
          size: 9,
          font: fontRegular,
          color: rgb(0.1, 0.1, 0.1),
        });
      });

      // Col 2: Qty (centered)
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
      const priceStr = `Rs. ${unitPrice.toFixed(2)}`;
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
      const amtStr = `Rs. ${total.toFixed(2)}`;
      const amtW = fontRegular.widthOfTextAtSize(amtStr, 9);
      currentPage.drawText(amtStr, {
        x: amtX + itemColWidths[4] - amtW - 10,
        y: firstLineY,
        size: 9,
        font: fontRegular,
        color: rgb(0.1, 0.1, 0.1),
      });

      currentPage.drawLine({
        start: { x: tX, y: tableY - dynamicRowH },
        end: { x: tX + tableWidth, y: tableY - dynamicRowH },
        thickness: 0.5,
        color: rgb(0.9, 0.9, 0.9),
      });

      tableY -= dynamicRowH;
    });

    const gstAmount = subTotal * 0.18;
    const grandTotal = subTotal + gstAmount;

    const summaryRows = [
      { label: 'Subtotal:', value: `Rs. ${subTotal.toFixed(2)}`, color: rgb(0.1, 0.1, 0.1), isGrand: false },
      { label: 'GST (18%):', value: `Rs. ${gstAmount.toFixed(2)}`, color: rgb(0.1, 0.1, 0.1), isGrand: false },
      { label: 'Grand Total:', value: `Rs. ${grandTotal.toFixed(2)}`, color: rgb(0.05, 0.45, 0.75), isGrand: true },
    ];

    if (tableY - 70 < 100) {
      createNewPage();
      tableY = currentY;
    }

    const priceColX = tX + itemColWidths[0] + itemColWidths[1] + itemColWidths[2];
    const amtColX = priceColX + itemColWidths[3];

    summaryRows.forEach((sRow, sIdx) => {
      const sRowH = sRow.isGrand ? 24 : 20;
      const sFont = fontBold;
      const sSize = sRow.isGrand ? 10.5 : 9.5;
      const sY = tableY - (sRow.isGrand ? 16 : 14);

      const lblW = sFont.widthOfTextAtSize(sRow.label, sSize);
      currentPage.drawText(sRow.label, {
        x: priceColX + itemColWidths[3] - lblW - 8,
        y: sY,
        size: sSize,
        font: sFont,
        color: rgb(0.1, 0.1, 0.1),
      });

      const valW = sFont.widthOfTextAtSize(sRow.value, sSize);
      currentPage.drawText(sRow.value, {
        x: amtColX + itemColWidths[4] - valW - 10,
        y: sY,
        size: sSize,
        font: sFont,
        color: sRow.color,
      });

      if (sIdx === 1) {
        currentPage.drawLine({
          start: { x: priceColX, y: tableY - sRowH },
          end: { x: tX + tableWidth, y: tableY - sRowH },
          thickness: 1,
          color: rgb(0.8, 0.8, 0.8),
        });
      }

      tableY -= sRowH;
    });

    currentY = tableY - 15;
  }

  // Ensure signatures fit on the final page
  ensureSpace(80);
  drawFooterSignatures(currentPage, true);

  const pages = pdfDoc.getPages();
  const genTime = new Date().toLocaleString('en-IN');
  for (const page of pages) {
    page.drawText(eventId, {
      x: 35,
      y: 20,
      size: 8,
      font: fontRegular,
      color: rgb(0, 0, 0)
    });
    const timeWidth = fontRegular.widthOfTextAtSize(genTime, 8);
    page.drawText(genTime, {
      x: pageWidth - 35 - timeWidth,
      y: 20,
      size: 8,
      font: fontRegular,
      color: rgb(0, 0, 0)
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
