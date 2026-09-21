import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { PSG_LOGO_BASE64 } from './psgLogoBase64';
import { KRIYA_LOGO_BASE64 } from './kriyaLogoBase64';

/**
 * Generates exact high-fidelity LAB CONFIRMATION FORM PDF matching official PSG College of Technology standard.
 */
export async function generateLabPdf(eventData = {}) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const pageWidth = 595.28; // A4 Portrait width
  const pageHeight = 841.89; // A4 Portrait height
  const margin = 25;
  const contentWidth = pageWidth - margin * 2; // 545.28

  // Light INTRAMS 2026 Background Watermark
  const drawWatermark = (page) => {
    // Watermark removed
  };

  // Helper to load PNG image from base64 or fallback URL
  const loadPng = async (base64Str, fallbackUrl) => {
    try {
      if (base64Str) {
        const cleanBase64 = base64Str.replace(/^data:image\/png;base64,/, '');
        const bytes = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));
        return await pdfDoc.embedPng(bytes);
      }
    } catch (_) { /* ignore */ }

    try {
      if (fallbackUrl) {
        const res = await fetch(fallbackUrl);
        if (res.ok) {
          const bytes = await res.arrayBuffer();
          return await pdfDoc.embedPng(bytes);
        }
      }
    } catch (_) { /* ignore */ }
    return null;
  };

  const psgLogo = await loadPng(PSG_LOGO_BASE64, '/psg_logo.png');

  // Extract Event Details
  const associationName =
    eventData?.club_name ||
    eventData?.associationName ||
    eventData?.clubName ||
    eventData?.form?.associationName ||
    'Students Union';

  const eventName =
    eventData?.name ||
    eventData?.event_name ||
    eventData?.title ||
    eventData?.form?.eventName ||
    'sample_event';

  let rawConvenors =
    eventData?.contacts?.convenors ||
    eventData?.contacts?.convenor ||
    eventData?.convenors ||
    eventData?.form?.convenors ||
    eventData?.convenor_details ||
    (eventData?.convenorName ? [{ name: eventData.convenorName, rollNo: eventData.convenorRollNo, phone: eventData.convenorPhone }] : []);

  rawConvenors = rawConvenors ? (Array.isArray(rawConvenors) ? rawConvenors : [rawConvenors]) : [];

  const convenorsList = rawConvenors.length > 0
    ? rawConvenors.map(c => ({
      name: c.name || '',
      rollNo: c.roll_number || c.rollNo || '',
      phone: c.mobile || c.phone || ''
    }))
    : [
      { name: '', rollNo: '', phone: '' },
      { name: '', rollNo: '', phone: '' },
    ];

  const isTwoDayLab = eventData?.is_two_day_lab || eventData?.form?.is_two_day_lab || eventData?.form_specs?.is_two_day_lab || false;
  const labDayRaw = eventData?.lab_day || eventData?.form?.lab_day || eventData?.form_specs?.lab_day || eventData?.event_day || eventData?.form?.event_day || eventData?.day || '1';
  const labSlotRaw = eventData?.lab_session_slot || eventData?.form?.lab_session_slot || eventData?.form_specs?.lab_session_slot || eventData?.session_slot || eventData?.form?.session_slot || '1';

  const dateAllotted = isTwoDayLab ? '2 Days' : (labDayRaw || 'N/A');
  const durationInHrs = String(eventData?.duration_in_hrs || eventData?.form?.duration || eventData?.form_specs?.duration || eventData?.duration || 'N/A');
  const labName = String(eventData?.lab_name || eventData?.form?.lab_name || eventData?.form_specs?.lab_name || eventData?.preferred_halls || eventData?.form?.preferred_halls || eventData?.form_specs?.preferred_halls || 'N/A');
  const labBlock = String(eventData?.lab_block || eventData?.form?.lab_block || eventData?.form_specs?.lab_block || 'N/A');
  const labFloor = String(eventData?.lab_floor || eventData?.form?.lab_floor || eventData?.form_specs?.lab_floor || 'N/A');
  const labNo = String(eventData?.lab_no || eventData?.form?.lab_no || eventData?.form_specs?.lab_no || 'N/A');

  const selectedDayStr = String(labDayRaw).toLowerCase();
  const selectedSessionStr = String(labSlotRaw).toLowerCase();

  // Helper to draw radio circle (open or filled)
  const drawRadioCircle = (page, cx, cy, isSelected) => {
    page.drawCircle({
      x: cx,
      y: cy,
      size: 7,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.2,
      color: rgb(1, 1, 1),
    });
    if (isSelected) {
      page.drawCircle({
        x: cx,
        y: cy,
        size: 4,
        color: rgb(0, 0, 0),
      });
    }
  };

  // ==========================================
  // PAGE 1: COVER & FORM DETAILS
  // ==========================================
  const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawWatermark(page1);

  // Page 1 Border Frame
  page1.drawRectangle({
    x: margin,
    y: margin,
    width: contentWidth,
    height: pageHeight - margin * 2,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.5,
  });

  // Top Left PSG Crest Logo
  if (psgLogo) {
    page1.drawImage(psgLogo, {
      x: 160,
      y: 728,
      width: 48,
      height: 60,
    });
  }

  // College Header Text
  const headerLine1 = 'PSG College of';
  const headerLine2 = 'Technology, Coimbatore';
  page1.drawText(headerLine1, {
    x: 218,
    y: 760,
    size: 17,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });
  page1.drawText(headerLine2, {
    x: 218,
    y: 738,
    size: 17,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  // STUDENTS UNION 26-27
  const unionTitle = 'STUDENTS UNION 26-27';
  const unionTitleW = fontBold.widthOfTextAtSize(unionTitle, 20);
  page1.drawText(unionTitle, {
    x: (pageWidth - unionTitleW) / 2,
    y: 685,
    size: 20,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Center Logo area left blank as requested for different event logos
  // (Reserved vertical space ~ 115pt left blank)

  // INTRAMS 2026 Header
  const kriyaText = 'INTRAMS 2026';
  const kriyaTextW = fontBold.widthOfTextAtSize(kriyaText, 18);
  page1.drawText(kriyaText, {
    x: (pageWidth - kriyaTextW) / 2,
    y: 495,
    size: 18,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // LAB CONFIRMATION FORM Header
  const formTitle = 'LAB CONFIRMATION FORM';
  const formTitleW = fontBold.widthOfTextAtSize(formTitle, 16);
  page1.drawText(formTitle, {
    x: (pageWidth - formTitleW) / 2,
    y: 462,
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

  // ASSOCIATION/CLUB NAME
  const assocStr = `CLUB NAME: ${associationName}`;
  const assocSize = getShrinkSize(assocStr, 480, 13.5, fontBold);
  page1.drawText(assocStr, {
    x: 55,
    y: 395,
    size: assocSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // EVENT NAME
  const eventStr = `EVENT NAME: ${eventName}`;
  const eventSize = getShrinkSize(eventStr, 480, 13.5, fontBold);
  page1.drawText(eventStr, {
    x: 55,
    y: 355,
    size: eventSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Page 1 Signatures Section
  const leftSigHeader = 'For Students Union';
  const rightSigHeader = 'Signature of Convenor';
  page1.drawText(leftSigHeader, {
    x: 55,
    y: 280,
    size: 12,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });
  page1.drawText(rightSigHeader, {
    x: 330,
    y: 280,
    size: 12,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  // Signature lines under headers
  page1.drawLine({
    start: { x: 55, y: 250 },
    end: { x: 235, y: 250 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  page1.drawLine({
    start: { x: 330, y: 250 },
    end: { x: 510, y: 250 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Details under left signature
  page1.drawText('Name:', { x: 55, y: 215, size: 11, font: fontRegular, color: rgb(0, 0, 0) });
  page1.drawText('Roll No:', { x: 55, y: 190, size: 11, font: fontRegular, color: rgb(0, 0, 0) });
  page1.drawText('Phone No:', { x: 55, y: 165, size: 11, font: fontRegular, color: rgb(0, 0, 0) });

  // Details under right signature
  const c1 = convenorsList[0] || {};
  page1.drawText(`Name: ${c1.name || ''}`, { x: 330, y: 215, size: 11, font: fontRegular, color: rgb(0, 0, 0) });
  page1.drawText(`Roll No: ${c1.rollNo || ''}`, { x: 330, y: 190, size: 11, font: fontRegular, color: rgb(0, 0, 0) });
  page1.drawText(`Phone No: ${c1.phone || c1.mobile || ''}`, { x: 330, y: 165, size: 11, font: fontRegular, color: rgb(0, 0, 0) });

  // Date Line
  page1.drawText('Date:    ___ / ___ / ______', {
    x: 55,
    y: 105,
    size: 11.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // ==========================================
  // PAGE 2: TABLES, SELECTIONS & STAMPS
  // ==========================================
  const page2 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawWatermark(page2);

  // Page 2 Border Frame
  page2.drawRectangle({
    x: margin,
    y: margin,
    width: contentWidth,
    height: pageHeight - margin * 2,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.5,
  });

  // Section 1: CONVENOR DETAILS Header
  page2.drawText('CONVENOR DETAILS:', {
    x: 55,
    y: 782,
    size: 12.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // CONVENOR DETAILS Table
  const table1X = 55;
  let currentY = 765;
  const table1Width = 485.28;
  const col1Widths = [60, 155, 135, 135.28];
  const rowHeight = 26;

  // Header Row
  page2.drawRectangle({
    x: table1X,
    y: currentY - rowHeight,
    width: table1Width,
    height: rowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  const headers1 = ['S.NO', 'NAME', 'ROLL NO.', 'MOBILE NO.'];
  let cellX = table1X;
  headers1.forEach((h, idx) => {
    const w = col1Widths[idx];
    const textW = fontBold.widthOfTextAtSize(h, 9.5);
    page2.drawText(h, {
      x: cellX + (w - textW) / 2,
      y: currentY - 17,
      size: 9.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    if (idx < headers1.length - 1) {
      page2.drawLine({
        start: { x: cellX + w, y: currentY },
        end: { x: cellX + w, y: currentY - rowHeight },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }
    cellX += w;
  });

  currentY -= rowHeight;

  // Render 2 Convenor Rows
  const renderRowsCount = Math.max(2, Math.min(convenorsList.length, 3));
  for (let r = 0; r < renderRowsCount; r++) {
    const item = convenorsList[r] || { name: '', rollNo: '', phone: '' };
    page2.drawRectangle({
      x: table1X,
      y: currentY - rowHeight,
      width: table1Width,
      height: rowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.2,
    });

    const rowVals = [String(r + 1), String(item.name || ''), String(item.rollNo || ''), String(item.phone || item.mobile || '')];
    cellX = table1X;
    rowVals.forEach((val, idx) => {
      const w = col1Widths[idx];
      const font = idx === 0 ? fontBold : fontRegular;
      const textW = font.widthOfTextAtSize(val, 9.5);
      page2.drawText(val, {
        x: cellX + (idx === 0 ? (w - textW) / 2 : 12),
        y: currentY - 17,
        size: 9.5,
        font: font,
        color: rgb(0, 0, 0),
      });
      if (idx < rowVals.length - 1) {
        page2.drawLine({
          start: { x: cellX + w, y: currentY },
          end: { x: cellX + w, y: currentY - rowHeight },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
      }
      cellX += w;
    });

    currentY -= rowHeight;
  }

  // Section 2: DAY & SESSION SELECTOR GRID
  currentY -= 35;
  const gridX = 55;
  const gridWidth = 485.28;
  const gridColW = gridWidth / 3; // 161.76
  const gridHeaderH = 22;
  const gridRadioH = 28;

  // --- DAY SELECTOR ROW ---
  page2.drawRectangle({
    x: gridX,
    y: currentY - gridHeaderH,
    width: gridWidth,
    height: gridHeaderH,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  const dayHeaders = ['DAY 1', 'DAY 2', '2 DAYS'];
  dayHeaders.forEach((dh, idx) => {
    const textW = fontBold.widthOfTextAtSize(dh, 9.5);
    page2.drawText(dh, {
      x: gridX + idx * gridColW + (gridColW - textW) / 2,
      y: currentY - 15,
      size: 9.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    if (idx < 2) {
      page2.drawLine({
        start: { x: gridX + (idx + 1) * gridColW, y: currentY },
        end: { x: gridX + (idx + 1) * gridColW, y: currentY - gridHeaderH },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }
  });

  currentY -= gridHeaderH;

  // Day Radio Circles Row
  page2.drawRectangle({
    x: gridX,
    y: currentY - gridRadioH,
    width: gridWidth,
    height: gridRadioH,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  // Determine selected day
  const selectedDayIdxs = [];
  if (isTwoDayLab) {
    selectedDayIdxs.push(2); // Select 2 DAYS
  } else {
    if (selectedDayStr.includes('both') || selectedDayStr.includes('2 day') || selectedDayStr.includes('all')) {
      selectedDayIdxs.push(2);
    } else if (selectedDayStr.includes('2')) {
      selectedDayIdxs.push(1);
    } else {
      selectedDayIdxs.push(0);
    }
  }

  for (let d = 0; d < 3; d++) {
    const cx = gridX + d * gridColW + gridColW / 2;
    const cy = currentY - gridRadioH / 2;
    drawRadioCircle(page2, cx, cy, selectedDayIdxs.includes(d));

    if (d < 2) {
      page2.drawLine({
        start: { x: gridX + (d + 1) * gridColW, y: currentY },
        end: { x: gridX + (d + 1) * gridColW, y: currentY - gridRadioH },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }
  }

  currentY -= gridRadioH;

  // --- SESSION SELECTOR ROW ---
  page2.drawRectangle({
    x: gridX,
    y: currentY - gridHeaderH,
    width: gridWidth,
    height: gridHeaderH,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2,
  });

  const sessionHeaders = ['SESSION', 'I (9.30-12.30)', 'II (1.30-4.30)', 'BOTH'];
  sessionHeaders.forEach((sh, idx) => {
    const textW = fontBold.widthOfTextAtSize(sh, 9.5);
    page2.drawText(sh, {
      x: gridX + idx * gridColW + (gridColW - textW) / 2,
      y: currentY - 15,
      size: 9.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    if (idx < 3) {
      page2.drawLine({
        start: { x: gridX + (idx + 1) * gridColW, y: currentY },
        end: { x: gridX + (idx + 1) * gridColW, y: currentY - gridHeaderH },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }
  });

  currentY -= gridHeaderH;

  // Determine selected session
  const getSessionIdxs = (str) => {
    if (str.includes('both') || str.includes('full')) return [1, 2, 3]; // Check I, II, and BOTH
    if (str.includes('ii') || str.includes('afternoon') || str.includes('2')) return [2];
    if (str.includes('i') || str.includes('morning') || str.includes('1')) return [1];
    return [1];
  };

  const drawSessionRow = (label, selectedIdxs) => {
    page2.drawRectangle({
      x: gridX,
      y: currentY - gridRadioH,
      width: gridWidth,
      height: gridRadioH,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.2,
    });

    if (label) {
      const textW = fontBold.widthOfTextAtSize(label, 9);
      page2.drawText(label, {
        x: gridX + (gridColW - textW) / 2,
        y: currentY - 18,
        size: 9,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
    }

    for (let s = 0; s < 4; s++) {
      if (s > 0) {
        const cx = gridX + s * gridColW + gridColW / 2;
        const cy = currentY - gridRadioH / 2;
        drawRadioCircle(page2, cx, cy, selectedIdxs.includes(s));
      }

      if (s < 3) {
        page2.drawLine({
          start: { x: gridX + (s + 1) * gridColW, y: currentY },
          end: { x: gridX + (s + 1) * gridColW, y: currentY - gridRadioH },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
      }
    }
    currentY -= gridRadioH;
  };

  if (isTwoDayLab) {
    const session1 = String(eventData?.lab_session_slot || eventData?.form?.lab_session_slot || eventData?.form_specs?.lab_session_slot || '1').toLowerCase();
    const session2 = String(eventData?.lab_session_slot_day2 || eventData?.form?.lab_session_slot_day2 || eventData?.form_specs?.lab_session_slot_day2 || session1).toLowerCase();
    
    drawSessionRow('DAY 1', getSessionIdxs(session1));
    drawSessionRow('DAY 2', getSessionIdxs(session2));
  } else {
    drawSessionRow('', getSessionIdxs(selectedSessionStr));
  }

  // Section 3: LAB SPECIFICATION TABLE
  currentY -= 20;
  const specX = 55;
  const specWidth = 485.28;
  const leftColW = 140;
  const specRowH = 26;

  const specRows = [
    { label: 'DATE(allotted)', value: dateAllotted },
    { label: 'DURATION(in hrs)', value: durationInHrs },
    { label: 'LAB NAME', value: labName },
    { label: 'LAB BLOCK', value: labBlock },
    { label: 'LAB FLOOR', value: labFloor },
    { label: 'LAB No.(if any)', value: labNo },
  ];

  specRows.forEach((row) => {
    page2.drawRectangle({
      x: specX,
      y: currentY - specRowH,
      width: specWidth,
      height: specRowH,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.2,
    });

    // Vertical Divider Line
    page2.drawLine({
      start: { x: specX + leftColW, y: currentY },
      end: { x: specX + leftColW, y: currentY - specRowH },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Label Text
    page2.drawText(row.label, {
      x: specX + 10,
      y: currentY - 17,
      size: 9.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Value Text
    let valSize = 9.5;
    let valW = fontRegular.widthOfTextAtSize(row.value, valSize);
    while (valW > 320 && valSize > 5) {
      valSize -= 0.5;
      valW = fontRegular.widthOfTextAtSize(row.value, valSize);
    }
    page2.drawText(row.value, {
      x: specX + leftColW + 15,
      y: currentY - 17,
      size: valSize,
      font: fontRegular,
      color: rgb(0, 0, 0),
    });

    currentY -= specRowH;
  });

  // Section 4: 3-COLUMN SIGNATURE FOOTER (Page 2 Bottom)
  const sigY = 160;
  const sigCols = [
    { title: 'SIGNATURE', line2: '(Faculty Advisor)', line3: '(With Seal)', x: 55 },
    { title: 'SIGNATURE', line2: '(Lab Incharge)', line3: '', x: 235 },
    { title: 'SIGNATURE', line2: '(HOD)', line3: '(With Seal)', x: 405 },
  ];

  sigCols.forEach((col) => {
    page2.drawText(col.title, {
      x: col.x,
      y: sigY,
      size: 10.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    if (col.line2) {
      page2.drawText(col.line2, {
        x: col.x,
        y: sigY - 18,
        size: 9.5,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });
    }
    if (col.line3) {
      page2.drawText(col.line3, {
        x: col.x,
        y: sigY - 34,
        size: 9.5,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });
    }
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
