import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

function normalizeRole(role) {
  const value = String(role || '').toLowerCase();
  if (value === 'convenor') return 'convenor';
  if (value === 'volunteer') return 'volunteer';
  return 'secretary';
}

function getRoleLabel(role) {
  const value = normalizeRole(role);
  if (value === 'convenor') return 'Convenor';
  if (value === 'volunteer') return 'Volunteer';
  return 'Secretary';
}

function getRoleTitle(role) {
  const value = normalizeRole(role);
  if (value === 'convenor') return 'Event Convenor Details Report';
  if (value === 'volunteer') return 'Event Volunteer Details Report';
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
        year: member?.year || member?.yearOfStudy || member?.studyYear || '4TH YEAR',
        department: member?.department || member?.dept || member?.specialization || '—',
        phone: member?.phone || member?.phoneNo || member?.phone_no || member?.mobile || '—',
      });
    });
  });

  const entries = Object.entries(map);
  if (entries.length > 0) return entries;

  return [['General Association', [{ name: 'NIL', rollNo: 'NIL', year: '4TH YEAR', department: 'NIL', phone: '0000000000' }]]];
}

export async function generateRolePdf({ role, data }) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const outerX = 15;
  const outerY = 15;
  const tableX = 35;
  const tableWidth = 770;
  const colWidths = [50, 190, 110, 82, 190, 148];

  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  page.drawRectangle({
    x: outerX,
    y: outerY,
    width: pageWidth - outerX * 2,
    height: pageHeight - outerY * 2,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.5,
  });

  const title = getRoleTitle(role);
  const titleWidth = fontBold.widthOfTextAtSize(title, 20);
  page.drawText(title, {
    x: (pageWidth - titleWidth) / 2,
    y: pageHeight - 62,
    size: 20,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  const now = new Date();
  const generatedText = `Generated on ${now.toLocaleDateString('en-GB')}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}`;
  const generatedWidth = fontItalic.widthOfTextAtSize(generatedText, 9);
  page.drawText(generatedText, {
    x: (pageWidth - generatedWidth) / 2,
    y: pageHeight - 80,
    size: 9,
    font: fontItalic,
    color: rgb(0, 0, 0),
  });

  let currentY = pageHeight - 112;
  const associationGroups = getAssociationEntries(data, role);

  associationGroups.forEach(([associationName, members]) => {
    const bannerHeight = 24;
    const headerHeight = 24;
    const rowHeight = 24;
    const sectionGap = 14;

    const bannerY = currentY - bannerHeight;
    page.drawRectangle({
      x: tableX,
      y: bannerY,
      width: tableWidth,
      height: bannerHeight,
      color: rgb(0.06, 0.28, 0.41),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    page.drawText(associationName, {
      x: tableX + 8,
      y: bannerY + 7,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    currentY -= bannerHeight;
    const headerY = currentY - headerHeight;
    page.drawRectangle({
      x: tableX,
      y: headerY,
      width: tableWidth,
      height: headerHeight,
      color: rgb(0.06, 0.28, 0.41),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    const headerValues = ['S.No', `${getRoleLabel(role)} Name`, 'Roll Number', 'Year', 'Department', 'Phone No'];
    let xPos = tableX;

    headerValues.forEach((header, index) => {
      const width = colWidths[index];
      const textWidth = fontBold.widthOfTextAtSize(header, 10);
      const centered = index === 0 || index === 2 || index === 3;
      const textX = centered ? xPos + (width - textWidth) / 2 : xPos + 8;

      page.drawText(header, {
        x: textX,
        y: headerY + 7,
        size: 10,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      page.drawLine({
        start: { x: xPos, y: headerY },
        end: { x: xPos, y: headerY + headerHeight },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      xPos += width;
    });

    page.drawLine({
      start: { x: xPos, y: headerY },
      end: { x: xPos, y: headerY + headerHeight },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    currentY = headerY;

    members.forEach((member, memberIndex) => {
      const rowTop = currentY;
      const rowBottom = rowTop - rowHeight;
      const rowColor = memberIndex % 2 === 0 ? rgb(1, 1, 1) : rgb(0.92, 0.94, 0.96);

      page.drawRectangle({
        x: tableX,
        y: rowBottom,
        width: tableWidth,
        height: rowHeight,
        color: rowColor,
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
        const centered = index === 0 || index === 2 || index === 3;
        const textX = centered ? cellX + (width - textWidth) / 2 : cellX + 8;

        page.drawText(value, {
          x: textX,
          y: rowBottom + 7,
          size: 9.5,
          font: fontRegular,
          color: rgb(0, 0, 0),
        });

        page.drawLine({
          start: { x: cellX, y: rowTop },
          end: { x: cellX, y: rowBottom },
          thickness: 1,
          color: rgb(0, 0, 0),
        });

        cellX += width;
      });

      page.drawLine({
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
