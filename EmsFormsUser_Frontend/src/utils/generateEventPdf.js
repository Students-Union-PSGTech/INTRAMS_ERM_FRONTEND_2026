import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { PSG_LOGO_BASE64 } from './psgLogoBase64';

/**
 * Generates exact high-fidelity DRAFT ERM FORM PDF matching official PSG College of Technology INTRAMS standard.
 */
export async function generateEventPdf(eventData = {}) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const pageWidth = 595.28; // A4 Portrait width
  const pageHeight = 841.89; // A4 Portrait height
  const margin = 45;
  const contentWidth = pageWidth - margin * 2; // 505.28

  // 1. Load PSG Crest Logo Image
  let logoImage = null;
  try {
    const base64 = PSG_LOGO_BASE64.replace(/^data:image\/png;base64,/, '');
    const logoBytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch (_) {
    try {
      const logoRes = await fetch('/psg_logo.png');
      if (logoRes.ok) {
        const logoBytes = await logoRes.arrayBuffer();
        logoImage = await pdfDoc.embedPng(logoBytes);
      }
    } catch (_) {
      logoImage = null;
    }
  }

  // Helper to draw watermark on page background
  const drawWatermark = (page) => {
    const watermarkText = 'INTRAMS 2026';
    page.drawText(watermarkText, {
      x: 85,
      y: 250,
      size: 70,
      font: fontBold,
      color: rgb(0.78, 0.78, 0.78), // Slightly thicker translucent grey background
      rotate: degrees(45),
    });
  };

  // Helper to draw college logo emblem on top left
  const drawCollegeLogo = (page, startX, startY) => {
    if (logoImage) {
      page.drawImage(logoImage, {
        x: startX,
        y: startY,
        width: 55,
        height: 68,
      });
    } else {
      // Vector fallback box
      const boxWidth = 48;
      const boxHeight = 54;
      page.drawRectangle({
        x: startX,
        y: startY,
        width: boxWidth,
        height: boxHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.2,
      });
      const divY = startY + 20;
      page.drawLine({
        start: { x: startX, y: divY },
        end: { x: startX + boxWidth, y: divY },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      const midX = startX + boxWidth / 2;
      page.drawLine({
        start: { x: midX, y: divY },
        end: { x: midX, y: startY + boxHeight },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      page.drawCircle({
        x: startX + 12,
        y: divY + (startY + boxHeight - divY) / 2,
        size: 6,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.2,
      });
      page.drawRectangle({
        x: midX + 6,
        y: divY + (startY + boxHeight - divY) / 2 - 5,
        width: 10,
        height: 10,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.2,
      });
      const text1951 = '1951';
      const textW = fontBold.widthOfTextAtSize(text1951, 8.5);
      page.drawText(text1951, {
        x: startX + (boxWidth - textW) / 2,
        y: startY + 6,
        size: 8.5,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
    }
  };

  // Helper to draw clean table grid
  const drawTable = (page, { startX, startY, colWidths, headers, rows, headerHeight = 24, rowHeight = 24 }) => {
    let currentY = startY;

    // 1. Draw Header Row
    page.drawRectangle({
      x: startX,
      y: currentY - headerHeight,
      width: contentWidth,
      height: headerHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    let cellX = startX;
    headers.forEach((h, idx) => {
      const w = colWidths[idx];
      const lines = String(h).split('\n');
      const totalTextH = lines.length * 9;
      const textStartY = currentY - (headerHeight - totalTextH) / 2 - 7;

      lines.forEach((lineText, lineIdx) => {
        const textW = fontBold.widthOfTextAtSize(lineText.trim(), 9);
        const textX = cellX + Math.max(2, (w - textW) / 2);
        page.drawText(lineText.trim(), {
          x: textX,
          y: textStartY - lineIdx * 9.5,
          size: 9,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
      });

      page.drawLine({
        start: { x: cellX, y: currentY },
        end: { x: cellX, y: currentY - headerHeight },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      cellX += w;
    });

    // Rightmost border of header
    page.drawLine({
      start: { x: startX + contentWidth, y: currentY },
      end: { x: startX + contentWidth, y: currentY - headerHeight },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    currentY -= headerHeight;

    // 2. Draw Data Rows
    rows.forEach((row) => {
      page.drawRectangle({
        x: startX,
        y: currentY - rowHeight,
        width: contentWidth,
        height: rowHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      let rCellX = startX;
      row.forEach((val, idx) => {
        const w = colWidths[idx];
        const strVal = String(val ?? '').trim();
        const textW = fontRegular.widthOfTextAtSize(strVal, 9);
        const isCentered = idx === 0 || idx === 1 || idx === 3;
        const textX = isCentered ? rCellX + Math.max(3, (w - textW) / 2) : rCellX + 6;

        page.drawText(strVal, {
          x: textX,
          y: currentY - rowHeight + 7,
          size: 9,
          font: fontRegular,
          color: rgb(0, 0, 0),
        });

        page.drawLine({
          start: { x: rCellX, y: currentY },
          end: { x: rCellX, y: currentY - rowHeight },
          thickness: 1,
          color: rgb(0, 0, 0),
        });

        rCellX += w;
      });

      page.drawLine({
        start: { x: startX + contentWidth, y: currentY },
        end: { x: startX + contentWidth, y: currentY - rowHeight },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      currentY -= rowHeight;
    });

    return currentY;
  };

  // Extract Event Data safely
  const ev = eventData || {};
  const clubName = ev.associationName || ev.club_name || ev.clubName || ev.association || 'Computational Sciences Association';
  const eventName = ev.name || ev.event_name || ev.eventName || '—';
  const eventCategory = ev.category || ev.event_category || ev.type || 'Solo';

  // Extract Personnel
  const secretarialList = ev.secretaries || ev.secretary || [];
  const secRows = Array.isArray(secretarialList) && secretarialList.length > 0
    ? secretarialList.map(s => [s.name || s.secretaryName || '—', s.rollNo || s.roll_number || '—', s.phone || s.mobile || '—'])
    : [[ev.secretaryName || '—', ev.secretaryRollNo || '—', ev.secretaryPhone || '—']];

  const convenorList = ev.convenors || ev.convenor || [];
  let convRows = Array.isArray(convenorList) && convenorList.length > 0
    ? convenorList.map(c => [c.name || c.convenorName || '—', c.rollNo || c.roll_number || '—', c.department || c.dept || 'Information Technology', c.phone || c.mobile || '—'])
    : [];
  if (convRows.length === 0) {
    convRows = [
      ['—', '—', 'Information Technology', '—'],
      ['—', '—', 'Electrical & Electronics Engineering', '—'],
    ];
  }

  const facultyObj = ev.facultyAdvisor || ev.faculty || {};
  const facultyRows = [
    [
      `${facultyObj.name || ev.facultyName || '—'} / ${facultyObj.designation || ev.facultyDesignation || '—'}`,
      facultyObj.department || ev.facultyDepartment || 'Mechanical Engineering',
      facultyObj.phone || ev.facultyPhone || '—',
    ]
  ];

  // ==========================================
  // PAGE 1: HEADER & PERSONNEL DETAILS (Balanced Spacing)
  // ==========================================
  const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawWatermark(page1);

  // College Logo Emblem
  drawCollegeLogo(page1, margin, pageHeight - margin - 62);

  // Top Header Titles
  const headersList = [
    { text: 'PSG COLLEGE OF TECHNOLOGY', size: 14, font: fontBold },
    { text: 'STUDENTS UNION 2026-2027', size: 11, font: fontBold },
    { text: 'DRAFT ERM FORM', size: 11.5, font: fontBold },
    { text: 'INTRAMS 2026', size: 11.5, font: fontBold },
  ];

  let headerY = pageHeight - margin - 10;
  headersList.forEach(item => {
    const w = item.font.widthOfTextAtSize(item.text, item.size);
    page1.drawText(item.text, {
      x: (pageWidth - w) / 2,
      y: headerY,
      size: item.size,
      font: item.font,
      color: rgb(0, 0, 0),
    });
    headerY -= (item.size + 4);
  });

  let curY = pageHeight - margin - 110;

  // Metadata Block
  const metaLines = [
    { label: 'CLUB NAME: ', val: clubName },
    { label: 'EVENT NAME: ', val: eventName },
    { label: 'EVENT CATEGORY: ', val: eventCategory },
  ];

  metaLines.forEach(m => {
    page1.drawText(m.label, { x: margin, y: curY, size: 10.5, font: fontBold, color: rgb(0, 0, 0) });
    const lblW = fontBold.widthOfTextAtSize(m.label, 10.5);
    page1.drawText(m.val, { x: margin + lblW, y: curY, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
    curY -= 20;
  });

  curY -= 25; // Spacing before 1st table

  // 1. SECRETARY DETAILS
  page1.drawText('SECRETARY DETAILS:', { x: margin, y: curY, size: 11, font: fontBold, color: rgb(0, 0, 0) });
  curY -= 10;
  curY = drawTable(page1, {
    startX: margin,
    startY: curY,
    colWidths: [210, 160, 135.28],
    headers: ['NAME', 'ROLL NUMBER', 'MOBILE NO'],
    rows: secRows,
    headerHeight: 24,
    rowHeight: 24,
  });

  curY -= 40; // Balanced spacing between 1st and 2nd table

  // 2. CONVENORS DETAILS
  page1.drawText('CONVENORS DETAILS:', { x: margin, y: curY, size: 11, font: fontBold, color: rgb(0, 0, 0) });
  curY -= 10;
  curY = drawTable(page1, {
    startX: margin,
    startY: curY,
    colWidths: [140, 110, 140, 115.28],
    headers: ['NAME', 'ROLL NUMBER', 'DEPARTMENT & YEAR', 'MOBILE NO'],
    rows: convRows,
    headerHeight: 24,
    rowHeight: 24,
  });

  curY -= 40; // Balanced spacing between 2nd and 3rd table

  // 3. FACULTY ADVISOR DETAILS
  page1.drawText('FACULTY ADVISOR DETAILS:', { x: margin, y: curY, size: 11, font: fontBold, color: rgb(0, 0, 0) });
  curY -= 10;
  curY = drawTable(page1, {
    startX: margin,
    startY: curY,
    colWidths: [190, 175, 140.28],
    headers: ['NAME/ DESIGNATION', 'DEPARTMENT', 'MOBILE NO'],
    rows: facultyRows,
    headerHeight: 24,
    rowHeight: 24,
  });

  // Bottom Signature
  page1.drawText('SECRETARY SIGNATURE', {
    x: pageWidth - margin - 150,
    y: margin + 25,
    size: 10.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // ==========================================
  // PAGE 2: EVENT DESCRIPTION & ROUNDS
  // ==========================================
  const page2 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawWatermark(page2);

  let p2Y = pageHeight - margin - 10;
  page2.drawText('EVENT DESCRIPTION', { x: margin, y: p2Y, size: 12.5, font: fontBold, color: rgb(0, 0, 0) });
  // Underline
  page2.drawLine({
    start: { x: margin, y: p2Y - 2 },
    end: { x: margin + 150, y: p2Y - 2 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  p2Y -= 32;

  const descFields = [
    { label: 'EVENT NAME: ', val: eventName },
    { label: 'TEAM / INDIVIDUAL EVENT: ', val: eventCategory },
    { label: 'Preferred Date/Time: ', val: ev.preferredDate || ev.date || '' },
    { label: 'Preferred Venue: ', val: ev.preferredVenue || ev.venue || '' },
    { label: `TEAM SIZE: MIN ${ev.minTeamSize || 1} / MAX ${ev.maxTeamSize || 1}`, val: '' },
    { label: 'EXPECTED PARTICIPANT COUNT: ', val: String(ev.expectedParticipants || ev.participantCount || '') },
    { label: 'ONE LINE DESCRIPTION: ', val: ev.shortDescription || ev.oneLineDescription || '' },
    { label: 'ABOUT THE EVENT:', val: '' },
    { label: '', val: ev.about || ev.description || '' },
  ];

  descFields.forEach(f => {
    if (f.label) {
      page2.drawText(f.label, { x: margin, y: p2Y, size: 10.5, font: fontBold, color: rgb(0, 0, 0) });
      if (f.val) {
        const lw = fontBold.widthOfTextAtSize(f.label, 10.5);
        page2.drawText(f.val, { x: margin + lw, y: p2Y, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
      }
      p2Y -= 22;
    } else if (f.val) {
      page2.drawText(f.val, { x: margin, y: p2Y, size: 10, font: fontRegular, color: rgb(0, 0, 0) });
      p2Y -= 28;
    }
  });

  p2Y -= 15;

  // Rounds Section
  const roundsList = Array.isArray(ev.rounds) && ev.rounds.length > 0 ? ev.rounds : [
    {
      name: ev.round1Name || 'Round 1',
      description: ev.round1Description || '—',
      duration: ev.round1Duration || '—',
      scoring: ev.round1Scoring || '—',
      tieBreaker: ev.round1TieBreaker || '—',
    }
  ];

  roundsList.forEach((r, rIdx) => {
    const roundTitle = `ROUND – ${rIdx + 1} NAME & DESCRIPTION`;
    page2.drawText(roundTitle, { x: margin, y: p2Y, size: 11, font: fontBold, color: rgb(0, 0, 0) });
    p2Y -= 20;

    const rFields = [
      { label: 'NAME: ', val: r.name || `Round ${rIdx + 1}` },
      { label: 'DESCRIPTION: ', val: r.description || '—' },
      { label: 'DURATION: ', val: r.duration || '—' },
      { label: 'SCORING: ', val: r.scoring || '—' },
      { label: 'TIE-BREAKING CRITERIA: ', val: r.tieBreaker || r.tie_breaking_criteria || '—' },
    ];

    rFields.forEach(rf => {
      page2.drawText(rf.label, { x: margin, y: p2Y, size: 10.5, font: fontBold, color: rgb(0, 0, 0) });
      const rw = fontBold.widthOfTextAtSize(rf.label, 10.5);
      page2.drawText(String(rf.val), { x: margin + rw, y: p2Y, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
      p2Y -= 20;
    });

    p2Y -= 18;
  });

  // ==========================================
  // PAGE 3: ITEMS REQUIRED (Full Height Spacing)
  // ==========================================
  const page3 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawWatermark(page3);

  let p3Y = pageHeight - margin - 10;
  const itemTitle = 'ITEMS REQUIRED';
  const itemTW = fontBold.widthOfTextAtSize(itemTitle, 13);
  page3.drawText(itemTitle, { x: (pageWidth - itemTW) / 2, y: p3Y, size: 13, font: fontBold, color: rgb(0, 0, 0) });
  page3.drawLine({
    start: { x: (pageWidth - itemTW) / 2, y: p3Y - 2 },
    end: { x: (pageWidth + itemTW) / 2, y: p3Y - 2 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  p3Y -= 30;

  // Extract requested items list (15 rows max)
  const itemsList = ev.items || ev.requirements || ev.itemsRequired || [];
  const itemRows = [];

  for (let i = 1; i <= 15; i++) {
    const itemData = itemsList[i - 1] || {};
    itemRows.push([
      String(i),
      itemData.name || itemData.itemName || '',
      itemData.specifications || itemData.specs || '',
      itemData.quantity ? String(itemData.quantity) : '',
      itemData.pricePerUnit ? String(itemData.pricePerUnit) : '',
      itemData.totalPrice ? String(itemData.totalPrice) : '',
    ]);
  }

  drawTable(page3, {
    startX: margin,
    startY: p3Y,
    colWidths: [40, 145, 140, 60, 60, 60.28],
    headers: ['S.NO.', 'ITEM NAME', 'SPECIFICATIONS\n(COLOUR)', 'QUANTITY', 'PRICE PER\nUNIT', 'TOTAL\nPRICE'],
    rows: itemRows,
    headerHeight: 30,
    rowHeight: 26, // Spaced out comfortably over Page 3 height
  });

  // ==========================================
  // PAGE 4: INSTRUCTIONS
  // ==========================================
  const page4 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawWatermark(page4);

  let p4Y = pageHeight - margin - 10;
  const instTitle = 'INSTRUCTIONS';
  const instW = fontBold.widthOfTextAtSize(instTitle, 13);
  page4.drawText(instTitle, { x: (pageWidth - instW) / 2, y: p4Y, size: 13, font: fontBold, color: rgb(0, 0, 0) });
  page4.drawLine({
    start: { x: (pageWidth - instW) / 2, y: p4Y - 2 },
    end: { x: (pageWidth + instW) / 2, y: p4Y - 2 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  p4Y -= 18;
  const subInst = '(TO BE READ BEFORE FILLING THE FORM)';
  const subW = fontBold.widthOfTextAtSize(subInst, 10.5);
  page4.drawText(subInst, { x: (pageWidth - subW) / 2, y: p4Y, size: 10.5, font: fontBold, color: rgb(0, 0, 0) });

  p4Y -= 28;

  const note1 = '* If two different events are to be conducted then fill the above form for each event separately and submit it.';
  page4.drawText(note1, { x: margin, y: p4Y, size: 9.8, font: fontBold, color: rgb(0, 0, 0) });
  p4Y -= 16;

  const note2 = '** If the same event continues on both the days (i.e.) Preliminary round on first day and final round on second day, then';
  page4.drawText(note2, { x: margin, y: p4Y, size: 9.8, font: fontBold, color: rgb(0, 0, 0) });
  p4Y -= 14;
  const note2b = 'fill the needed requirement in the same form.';
  page4.drawText(note2b, { x: margin, y: p4Y, size: 9.8, font: fontBold, color: rgb(0, 0, 0) });

  p4Y -= 24;
  page4.drawText('Instructions:', { x: margin, y: p4Y, size: 10.5, font: fontBold, color: rgb(0, 0, 0) });
  p4Y -= 20;

  const instructionsTextList = [
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

  instructionsTextList.forEach(ins => {
    if (ins.length > 92) {
      const cut = ins.lastIndexOf(' ', 88);
      const line1 = ins.substring(0, cut);
      const line2 = '   ' + ins.substring(cut + 1);
      page4.drawText(line1, { x: margin, y: p4Y, size: 9.5, font: fontRegular, color: rgb(0, 0, 0) });
      p4Y -= 14;
      page4.drawText(line2, { x: margin, y: p4Y, size: 9.5, font: fontRegular, color: rgb(0, 0, 0) });
      p4Y -= 18;
    } else {
      page4.drawText(ins, { x: margin, y: p4Y, size: 9.5, font: fontRegular, color: rgb(0, 0, 0) });
      p4Y -= 18;
    }
  });

  page4.drawText('SECRETARY SIGNATURE', {
    x: pageWidth - margin - 150,
    y: margin + 65,
    size: 10.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
