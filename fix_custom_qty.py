import re

for filepath in ['admin/src/components/edit-event/ItemsPage.jsx', 'EmsFormsUser_Frontend/src/components/ItemsPage.jsx']:
    with open(filepath, 'r') as f:
        content = f.read()

    # Find the Custom / Unlisted Items block and replace it
    start_marker = "{/* Custom / Legacy Requested Items */}"
    end_marker = "{/* Footer */}"
    
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker, start_idx)
    
    if start_idx != -1 and end_idx != -1:
        custom_items_block = """{/* Custom / Legacy Requested Items */}
        {(() => {
          const customOrMissingItems = (formData.items || []).filter(
            (item) => !masterItems.some((m) => (m._id || m.id) === item.item_id)
          );
          
          if (customOrMissingItems.length === 0) return null;
          
          const updateCustomQuantity = (item, newQty) => {
            const validQty = Math.max(0, newQty);
            setFormData(prev => {
              const newItems = [...(prev.items || [])];
              const idx = newItems.findIndex(i => {
                if (item._id && i._id) return i._id === item._id;
                return i.item_name === item.item_name;
              });
              if (idx !== -1) {
                newItems[idx] = { ...newItems[idx], quantity: validQty, requested_quantity: validQty };
              }
              return { ...prev, items: newItems };
            });
          };
          
          return (
            <div className="mt-8 pt-8 border-t border-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4 font-heading">
                <Package className="w-5 h-5 text-amber-400" />
                Custom / Unlisted Items
              </h3>
              <div className="flex flex-col gap-3">
                {customOrMissingItems.map((item, idx) => (
                  <div key={`custom-${item.item_id || idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-2xl bg-amber-950/20 border-amber-500/30">
                    <div className="flex-1">
                      <span className="text-base font-semibold text-slate-200 block truncate">{item.item_name || 'Custom Item'}</span>
                      <span className="block text-amber-400/80 text-sm mt-0.5 font-medium">{item.is_custom ? 'Custom Request' : 'Legacy Item'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right mr-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Price/Unit</span>
                        <span className="text-sm font-bold text-slate-300">₹{item.price_per_unit || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 shadow-inner">
                        <button 
                          type="button"
                          onClick={() => updateCustomQuantity(item, (item.quantity || 0) - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-400 hover:bg-amber-900/40 hover:text-amber-300 transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={item.quantity || 0}
                          onChange={(e) => updateCustomQuantity(item, parseInt(e.target.value) || 0)}
                          className="w-12 text-center text-sm font-bold text-white bg-slate-800 border border-slate-700/50 rounded focus:outline-none focus:border-amber-500 tabular-nums py-1"
                        />
                        <button 
                          type="button"
                          onClick={() => updateCustomQuantity(item, (item.quantity || 0) + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-400 hover:bg-amber-900/40 hover:text-amber-300 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        """
        content = content[:start_idx] + custom_items_block + content[end_idx:]
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")
