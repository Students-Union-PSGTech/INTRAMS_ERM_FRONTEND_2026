import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Calendar,
  Package,
  Gift,
  ShoppingCart,
  ShieldCheck,
  Warehouse,
  FileWarning,
} from 'lucide-react';
import { adminAPI } from '../api';
import { getApiErrorMessage } from '../utils/apiError';
import PageHeader from './ui/PageHeader';
import StatCard from './ui/StatCard';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { DashboardSkeleton } from './ui/LoadingState';
import { Table, THead, Th, Td, Tr } from './ui/Table';
import EmptyState from './ui/EmptyState';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [events, setEvents] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [statsRes, eventsRes, assocRes, procRes, itemsRes] = await Promise.allSettled([
          adminAPI.getStats(),
          adminAPI.getEvents(),
          adminAPI.getAssociations(),
          adminAPI.getProcurements(),
          adminAPI.getItems(),
        ]);

        const statsData = statsRes.status === 'fulfilled' ? statsRes.value.data?.data || {} : {};
        const eventsList =
          eventsRes.status === 'fulfilled'
            ? eventsRes.value.data?.data || eventsRes.value.data?.events || []
            : [];
        const assocList = assocRes.status === 'fulfilled' ? assocRes.value.data?.data || [] : [];
        const procItems =
          procRes.status === 'fulfilled' ? procRes.value.data?.data?.items || [] : [];
        const itemsList = itemsRes.status === 'fulfilled' ? itemsRes.value.data?.data || [] : [];
        const stockSum = itemsList.reduce((acc, item) => acc + (item.available_quantity || 0), 0);
        const submitted = eventsList.filter((e) =>
          ['submitted', 'approved', 'under_review'].includes(String(e.status || '').toLowerCase())
        ).length;
        const pending = eventsList.filter((e) =>
          ['draft', 'pending'].includes(String(e.status || '').toLowerCase())
        ).length;

        setEvents(eventsList);
        setItems(itemsList);
        setStats({
          totalClubs: statsData.totalClubs || assocList.length || 0,
          totalEvents: statsData.totalEvents || eventsList.length || 0,
          submittedEvents: statsData.submittedEvents || submitted,
          pendingSubmissions: statsData.pendingSubmissions ?? pending,
          pendingEditRequests: statsData.pendingEditRequests || 0,
          totalItems: statsData.totalItems || itemsList.length || 0,
          totalAvailableStock: stockSum,
          totalGrants: statsData.totalGrants || 0,
          procurementCount: procItems.length,
        });
      } catch (err) {
        setError(getApiErrorMessage(err, 'Unable to load dashboard. Please try again.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div>
      <PageHeader
        title="ADMIN CONTROL CENTER"
        subtitle="System overview, ERM proposals, equipment stock, and allocation controls"
        actions={
          <Button onClick={() => navigate('/grant-allocation')}>+ GRANT ALLOCATION</Button>
        }
      />

      {error && <p className="mb-4 text-[13px] font-bold text-[#FF4D67] border border-[#FF4D67]/40 bg-[#050505] p-3">{error}</p>}

      {/* System Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="CLUBS" value={stats.totalClubs} subtext="Registered Clubs" icon={Building2} onClick={() => navigate('/associations')} />
        <StatCard title="TOTAL EVENTS" value={stats.totalEvents} subtext="Submitted ERM Proposals" icon={Calendar} onClick={() => navigate('/events')} />
        <StatCard title="SUBMITTED ERM" value={stats.submittedEvents} subtext="Awaiting or Under Review" icon={Calendar} onClick={() => navigate('/events')} />
        <StatCard title="PENDING DRAFTS" value={stats.pendingSubmissions} subtext="Draft Submissions" icon={FileWarning} />
        <StatCard title="MASTER ITEMS" value={stats.totalItems} subtext="SU Catalog Entries" icon={Package} onClick={() => navigate('/items')} />
        <StatCard title="AVAILABLE STOCK" value={stats.totalAvailableStock} subtext="SU Equipment Units" icon={Warehouse} onClick={() => navigate('/inventory')} />
        <StatCard title="ACTIVE GRANTS" value={stats.totalGrants} subtext="Granted Allocations" icon={Gift} onClick={() => navigate('/grant-history')} />
        <StatCard title="SHORTAGES" value={stats.procurementCount} subtext="Procurement Requisitions" icon={ShoppingCart} onClick={() => navigate('/procurement')} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
        {/* Recent Events Table */}
        <Card className="xl:col-span-2 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#252525] bg-[#000000] flex items-center justify-between">
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-[#FFFFFF]">RECENT SUBMITTED EVENTS</h2>
            <Button variant="ghost" className="text-[11px]" onClick={() => navigate('/events')}>
              VIEW ALL
            </Button>
          </div>
          {events.length === 0 ? (
            <EmptyState title="NO EVENTS" message="Submitted ERM forms will appear here." />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>EVENT</Th>
                  <Th>ASSOCIATION</Th>
                  <Th>STATUS</Th>
                  <Th numeric>ITEMS</Th>
                </tr>
              </THead>
              <tbody>
                {events.slice(0, 8).map((ev) => (
                  <Tr key={ev._id || ev.id} onClick={() => navigate(`/events/${ev._id || ev.id}`)}>
                    <Td className="text-[#FFFFFF] font-bold">{ev.name || ev.event_name || 'UNTITLED'}</Td>
                    <Td>{ev.club_name || '—'}</Td>
                    <Td>
                      <Badge status={ev.status} />
                    </Td>
                    <Td numeric>{Array.isArray(ev.items) ? ev.items.length : 0}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        {/* Inventory Snapshot */}
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-[#252525] bg-[#000000] flex items-center justify-between">
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-[#FFFFFF]">INVENTORY SNAPSHOT</h2>
            <Button variant="ghost" className="text-[11px]" onClick={() => navigate('/inventory')}>
              OPEN
            </Button>
          </div>
          {items.length === 0 ? (
            <EmptyState title="NO INVENTORY" message="Master items will appear here." />
          ) : (
            <div className="divide-y divide-[#252525]">
              {items.slice(0, 8).map((item) => (
                <div key={item._id} className="px-4 py-3 flex justify-between text-[13px] bg-[#000000] hover:bg-[#080808]">
                  <span className="text-[#FFFFFF] font-bold">{item.item_name}</span>
                  <span className="font-mono text-[#00AEEF] font-bold">{item.available_quantity ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

