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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-heading">
          <Package className="w-6 h-6 text-sky-400" />
          Equipment & Item Requirements
        </h2>
        <p className="text-sky-300/70 text-sm mt-1">Select items from Students Union inventory catalog</p>
      </div>

      <div className="space-y-8">
        {/* Selected Items Section */}
        {formData.items && formData.items.length > 0 && (
          <div className="bg-slate-900/50 p-5 rounded-2xl border border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
            <h3 className="text-lg font-bold text-sky-400 mb-4 font-heading border-b border-slate-800/50 pb-2">Selected Items</h3>
            <div className="space-y-3">
              {formData.items.map((item, idx) => {
                const masterItem = masterItems.find(m => (m._id || m.id) === item.item_id) || {};
                const pricePerUnit = masterItem.price_per_unit ?? item.price_per_unit ?? 0;
                return (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                    <div className="flex-1">
                      <span className="font-semibold text-white">{item.item_name}</span>
                      <span className="text-slate-400 text-xs ml-2">(₹{pricePerUnit}/unit)</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">Qty</span>
                        <input 
                          type="number"
                          min="1"
                          value={item.quantity ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateMasterQuantity(item.item_id, val === '' ? '' : parseInt(val, 10));
                          }}
                          onBlur={(e) => updateMasterQuantity(item.item_id, Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-16 p-1.5 bg-slate-900 border border-sky-500/30 rounded-lg text-sm text-white text-center font-bold outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                      <div className="w-20 text-right">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                        <span className="text-sm font-bold text-sky-400">
                          ₹{calculateItemTotal({ quantity: item.quantity, price_per_unit: pricePerUnit }).toFixed(2)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMasterCheckbox({ _id: item.item_id }, false)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors border border-transparent hover:border-red-400/20"
                        title="Remove item"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Catalog Section */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4 font-heading border-b border-slate-800 pb-2">Inventory Catalog</h3>
          
          {masterItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
              No items available in the catalog.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {masterItems.map(m => {
                const id = m._id || m.id;
                const isChecked = !!(formData.items || []).find(i => i.item_id === id);

                return (
                  <label key={id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${isChecked ? 'bg-sky-950/20 border-sky-500/50 shadow-[0_0_10px_rgba(14,165,233,0.05)]' : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'}`}>
                    <input 
                      type="checkbox" 
                      className="accent-sky-500 w-4 h-4 rounded cursor-pointer"
                      checked={isChecked}
                      onChange={(e) => handleMasterCheckbox(m, e.target.checked)}
                    />
                    <div className="flex-1 truncate">
                      <span className="text-sm font-medium text-slate-200">{m.item_name}</span>
                      <span className="block text-slate-500 text-xs">₹{m.price_per_unit || 0} / unit</span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-800">
          <div className="text-sm font-medium text-slate-300 bg-slate-900/80 px-5 py-3 rounded-xl border border-slate-800 shadow-inner">
            Grand Total (inc 18% GST): <span className="text-sky-400 font-bold ml-2 text-xl tracking-tight">₹{calculateGrandTotal(formData.items || []).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemsPage;
