import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  Search,
  RefreshCw,
  Users,
  Layers,
  DollarSign,
  Eye,
  CheckCircle2,
  Clock,
  Building2,
  Calendar
} from 'lucide-react';
import { adminAPI } from '../api';
import { getApiErrorMessage } from '../utils/apiError';
import { useToast } from '../context/ToastContext';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';
import Modal from './ui/Modal';
import EmptyState from './ui/EmptyState';
import { TableSkeleton } from './ui/LoadingState';
import PageHeader from './ui/PageHeader';

const emptyForm = { item_name: '', price_per_unit: '', available_quantity: '', is_returnable: true };

export default function Items() {
  const { showToast } = useToast();

  // Active view tab: 'consolidated' (default) or 'master'
  const [activeTab, setActiveTab] = useState('consolidated');

  // Consolidated items requested by clubs in event forms
  const [consolidatedItems, setConsolidatedItems] = useState([]);
  const [summary, setSummary] = useState({
    total_unique_items: 0,
    total_units_requested: 0,
    total_units_approved: 0,
    total_clubs_requesting: 0,
    total_estimated_valuation: 0
  });

  // Master catalog items
  const [masterItems, setMasterItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  // Breakdown modal state
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
  const [selectedConsolidatedItem, setSelectedConsolidatedItem] = useState(null);

  // Master item modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Fetch consolidated data from event forms
  const fetchConsolidatedData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);
      const res = await adminAPI.getConsolidatedItems();
      const itemsList = Array.isArray(res.data?.data) ? res.data.data : [];
      setConsolidatedItems(itemsList);
      if (res.data?.summary) {
        setSummary(res.data.summary);
      }
      setLastUpdated(new Date());
    } catch (err) {
      if (!isSilent) {
        showToast(getApiErrorMessage(err, 'Unable to load consolidated event items.'), 'error');
      }
    } finally {
      if (!isSilent) setRefreshing(false);
      setLoading(false);
    }
  }, [showToast]);

  // Fetch master catalog items
  const fetchMasterItems = useCallback(async () => {
    try {
      const res = await adminAPI.getItems({ type: 'master' });
      setMasterItems(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
    } catch (_) {
      // master items error handled gracefully
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchConsolidatedData();
    fetchMasterItems();
  }, [fetchConsolidatedData, fetchMasterItems]);

  // Real-Time auto polling every 6 seconds to capture live club submissions
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConsolidatedData(true);
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchConsolidatedData]);

  const handleManualRefresh = () => {
    fetchConsolidatedData(false);
    fetchMasterItems();
    showToast('Event items refreshed with live club submissions.', 'success');
  };

  // Master item CRUD handlers
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      item_name: item.item_name || '',
      price_per_unit: item.price_per_unit ?? '',
      available_quantity: item.available_quantity ?? 0,
      is_returnable: item.is_returnable !== false,
    });
    setModalOpen(true);
  };

  const saveMasterItem = async () => {
    if (!form.item_name || form.price_per_unit === '') {
      showToast('Item name and price per unit are required.', 'warning');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        item_name: form.item_name,
        price_per_unit: parseFloat(form.price_per_unit),
        available_quantity: form.available_quantity === '' ? 0 : parseInt(form.available_quantity, 10),
        is_returnable: form.is_returnable,
      };
      if (editing) await adminAPI.updateItem(editing._id, payload);
      else await adminAPI.createItem(payload);
      setModalOpen(false);
      showToast(editing ? 'Master item updated successfully.' : 'Master item created successfully.', 'success');
      await fetchMasterItems();
      await fetchConsolidatedData(true);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Unable to save item.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeMasterItem = async (id) => {
    if (!window.confirm('Delete this master item?')) return;
    try {
      await adminAPI.deleteItem(id);
      showToast('Master item deleted.', 'success');
      fetchMasterItems();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Unable to delete item.'), 'error');
    }
  };

  // Open breakdown modal for a specific item
  const openBreakdown = (item) => {
    setSelectedConsolidatedItem(item);
    setBreakdownModalOpen(true);
  };

  // Filtered lists
  const filteredConsolidated = consolidatedItems.filter((item) => {
    const q = searchTerm.toLowerCase();
    const nameMatch = (item.item_name || '').toLowerCase().includes(q);
    const clubMatch = (item.clubs || []).some(
      (c) => (c.club_name || '').toLowerCase().includes(q) || (c.username || '').toLowerCase().includes(q)
    );
    const eventMatch = (item.events || []).some((e) => (e.event_name || '').toLowerCase().includes(q));
    return nameMatch || clubMatch || eventMatch;
  });

  const filteredMaster = masterItems.filter((item) =>
    (item.item_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header with Real-Time Indicator & Actions */}
      <PageHeader
        title="CONSOLIDATED ITEMS DIRECTORY"
        subtitle="Live consolidated equipment & materials aggregated directly from club event proposals"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="px-3 py-2 bg-[#050505] hover:bg-[#101010] text-[#00AEEF] hover:text-[#38bdf8] border border-[#00AEEF]/40 rounded-none text-xs font-bold uppercase transition-all flex items-center gap-2 shadow-sm"
              title="Fetch latest submissions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              REFRESH LIVE
            </button>

            {activeTab === 'master' && (
              <Button onClick={openCreate} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                ADD MASTER ITEM
              </Button>
            )}
          </div>
        }
      />

      {/* Real-time sync bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 bg-[#050505] border border-[#252525] text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
            REAL-TIME EVENT SUBMISSION SYNC ACTIVE
          </span>
        </div>
        <div className="font-mono text-[#A0A0A0] text-[11px]">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-[#252525] bg-[#050505] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0A0]">TOTAL ITEMS REQUESTED</div>
              <div className="text-2xl font-bold font-mono text-[#00AEEF] mt-1">
                {Number(summary.total_units_requested || 0).toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-none bg-[#00AEEF]/10 border border-[#00AEEF]/30 flex items-center justify-center text-[#00AEEF]">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-[#A0A0A0] mt-2 font-mono">
            {summary.total_units_approved || 0} units approved so far
          </div>
        </Card>

        <Card className="p-4 border border-[#252525] bg-[#050505] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0A0]">UNIQUE ITEM TYPES</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {summary.total_unique_items || 0}
              </div>
            </div>
            <div className="w-10 h-10 rounded-none bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-[#A0A0A0] mt-2 font-mono">
            Distinct catalog & custom items
          </div>
        </Card>

        <Card className="p-4 border border-[#252525] bg-[#050505] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0A0]">CLUBS ORDERING</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {summary.total_clubs_requesting || 0}
              </div>
            </div>
            <div className="w-10 h-10 rounded-none bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-[#A0A0A0] mt-2 font-mono">
            Participating PSG Tech clubs
          </div>
        </Card>

        <Card className="p-4 border border-[#252525] bg-[#050505] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0A0]">TOTAL ESTIMATED VALUE</div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                ₹{Number(summary.total_estimated_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="w-10 h-10 rounded-none bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-[#A0A0A0] mt-2 font-mono">
            Including 18% GST estimate
          </div>
        </Card>
      </div>

      {/* View Tabs */}
      <div className="flex border-b border-[#252525] gap-2">
        <button
          onClick={() => setActiveTab('consolidated')}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'consolidated'
              ? 'border-[#00AEEF] text-[#00AEEF] bg-[#00AEEF]/5'
              : 'border-transparent text-[#A0A0A0] hover:text-white'
          }`}
        >
          CONSOLIDATED EVENT REQUESTS ({consolidatedItems.length})
        </button>
        <button
          onClick={() => setActiveTab('master')}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'master'
              ? 'border-[#00AEEF] text-[#00AEEF] bg-[#00AEEF]/5'
              : 'border-transparent text-[#A0A0A0] hover:text-white'
          }`}
        >
          MASTER CATALOG DIRECTORY ({masterItems.length})
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'consolidated' ? (
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252525] pb-4">
            <div>
              <h2 className="text-sm font-bold text-[#FFFFFF] font-heading uppercase tracking-wider">
                CONSOLIDATED CLUB REQUIREMENTS ({filteredConsolidated.length})
              </h2>
              <p className="text-[11px] text-[#A0A0A0] mt-0.5">
                Total sum of items ordered across all submitted club event proposals
              </p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
              <input
                type="text"
                placeholder="SEARCH ITEM, CLUB OR EVENT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#000000] text-[#FFFFFF] text-xs font-bold border border-[#252525] rounded-none outline-none focus:border-[#00AEEF]"
              />
            </div>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : filteredConsolidated.length === 0 ? (
            <EmptyState
              icon={Package}
              title="NO EVENT ITEM REQUESTS FOUND"
              message="No clubs have requested items in their event proposals yet. As clubs submit proposals, items will aggregate here in real time."
            />
          ) : (
            <div className="overflow-x-auto border border-[#252525]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#080808] text-[#00AEEF] font-bold uppercase tracking-wider border-b border-[#252525]">
                  <tr>
                    <th className="py-3.5 px-4 border-r border-[#252525] font-bold">ITEM NAME</th>
                    <th className="py-3.5 px-4 text-center border-r border-[#252525] font-bold bg-[#00AEEF]/5">
                      TOTAL REQUESTED
                    </th>
                    <th className="py-3.5 px-4 text-center border-r border-[#252525] font-bold">APPROVED QTY</th>
                    <th className="py-3.5 px-4 border-r border-[#252525] font-bold">REQUESTING CLUBS</th>
                    <th className="py-3.5 px-4 text-center border-r border-[#252525] font-bold">EVENTS</th>
                    <th className="py-3.5 px-4 text-right border-r border-[#252525] font-bold">UNIT PRICE</th>
                    <th className="py-3.5 px-4 text-right border-r border-[#252525] font-bold">EST. TOTAL</th>
                    <th className="py-3.5 px-4 text-center font-bold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252525] bg-[#000000] text-[#E5E5E5]">
                  {filteredConsolidated.map((item) => (
                    <tr key={item._id} className="hover:bg-[#080808] transition-colors">
                      {/* Item Name */}
                      <td className="py-3.5 px-4 font-bold text-[#FFFFFF] border-r border-[#252525]">
                        <div className="flex items-center gap-2">
                          <span>{item.item_name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 font-bold uppercase ${
                              item.is_returnable
                                ? 'bg-sky-950/60 text-sky-400 border border-sky-800/40'
                                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                            }`}
                          >
                            {item.is_returnable ? 'RETURNABLE' : 'CONSUMABLE'}
                          </span>
                        </div>
                      </td>

                      {/* Total Requested Quantity (Highlight) */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-base text-[#00AEEF] border-r border-[#252525] bg-[#00AEEF]/5">
                        {Number(item.total_requested_quantity || 0).toLocaleString()} <span className="text-xs font-normal text-[#A0A0A0]">{item.unit || 'pcs'}</span>
                      </td>

                      {/* Total Approved Quantity */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400 border-r border-[#252525]">
                        {Number(item.total_approved_quantity || 0).toLocaleString()}
                      </td>

                      {/* Requesting Clubs Badges */}
                      <td className="py-3.5 px-4 border-r border-[#252525]">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {(item.clubs || []).slice(0, 3).map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-[#121212] border border-[#2a2a2a] text-[#FFFFFF] text-[11px] font-mono font-semibold"
                            >
                              {c.username.toUpperCase()} <span className="text-[#00AEEF]">({c.total_requested})</span>
                            </span>
                          ))}
                          {(item.clubs || []).length > 3 && (
                            <span className="text-[10px] text-[#A0A0A0] font-mono">
                              +{item.clubs.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Events Count */}
                      <td className="py-3.5 px-4 text-center font-mono text-[#E5E5E5] border-r border-[#252525]">
                        {item.events_count || (item.events || []).length}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-4 text-right font-mono text-[#E5E5E5] border-r border-[#252525]">
                        ₹{Number(item.price_per_unit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Estimated Total Cost */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-amber-300 border-r border-[#252525]">
                        ₹{Number(item.total_estimated_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Action: View Breakdown */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => openBreakdown(item)}
                          className="px-2.5 py-1.5 bg-[#050505] hover:bg-[#00AEEF]/10 text-[#00AEEF] hover:border-[#00AEEF] border border-[#00AEEF]/40 rounded-none text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          VIEW BREAKDOWN
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        /* Master Catalog View */
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252525] pb-4">
            <div>
              <h2 className="text-sm font-bold text-[#FFFFFF] font-heading uppercase tracking-wider">
                MASTER EQUIPMENT CATALOG ({filteredMaster.length})
              </h2>
              <p className="text-[11px] text-[#A0A0A0] mt-0.5">
                Standard equipment repository, pricing rates, and warehouse baseline stock
              </p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
              <input
                type="text"
                placeholder="SEARCH MASTER ITEMS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#000000] text-[#FFFFFF] text-xs font-bold border border-[#252525] rounded-none outline-none focus:border-[#00AEEF]"
              />
            </div>
          </div>

          {filteredMaster.length === 0 ? (
            <EmptyState icon={Package} title="NO MASTER ITEMS FOUND" message="Add items to the master equipment directory." />
          ) : (
            <div className="overflow-x-auto border border-[#252525]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#080808] text-[#00AEEF] font-bold uppercase tracking-wider border-b border-[#252525]">
                  <tr>
                    <th className="py-3.5 px-4 border-r border-[#252525] font-bold">ITEM NAME</th>
                    <th className="py-3.5 px-4 text-right border-r border-[#252525] font-bold">PRICE PER UNIT</th>
                    <th className="py-3.5 px-4 text-center border-r border-[#252525] font-bold">AVAILABLE STOCK</th>
                    <th className="py-3.5 px-4 text-center border-r border-[#252525] font-bold">RETURNABLE</th>
                    <th className="py-3.5 px-4 text-center font-bold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252525] bg-[#000000] text-[#E5E5E5]">
                  {filteredMaster.map((item) => (
                    <tr key={item._id} className="hover:bg-[#080808] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#FFFFFF] border-r border-[#252525]">
                        {item.item_name}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#E5E5E5] border-r border-[#252525]">
                        ₹{Number(item.price_per_unit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-[#00AEEF] border-r border-[#252525]">
                        {Number(item.available_quantity ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#E5E5E5] border-r border-[#252525]">
                        {item.is_returnable === false ? 'NO' : 'YES'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            title="Edit Item"
                            className="px-2.5 py-1.5 bg-[#050505] text-[#FFFFFF] hover:border-[#00AEEF] hover:text-[#00AEEF] border border-[#252525] rounded-none text-[11px] font-bold uppercase transition-all flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            EDIT
                          </button>
                          <button
                            onClick={() => removeMasterItem(item._id)}
                            title="Delete Item"
                            className="px-2.5 py-1.5 bg-[#050505] text-[#FF4D67] hover:bg-[#FF4D67]/10 border border-[#FF4D67]/40 rounded-none text-[11px] font-bold uppercase transition-all flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            DELETE
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Item Breakdown Modal */}
      <Modal
        open={breakdownModalOpen}
        title={`EVENT REQUIREMENTS BREAKDOWN: ${selectedConsolidatedItem?.item_name?.toUpperCase() || ''}`}
        onClose={() => setBreakdownModalOpen(false)}
        footer={
          <Button variant="secondary" onClick={() => setBreakdownModalOpen(false)}>
            CLOSE
          </Button>
        }
      >
        {selectedConsolidatedItem && (
          <div className="space-y-4">
            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#050505] border border-[#252525] text-xs font-mono">
              <div>
                <span className="text-[#A0A0A0] block text-[10px] uppercase">TOTAL ORDERED</span>
                <span className="text-[#00AEEF] text-base font-bold">
                  {selectedConsolidatedItem.total_requested_quantity} {selectedConsolidatedItem.unit || 'pcs'}
                </span>
              </div>
              <div>
                <span className="text-[#A0A0A0] block text-[10px] uppercase">TOTAL APPROVED</span>
                <span className="text-emerald-400 text-base font-bold">
                  {selectedConsolidatedItem.total_approved_quantity} {selectedConsolidatedItem.unit || 'pcs'}
                </span>
              </div>
              <div>
                <span className="text-[#A0A0A0] block text-[10px] uppercase">UNIT PRICE</span>
                <span className="text-[#E5E5E5] text-base font-bold">
                  ₹{Number(selectedConsolidatedItem.price_per_unit || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[#A0A0A0] block text-[10px] uppercase">TOTAL ESTIMATED</span>
                <span className="text-amber-400 text-base font-bold">
                  ₹{Number(selectedConsolidatedItem.total_estimated_cost || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* List of Clubs & Events */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A0A0]">
                CLUB SUBMISSION BREAKDOWN ({selectedConsolidatedItem.clubs?.length || 0} CLUBS)
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(selectedConsolidatedItem.clubs || []).map((club, idx) => (
                  <div key={idx} className="p-3 bg-[#080808] border border-[#252525] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#00AEEF]" />
                        <span className="font-bold text-white text-xs">{club.club_name}</span>
                        <span className="px-1.5 py-0.5 bg-[#141414] text-[10px] font-mono text-[#00AEEF] border border-[#2c2c2c]">
                          @{club.username}
                        </span>
                      </div>
                      <div className="font-mono text-sm font-bold text-[#00AEEF]">
                        {club.total_requested} {selectedConsolidatedItem.unit || 'pcs'}
                      </div>
                    </div>

                    {/* Events under this club */}
                    <div className="pl-6 space-y-1">
                      {(club.events || []).map((ev, eIdx) => (
                        <div key={eIdx} className="flex items-center justify-between text-[11px] text-[#A0A0A0] border-t border-[#1c1c1c] pt-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-[#A0A0A0]" />
                            <span className="text-[#E5E5E5] font-semibold">{ev.event_name}</span>
                            <span className="px-1.5 py-0.2 bg-[#121212] text-[9px] uppercase font-mono text-[#A0A0A0]">
                              {ev.status}
                            </span>
                          </div>
                          <div className="font-mono font-semibold text-white">
                            Qty: {ev.quantity} {ev.approved_quantity > 0 && `(Approved: ${ev.approved_quantity})`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Master Item Create/Edit Modal */}
      <Modal
        open={modalOpen}
        title={editing ? 'EDIT MASTER ITEM' : 'CREATE MASTER ITEM'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              CANCEL
            </Button>
            <Button loading={saving} onClick={saveMasterItem}>
              SAVE ITEM
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Item Name"
            value={form.item_name}
            onChange={(e) => setForm({ ...form, item_name: e.target.value })}
            placeholder="e.g. Extension Box 5m"
          />
          <Input
            label="Price Per Unit (INR)"
            type="number"
            value={form.price_per_unit}
            onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })}
            placeholder="e.g. 250.00"
          />
          <Input
            label="Initial Stock Quantity"
            type="number"
            value={form.available_quantity}
            onChange={(e) => setForm({ ...form, available_quantity: e.target.value })}
            placeholder="e.g. 50"
          />
          <label className="flex items-center gap-2 text-[13px] text-[#E5E5E5] font-bold uppercase cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_returnable}
              onChange={(e) => setForm({ ...form, is_returnable: e.target.checked })}
              className="accent-[#00AEEF] h-4 w-4"
            />
            Returnable equipment item
          </label>
        </div>
      </Modal>
    </div>
  );
}
