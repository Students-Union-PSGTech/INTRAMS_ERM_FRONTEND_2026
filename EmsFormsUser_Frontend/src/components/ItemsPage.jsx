import React, { useEffect, useState } from 'react';
import { Package, Plus, Minus } from 'lucide-react';
import { userAPI } from '../api/api';
import { calculateGrandTotal, calculateItemTotal } from '../utils/proposalHelpers';

function ItemsPage({ formData, setFormData }) {
  const [masterItems, setMasterItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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

  const updateMasterQuantity = (masterItem, newQuantity) => {
    setFormData(prev => {
      let currentItems = [...(prev.items || [])];
      const masterId = masterItem._id || masterItem.id;
      
      if (newQuantity <= 0) {
        currentItems = currentItems.filter(i => i.item_id !== masterId);
      } else {
        const existingIndex = currentItems.findIndex(i => i.item_id === masterId);
        if (existingIndex >= 0) {
          currentItems[existingIndex] = { ...currentItems[existingIndex], quantity: newQuantity };
        } else {
          currentItems.push({
            item_id: masterId,
            item_name: masterItem.item_name || masterItem.name,
            quantity: newQuantity,
            price_per_unit: masterItem.price_per_unit || 0,
            is_custom: false
          });
        }
      }
      return { ...prev, items: currentItems };
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
      
      <div className="mb-4">
        <input 
          type="text" 
          placeholder="Search items..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
        />
      </div>

      <div className="space-y-8">
        {/* Catalog Section */}
        <div>
          {masterItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
              No items available in the catalog.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {masterItems.filter(m => (m.item_name || m.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(m => {
                const id = m._id || m.id;
                const selectedItem = (formData.items || []).find(i => i.item_id === id);
                const quantity = selectedItem ? selectedItem.quantity : 0;
                const isSelected = quantity > 0;

                return (
                  <div key={id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-2xl transition-all ${isSelected ? 'bg-sky-950/20 border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.1)]' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'}`}>
                    <div className="flex-1">
                      <span className="text-base font-semibold text-slate-200 block truncate" title={m.item_name}>{m.item_name}</span>
                      <span className="block text-sky-400/80 text-sm mt-0.5 font-medium">₹{m.price_per_unit || 0} / unit</span>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="min-w-[5rem] text-left sm:text-right">
                        {isSelected && (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</span>
                            <span className="text-sm font-bold text-sky-400">
                              ₹{calculateItemTotal({ quantity, price_per_unit: m.price_per_unit || 0 }).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/50 rounded-xl p-1 shadow-inner shrink-0">
                        <button 
                          type="button"
                          onClick={() => updateMasterQuantity(m, quantity - 1)}
                          disabled={quantity === 0}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${quantity > 0 ? 'text-white hover:bg-slate-800' : 'text-slate-600 opacity-50 cursor-not-allowed'}`}
                        >
                          <Minus size={16} />
                        </button>
                        <input 
                          type="number"
                          min="0"
                          value={quantity === 0 ? '' : quantity}
                          placeholder="0"
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            updateMasterQuantity(m, isNaN(val) ? 0 : val);
                          }}
                          className="w-12 text-center text-sm font-bold text-white bg-slate-800 border border-slate-700/50 rounded focus:outline-none focus:border-sky-500 tabular-nums py-1"
                        />
                        <button 
                          type="button"
                          onClick={() => updateMasterQuantity(m, quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-sky-400 hover:bg-sky-900/40 hover:text-sky-300 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom / Legacy Requested Items */}
        {(() => {
          const customOrMissingItems = (formData.items || []).filter(
            (item) => !masterItems.some((m) => (m._id || m.id) === item.item_id)
          );
          
          if (customOrMissingItems.length === 0) return null;
          
          const updateCustomQuantity = (item, newQty) => {
            const validQty = Math.max(0, newQty);
            setFormData(prev => {
              let newItems = [...(prev.items || [])];
              if (validQty <= 0) {
                newItems = newItems.filter(i => {
                  if (item._id && i._id) return i._id !== item._id;
                  if (item.item_id && i.item_id) return i.item_id !== item.item_id;
                  return i.item_name !== item.item_name;
                });
              } else {
                const idx = newItems.findIndex(i => {
                  if (item._id && i._id) return i._id === item._id;
                  if (item.item_id && i.item_id) return i.item_id === item.item_id;
                  return i.item_name === item.item_name;
                });
                if (idx !== -1) {
                  newItems[idx] = { ...newItems[idx], quantity: validQty, requested_quantity: validQty };
                }
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

        {/* Footer */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-800">
          <div className="text-sm font-medium text-slate-300 bg-slate-900/80 px-6 py-4 rounded-2xl border border-slate-800 shadow-inner w-full flex justify-between items-center">
            <span>Grand Total (inc 18% GST):</span>
            <span className="text-sky-400 font-bold ml-2 text-2xl tracking-tight">₹{calculateGrandTotal(formData.items || []).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemsPage;
