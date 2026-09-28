import re

# 1. Update generateEventItemsPdf.js
with open('generateEventItemsPdf.js', 'r') as f:
    content = f.read()

content = content.replace("const footerY = 45;", "const footerY = 20;")

with open('generateEventItemsPdf.js', 'w') as f:
    f.write(content)

# 2. Update generateItemsPdf.js
with open('generateItemsPdf.js', 'r') as f:
    content2 = f.read()

content2 = content2.replace("const footerY = 45;", "const footerY = 20;")

# Make every event start on a new page
old_loop_page = """    if (evIndex > 0) {
      currentY -= 30; // gap between events
    }

    if (currentY < 250) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      drawHeader(currentPage, false);
      currentY = pageHeight - 60;
    }"""

new_loop_page = """    if (evIndex > 0) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      drawHeader(currentPage, false);
      currentY = pageHeight - 60;
    }"""

content2 = content2.replace(old_loop_page, new_loop_page)

# Also fix the event ID in footer? The user said "can you put the event i and the time out of the margin". 
# Wait, for generateItemsPdf.js, since each event is on its own page, maybe we CAN put the event ID in the footer?
# Actually, the footer is drawn inside drawHeader. In generateItemsPdf.js, drawHeader does NOT have access to eventId because it's defined outside the loop!
# Ah! In generateEventItemsPdf.js, drawHeader is defined INSIDE generateEventItemsPdf but OUTSIDE the loop, so it captures `eventId` from the single event.
# In generateItemsPdf.js, `drawHeader` is defined OUTSIDE the loop. It can't capture the eventId dynamically unless we pass it.
# Let's modify drawHeader in generateItemsPdf.js to accept eventId as a 3rd parameter.

old_drawHeader_sig = "const drawHeader = (page, isFirstPage = false) => {"
new_drawHeader_sig = "const drawHeader = (page, isFirstPage = false, currentEventId = '') => {"
content2 = content2.replace(old_drawHeader_sig, new_drawHeader_sig)

old_footer = """    // Add footer
    const footerY = 20;
    page.drawText(`Updated on: ${genTime}`, { x: 45, y: footerY, size: 9, font: fontItalic, color: rgb(0.3, 0.3, 0.3) });
  };"""

new_footer = """    // Add footer
    const footerY = 20;
    page.drawText(`Updated on: ${genTime}`, { x: 45, y: footerY, size: 9, font: fontItalic, color: rgb(0.3, 0.3, 0.3) });
    
    if (currentEventId) {
      const eventIdText = `Event ID: ${currentEventId}`;
      const wEId = fontItalic.widthOfTextAtSize(eventIdText, 9);
      page.drawText(eventIdText, { x: pageWidth - 45 - wEId, y: footerY, size: 9, font: fontItalic, color: rgb(0.3, 0.3, 0.3) });
    }
  };"""
content2 = content2.replace(old_footer, new_footer)

# Now update the calls to drawHeader in generateItemsPdf.js
# Initial call (before loop) - we don't have eventId yet, but wait, the first event is at index 0. 
# So the first page belongs to eventsList[0]!
# Let's fix the initial call:
old_init_header = "drawHeader(currentPage, true);"
new_init_header = "drawHeader(currentPage, true, eventsList.length > 0 ? (eventsList[0].event_id || eventsList[0].id || eventsList[0]._id || '') : '');"
content2 = content2.replace(old_init_header, new_init_header)

# Call inside loop (for evIndex > 0)
old_loop_header = "drawHeader(currentPage, false);"
new_loop_header = "drawHeader(currentPage, false, eventId);"
content2 = content2.replace(old_loop_header, new_loop_header)

with open('generateItemsPdf.js', 'w') as f:
    f.write(content2)
