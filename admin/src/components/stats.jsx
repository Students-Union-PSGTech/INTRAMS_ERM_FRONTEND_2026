import React, { useState, useEffect, useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { adminAPI } from "../api";
import { TrendingUp, Package, IndianRupee, BarChart3, Download, Loader2 } from "lucide-react";

function Stats() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particlesOptions = {
    background: {
      color: { value: "#000000" },
    },
    fpsLimit: 120,
    interactivity: {
      events: {
        onClick: { enable: true, mode: "push" },
        onHover: { enable: true, mode: "repulse" },
        resize: true,
      },
      modes: {
        push: { quantity: 4 },
        repulse: { distance: 200, duration: 0.4 },
      },
    },
    particles: {
      color: { value: "#38bdf8" },
      links: { color: "#0284c7", distance: 150, enable: true, opacity: 0.25, width: 1 },
      move: { direction: "none", enable: true, outModes: { default: "bounce" }, random: false, speed: 1, straight: false },
      number: { density: { enable: true, area: 800 }, value: 80 },
      opacity: { value: 0.35 },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 3 } },
    },
    detectRetina: true,
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getItems();
      const itemsList = Array.isArray(res.data?.data) ? res.data.data : [];
      setItems(itemsList);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const totalItemsCount = items.reduce((acc, item) => acc + (Number(item.available_quantity) || 0), 0);
  const totalValuation = items.reduce((acc, item) => {
    const qty = Number(item.available_quantity) || 0;
    const price = Number(item.price_per_unit) || 0;
    return acc + (qty * price * 1.18);
  }, 0);
  const uniqueItemsCount = items.length;

  const handleDownloadExcel = () => {
    if (items.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Item Name,Quantity,Unit Price (INR),Total Value (INR)\n";

    items.forEach((item) => {
      const qty = Number(item.available_quantity) || 0;
      const price = Number(item.price_per_unit) || 0;
      const total = qty * price * 1.18;
      const name = `"${(item.item_name || "").replace(/"/g, '""')}"`;
      csvContent += `${name},${qty},${price},${total}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `item_statistics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen relative bg-[#000000] text-slate-100 ocean-gradient-bg overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      <Particles id="stats-particles" init={particlesInit} options={particlesOptions} className="absolute inset-0 z-0" />

      <div className="relative z-10 max-w-6xl w-full mx-auto space-y-8 pt-16 sm:pt-6">
        {/* Top Header & Export Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-wide uppercase flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-sky-400" />
              ITEM STATISTICS
            </h1>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              VIEW COMPREHENSIVE ITEM ANALYTICS AND EXPORT REPORTS
            </p>
          </div>

          <button
            onClick={handleDownloadExcel}
            disabled={items.length === 0}
            className="self-start sm:self-auto bg-white hover:bg-zinc-200 text-black font-extrabold px-6 py-3.5 rounded-none text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2 border border-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 text-black" />
            DOWNLOAD EXCEL
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-sky-400" />
            <p className="text-slate-400 text-sm">Calculating statistics & valuation...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-rose-400 bg-rose-500/10 rounded-none border border-rose-500/20 backdrop-blur-md">
            <p className="text-base font-semibold">Error loading statistics: {error}</p>
          </div>
        ) : (
          <>
            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Items Card */}
              <div className="bg-white border-2 border-black p-6 rounded-none shadow-md flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black text-white rounded-none flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Total Items</p>
                    <h3 className="text-3xl font-extrabold text-black font-mono tracking-tight mt-0.5">
                      {totalItemsCount.toLocaleString()}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Total Value Card */}
              <div className="bg-white border-2 border-black p-6 rounded-none shadow-md flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black text-white rounded-none flex items-center justify-center font-bold text-xl flex-shrink-0">
                    $
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Total Value</p>
                    <h3 className="text-3xl font-extrabold text-black font-mono tracking-tight mt-0.5">
                      ₹{totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Unique Items Card */}
              <div className="bg-white border-2 border-black p-6 rounded-none shadow-md flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black text-white rounded-none flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Unique Items</p>
                    <h3 className="text-3xl font-extrabold text-black font-mono tracking-tight mt-0.5">
                      {uniqueItemsCount.toLocaleString()}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* ITEM BREAKDOWN Table */}
            <div className="bg-white border-2 border-black rounded-none shadow-xl overflow-hidden p-6 space-y-4">
              <div className="border-b-2 border-black pb-4">
                <h2 className="text-lg font-extrabold text-black font-heading uppercase tracking-wide">
                  ITEM BREAKDOWN
                </h2>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12 text-slate-600 bg-zinc-100 border border-black">
                  <p className="text-base font-semibold">No items available to generate statistics.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-black">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-white text-black font-extrabold uppercase tracking-wider border-b-2 border-black">
                      <tr>
                        <th className="py-3.5 px-4 border-r border-black font-extrabold">ITEM NAME</th>
                        <th className="py-3.5 px-4 text-center border-r border-black font-extrabold">QUANTITY</th>
                        <th className="py-3.5 px-4 text-right border-r border-black font-extrabold">UNIT PRICE</th>
                        <th className="py-3.5 px-4 text-right font-extrabold">TOTAL VALUE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black bg-white text-black">
                      {items.map((item) => {
                        const qty = Number(item.available_quantity) || 0;
                        const price = Number(item.price_per_unit) || 0;
                        const itemTotal = qty * price * 1.18;

                        return (
                          <tr key={item._id} className="hover:bg-zinc-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-black border-r border-black font-sans">
                              {item.item_name}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-black border-r border-black">
                              {qty.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-black border-r border-black">
                              ₹{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-extrabold text-black">
                              ₹{itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Stats;
