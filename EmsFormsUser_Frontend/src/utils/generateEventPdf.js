import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { PSG_LOGO_BASE64 } from './psgLogoBase64';

/**
 * Generates exact high-fidelity 5-Page EVENT RESOURCE FORM PDF matching official PSG College of Technology INTRAMS standard.
 */
export async function generateEventPdf(eventData = {}) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

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
    } catch (_) {}
  }

  // Draw Page Border Frame
  const drawPageBorder = (page) => {
    page.drawRectangle({
      x: margin,
      y: margin,
      width: contentWidth,
      height: pageHeight - margin * 2,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.2,
    });
  };

  // Light INTRAMS 2026 Background Watermark
  const drawWatermark = (page) => {
    page.drawText('INTRAMS 2026', {
      x: 85,
      y: 250,
      size: 70,
      font: fontBold,
      color: rgb(0.88, 0.88, 0.88),
      rotate: degrees(45),
    });
  };

  // Draw Bottom Signature Lines (Secretary & Faculty Advisor)
  const drawFooterSignatures = (page, showColon = false) => {
    const colonStr = showColon ? ':' : '';
    page.drawText(`Signature of the Secretary${colonStr}`, {
      x: margin + 20,
      y: margin + 25,
      size: 10.5,
      font: fontRegular,
      color: rgb(0, 0, 0),
    });
    page.drawText(`Signature of the Faculty Advisor${colonStr}`, {
      x: pageWidth - margin - 210,
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
  const eventName = ev.name || ev.event_name || ev.eventName || formSpecs.eventName || 'sample_event';
  const eventId = ev.event_id || ev.id || ev._id || 'EVNT47';
  const tagline = ev.tagline || formSpecs.tagline || 'Find the time complexity';
  const about = ev.about || ev.description || formSpecs.about || '—';

  const secretarialList = ev.contacts?.secretaries || ev.secretaries || ev.contacts?.secretary || [];
  const secRows = Array.isArray(secretarialList) && secretarialList.length > 0
    ? secretarialList.map(s => [s.name || 'Sample', s.roll_number || s.rollNo || '23N213', s.mobile || s.phone || '1234567890', s.department || 'B.TECH TEXTILE TECH', s.year || '1ST YEAR'])
    : [
        ['Sample', '23N213', '1234567890', 'B.TECH FASHION TECH', '1ST YEAR'],
        ['Sample', '23N213', '1234567890', 'B.TECH TEXTILE TECH', '1ST YEAR'],
      ];

  const convenorList = ev.contacts?.convenors || ev.convenors || [];
  const convRows = Array.isArray(convenorList) && convenorList.length > 0
    ? convenorList.map(c => [c.name || 'Sample', c.roll_number || c.rollNo || '23N213', c.mobile || c.phone || '1234567890', c.department || 'BE EEE (SW)', c.year || '3RD YEAR'])
    : [
        ['Sample', '23N213', '1234567890', 'BE EEE (SW)', '3RD YEAR'],
        ['Sample', '23N213', '1234567890', 'BE CIVIL', '3RD YEAR'],
      ];

  const volunteerList = ev.contacts?.volunteers || ev.volunteers || [];
  const volRows = Array.isArray(volunteerList) && volunteerList.length > 0
    ? volunteerList.map(v => [v.name || 'Sample', v.roll_number || v.rollNo || '23N213', v.mobile || v.phone || '1234567890', v.department || 'B.TECH TEXTILE TECH', v.year || '3RD YEAR'])
    : [
        ['Sample', '23N213', '1234567890', 'B.TECH TEXTILE TECH', '3RD YEAR'],
        ['Sample', '23N213', '1234567890', 'BE METLY', '2ND YEAR'],
      ];

  const facultyObj = ev.contacts?.faculty_advisor || ev.facultyAdvisor || {};
  const facRows = [
    [facultyObj.name || 'Sample', facultyObj.designation || facultyObj.department || 'Sample', facultyObj.mobile || facultyObj.phone || '1234567890']
  ];

  const judgeObj = ev.contacts?.judge || ev.judge || {};
  const judgeRows = [
    [judgeObj.name || 'Sample', judgeObj.designation || 'Sample', judgeObj.mobile || judgeObj.phone || '1234567890']
  ];

  // Helper to draw bordered table for Page 3
  const drawPage3Table = (page, startX, startY, colWidths, headers, rows) => {
    let currentY = startY;
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);

    // Header Row
    page.drawRectangle({
      x: startX,
      y: currentY - 24,
      width: tableWidth,
      height: 24,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.2,
      color: rgb(0.89, 0.95, 0.98), // Light blue header fill
    });

    let cellX = startX;
    headers.forEach((h, idx) => {
      const w = colWidths[idx];
      const textW = fontBold.widthOfTextAtSize(h, 9.5);
      page.drawText(h, {
        x: cellX + (w - textW) / 2,
        y: currentY - 16,
        size: 9.5,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      if (idx < headers.length - 1) {
        page.drawLine({
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
      page.drawRectangle({
        x: startX,
        y: currentY - rowH,
        width: tableWidth,
        height: rowH,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.2,
      });

      cellX = startX;
      row.forEach((val, idx) => {
        const w = colWidths[idx];
        const strVal = String(val || '');
        const font = idx === 0 ? fontRegular : fontRegular;
        const textW = font.widthOfTextAtSize(strVal, 9);
        page.drawText(strVal, {
          x: cellX + (w - textW) / 2,
          y: currentY - 16,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });
        if (idx < row.length - 1) {
          page.drawLine({
            start: { x: cellX + w, y: currentY },
            end: { x: cellX + w, y: currentY - rowH },
            thickness: 1,
            color: rgb(0, 0, 0),
          });
        }
        cellX += w;
      });

      currentY -= rowH;
    });

    return currentY;
  };

  // Helper to draw radio circle (open or filled)
  const drawRadioCircle = (page, cx, cy, isSelected) => {
    page.drawCircle({
      x: cx,
      y: cy,
      size: 6,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.2,
      color: rgb(1, 1, 1),
    });
    if (isSelected) {
      page.drawCircle({
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
  const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawWatermark(page1);
  drawPageBorder(page1);

  // Top Left PSG Crest Logo
  if (psgLogo) {
    page1.drawImage(psgLogo, {
      x: 160,
      y: 728,
      width: 48,
      height: 60,
    });
  }

  // Header College Text
  page1.drawText('PSG College of', { x: 218, y: 760, size: 17, font: fontRegular, color: rgb(0, 0, 0) });
  page1.drawText('Technology, Coimbatore', { x: 218, y: 738, size: 17, font: fontRegular, color: rgb(0, 0, 0) });

  // STUDENTS UNION 2026-2027
  const unionText = 'STUDENTS UNION 2026-2027';
  const unionW = fontBold.widthOfTextAtSize(unionText, 20);
  page1.drawText(unionText, {
    x: (pageWidth - unionW) / 2,
    y: 675,
    size: 20,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Center Kriya Logo area LEFT BLANK as requested
  // (Vertical space reserved ~120pt left blank)

  // INTRAMS 2026 Header
  const intramsText = 'INTRAMS 2026';
  const intramsW = fontBold.widthOfTextAtSize(intramsText, 18);
  page1.drawText(intramsText, {
    x: (pageWidth - intramsW) / 2,
    y: 485,
    size: 18,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Event Resource Form Subtitle
  const formSub = 'Event Resource Form';
  const formSubW = fontBold.widthOfTextAtSize(formSub, 16);
  page1.drawText(formSub, {
    x: (pageWidth - formSubW) / 2,
    y: 450,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // ASSOCIATION/CLUB NAME
  page1.drawText(`ASSOCIATION/CLUB NAME : ${clubName}`, {
    x: 55,
    y: 380,
    size: 13.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // EVENT NAME
  page1.drawText(`EVENT NAME : ${eventName}`, {
    x: 55,
    y: 340,
    size: 13.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // ==========================================
  // PAGE 2: INSTRUCTIONS & GUIDELINES
  // ==========================================
  const page2 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawWatermark(page2);
  drawPageBorder(page2);

  let p2Y = pageHeight - margin - 35;

  const instHeader = 'INSTRUCTIONS';
  const instHeaderW = fontBold.widthOfTextAtSize(instHeader, 16);
  page2.drawText(instHeader, {
    x: (pageWidth - instHeaderW) / 2,
    y: p2Y,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  // Underline
  page2.drawLine({
    start: { x: (pageWidth - instHeaderW) / 2, y: p2Y - 3 },
    end: { x: (pageWidth + instHeaderW) / 2, y: p2Y - 3 },
    thickness: 1.2,
    color: rgb(0, 0, 0),
  });

  p2Y -= 30;

  const subTitle = '(TO BE READ BEFORE FILLING THE FORM)';
  const subTitleW = fontBold.widthOfTextAtSize(subTitle, 11);
  page2.drawText(subTitle, {
    x: (pageWidth - subTitleW) / 2,
    y: p2Y,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  p2Y -= 35;

  page2.drawText('* Kindly submit a separate form for each event, in case of multiple events.', {
    x: margin + 15,
    y: p2Y,
    size: 10,
    font: fontItalic,
    color: rgb(0, 0, 0),
  });
  p2Y -= 18;

  page2.drawText('If an event is conducted over two days (for example, a preliminary round on Day 1 and a final round on Day), include', {
    x: margin + 15,
    y: p2Y,
    size: 10,
    font: fontItalic,
    color: rgb(0, 0, 0),
  });
  p2Y -= 15;
  page2.drawText('all requirements in the same form.', {
    x: margin + 15,
    y: p2Y,
    size: 10,
    font: fontItalic,
    color: rgb(0, 0, 0),
  });

  p2Y -= 35;

  page2.drawText('General Guidelines', {
    x: margin + 15,
    y: p2Y,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  p2Y -= 22;

  const guidelinesList = [
    '1. All event and workshop proposals will be reviewed and approved based on feasibility and relevance.',
    '2. Each club or association can propose up to two events, one workshop, and one paper presentation.',
    '3. Events and workshops should preferably be innovative or aligned with emerging technologies related to the respective stream.',
    '4. Kindly make sure that the judges are present for the entire duration of the event to ensure smooth evaluation.',
    '5. As per Students Union guidelines, cash prizes or mementos should not be provided by clubs/associations.',
    '6. Details of any external guests, as recommended by the Students Union, should be entered in the required items table.',
    '7. Certificates for winners, runners-up, coordinators, and volunteers will be issued by the Students Union.',
    '8. If any materials are needed before the event day, clearly mention "Required in advance" near the Items Name column.',
    '9. Event venues will be allotted based on availability by the Students Union.',
    '10. Projectors available in the allotted halls may be used, and will not be provided by the Students Union.',
    '11. Winner and runner-up details should be submitted within one hour after the event concludes along the judges signature.',
    '12. Participants should arrange their own HDMI cables or VGA converters if required.',
    '13. Clubs and associations are advised to keep sufficient copies of the submitted form for reference.',
    '14. Requests for changes after submission may not be entertained, so ensure all details are finalised before submitting.',
    '15. The completed form must be submitted to the designated point of contact for your club or association.',
    '16. For any clarifications or additional details, contact your respective point of contact.',
  ];

  guidelinesList.forEach((guide) => {
    if (guide.length > 95) {
      const cut = guide.lastIndexOf(' ', 92);
      const l1 = guide.substring(0, cut);
      const l2 = '   ' + guide.substring(cut + 1);
      page2.drawText(l1, { x: margin + 25, y: p2Y, size: 9.5, font: fontRegular, color: rgb(0, 0, 0) });
      p2Y -= 14;
      page2.drawText(l2, { x: margin + 25, y: p2Y, size: 9.5, font: fontRegular, color: rgb(0, 0, 0) });
      p2Y -= 18;
    } else {
      page2.drawText(guide, { x: margin + 25, y: p2Y, size: 9.5, font: fontRegular, color: rgb(0, 0, 0) });
      p2Y -= 18;
    }
  });

  drawFooterSignatures(page2);

  // ==========================================
  // PAGE 3: PERSONNEL & CONTACT TABLES
  // ==========================================
  const page3 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawWatermark(page3);
  drawPageBorder(page3);

  let p3Y = pageHeight - margin - 35;

  const prevTitle = `Event Preview: ${eventId}`;
  const prevTitleW = fontBold.widthOfTextAtSize(prevTitle, 16);
  page3.drawText(prevTitle, {
    x: (pageWidth - prevTitleW) / 2,
    y: p3Y,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  p3Y -= 40;

  const tX = margin + 15;
  const p3ColWidths5 = [100, 85, 95, 125, 80];

  // Secretary Details
  page3.drawText('Secretary Details', { x: tX, y: p3Y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
  p3Y -= 12;
  p3Y = drawPage3Table(page3, tX, p3Y, p3ColWidths5, ['Name', 'Roll Number', 'Mobile No', 'Department', 'Year'], secRows);

  p3Y -= 30;

  // Convenor Details
  page3.drawText('Convenor Details', { x: tX, y: p3Y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
  p3Y -= 12;
  p3Y = drawPage3Table(page3, tX, p3Y, p3ColWidths5, ['Name', 'Roll Number', 'Mobile No', 'Department', 'Year'], convRows);

  p3Y -= 30;

  // Volunteer Details
  page3.drawText('Volunteer Details', { x: tX, y: p3Y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
  p3Y -= 12;
  p3Y = drawPage3Table(page3, tX, p3Y, p3ColWidths5, ['Name', 'Roll Number', 'Mobile No', 'Department', 'Year'], volRows);

  p3Y -= 30;

  // Faculty Advisor Details
  page3.drawText('Faculty Advisor Details', { x: tX, y: p3Y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
  p3Y -= 12;
  p3Y = drawPage3Table(page3, tX, p3Y, [160, 160, 165.28], ['Name', 'Designation', 'Contact Details'], facRows);

  p3Y -= 30;

  // Judge Details
  page3.drawText('Judge Details', { x: tX, y: p3Y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
  p3Y -= 12;
  p3Y = drawPage3Table(page3, tX, p3Y, [160, 160, 165.28], ['Name', 'Designation', 'Contact Details'], judgeRows);

  drawFooterSignatures(page3, true);

  // ==========================================
  // PAGE 4: EVENT DETAILS & RESOURCE MATRIX
  // ==========================================
  const page4 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawWatermark(page4);
  drawPageBorder(page4);

  let p4Y = pageHeight - margin - 35;

  const detTitle = 'Event Details';
  const detTitleW = fontBold.widthOfTextAtSize(detTitle, 16);
  page4.drawText(detTitle, {
    x: (pageWidth - detTitleW) / 2,
    y: p4Y,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  p4Y -= 35;

  const gridBoxX = margin + 15;
  const gridBoxWidth = 495.28;

  // Box 1: Day Selection Row
  const box1H = 38;
  page4.drawRectangle({
    x: gridBoxX,
    y: p4Y - box1H,
    width: gridBoxWidth,
    height: box1H,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  const selectedDayStr = String(formSpecs.day || ev.day || '1').toLowerCase();
  let daySelIdx = 0;
  if (selectedDayStr.includes('2')) daySelIdx = 1;
  else if (selectedDayStr.includes('3')) daySelIdx = 2;

  const dayLabels = ['Day 1', 'Day 2', 'Day 3'];
  dayLabels.forEach((dl, idx) => {
    const lx = gridBoxX + 20 + idx * 150;
    page4.drawText(dl, { x: lx, y: p4Y - 24, size: 11, font: fontRegular, color: rgb(0, 0, 0) });
    drawRadioCircle(page4, lx + 45, p4Y - 20, idx === daySelIdx);
  });

  p4Y -= box1H;

  // Box 2: Parameters
  const box2H = 75;
  page4.drawRectangle({
    x: gridBoxX,
    y: p4Y - box2H,
    width: gridBoxWidth,
    height: box2H,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  const roundsCount = Array.isArray(ev.rounds) ? ev.rounds.length : 2;
  const expectedParticipants = ev.expectedParticipants || formSpecs.expectedParticipants || 7;
  const durationText = formSpecs.duration || ev.duration || '11';

  page4.drawText(`No. of Rounds: ${roundsCount}`, { x: gridBoxX + 15, y: p4Y - 22, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  page4.drawText(`Expected no of Participants: ${expectedParticipants}`, { x: gridBoxX + 15, y: p4Y - 42, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  page4.drawText(`Duration of the event: ${durationText}`, { x: gridBoxX + 15, y: p4Y - 62, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });

  p4Y -= box2H;

  // Box 3: Individual vs Team
  const box3H = 50;
  page4.drawRectangle({
    x: gridBoxX,
    y: p4Y - box3H,
    width: gridBoxWidth,
    height: box3H,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  // Vertical Divider in Box 3
  page4.drawLine({
    start: { x: gridBoxX + 240, y: p4Y },
    end: { x: gridBoxX + 240, y: p4Y - box3H },
    thickness: 1.2,
    color: rgb(0, 0, 0),
  });

  const isTeam = String(formSpecs.participant_type || ev.participant_type || '').toLowerCase().includes('team');
  page4.drawText('Individual:', { x: gridBoxX + 15, y: p4Y - 30, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  drawRadioCircle(page4, gridBoxX + 85, p4Y - 26, !isTeam);

  page4.drawText('Team:', { x: gridBoxX + 255, y: p4Y - 20, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  drawRadioCircle(page4, gridBoxX + 310, p4Y - 16, isTeam);
  page4.drawText(`Min Size: ${formSpecs.team_min || 1}`, { x: gridBoxX + 255, y: p4Y - 35, size: 9.5, font: fontRegular, color: rgb(0, 0, 0) });
  page4.drawText(`Max Size: ${formSpecs.team_max || 1}`, { x: gridBoxX + 255, y: p4Y - 47, size: 9.5, font: fontRegular, color: rgb(0, 0, 0) });

  p4Y -= box3H;

  // Box 4: Halls Required
  const box4H = 75;
  page4.drawRectangle({
    x: gridBoxX,
    y: p4Y - box4H,
    width: gridBoxWidth,
    height: box4H,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  const hallsCount = formSpecs.halls_required || 1;
  const preferredHalls = formSpecs.preferred_halls || ev.preferred_halls || '1123';
  const reasonForHalls = formSpecs.reason_for_halls || ',n, ,';

  page4.drawText(`No of Halls Required: ${hallsCount}`, { x: gridBoxX + 15, y: p4Y - 22, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  page4.drawText(`Preferred Halls: ${preferredHalls}`, { x: gridBoxX + 15, y: p4Y - 42, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  page4.drawText(`Reason: ${reasonForHalls}`, { x: gridBoxX + 15, y: p4Y - 62, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });

  p4Y -= box4H;

  // Box 5: Slot Details
  const box5H = 85;
  page4.drawRectangle({
    x: gridBoxX,
    y: p4Y - box5H,
    width: gridBoxWidth,
    height: box5H,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  const slotStr = String(formSpecs.slot || ev.slot || '1').toLowerCase();
  let slotIdx = 0;
  if (slotStr.includes('full') || slotStr.includes('both')) slotIdx = 2;
  else if (slotStr.includes('2') || slotStr.includes('afternoon')) slotIdx = 1;
  else if (slotStr.includes('1') || slotStr.includes('morning')) slotIdx = 0;

  page4.drawText('Slot Details:', { x: gridBoxX + 15, y: p4Y - 20, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  page4.drawText('Slot 1: 9:30 to 12:30', { x: gridBoxX + 35, y: p4Y - 38, size: 10, font: fontRegular, color: rgb(0, 0, 0) });
  drawRadioCircle(page4, gridBoxX + 175, p4Y - 34, slotIdx === 0);

  page4.drawText('Slot 2: 1:30 to 4:30', { x: gridBoxX + 35, y: p4Y - 55, size: 10, font: fontRegular, color: rgb(0, 0, 0) });
  drawRadioCircle(page4, gridBoxX + 175, p4Y - 51, slotIdx === 1);

  page4.drawText('Full Day', { x: gridBoxX + 35, y: p4Y - 72, size: 10, font: fontRegular, color: rgb(0, 0, 0) });
  drawRadioCircle(page4, gridBoxX + 175, p4Y - 68, slotIdx === 2);

  p4Y -= box5H;

  // Box 6: Extension Boxes
  const box6H = 55;
  page4.drawRectangle({
    x: gridBoxX,
    y: p4Y - box6H,
    width: gridBoxWidth,
    height: box6H,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  const extBoxesCount = formSpecs.extension_boxes || 0;
  const reasonExt = formSpecs.reason_for_extension_boxes || 'bhk';

  page4.drawText(`Extension Boxes: ${extBoxesCount > 0 ? extBoxesCount : ''}`, { x: gridBoxX + 15, y: p4Y - 22, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });
  page4.drawText(`Reason: ${reasonExt}`, { x: gridBoxX + 15, y: p4Y - 42, size: 10.5, font: fontRegular, color: rgb(0, 0, 0) });

  drawFooterSignatures(page4);

  // ==========================================
  // PAGE 5: EVENT DESCRIPTION & ROUND RULES
  // ==========================================
  const page5 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawWatermark(page5);
  drawPageBorder(page5);

  let p5Y = pageHeight - margin - 35;

  const descHeader = 'EVENT DESCRIPTION';
  const descHeaderW = fontBold.widthOfTextAtSize(descHeader, 16);
  page5.drawText(descHeader, {
    x: (pageWidth - descHeaderW) / 2,
    y: p5Y,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  // Underline
  page5.drawLine({
    start: { x: (pageWidth - descHeaderW) / 2, y: p5Y - 3 },
    end: { x: (pageWidth + descHeaderW) / 2, y: p5Y - 3 },
    thickness: 1.2,
    color: rgb(0, 0, 0),
  });

  p5Y -= 45;

  page5.drawText(`EVENT NAME : ${eventName.toUpperCase()}`, { x: 55, y: p5Y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
  p5Y -= 30;

  page5.drawText('ONE LINE DESCRIPTION (TAG LINE) :', { x: 55, y: p5Y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
  p5Y -= 20;
  page5.drawText(tagline, { x: 55, y: p5Y, size: 11, font: fontRegular, color: rgb(0, 0, 0) });
  p5Y -= 35;

  page5.drawText('ABOUT THE EVENT :', { x: 55, y: p5Y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
  p5Y -= 20;
  page5.drawText(about, { x: 55, y: p5Y, size: 11, font: fontRegular, color: rgb(0, 0, 0) });
  p5Y -= 45;

  // Rounds List on Page 5
  const roundsList = Array.isArray(ev.rounds) && ev.rounds.length > 0 ? ev.rounds : [
    { name: 'dfbngf', description: 'iokj', rules: ['njjnj'] }
  ];

  roundsList.forEach((rd, rIdx) => {
    page5.drawText(`ROUND - ${rIdx + 1}`, { x: 55, y: p5Y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    p5Y -= 25;

    page5.drawText(`NAME : ${rd.name || `Round ${rIdx + 1}`}`, { x: 55, y: p5Y, size: 11.5, font: fontBold, color: rgb(0, 0, 0) });
    p5Y -= 25;

    page5.drawText('DESCRIPTION :', { x: 55, y: p5Y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    p5Y -= 20;
    page5.drawText(rd.description || '—', { x: 55, y: p5Y, size: 11, font: fontRegular, color: rgb(0, 0, 0) });
    p5Y -= 30;

    page5.drawText('ROUND RULES :', { x: 55, y: p5Y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    p5Y -= 20;

    const rules = Array.isArray(rd.rules) && rd.rules.length > 0 ? rd.rules : ['njjnj'];
    rules.forEach((rl) => {
      page5.drawText(`• ${rl}`, { x: 55, y: p5Y, size: 11, font: fontRegular, color: rgb(0, 0, 0) });
      p5Y -= 20;
    });

    p5Y -= 25;
  });

  drawFooterSignatures(page5, true);

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
