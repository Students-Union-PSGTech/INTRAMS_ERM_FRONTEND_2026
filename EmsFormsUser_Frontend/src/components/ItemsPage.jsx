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

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), { item_id: '', item_name: '', quantity: 1, price_per_unit: 0, is_custom: false }],
    }));
  };

  const removeItem = (idx) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const updateItem = (idx, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.items || [])];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleMasterSelect = (idx, selectedMasterId) => {
    if (!selectedMasterId || selectedMasterId === 'custom') {
      updateItem(idx, 'is_custom', true);
      updateItem(idx, 'item_id', '');
      return;
    }

    const matched = masterItems.find((m) => m._id === selectedMasterId || m.id === selectedMasterId);
    if (matched) {
      setFormData((prev) => {
        const updated = [...(prev.items || [])];
        updated[idx] = {
          ...updated[idx],
          item_id: matched._id || matched.id,
          item_name: matched.item_name || matched.name,
          price_per_unit: matched.price_per_unit || 0,
          is_custom: false
        };
        return { ...prev, items: updated };
      });
    }
  };

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

      <div className="space-y-4">
        {formData.items?.map((item, idx) => (
          <div key={idx} className="flex flex-col lg:flex-row gap-3 items-start lg:items-center bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            {/* Master Item Dropdown / Selection */}
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-sky-200/80 mb-1">Catalog Item</label>
              <select
                value={item.is_custom ? 'custom' : (item.item_id || '')}
                onChange={(e) => handleMasterSelect(idx, e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none text-white font-medium mb-2"
              >
                <option value="">-- Select from Inventory Catalog --</option>
                {masterItems.map((m) => (
                  <option key={m._id || m.id} value={m._id || m.id}>
                    {m.item_name} (₹{m.price_per_unit || 0}/unit)
                  </option>
                ))}
                <option value="custom">+ Other / Custom Item</option>
              </select>

              {(item.is_custom || !item.item_id) && (
                <div className="mt-3 relative group animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-sky-500/70 text-xs font-semibold">Custom:</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Extension Boxes, Projector"
                    value={item.item_name || ''}
                    onChange={(e) => updateItem(idx, 'item_name', e.target.value)}
                    className="w-full pl-16 pr-4 py-2.5 bg-slate-900 border border-sky-500/30 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none text-white placeholder-slate-500 transition-all shadow-[0_0_15px_rgba(14,165,233,0.05)]"
                  />
                </div>
              )}
            </div>

            <div className="w-full lg:w-28">
              <label className="block text-xs font-semibold text-sky-200/80 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={item.quantity || 1}
                onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none text-white font-medium"
              />
            </div>

            <div className="w-full lg:w-32">
              <label className="block text-xs font-semibold text-sky-200/80 mb-1">Unit Price (₹)</label>
              <input
                type="number"
                min="0"
                readOnly={!item.is_custom && Boolean(item.item_id)}
                value={item.price_per_unit || 0}
                onChange={(e) => updateItem(idx, 'price_per_unit', parseFloat(e.target.value) || 0)}
                className={`w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm outline-none text-white font-medium ${
                  !item.is_custom && item.item_id ? 'opacity-75 bg-slate-900 cursor-not-allowed' : 'focus:ring-2 focus:ring-sky-500'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg lg:mt-5 transition-colors self-end lg:self-center"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}

        {(!formData.items || formData.items.length === 0) && (
          <div className="text-center py-8 text-slate-400 text-sm bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            No equipment items added yet. Click "+ Add Item" to specify requirements.
          </div>
        )}

        <div className="flex justify-between items-center pt-2 mt-4 border-t border-slate-800">
          <div className="text-sm font-medium text-slate-300 bg-slate-900/50 px-4 py-2.5 rounded-xl border border-slate-800">
            Estimated Total (inc 18% GST): <span className="text-sky-400 font-bold ml-1">₹{((formData.items || []).reduce((acc, curr) => acc + ((curr.quantity || 0) * (curr.price_per_unit || 0) * 1.18), 0)).toFixed(2)}</span>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>
    </div>
  );
}

export default ItemsPage;

