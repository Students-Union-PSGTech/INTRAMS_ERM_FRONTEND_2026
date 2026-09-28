with open('generateItemsPdf.js', 'r') as f:
    lines = f.readlines()

content = "".join(lines)
old_chunk = """  drawHeader(currentPage, true, eventsList.length > 0 ? (eventsList[0].event_id || eventsList[0].id || eventsList[0]._id || '') : '');

  let currentY = pageHeight - 155;
  const tX = 50;
  const tableWidth = pageWidth - 100;

  const eventsList = Array.isArray(data) ? data : [];"""

new_chunk = """  const eventsList = Array.isArray(data) ? data : [];
  drawHeader(currentPage, true, eventsList.length > 0 ? (eventsList[0].event_id || eventsList[0].id || eventsList[0]._id || '') : '');

  let currentY = pageHeight - 155;
  const tX = 50;
  const tableWidth = pageWidth - 100;"""

content = content.replace(old_chunk, new_chunk)
with open('generateItemsPdf.js', 'w') as f:
    f.write(content)
