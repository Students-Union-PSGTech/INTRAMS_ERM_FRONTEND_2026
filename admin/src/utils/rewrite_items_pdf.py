import re

with open('generateEventItemsPdf.js', 'r') as f:
    content = f.read()

# 1. Change the function signature
content = content.replace("export async function generateEventItemsPdf(event) {", "export async function generateItemsPdf({ data }) {")

# 2. Extract out the single event parsing
old_single_event = """  const drawQueue = [];
  const ev = event || {};
  const clubName = ev.club_name || ev.association || ev.clubName || 'Students Union';
  const eventName = ev.event_name || ev.name || ev.eventName || 'Event';
  const eventId = ev.event_id || ev.id || ev._id || 'EVNT47';
  const genTime = new Date().toLocaleString('en-IN');"""

new_setup = """  const drawQueue = [];
  const genTime = new Date().toLocaleString('en-IN');"""

content = content.replace(old_single_event, new_setup)


# 3. Add the loop around the event rendering logic
old_render_start = """  let currentY = pageHeight - 135;
  const tX = 50;
  const tableWidth = pageWidth - 100;

  // Metadata card box
  const eventNameLines = wrapText('Event Name: ' + eventName, 240, fontBold, 10.5);"""

new_render_start = """  let currentY = pageHeight - 135;
  const tX = 50;
  const tableWidth = pageWidth - 100;

  const eventsList = Array.isArray(data) ? data : [];
  
  if (eventsList.length === 0) {
    currentPage.drawText('No items requested.', { x: tX + 15, y: currentY - 15, size: 10, font: fontItalic, color: rgb(0.4, 0.4, 0.4) });
  }

  eventsList.forEach((ev, evIndex) => {
    const clubName = ev.club_id?.club_name || ev.club_name || ev.association || ev.clubName || 'General';
    const eventName = ev.event_name || ev.name || ev.eventName || 'Event';
    const eventId = ev.event_id || ev.id || ev._id || '';
    
    if (evIndex > 0) {
      currentY -= 30; // gap between events
    }

    if (currentY < 250) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      drawHeader(currentPage);
      currentY = pageHeight - 135;
    }

    // Metadata card box
    const eventNameLines = wrapText('Event Name: ' + eventName, 240, fontBold, 10.5);"""

content = content.replace(old_render_start, new_render_start)


# 4. Close the loop before the tamil processing block
old_end_render = """  // Process canvas text (for Tamil support)
  for (const op of drawQueue) {"""

new_end_render = """  }); // end of eventsList loop

  // Process canvas text (for Tamil support)
  for (const op of drawQueue) {"""

content = content.replace(old_end_render, new_end_render)

with open('generateItemsPdf.js', 'w') as f:
    f.write(content)
