import re

for filepath in ['admin/src/components/edit-event/ItemsPage.jsx', 'EmsFormsUser_Frontend/src/components/ItemsPage.jsx']:
    with open(filepath, 'r') as f:
        content = f.read()

    old_remove = """                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            items: (prev.items || []).filter(i => i.item_id !== item.item_id)
                          }));
                        }}"""
    
    new_remove = """                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            items: (prev.items || []).filter((i, filterIdx) => {
                              if (item._id && i._id) return i._id !== item._id;
                              return i.item_name !== item.item_name;
                            })
                          }));
                        }}"""

    content = content.replace(old_remove, new_remove)
    with open(filepath, 'w') as f:
        f.write(content)
