import re

with open('generateItemsPdf.js', 'r') as f:
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

      const titleText3 = 'ITEM REQUEST & LOGISTICS INVOICE (ALL EVENTS)';
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
  };"""

content = content.replace(old_drawHeader, new_drawHeader)

# 2. Fix the initial call to drawHeader
content = content.replace("drawHeader(currentPage);", "drawHeader(currentPage, true);", 1)

# 3. Fix drawHeader inside loop when creating new page
content = content.replace("drawHeader(currentPage);", "drawHeader(currentPage, false);")
# wait, there are two `drawHeader(currentPage);` inside the file! Let's be careful. Let's just do a blanket replace because the first one was already replaced by true.
content = content.replace("drawHeader(currentPage);", "drawHeader(currentPage, false);")

# 4. Fix currentY logic for new page
# When creating new page (at evIndex > 0)
old_newPage_ev = """    if (currentY < 250) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      drawHeader(currentPage, false);
      currentY = pageHeight - 135;
    }"""
new_newPage_ev = """    if (currentY < 250) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      drawHeader(currentPage, false);
      currentY = pageHeight - 60;
    }"""
content = content.replace(old_newPage_ev, new_newPage_ev)

# 5. Fix currentY logic inside items loop
old_newPage_items = """      if (currentY - rowH < 70) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader(currentPage, false);
        currentY = pageHeight - 120;
        drawTableHeader();
      }"""
new_newPage_items = """      if (currentY - rowH < 70) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        drawHeader(currentPage, false);
        currentY = pageHeight - 60;
        drawTableHeader();
      }"""
content = content.replace(old_newPage_items, new_newPage_items)

# 6. Fix initial currentY
old_init_currentY = "  let currentY = pageHeight - 135;"
new_init_currentY = "  let currentY = pageHeight - 155;"
content = content.replace(old_init_currentY, new_init_currentY, 1)

with open('generateItemsPdf.js', 'w') as f:
    f.write(content)
