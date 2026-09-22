import React, { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { adminAPI } from '../api';
import { getApiErrorMessage } from '../utils/apiError';
import { useToast } from '../context/ToastContext';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import Badge from './ui/Badge';
import EmptyState from './ui/EmptyState';
import { Table, THead, Th, Td, Tr } from './ui/Table';
import { TableSkeleton } from './ui/LoadingState';

export default function GrantLogs() {
  const { showToast } = useToast();
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDir, setSortDir] = useState('desc');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminAPI.getAllGrants();
      setGrants(res.data?.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load grant history.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const revert = async (id) => {
    if (!window.confirm('Reverting this allocation will return the allocated quantity to SU inventory.')) return;
    try {
      await adminAPI.revertGrant(id);
      showToast('Grant reverted. Inventory updated.', 'success');
      await fetchLogs();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Unable to revert grant.'), 'error');
    }
  };

  const filtered = grants
    .filter((g) => {
      const term = searchTerm.toLowerCase();
      return (
        (g.item_name || '').toLowerCase().includes(term) ||
        (g.granted_to || '').toLowerCase().includes(term) ||
        String(g.granted_by?.username || g.granted_by || '').toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      const da = new Date(a.createdAt || a.created_at || a.granted_at || 0).getTime();
      const db = new Date(b.createdAt || b.created_at || b.granted_at || 0).getTime();
      return sortDir === 'desc' ? db - da : da - db;
    });

  return (
    <div>
      <PageHeader
        title="GRANT HISTORY LOGS"
        subtitle="Complete log of allocated equipment grants with revert capabilities"
        actions={
          <>
            <Button variant="secondary" onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}>
              SORT {sortDir === 'desc' ? 'NEWEST' : 'OLDEST'}
            </Button>
            <Button variant="secondary" onClick={fetchLogs}>
              REFRESH
            </Button>
          </>
        }
      />
      <div className="max-w-md mb-5">
        <Input placeholder="SEARCH ITEM, ASSOCIATION OR ADMIN..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      {loading && <TableSkeleton />}
      {error && <p className="text-[#FF4D67] text-[13px] font-bold border border-[#FF4D67]/40 bg-[#050505] p-3 mb-4">{error}</p>}
      {!loading && !error && (
        <Card className="overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={History} title="NO GRANT RECORDS FOUND" message="Allocations will appear here after they are confirmed." />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>DATE & TIME</Th>
                  <Th>ITEM NAME</Th>
                  <Th>ASSOCIATION / EVENT</Th>
                  <Th numeric>ALLOCATED QTY</Th>
                  <Th>ADMIN</Th>
                  <Th>STATUS</Th>
                  <Th></Th>
                </tr>
              </THead>
              <tbody>
                {filtered.map((g) => (
                  <Tr key={g._id}>
                    <Td>{new Date(g.createdAt || g.created_at || g.granted_at).toLocaleString('en-IN')}</Td>
                    <Td className="text-[#FFFFFF] font-bold">{g.item_name}</Td>
                    <Td>{g.granted_to || `${g.event_name || ''} ${g.event_id ? `(${g.event_id})` : ''}`.trim() || '—'}</Td>
                    <Td numeric className="text-[#00AEEF] font-bold">{g.quantity ?? g.allocated_quantity ?? 0}</Td>
                    <Td>{g.granted_by?.username || g.granted_by || 'Admin'}</Td>
                    <Td>
                      <Badge status={g.grant_status || 'active'} />
                    </Td>
                    <Td>
                      {g.grant_status !== 'returned' && (
                        <div className="flex justify-end">
                          <Button variant="danger" onClick={() => revert(g._id)}>
                            REVERT
                          </Button>
                        </div>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}

