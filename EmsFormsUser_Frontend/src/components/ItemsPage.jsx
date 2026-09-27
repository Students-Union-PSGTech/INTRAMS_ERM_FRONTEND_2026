import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { userAPI } from '../api/api';
import { calculateGrandTotal, calculateItemTotal } from '../utils/proposalHelpers';

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


  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-slate-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-heading">
            <Package className="w-6 h-6 text-sky-400" />
            Equipment & Item Requirements
          </h2>
          <p className="text-sky-300/70 text-sm mt-1">Select items from Students Union inventory catalog</p>
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
                        <span className="text-sm font-bold text-sky-400">₹{calculateItemTotal({ quantity: selectedItem.quantity, price_per_unit: m.price_per_unit }).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}


        <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-800">
          <div className="text-sm font-medium text-slate-300 bg-slate-900/50 px-4 py-2.5 rounded-xl border border-slate-800">
            Grand Total (inc 18% GST): <span className="text-sky-400 font-bold ml-1 text-lg">₹{calculateGrandTotal(formData.items || []).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemsPage;
