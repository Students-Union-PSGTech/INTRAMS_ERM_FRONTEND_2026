import re

with open('generateEventsPdf.js', 'r') as f:
    content = f.read()

# 1. Update colWidths
content = content.replace(
    "const colWidths = [50, 150, 421.89, 150]; // S.No, Event ID, Event Name, Status",
    "const colWidths = [40, 180, 120, 431.89]; // S.No, Club Name, Event ID, Event Name"
)

# 2. Update loop structure and headers
old_loop = """  const associationGroups = Object.entries(data || {}).map(([clubName, events]) => {
    return [clubName, Array.isArray(events) ? events : []];
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

  associationGroups.forEach(([associationName, members]) => {
    const bannerHeight = 24;
    const headerHeight = 24;
    const rowHeight = 24;
    const sectionGap = 16;

    const drawHeaders = () => {
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

      const headerValues = ['S.No', 'Event ID', 'Event Name', 'Status'];"""

new_loop = """  const eventsList = Array.isArray(data) ? data : [];

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

    const headerValues = ['S.No', 'Club Name', 'Event ID', 'Event Name'];"""

content = content.replace(old_loop, new_loop)

# 3. Update values
old_values = """      const values = [
        String(memberIndex + 1),
        String(member.event_id || '—'),
        String(member.event_name || '—'),
        String((member.status || '—').toUpperCase())
      ];"""

new_values = """      const values = [
        String(memberIndex + 1),
        String(member.club_id?.club_name || member.club_name || 'General'),
        String(member.event_id || '—'),
        String(member.event_name || '—')
      ];"""

content = content.replace(old_values, new_values)

# 4. Update checkAddPage and loop initialization
old_init = """    // Ensure space for banner + header + at least 1 row
    checkAddPage(bannerHeight + headerHeight + rowHeight);
    drawHeaders();

    // Member Data Rows (White Background, Black Text)
    members.forEach((member, memberIndex) => {"""

new_init = """  // Ensure space for header + at least 1 row
  checkAddPage(headerHeight + rowHeight);
  drawHeaders();

  // Member Data Rows (White Background, Black Text)
  eventsList.forEach((member, memberIndex) => {"""

content = content.replace(old_init, new_init)

# 5. Update end of loop
old_end = """      currentY = rowBottom;
    });

    currentY -= sectionGap;
  });

  for (const op of drawQueue) {"""

new_end = """      currentY = rowBottom;
  });

  for (const op of drawQueue) {"""

content = content.replace(old_end, new_end)

with open('generateEventsPdf.js', 'w') as f:
    f.write(content)

