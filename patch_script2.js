const fs = require('fs');
let content = fs.readFileSync('admin/src/utils/generateEventItemsPdf.js', 'utf8');

const badFontLoad = `
  try {
    const tamilRes = await fetch('/fonts/NotoSansTamil-Regular.ttf');
    if (tamilRes.ok) {
      const tamilBytes = await tamilRes.arrayBuffer();
      fontRegular = await pdfDoc.embedFont(tamilBytes, { subset: true });
      fontBold = await pdfDoc.embedFont(tamilBytes, { subset: true });
      fontItalic = await pdfDoc.embedFont(tamilBytes, { subset: true });
    }
  } catch (e) {}
`;

const goodFontLoad = `
  try {
    const tamilRes = await fetch('/fonts/NotoSansTamil-Regular.ttf');
    if (tamilRes.ok) {
      const tamilBytes = await tamilRes.arrayBuffer();
      if (!window.__pdfTamilFontLoaded) {
        try {
          const font = new FontFace('Noto Sans Tamil', tamilBytes);
          await font.load();
          document.fonts.add(font);
          window.__pdfTamilFontLoaded = true;
        } catch (e) {
          console.warn("Could not load FontFace", e);
        }
      }
    }
  } catch (e) {}
`;

content = content.replace(badFontLoad.trim(), goodFontLoad.trim());

// Also change let fontRegular to const fontRegular
content = content.replace('let fontRegular', 'const fontRegular');
content = content.replace('let fontBold', 'const fontBold');
content = content.replace('let fontItalic', 'const fontItalic');

fs.writeFileSync('admin/src/utils/generateEventItemsPdf.js', content);
