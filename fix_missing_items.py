import re

for filepath in ['admin/src/components/edit-event/ItemsPage.jsx', 'EmsFormsUser_Frontend/src/components/ItemsPage.jsx']:
    with open(filepath, 'r') as f:
        content = f.read()

    # Find the end of the master items list rendering
    target_block = """            </div>
          )}
        </div>

        {/* Footer */}"""
    
    custom_items_block = """            </div>
          )}
        </div>

        {/* Custom / Legacy Requested Items */}
        {(() => {
          const customOrMissingItems = (formData.items || []).filter(
            (item) => !masterItems.some((m) => (m._id || m.id) === item.item_id)
          );
          
          if (customOrMissingItems.length === 0) return null;
          
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
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Quantity</span>
                        <span className="text-sm font-bold text-amber-400">{item.quantity}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            items: (prev.items || []).filter(i => i.item_id !== item.item_id)
                          }));
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Footer */}"""

    if target_block in content:
        content = content.replace(target_block, custom_items_block)
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")
    else:
        print(f"Could not find target block in {filepath}")

