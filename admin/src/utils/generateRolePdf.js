import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

function normalizeRole(role) {
  const value = String(role || '').toLowerCase();
  if (value === 'convenor' || value === 'convenors') return 'convenor';
  if (value === 'volunteer' || value === 'volunteers') return 'volunteer';
  if (value === 'faculty' || value === 'faculty_advisor') return 'faculty';
  return 'secretary';
}

function formatYear(yearStr) {
  if (!yearStr) return 'IV YEAR';
  const y = String(yearStr).trim().toUpperCase();
  if (y.includes('MSC')) return y;
  
  if (y === '1' || y.startsWith('1ST') || y === 'I' || y === 'I YEAR') return 'I YEAR';
  if (y === '2' || y.startsWith('2ND') || y === 'II' || y === 'II YEAR') return 'II YEAR';
  if (y === '3' || y.startsWith('3RD') || y === 'III' || y === 'III YEAR') return 'III YEAR';
  if (y === '4' || y.startsWith('4TH') || y === 'IV' || y === 'IV YEAR') return 'IV YEAR';
  if (y === '5' || y.startsWith('5TH') || y === 'V' || y === 'V YEAR') return 'V YEAR';
  
  return y.includes('YEAR') ? y : `${y} YEAR`;
}

function getRoleLabel(role) {
  const value = normalizeRole(role);
  if (value === 'convenor') return 'Convenor';
  if (value === 'volunteer') return 'Volunteer';
  if (value === 'faculty') return 'Faculty Advisor';
  return 'Secretary';
}

function getRoleTitle(role) {
  const value = normalizeRole(role);
  if (value === 'convenor') return 'Event Convenor Details Report';
  if (value === 'volunteer') return 'Event Volunteer Details Report';
  if (value === 'faculty') return 'Event Faculty Advisor Details Report';
  return 'Event Secretary Details Report';
}

function getAssociationEntries(data, role) {
  const source = Array.isArray(data)
    ? data
    : (Array.isArray(data?.data)
      ? data.data
      : (Array.isArray(data?.associations)
        ? data.associations
        : (Array.isArray(data?.members)
          ? data.members
          : (Array.isArray(data?.[String(role).toLowerCase()])
            ? data[String(role).toLowerCase()]
            : Object.keys(data || {}).flatMap((key) => {
                const value = data[key];
                if (Array.isArray(value)) return [{ associationName: key, members: value }];
                if (value && Array.isArray(value.members)) return [{ associationName: key, members: value.members }];
                return [];
              })))));

  const map = {};

  (source || []).forEach((item) => {
    const associationName = item?.associationName || item?.club_name || item?.clubName || item?.association || item?.name || 'General Association';
    const memberList = Array.isArray(item?.members)
      ? item.members
      : (Array.isArray(item?.secretaries)
        ? item.secretaries
        : (Array.isArray(item?.volunteers)
          ? item.volunteers
          : (Array.isArray(item?.convenors)
            ? item.convenors
            : (Array.isArray(item?.[role])
              ? item[role]
              : (Array.isArray(item?.[String(role).toLowerCase()])
                ? item[String(role).toLowerCase()]
                : (Array.isArray(item?.data) ? item.data : [item]))))));

    if (!map[associationName]) map[associationName] = [];

    const entries = Array.isArray(memberList) && memberList.length > 0 ? memberList : [item];
    entries.forEach((member) => {
      map[associationName].push({
        name: member?.name || member?.secretaryName || member?.convenorName || member?.volunteerName || '—',
        rollNo: member?.rollNo || member?.rollNumber || member?.roll_no || member?.roll_number || '—',
        year: formatYear(member?.year),
        department: member?.department || member?.dept || member?.specialization || '—',
        phone: member?.phone || member?.phoneNo || member?.phone_no || member?.mobile || '—',
      });
    });
  });

  const entries = Object.entries(map);
  if (entries.length > 0) return entries;

  return [['General Association', [{ name: 'NIL', rollNo: 'NIL', year: '4TH YEAR', department: '—', phone: '0000000000' }]]];
}

export async function generateRolePdf({ role, data }) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const pageWidth = 841.89; // Landscape A4 width
  const pageHeight = 595.28; // Landscape A4 height
  const outerMargin = 18;
  const tableX = 35;
  const tableWidth = pageWidth - tableX * 2; // 771.89 pt
  const colWidths = [45, 210, 110, 85, 203.89, 118]; // S.No, Name, Roll No, Year, Dept, Phone

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

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  drawWatermark(currentPage);
  drawPageBorder(currentPage);

  // Title Header
  const title = getRoleTitle(role);
  const titleWidth = fontBold.widthOfTextAtSize(title, 20);
  currentPage.drawText(title, {
    x: (pageWidth - titleWidth) / 2,
    y: pageHeight - 55,
    size: 20,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Timestamp Subtitle
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB'); // DD/MM/YYYY
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
  const generatedText = `Generated on ${dateStr}, ${timeStr}`;
  const generatedWidth = fontItalic.widthOfTextAtSize(generatedText, 10);
  currentPage.drawText(generatedText, {
    x: (pageWidth - generatedWidth) / 2,
    y: pageHeight - 74,
    size: 10,
    font: fontItalic,
    color: rgb(0, 0, 0),
  });

  let currentY = pageHeight - 105;
  const associationGroups = getAssociationEntries(data, role);

  const checkAddPage = (requiredHeight) => {
    if (currentY - requiredHeight < outerMargin + 25) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      drawWatermark(currentPage);
      drawPageBorder(currentPage);
      currentY = pageHeight - 50;
    }
  };

  associationGroups.forEach(([associationName, members]) => {
    const bannerHeight = 24;
    const headerHeight = 24;
    const rowHeight = 24;
    const sectionGap = 16;

    // Ensure space for banner + header + at least 1 row
    checkAddPage(bannerHeight + headerHeight + rowHeight);

    // Association Banner (Dark Blue)
    const bannerY = currentY - bannerHeight;
    currentPage.drawRectangle({
      x: tableX,
      y: bannerY,
      width: tableWidth,
      height: bannerHeight,
      color: rgb(0.14, 0.32, 0.48), // Dark Blue #24527a
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    currentPage.drawText(associationName, {
      x: tableX + 8,
      y: bannerY + 7,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1), // White Text
    });

    currentY -= bannerHeight;

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

    const headerValues = ['S.No', `${getRoleLabel(role)} Name`, 'Roll Number', 'Year', 'Department', 'Phone No'];
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

    currentY = headerY;

    // Member Data Rows (White Background, Black Text)
    members.forEach((member, memberIndex) => {
      checkAddPage(rowHeight);

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
        String(member.name || '—'),
        String(member.rollNo || '—'),
        String(member.year || '—'),
        String(member.department || '—'),
        String(member.phone || '—'),
      ];

      let cellX = tableX;
      values.forEach((value, index) => {
        const width = colWidths[index];
        const textWidth = fontRegular.widthOfTextAtSize(value, 9.5);
        const isCentered = index === 0 || index === 2 || index === 3;
        const textX = isCentered ? cellX + (width - textWidth) / 2 : cellX + 8;

        currentPage.drawText(value, {
          x: textX,
          y: rowBottom + 7,
          size: 9.5,
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

    currentY -= sectionGap;
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
