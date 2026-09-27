const fs = require('fs');
let content = fs.readFileSync('admin/src/utils/generateEventItemsPdf.js', 'utf8');

// We need to inject a wrapText function and replace the Metadata card box drawing logic
const wrapTextFunc = `
  const wrapText = (text, maxWidth, font, size) => {
    const words = String(text).split(' ');
    const lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = font.widthOfTextAtSize(currentLine + ' ' + word, size);
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };
`;

const oldCardBox = `
  // Metadata card box
  currentPage.drawRectangle({
    x: tX, y: currentY - 55, width: tableWidth, height: 55,
    borderColor: rgb(0.2, 0.2, 0.2), borderWidth: 1
  });
  
  currentPage.drawText('Event Name: ' + eventName, { x: tX + 15, y: currentY - 12 - 10.5, size: 10.5, font: fontBold, color: rgb(0,0,0) });
  currentPage.drawText('Event Code: ' + eventId, { x: tX + 15, y: currentY - 32 - 10.5, size: 10.5, font: fontBold, color: rgb(0,0,0) });
  currentPage.drawText('Association / Club: ' + clubName, { x: tX + 270, y: currentY - 12 - 10.5, size: 10.5, font: fontBold, color: rgb(0,0,0) });
  currentPage.drawText('Status: ' + (ev.status || 'SUBMITTED').toUpperCase(), { x: tX + 270, y: currentY - 32 - 10.5, size: 10.5, font: fontBold, color: rgb(0,0,0) });

  currentY -= 75;
`;

const newCardBox = `
  // Metadata card box
  const eventNameLines = wrapText('Event Name: ' + eventName, 240, fontBold, 10.5);
  const clubNameLines = wrapText('Association / Club: ' + clubName, tableWidth - 270 - 15, fontBold, 10.5);
  
  const leftLines = eventNameLines.length + 1; // +1 for Event Code
  const rightLines = clubNameLines.length + 1; // +1 for Status
  const maxLines = Math.max(leftLines, rightLines);
  
  const lineHeight = 15;
  const boxHeight = (maxLines * lineHeight) + 24;
  
  currentPage.drawRectangle({
    x: tX, y: currentY - boxHeight, width: tableWidth, height: boxHeight,
    borderColor: rgb(0.2, 0.2, 0.2), borderWidth: 1
  });
  
  let leftY = currentY - 12 - 10.5;
  eventNameLines.forEach(line => {
    currentPage.drawText(line, { x: tX + 15, y: leftY, size: 10.5, font: fontBold, color: rgb(0,0,0) });
    leftY -= lineHeight;
  });
  currentPage.drawText('Event Code: ' + eventId, { x: tX + 15, y: leftY, size: 10.5, font: fontBold, color: rgb(0,0,0) });
  
  let rightY = currentY - 12 - 10.5;
  clubNameLines.forEach(line => {
    currentPage.drawText(line, { x: tX + 270, y: rightY, size: 10.5, font: fontBold, color: rgb(0,0,0) });
    rightY -= lineHeight;
  });
  currentPage.drawText('Status: ' + (ev.status || 'SUBMITTED').toUpperCase(), { x: tX + 270, y: rightY, size: 10.5, font: fontBold, color: rgb(0,0,0) });

  currentY -= (boxHeight + 20);
`;

content = content.replace("const drawQueue = [];", wrapTextFunc + "\n  const drawQueue = [];");
content = content.replace(oldCardBox.trim(), newCardBox.trim());

fs.writeFileSync('admin/src/utils/generateEventItemsPdf.js', content);
