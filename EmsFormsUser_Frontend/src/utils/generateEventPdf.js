import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { PSG_LOGO_BASE64 } from './psgLogoBase64';

/**
 * Generates exact high-fidelity 5-Page EVENT RESOURCE FORM PDF matching official PSG College of Technology INTRAMS standard.
 */
export async function generateEventPdf(eventData = {}) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

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
  const formSpecs = ev.form || {};
  const clubName = ev.associationName || ev.club_name || ev.clubName || ev.association || formSpecs.associationName || 'Students Union';
  const eventId = ev.event_id || ev.id || ev._id || 'EVNT47';
  const rawEventName = ev.name || ev.event_name || ev.eventName || formSpecs.eventName || 'sample_event';
  const eventName = `${rawEventName} ${eventId ? `(${eventId})` : ''}`.trim();
  const tagline = ev.tagline || formSpecs.tagline || 'Find the time complexity';
  const about = ev.about || ev.description || formSpecs.about || '—';

  const formatYear = (yearStr) => {
    if (!yearStr) return 'IV YEAR';
    const y = String(yearStr).trim().toUpperCase();
    if (y.includes('MSC')) return y;
    if (y === '1' || y.startsWith('1ST') || y === 'I' || y === 'I YEAR') return 'I YEAR';
    if (y === '2' || y.startsWith('2ND') || y === 'II' || y === 'II YEAR') return 'II YEAR';
    if (y === '3' || y.startsWith('3RD') || y === 'III' || y === 'III YEAR') return 'III YEAR';
    if (y === '4' || y.startsWith('4TH') || y === 'IV' || y === 'IV YEAR') return 'IV YEAR';
    if (y === '5' || y.startsWith('5TH') || y === 'V' || y === 'V YEAR') return 'V YEAR';
    return y.includes('YEAR') ? y : `${y} YEAR`;
  };

  const rawSec = ev.contacts?.secretaries || ev.secretaries || ev.contacts?.secretary;
  const secretarialList = rawSec ? (Array.isArray(rawSec) ? rawSec : [rawSec]) : [];
  const secRows = secretarialList.length > 0
    ? secretarialList.map(s => [s.name || '', s.roll_number || s.rollNo || '', s.mobile || s.phone || '', s.department || '', formatYear(s.year)])
    : [
      ['', '', '', '', '']
    ];

  const rawConv = ev.contacts?.convenors || ev.convenors || ev.contacts?.convenor;
  const convenorList = rawConv ? (Array.isArray(rawConv) ? rawConv : [rawConv]) : [];
  const convRows = convenorList.length > 0
    ? convenorList.map(c => [c.name || '', c.roll_number || c.rollNo || '', c.mobile || c.phone || '', c.department || '', formatYear(c.year)])
    : [
      ['', '', '', '', '']
    ];

  const rawVol = ev.contacts?.volunteers || ev.volunteers || ev.contacts?.volunteer;
  const volunteerList = rawVol ? (Array.isArray(rawVol) ? rawVol : [rawVol]) : [];
  const volRows = volunteerList.length > 0
    ? volunteerList.map(v => [v.name || '', v.roll_number || v.rollNo || '', v.mobile || v.phone || '', v.department || '', formatYear(v.year)])
    : [
      ['', '', '', '', '']
    ];

  const facultyObj = ev.contacts?.faculty_advisor || ev.facultyAdvisor || {};
  const facRows = facultyObj.name ? [
    [facultyObj.name || '', facultyObj.designation || '', facultyObj.mobile || facultyObj.phone || '']
  ] : [
    ['', '', '']
  ];

  const judgeObj = ev.contacts?.judge || ev.judge || {};
  const judgeRows = judgeObj.name && judgeObj.name.trim() ? [
    [judgeObj.name || '', judgeObj.designation || '', judgeObj.mobile || judgeObj.phone || '']
  ] : [];

  const chiefGuestObj = ev.contacts?.chief_guest || ev.chief_guest || {};
  const chiefGuestRows = chiefGuestObj.name && chiefGuestObj.name.trim() ? [
    [
      chiefGuestObj.name || '',
      chiefGuestObj.designation || '',
      String(chiefGuestObj.remuneration || ''),
      chiefGuestObj.accommodation_required ? 'Yes' : 'No',
      chiefGuestObj.travel_required ? 'Yes' : 'No',
      chiefGuestObj.short_note || ''
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

    // Header Row (requires 24pt)
    ensureSpace(24);

    // Draw Header Background & Box
    currentPage.drawRectangle({
      x: startX,
      y: currentY - 24,
      width: tableWidth,
      height: 24,
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
        y: currentY - 16,
        size: 9.5,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      if (idx < headers.length - 1) {
        currentPage.drawLine({
          start: { x: cellX + w, y: currentY },
          end: { x: cellX + w, y: currentY - 24 },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
      }
      cellX += w;
    });

    currentY -= 24;

    // Data Rows
    rows.forEach((row) => {
      const rowH = 24;
      ensureSpace(rowH); // Ensure space for the row!

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
        const strVal = String(val || '');
        const font = idx === 0 ? fontRegular : fontRegular;
        let size = 9;
        let textW = font.widthOfTextAtSize(strVal, size);
        while (textW > (w - 6) && size > 4) {
          size -= 0.5;
          textW = font.widthOfTextAtSize(strVal, size);
        }
        currentPage.drawText(strVal, {
          x: cellXData + (w - textW) / 2,
          y: currentY - 16,
          size: size,
          font: font,
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

  // Helper to wrap text
  const wrapText = (text, maxWidth, font, fontSize) => {
    if (!text) return [];
    const words = String(text).split(' ');
    let lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = font.widthOfTextAtSize(currentLine + ' ' + word, fontSize);
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
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
  const p3ColWidths5 = [100, 85, 95, 125, 80];

  // Secretary Details
  ensureSpace(45);
  currentPage.drawText('Secretary Details', { x: tX, y: currentY, size: 12, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 12;
  drawPage3Table(tX, p3ColWidths5, ['Name', 'Roll Number', 'Mobile No', 'Department', 'Year'], secRows);
  currentY -= 30;

  // Convenor Details
  ensureSpace(45);
  currentPage.drawText('Convenor Details', { x: tX, y: currentY, size: 12, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 12;
  drawPage3Table(tX, p3ColWidths5, ['Name', 'Roll Number', 'Mobile No', 'Department', 'Year'], convRows);
  currentY -= 30;

  // Volunteer Details
  ensureSpace(45);
  currentPage.drawText('Volunteer Details', { x: tX, y: currentY, size: 12, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 12;
  drawPage3Table(tX, p3ColWidths5, ['Name', 'Roll Number', 'Mobile No', 'Department', 'Year'], volRows);
  currentY -= 30;

  // Faculty Advisor Details
  ensureSpace(45);
  currentPage.drawText('Faculty Advisor Details', { x: tX, y: currentY, size: 12, font: fontBold, color: rgb(0, 0, 0) });
  currentY -= 12;
  drawPage3Table(tX, [160, 160, 165.28], ['Name', 'Designation', 'Contact Details'], facRows);
  currentY -= 30;

  // Judge Details
  if (judgeRows.length > 0) {
    ensureSpace(45);
    currentPage.drawText('Judge Details', { x: tX, y: currentY, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    currentY -= 12;
    drawPage3Table(tX, [160, 160, 165.28], ['Name', 'Designation', 'Contact Details'], judgeRows);
  }

  // Chief Guest Details
  if (chiefGuestRows.length > 0) {
    ensureSpace(45);
    currentPage.drawText('Chief Guest Details', { x: tX, y: currentY, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    currentY -= 12;
    drawPage3Table(tX, [80, 90, 80, 50, 50, 135.28], ['Name', 'Designation', 'Remuneration', 'Accomm.', 'Travel', 'Note'], chiefGuestRows);
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

  const eventDayText = formSpecs.is_two_day ? '2 Days Event' : (formSpecs.day || 'N/A');
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

  const roundsCount = Array.isArray(ev.rounds) ? ev.rounds.length : 2;
  const expectedParticipants = ev.expectedParticipants || formSpecs.expectedParticipants || 7;
  const durationText = formSpecs.duration || ev.duration || '11';

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

  const pType = String(formSpecs.participant_type || ev.participant_type || '').toLowerCase();
  const isTeam = pType.includes('team');
  currentPage.drawText('Individual:', { x: gridBoxX + 15, y: currentY - 30, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  drawRadioCircle(gridBoxX + 85, currentY - 26, !isTeam);

  currentPage.drawText('Team:', { x: gridBoxX + 255, y: currentY - 20, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  drawRadioCircle(gridBoxX + 310, currentY - 16, isTeam);
  currentPage.drawText(`Min Size: ${formSpecs.team_min || 1}`, { x: gridBoxX + 255, y: currentY - 35, size: 9.5, font: fontRegular, color: rgb(0, 0, 0) });
  currentPage.drawText(`Max Size: ${formSpecs.team_max || 1}`, { x: gridBoxX + 255, y: currentY - 47, size: 9.5, font: fontRegular, color: rgb(0, 0, 0) });

  currentY -= box3H;

  // Box 4: Halls Required
  const box4H = 75;
  ensureSpace(box4H + 10);
  currentPage.drawRectangle({
    x: gridBoxX,
    y: currentY - box4H,
    width: gridBoxWidth,
    height: box4H,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  const hallsCount = formSpecs.halls_required || 1;
  const preferredHalls = formSpecs.preferred_halls || ev.preferred_halls || '1123';
  const reasonForHalls = formSpecs.reason_for_halls || ',n, ,';

  currentPage.drawText(`No of Halls Required: ${hallsCount}`, { x: gridBoxX + 15, y: currentY - 22, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  currentPage.drawText(`Preferred Halls: ${preferredHalls}`, { x: gridBoxX + 15, y: currentY - 42, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  currentPage.drawText(`Reason: ${reasonForHalls}`, { x: gridBoxX + 15, y: currentY - 62, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });

  currentY -= box4H;

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
    currentPage.drawText(`Day 1 Slot: ${formSpecs.day1_slot || 'N/A'}`, { x: gridBoxX + 35, y: currentY - 40, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
    currentPage.drawText(`Day 2 Slot: ${formSpecs.day2_slot || 'N/A'}`, { x: gridBoxX + 250, y: currentY - 40, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  } else {
    currentPage.drawText(`Time Slot: ${formSpecs.day ? formSpecs.day + ' - ' : ''}${formSpecs.slot || 'N/A'}`, { x: gridBoxX + 35, y: currentY - 40, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  }

  currentY -= box5H;

  // Box 6: Extension Boxes
  const box6H = 55;
  ensureSpace(box6H + 10);
  currentPage.drawRectangle({
    x: gridBoxX,
    y: currentY - box6H,
    width: gridBoxWidth,
    height: box6H,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  const extBoxesCount = formSpecs.extension_boxes || 0;
  const reasonExt = formSpecs.reason_for_extension_boxes || 'bhk';

  currentPage.drawText(`Extension Boxes: ${extBoxesCount > 0 ? extBoxesCount : ''}`, { x: gridBoxX + 15, y: currentY - 22, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  currentPage.drawText(`Reason: ${reasonExt}`, { x: gridBoxX + 15, y: currentY - 42, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });

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
    { name: 'dfbngf', description: 'iokj', rules: ['njjnj'] }
  ];

  roundsList.forEach((rd, rIdx) => {
    ensureSpace(120); // ensure space for round header + some content

    currentY -= 10;
    currentY = drawSectionHeader(currentPage, `ROUND ${rIdx + 1} : ${rd.name || `Round ${rIdx + 1}`}`, currentY);

    if (rd.description) {
      ensureSpace(40);
      currentY = drawSubHeader(currentPage, 'Description', currentY);
      const descLines = wrapText(rd.description, 480, fontRegular, 12);
      descLines.forEach(line => {
        ensureSpace(20);
        currentPage.drawText(line, { x: 55, y: currentY, size: 12, font: fontRegular, color: rgb(0, 0, 0) });
        currentY -= 16;
      });
      currentY -= 10;
    }

    ensureSpace(40);
    currentY = drawSubHeader(currentPage, 'Round Rules', currentY);
    const rules = Array.isArray(rd.rules) && rd.rules.length > 0 ? rd.rules : ['None'];
    rules.forEach((rl) => {
      const rlLines = wrapText(`• ${rl}`, 480, fontRegular, 12);
      rlLines.forEach((line) => {
        ensureSpace(20);
        currentPage.drawText(line, { x: 55, y: currentY, size: 12, font: fontRegular, color: rgb(0, 0, 0) });
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
        color: rgb(0.92, 0.94, 0.96), // Very light grey banner
      });
      currentPage.drawText(`TIE-BREAKER : ${rd.tie_breaker_name || 'Sudden Death'}`, { x: 60, y: currentY - 12, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      if (rd.tie_breaker_participants) {
        currentPage.drawText(`(Participants: ${rd.tie_breaker_participants})`, { x: 300, y: currentY - 12, size: 10, font: fontItalic, color: rgb(0.3, 0.3, 0.3) });
      }
      currentY -= 30;

      if (rd.tie_breaker_description) {
        const tbDescLines = wrapText(rd.tie_breaker_description, 480, fontRegular, 11);
        tbDescLines.forEach(line => {
          ensureSpace(20);
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
          const tbrLines = wrapText(`• ${rl}`, 480, fontRegular, 11);
          tbrLines.forEach(line => {
            ensureSpace(20);
            currentPage.drawText(line, { x: 55, y: currentY, size: 11, font: fontRegular, color: rgb(0, 0, 0) });
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

    const tX = margin + 30;
    const itemColWidths = [40, 200, 50, 80, 95.28];
    const itemHeaders = ['S.No', 'Item Name', 'Qty', 'Unit Price', 'Amount'];

    let subTotal = 0;
    const itemRows = ev.items.map((it, iIdx) => {
      const qty = it.quantity || it.requested_quantity || 1;
      const unitPrice = it.price_per_unit || 0;
      const total = qty * unitPrice;
      subTotal += total;
      return [
        String(iIdx + 1),
        it.item_name || it.name || 'Unknown Item',
        String(qty),
        `Rs. ${unitPrice.toFixed(2)}`,
        `Rs. ${total.toFixed(2)}`
      ];
    });

    const gstAmount = subTotal * 0.18;
    const grandTotal = subTotal + gstAmount;

    itemRows.push(['', '', '', 'Subtotal:', `Rs. ${subTotal.toFixed(2)}`]);
    itemRows.push(['', '', '', 'GST (18%):', `Rs. ${gstAmount.toFixed(2)}`]);
    itemRows.push(['', '', '', 'Grand Total:', `Rs. ${grandTotal.toFixed(2)}`]);

    // Draw Invoice Style Table
    let tableY = currentY;
    const tableWidth = itemColWidths.reduce((a, b) => a + b, 0);

    currentPage.drawRectangle({
      x: tX, y: tableY - 24, width: tableWidth, height: 24,
      color: rgb(0.95, 0.95, 0.95),
    });

    let cellX = tX;
    itemHeaders.forEach((h, idx) => {
      const w = itemColWidths[idx];
      const textW = fontBold.widthOfTextAtSize(h, 9.5);
      const xPos = idx === itemHeaders.length - 1 ? cellX + w - textW - 10 : (idx === 0 ? cellX + 10 : cellX + (w - textW) / 2);
      currentPage.drawText(h, { x: xPos, y: tableY - 16, size: 9.5, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
      cellX += w;
    });

    currentPage.drawLine({
      start: { x: tX, y: tableY - 24 }, end: { x: tX + tableWidth, y: tableY - 24 },
      thickness: 1, color: rgb(0.8, 0.8, 0.8),
    });
    tableY -= 24;

    itemRows.forEach((row, rIdx) => {
      const isSummary = rIdx >= itemRows.length - 3;
      const rowH = isSummary ? 20 : 24;
      const fontToUse = isSummary ? fontBold : fontRegular;

      let cellXData = tX;
      row.forEach((val, idx) => {
        const w = itemColWidths[idx];
        const strVal = String(val || '');
        if (strVal) {
          let size = isSummary ? 10 : 9;
          let textW = fontToUse.widthOfTextAtSize(strVal, size);
          let xPos = idx === itemHeaders.length - 1 ? cellXData + w - textW - 10 : (idx === itemHeaders.length - 2 && isSummary ? cellXData + w - textW - 5 : (idx === 0 ? cellXData + 10 : cellXData + (w - textW) / 2));
          currentPage.drawText(strVal, { x: xPos, y: tableY - 16, size: size, font: fontToUse, color: isSummary && idx === itemHeaders.length - 1 && rIdx === itemRows.length - 1 ? rgb(0.1, 0.5, 0.8) : rgb(0.1, 0.1, 0.1) });
        }
        cellXData += w;
      });

      if (!isSummary) {
        currentPage.drawLine({ start: { x: tX, y: tableY - rowH }, end: { x: tX + tableWidth, y: tableY - rowH }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
      } else if (rIdx === itemRows.length - 2) {
        currentPage.drawLine({ start: { x: tX + itemColWidths[0] + itemColWidths[1] + itemColWidths[2], y: tableY - rowH }, end: { x: tX + tableWidth, y: tableY - rowH }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
      }
      tableY -= rowH;
    });
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
