import React, { useEffect, useState } from 'react';
import { Warehouse, Download, Package, BarChart3, DollarSign } from 'lucide-react';
import { adminAPI } from '../api';
import { getApiErrorMessage } from '../utils/apiError';
import { useToast } from '../context/ToastContext';
import Input from './ui/Input';
import Card from './ui/Card';
import EmptyState from './ui/EmptyState';
import { TableSkeleton } from './ui/LoadingState';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';

export default function Inventory() {
  const { showToast } = useToast();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getItems();
      const itemsList = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setStocks(itemsList);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Unable to load inventory statistics.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  // KPI Calculations from dynamic database records
  const totalItemsCount = stocks.reduce((acc, item) => {
    const available = item.available_quantity ?? item.quantity ?? 0;
    return acc + (Number(available) || 0);
  }, 0);

  const totalValuation = stocks.reduce((acc, item) => {
    const available = item.available_quantity ?? item.quantity ?? 0;
    const price = Number(item.price_per_unit) || 0;
    return acc + (Number(available) * price * 1.18);
  }, 0);

  const uniqueItemsCount = stocks.length;

  // CSV Export from real database records
  const handleDownloadExcel = () => {
    if (stocks.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Item Name,Quantity,Unit Price (INR),Total Value (INR)\n';

    stocks.forEach((item) => {
      const available = item.available_quantity ?? item.quantity ?? 0;
      const price = Number(item.price_per_unit) || 0;
      const total = available * price * 1.18;
      const name = `"${(item.item_name || '').replace(/"/g, '""')}"`;
      csvContent += `${name},${available},${price},${total}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_statistics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = stocks.filter((s) => (s.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="SU INVENTORY OVERVIEW"
        subtitle="View Students Union equipment stock levels, valuation breakdown, and export CSV reports"
        actions={
          <Button onClick={handleDownloadExcel} disabled={stocks.length === 0} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            EXPORT CSV
          </Button>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Items Card */}
        <Card className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#000000] border border-[#00AEEF] text-[#00AEEF] flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-[#00AEEF]" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0A0]">TOTAL UNITS IN STOCK</p>
              <h3 className="text-2xl font-bold text-[#FFFFFF] font-heading tracking-tight mt-0.5 tabular-nums">
                {totalItemsCount.toLocaleString()}
              </h3>
            </div>
          </div>
        </Card>

        {/* Total Value Card */}
        <Card className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#000000] border border-[#00D084] text-[#00D084] flex items-center justify-center font-bold text-lg flex-shrink-0">
              ₹
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0A0]">TOTAL INVENTORY VALUE</p>
              <h3 className="text-2xl font-bold text-[#FFFFFF] font-heading tracking-tight mt-0.5 tabular-nums">
                ₹{totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        </Card>

        {/* Unique Items Card */}
        <Card className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#000000] border border-[#18BFFF] text-[#18BFFF] flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-[#18BFFF]" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0A0]">CATALOG TYPES</p>
              <h3 className="text-2xl font-bold text-[#FFFFFF] font-heading tracking-tight mt-0.5 tabular-nums">
                {uniqueItemsCount.toLocaleString()}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Item Breakdown Table */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252525] pb-4">
          <h2 className="text-sm font-bold text-[#FFFFFF] font-heading uppercase tracking-wider">
            STOCK BREAKDOWN BY ITEM
          </h2>
          <div className="w-full sm:w-80">
            <Input
              placeholder="SEARCH MASTER ITEMS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Warehouse} title="NO INVENTORY RECORDS FOUND" message="Master items added in the Items section will appear here automatically." />
        ) : (
          <div className="overflow-x-auto border border-[#252525]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#080808] text-[#00AEEF] font-bold uppercase tracking-wider border-b border-[#252525]">
                <tr>
                  <th className="py-3.5 px-4 border-r border-[#252525] font-bold">ITEM NAME</th>
                  <th className="py-3.5 px-4 text-center border-r border-[#252525] font-bold">QUANTITY IN STOCK</th>
                  <th className="py-3.5 px-4 text-right border-r border-[#252525] font-bold">UNIT PRICE</th>
                  <th className="py-3.5 px-4 text-right font-bold">TOTAL ESTIMATED VALUE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252525] bg-[#000000] text-[#E5E5E5]">
                {filtered.map((stock) => {
                  const available = stock.available_quantity ?? stock.quantity ?? 0;
                  const price = Number(stock.price_per_unit) || 0;
                  const totalVal = available * price * 1.18;

                  return (
                    <tr key={stock._id} className="hover:bg-[#080808] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#FFFFFF] border-r border-[#252525]">
                        {stock.item_name}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-[#00AEEF] border-r border-[#252525]">
                        {available.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#E5E5E5] border-r border-[#252525]">
                        ₹{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#FFFFFF]">
                        ₹{totalVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}



