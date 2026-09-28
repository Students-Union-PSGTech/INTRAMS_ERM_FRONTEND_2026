import re

with open('generateEventItemsPdf.js', 'r') as f:
    content = f.read()

# 1. Update drawHeader signature and titleY
old_drawHeader = """  const drawHeader = (page) => {
    drawPageBorder(page);
    let titleY = pageHeight - 45;
    const titleText1 = 'PSG COLLEGE OF TECHNOLOGY';
    const w1 = fontBold.widthOfTextAtSize(titleText1, 16);
    page.drawText(titleText1, { x: (pageWidth - w1) / 2, y: titleY, size: 16, font: fontBold, color: rgb(0, 0, 0) });
    titleY -= 23;

    const titleText2 = 'STUDENTS UNION 2026-2027';
    const w2 = fontBold.widthOfTextAtSize(titleText2, 12);
    page.drawText(titleText2, { x: (pageWidth - w2) / 2, y: titleY, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    titleY -= 22;

    const titleText3 = 'ITEM REQUEST & LOGISTICS INVOICE';
    const w3 = fontBold.widthOfTextAtSize(titleText3, 13);
    page.drawText(titleText3, { x: (pageWidth - w3) / 2, y: titleY, size: 13, font: fontBold, color: rgb(0, 0, 0) });
    page.drawLine({
      start: { x: (pageWidth - w3) / 2, y: titleY - 2 },
      end: { x: (pageWidth + w3) / 2, y: titleY - 2 },
      thickness: 1, color: rgb(0, 0, 0)
    });
    titleY -= 20;

    const titleText4 = `Generated on: ${genTime}`;
    const w4 = fontItalic.widthOfTextAtSize(titleText4, 9.5);
    page.drawText(titleText4, { x: (pageWidth - w4) / 2, y: titleY, size: 9.5, font: fontItalic, color: rgb(0, 0, 0) });
  };"""

new_drawHeader = """  const drawHeader = (page, isFirstPage = false) => {
    drawPageBorder(page);
    if (isFirstPage) {
      let titleY = pageHeight - 65;
      const titleText1 = 'PSG COLLEGE OF TECHNOLOGY';
      const w1 = fontBold.widthOfTextAtSize(titleText1, 16);
      page.drawText(titleText1, { x: (pageWidth - w1) / 2, y: titleY, size: 16, font: fontBold, color: rgb(0, 0, 0) });
      titleY -= 23;

      const titleText2 = 'STUDENTS UNION 2026-2027';
      const w2 = fontBold.widthOfTextAtSize(titleText2, 12);
      page.drawText(titleText2, { x: (pageWidth - w2) / 2, y: titleY, size: 12, font: fontBold, color: rgb(0, 0, 0) });
      titleY -= 22;

      const titleText3 = 'ITEM REQUEST & LOGISTICS INVOICE';
      const w3 = fontBold.widthOfTextAtSize(titleText3, 13);
      page.drawText(titleText3, { x: (pageWidth - w3) / 2, y: titleY, size: 13, font: fontBold, color: rgb(0, 0, 0) });
      page.drawLine({
        start: { x: (pageWidth - w3) / 2, y: titleY - 2 },
        end: { x: (pageWidth + w3) / 2, y: titleY - 2 },
        thickness: 1, color: rgb(0, 0, 0)
      });
    }

    // Add footer
    const footerY = 45;
    page.drawText(`Updated on: ${genTime}`, { x: 45, y: footerY, size: 9, font: fontItalic, color: rgb(0.3, 0.3, 0.3) });
    
    const eventIdText = `Event ID: ${eventId}`;
    const wEId = fontItalic.widthOfTextAtSize(eventIdText, 9);
    page.drawText(eventIdText, { x: pageWidth - 45 - wEId, y: footerY, size: 9, font: fontItalic, color: rgb(0.3, 0.3, 0.3) });
  };"""

content = content.replace(old_drawHeader, new_drawHeader)

# 2. Fix the initial call to drawHeader
content = content.replace("drawHeader(currentPage);", "drawHeader(currentPage, true);", 1)

# 3. Inside the loop when a new page is added, call drawHeader without true, and adjust currentY
old_addPage = """      if (currentY - rowH < 70) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader(currentPage);
        currentY = pageHeight - 120;
        drawTableHeader();
      }"""

new_addPage = """      if (currentY - rowH < 70) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader(currentPage, false);
        currentY = pageHeight - 60; // start higher since no big header
        drawTableHeader();
      }"""

content = content.replace(old_addPage, new_addPage)

# Same for items.length === 0, though not strictly a loop, but wait.
# Oh, currentY is initialized to pageHeight - 135 (wait, it should be pageHeight - 165 because of moving the titleY down by 20)
old_init_currentY = "  let currentY = pageHeight - 135;"
new_init_currentY = "  let currentY = pageHeight - 155;"
content = content.replace(old_init_currentY, new_init_currentY, 1)

with open('generateEventItemsPdf.js', 'w') as f:
    f.write(content)
