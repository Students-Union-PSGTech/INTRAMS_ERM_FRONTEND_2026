import re

with open('../components/rolePdf/RolePdf.jsx', 'r') as f:
    content = f.read()

# 1. Import generateItemsPdf
content = content.replace("import { generateEventsPdf } from '../../utils/generateEventsPdf';", "import { generateEventsPdf } from '../../utils/generateEventsPdf';\nimport { generateItemsPdf } from '../../utils/generateItemsPdf';")

# 2. Add 'items' to ROLES
content = content.replace("{ id: 'event', label: 'Events' },", "{ id: 'event', label: 'Events' },\n  { id: 'items', label: 'Requested Items' },")

# 3. Update generateExactPdfBlob
old_pdf_blob = """  const generateExactPdfBlob = async () => {
    let rawData = [];
    try {
      if (selected === 'event') {
        const res = await adminAPI.getEvents();
        const events = res.data?.data || res.data || [];
        rawData = events.filter(e => e.status === 'submitted');
      } else {
        const res = await adminAPI.getRoleMembers(selected);
        rawData = res.data?.data || res.data || {};
      }
    } catch (_) {
      rawData = selected === 'event' ? {} : [];
    }
    if (selected === 'event') {
      return await generateEventsPdf({ data: rawData });
    }
    return await generateRolePdf({ role: selected, data: rawData });
  };"""

new_pdf_blob = """  const generateExactPdfBlob = async () => {
    let rawData = [];
    try {
      if (selected === 'event' || selected === 'items') {
        const res = await adminAPI.getEvents();
        const events = res.data?.data || res.data || [];
        rawData = events.filter(e => e.status === 'submitted');
      } else {
        const res = await adminAPI.getRoleMembers(selected);
        rawData = res.data?.data || res.data || {};
      }
    } catch (_) {
      rawData = (selected === 'event' || selected === 'items') ? [] : {};
    }
    if (selected === 'items') {
      return await generateItemsPdf({ data: rawData });
    }
    if (selected === 'event') {
      return await generateEventsPdf({ data: rawData });
    }
    return await generateRolePdf({ role: selected, data: rawData });
  };"""

content = content.replace(old_pdf_blob, new_pdf_blob)

# 4. Update exportCsv
old_csv_export = """      if (Array.isArray(rawData)) {
        if (selected === 'event') {
          flattenRows = rawData.map((e, index) => ({
            SNo: index + 1,
            Club: e.club_id?.club_name || e.club_name || 'General',
            EventID: e.event_id || '',
            EventName: e.event_name || ''
          }));
        } else {
          flattenRows = rawData;
        }
      } else {"""

new_csv_export = """      if (Array.isArray(rawData)) {
        if (selected === 'event') {
          flattenRows = rawData.map((e, index) => ({
            SNo: index + 1,
            Club: e.club_id?.club_name || e.club_name || 'General',
            EventID: e.event_id || '',
            EventName: e.event_name || ''
          }));
        } else if (selected === 'items') {
          let sn = 1;
          rawData.forEach(e => {
            const club = e.club_id?.club_name || e.club_name || 'General';
            const eventName = e.event_name || '';
            const items = e.items || [];
            items.forEach(it => {
              flattenRows.push({
                SNo: sn++,
                Club: club,
                EventName: eventName,
                ItemName: it.item_name || it.name || '',
                Quantity: it.quantity || it.requested_quantity || 1
              });
            });
          });
        } else {
          flattenRows = rawData;
        }
      } else {"""

content = content.replace(old_csv_export, new_csv_export)

# 5. Handle selected check for events inside exportCsv
old_event_check = """      if (selected === 'event') {
        const eventRes = await adminAPI.getEvents();
        const events = eventRes.data?.data || eventRes.data || [];
        rawData = events.filter(e => e.status === 'submitted');
      } else {"""

new_event_check = """      if (selected === 'event' || selected === 'items') {
        const eventRes = await adminAPI.getEvents();
        const events = eventRes.data?.data || eventRes.data || [];
        rawData = events.filter(e => e.status === 'submitted');
      } else {"""

content = content.replace(old_event_check, new_event_check)

with open('../components/rolePdf/RolePdf.jsx', 'w') as f:
    f.write(content)
