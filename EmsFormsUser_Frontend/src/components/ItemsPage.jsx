import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Package } from 'lucide-react';
import { userAPI } from '../api/api';

function ItemsPage({ formData, setFormData }) {
  const [masterItems, setMasterItems] = useState([]);

  useEffect(() => {
    const fetchMasterItems = async () => {
      try {
        const res = await userAPI.getItems();
        const list = res.data?.data || res.data || [];
        setMasterItems(Array.isArray(list) ? list : []);
      } catch (_) {
        setMasterItems([]);
      }
    };
    fetchMasterItems();
  }, []);

  const handleMasterCheckbox = (masterItem, checked) => {
    setFormData(prev => {
      let currentItems = [...(prev.items || [])];
      const masterId = masterItem._id || masterItem.id;
      
      if (checked) {
        const exists = currentItems.find(i => i.item_id === masterId);
        if (!exists) {
          currentItems.push({
            item_id: masterId,
            item_name: masterItem.item_name || masterItem.name,
            quantity: 1,
            price_per_unit: masterItem.price_per_unit || 0,
            is_custom: false
          });
        }
      } else {
        currentItems = currentItems.filter(i => i.item_id !== masterId);
      }
      return { ...prev, items: currentItems };
    });
  };

  const updateMasterQuantity = (masterId, quantity) => {
    setFormData(prev => {
      const updated = (prev.items || []).map(item => {
        if (item.item_id === masterId) {
          return { ...item, quantity: quantity };
        }
        return item;
      });
      return { ...prev, items: updated };
    });
  };

  const addCustomItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), { item_id: '', item_name: '', quantity: 1, price_per_unit: 0, is_custom: true }],
    }));
  };

  const updateCustomItem = (customItemIdx, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.items || [])];
      let customCounter = -1;
      for (let i = 0; i < updated.length; i++) {
        if (updated[i].is_custom) {
          customCounter++;
          if (customCounter === customItemIdx) {
            updated[i] = { ...updated[i], [field]: value };
            break;
          }
        }
      }
      return { ...prev, items: updated };
    });
  };

  const removeCustomItem = (customItemIdx) => {
    setFormData((prev) => {
      const updated = [...(prev.items || [])];
      let customCounter = -1;
      const targetIdx = updated.findIndex(item => {
        if (item.is_custom) {
          customCounter++;
          return customCounter === customItemIdx;
        }
        return false;
      });
      if (targetIdx > -1) {
        updated.splice(targetIdx, 1);
      }
      return { ...prev, items: updated };
    });
  };

  const customItems = (formData.items || []).filter(i => i.is_custom);

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-slate-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-heading">
            <Package className="w-6 h-6 text-sky-400" />
            Equipment & Item Requirements
          </h2>
          <p className="text-sky-300/70 text-sm mt-1">Select items from Students Union inventory catalog or specify custom items</p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-bold text-white mb-2 font-heading border-b border-slate-800 pb-2">Inventory Catalog</h3>
        
        {masterItems.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            No items available in the catalog.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {masterItems.map(m => {
              const id = m._id || m.id;
              const selectedItem = (formData.items || []).find(i => i.item_id === id);
              const isChecked = !!selectedItem;

              return (
                <div key={id} className={`flex items-center justify-between p-4 border rounded-2xl transition-all ${isChecked ? 'bg-sky-950/20 border-sky-500/50' : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'}`}>
                  <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-slate-200 flex-1">
                    <input 
                      type="checkbox" 
                      className="accent-sky-500 w-4 h-4 rounded cursor-pointer"
                      checked={isChecked}
                      onChange={(e) => handleMasterCheckbox(m, e.target.checked)}
                    />
                    <span>
                      {m.item_name} <span className="text-slate-500 text-xs ml-1">(₹{m.price_per_unit || 0})</span>
                    </span>
                  </label>
                  {isChecked && (
                    <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">Qty</span>
                        <input 
                          type="number"
                          min="1"
                          value={selectedItem.quantity ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateMasterQuantity(id, val === '' ? '' : parseInt(val, 10));
                          }}
                          onBlur={(e) => updateMasterQuantity(id, Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-14 p-1.5 bg-slate-900 border border-sky-500/30 rounded-lg text-sm text-white font-bold text-center outline-none focus:ring-2 focus:ring-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.1)]"
                        />
                      </div>
                      <div className="text-right min-w-[60px]">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                        <span className="text-sm font-bold text-sky-400">₹{((selectedItem.quantity || 0) * (m.price_per_unit || 0)).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <h3 className="text-lg font-bold text-white mt-8 pt-6 mb-4 font-heading border-t border-slate-800">Other / Custom Items</h3>
        
        <div className="space-y-4">
          {customItems.map((item, idx) => (
            <div key={`custom-${idx}`} className="flex flex-col lg:flex-row gap-3 items-start lg:items-center bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-bold text-sky-200/90 uppercase tracking-wider mb-1">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Special Decor"
                  value={item.item_name || ''}
                  onChange={(e) => updateCustomItem(idx, 'item_name', e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none text-white font-medium"
                />
              </div>
              <div className="w-full lg:w-28">
                <label className="block text-[11px] font-bold text-sky-200/90 uppercase tracking-wider mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity ?? ''}
                  onChange={(e) => updateCustomItem(idx, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  onBlur={(e) => updateCustomItem(idx, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none text-white font-medium text-center"
                />
              </div>
              <div className="w-full lg:w-32">
                <label className="block text-[11px] font-bold text-sky-200/90 uppercase tracking-wider mb-1">Unit Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={item.price_per_unit ?? ''}
                  onChange={(e) => updateCustomItem(idx, 'price_per_unit', e.target.value === '' ? '' : parseFloat(e.target.value))}
                  onBlur={(e) => updateCustomItem(idx, 'price_per_unit', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none text-white font-medium text-center"
                />
              </div>
              <div className="w-full lg:w-32">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total (₹)</label>
                <div className="w-full p-2.5 bg-slate-900/50 border border-transparent rounded-xl text-sm text-sky-300 font-bold flex items-center h-[42px]">
                  ₹ {((item.quantity || 0) * (item.price_per_unit || 0)).toFixed(2)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeCustomItem(idx)}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-lg lg:mt-5 transition-colors self-end lg:self-center"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addCustomItem}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 rounded-xl text-sm font-bold transition-all"
          >
            <Plus className="w-4 h-4" /> Add Other Item
          </button>
        </div>

        <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-800">
          <div className="text-sm font-medium text-slate-300 bg-slate-900/50 px-4 py-2.5 rounded-xl border border-slate-800">
            Grand Total (inc 18% GST): <span className="text-sky-400 font-bold ml-1 text-lg">₹{((formData.items || []).reduce((acc, curr) => acc + ((curr.quantity || 0) * (curr.price_per_unit || 0) * 1.18), 0)).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemsPage;
