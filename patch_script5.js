const fs = require('fs');
let content = fs.readFileSync('admin/src/utils/generateEventItemsPdf.js', 'utf8');

const badCanvasCode = `
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
`;

const goodCanvasCode = `
          const padding = 2;
          const scale = 4;
          const textW = Math.max(1, ctx.measureText(chunk).width);
          
          const cvs = document.createElement('canvas');
          cvs.width = Math.ceil(textW * scale) + padding * 2;
          cvs.height = Math.ceil(options.size * 1.8 * scale) + padding * 2;
          const cvsCtx = cvs.getContext('2d');
          cvsCtx.scale(scale, scale);
          cvsCtx.font = ctx.font;
          cvsCtx.textBaseline = 'alphabetic';
          
          let r = 0, g = 0, b = 0;
          if (options.color) {
            r = Math.round((options.color.red || 0) * 255);
            g = Math.round((options.color.green || 0) * 255);
            b = Math.round((options.color.blue || 0) * 255);
          }
          cvsCtx.fillStyle = \`rgb(\${r}, \${g}, \${b})\`;
          cvsCtx.fillText(chunk, padding / scale, options.size * 1.4);
          
          const dataUrl = cvs.toDataURL('image/png');
          const pngImage = await pdfDoc.embedPng(dataUrl);
          
          origDrawImage(pngImage, {
            x: currentX - (padding / scale),
            y: (options.y || 0) - (options.size * 0.4) - (padding / scale),
            width: cvs.width / scale,
            height: cvs.height / scale
          });
`;

content = content.replace(badCanvasCode.trim(), goodCanvasCode.trim());

fs.writeFileSync('admin/src/utils/generateEventItemsPdf.js', content);
