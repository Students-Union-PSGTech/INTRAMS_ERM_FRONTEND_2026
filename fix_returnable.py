import re
import os

def fix_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r') as f:
        content = f.read()

    # Fix EventPreview.jsx
    if 'EventPreview.jsx' in filepath:
        old_str = """<span className={it.is_custom ? "text-slate-500" : (it.is_returnable ? "text-emerald-400 font-bold" : "text-red-400 font-bold")}>
                        {it.is_custom ? '-' : (it.is_returnable ? 'YES' : 'NO')}
                      </span>"""
        new_str = """<span className={it.is_returnable ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                        {it.is_returnable ? 'YES' : 'NO'}
                      </span>"""
        content = content.replace(old_str, new_str)
        
    # Fix generateEventPdf.js
    if 'generateEventPdf.js' in filepath:
        old_pdf = "const retStr = it.is_custom ? '-' : (it.is_returnable ? 'YES' : 'NO');"
        new_pdf = "const retStr = it.is_returnable ? 'YES' : 'NO';"
        content = content.replace(old_pdf, new_pdf)
        
        old_color = "color: it.is_returnable ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0),"
        new_color = "color: it.is_returnable ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0),"
        # Actually in PDF we might have done color based on it.is_returnable anyway
        
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Updated {filepath}")

files = [
    'admin/src/components/edit-event/EventPreview.jsx',
    'EmsFormsUser_Frontend/src/components/EventPreview.jsx',
    'admin/src/utils/generateEventPdf.js',
    'EmsFormsUser_Frontend/src/utils/generateEventPdf.js',
    'admin/src/utils/generateItemsPdf.js',
    'admin/src/utils/generateEventItemsPdf.js'
]

for f in files:
    fix_file(f)

