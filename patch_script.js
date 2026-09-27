const fs = require('fs');
let content = fs.readFileSync('admin/src/utils/generateEventItemsPdf.js', 'utf8');

const patchCode = `
  const originalAddPage = pdfDoc.addPage.bind(pdfDoc);
  pdfDoc.addPage = (...args) => {
    const page = originalAddPage(...args);
    const origDrawText = page.drawText.bind(page);
    const origDrawImage = page.drawImage.bind(page);
    
    page.drawText = (text, options) => {
      if (!text && text !== 0 && text !== '0') return;
      const cleanStr = cleanText(text).replace(/\\n/g, ' ');
      const hasTamil = /[\\u0B80-\\u0BFF]/.test(cleanStr);
      
      if (hasTamil) {
        drawQueue.push({ type: 'tamil', origDrawText, origDrawImage, text: cleanStr, options, page });
      } else {
        const actualOptions = { ...options };
        drawQueue.push({ type: 'text', method: origDrawText, args: [cleanStr, actualOptions], page });
      }
    };
    return page;
  };
`;

content = content.replace('let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);', patchCode + '\n  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);');

// Replace the manual drawQueue.push in items.forEach with just currentPage.drawText
content = content.replace(/drawQueue\.push\(\{\s*type:\s*'text',\s*page:\s*currentPage,\s*text:\s*dValue,\s*options:\s*\{\s*x:\s*nameX,\s*y:\s*topY,\s*size:\s*9,\s*font:\s*fontRegular,\s*color:\s*rgb\(0,0,0\)\s*\}\s*\}\);/g, "currentPage.drawText(dValue, { x: nameX, y: topY, size: 9, font: fontRegular, color: rgb(0,0,0) });");

// Update process canvas text loop
const newProcessCode = `
  // Process canvas text (for Tamil support)
  for (const op of drawQueue) {
    if (op.type === 'text') {
      op.method(...op.args);
    } else if (op.type === 'tamil') {
      const { origDrawText, origDrawImage, text, options, page } = op;
      const regexChunks = /[\\u0B80-\\u0BFF\\u200C\\u200D]+(?:[\\s]+[\\u0B80-\\u0BFF\\u200C\\u200D]+)*|[^\\u0B80-\\u0BFF\\u200C\\u200D]+/g;
      const chunks = text.match(regexChunks) || [];
      let currentX = options.x;
      
      const isBold = options.font === fontBold;
      if (!window.__pdfCanvasCtx) {
        const cvs = document.createElement('canvas');
        window.__pdfCanvasCtx = cvs.getContext('2d');
      }
      const ctx = window.__pdfCanvasCtx;
      
      for (const chunk of chunks) {
        if (/[\\u0B80-\\u0BFF]/.test(chunk)) {
          ctx.font = (isBold ? 'bold ' : '') + options.size + 'px "Noto Sans Tamil", Arial, sans-serif';
          const chunkWidth = ctx.measureText(chunk).width;
          
          const renderScale = 4;
          const cvsW = Math.ceil(chunkWidth * renderScale);
          const cvsH = Math.ceil(options.size * 2 * renderScale);
          const canvas = document.createElement('canvas');
          canvas.width = cvsW;
          canvas.height = cvsH;
          const cctx = canvas.getContext('2d');
          cctx.scale(renderScale, renderScale);
          cctx.font = ctx.font;
          cctx.textBaseline = 'top';
          cctx.fillStyle = 'black';
          cctx.fillText(chunk, 0, options.size * 0.2);
          
          const dataUrl = canvas.toDataURL('image/png');
          const pngImage = await pdfDoc.embedPng(dataUrl);
          origDrawImage(pngImage, {
            x: currentX,
            y: options.y - (options.size * 0.2),
            width: chunkWidth,
            height: options.size * 2
          });
          
          currentX += chunkWidth;
        } else {
          origDrawText(chunk, { ...options, x: currentX });
          currentX += options.font.widthOfTextAtSize(chunk, options.size);
        }
      }
    }
  }
`;

content = content.replace(/\/\/ Process canvas text \(for Tamil support\)[\s\S]*?(?=const pdfBytes = await pdfDoc\.save\(\);)/, newProcessCode);

fs.writeFileSync('admin/src/utils/generateEventItemsPdf.js', content);
