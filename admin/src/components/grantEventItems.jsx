import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package } from 'lucide-react';
import { adminAPI } from '../api';
import { getApiErrorMessage, INVENTORY_CHANGED_MESSAGE } from '../utils/apiError';
import { getAllocationMetrics, validateAllocation } from '../utils/allocation';
import { handlePdfBlob } from '../utils/pdf';
import { useToast } from '../context/ToastContext';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Modal from './ui/Modal';
import PdfPreviewModal from './ui/PdfPreviewModal';
import EmptyState from './ui/EmptyState';
import { Table, THead, Th, Td, Tr } from './ui/Table';
import { TableSkeleton } from './ui/LoadingState';
import { generateAllocationPdf } from '../utils/generateAllocationPdf';

export default function GrantEventItems() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [eventData, setEventData] = useState(null);
  const [availableItems, setAvailableItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [grantQuantity, setGrantQuantity] = useState('');
  const [grantNotes, setGrantNotes] = useState('');
  const [grantError, setGrantError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [granting, setGranting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewFilename, setPreviewFilename] = useState('');

  const getMaster = (name) =>
    availableItems.find((i) => (i.item_name || '').toLowerCase() === (name || '').toLowerCase());
  const getStock = (name) => getMaster(name)?.available_quantity || 0;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [eventRes, itemsRes] = await Promise.all([adminAPI.getEventQuantityToProvide(id), adminAPI.getItems()]);
      if (eventRes.data?.success) setEventData(eventRes.data.data);
      else setError('Unable to load grant details.');
      setAvailableItems(itemsRes.data?.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load allocation data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const metrics = selectedItem ? getAllocationMetrics(selectedItem, getStock(selectedItem.item_name)) : null;
  const qty = parseInt(grantQuantity, 10);

  const openAllocate = (item) => {
    const m = getAllocationMetrics(item, getStock(item.item_name));
    if (m.maxAllocatable <= 0) {
      showToast(m.availableStock <= 0 ? 'No stock available for this item.' : 'This request is already fully allocated.', 'warning');
      return;
    }
    setSelectedItem(item);
    setGrantQuantity('');
    setGrantNotes('');
    setGrantError('');
    setConfirmOpen(false);
  };

  const goConfirm = (e) => {
    e.preventDefault();
    const m = getAllocationMetrics(selectedItem, getStock(selectedItem.item_name));
    const invalid = validateAllocation(qty, m.remainingRequest, m.availableStock);
    if (invalid) {
      setGrantError(invalid);
      return;
    }
    setGrantError('');
    setConfirmOpen(true);
  };

  const executeGrant = async () => {
    const m = getAllocationMetrics(selectedItem, getStock(selectedItem.item_name));
    const master = getMaster(selectedItem.item_name);
    try {
      setGranting(true);
      await adminAPI.grantItemsToEvent({
        event_id: id,
        submission_id: id,
        item_id: master?._id || selectedItem.item_id,
        quantity: qty,
        granted_to:
          eventData?.eventDetails?.associationName ||
          eventData?.event?.club_name ||
          eventData?.eventDetails?.eventName ||
          'Association',
        notes: grantNotes || 'Admin item allocation',
      });
      showToast(`Allocated ${qty} ${selectedItem.item_name}.`, 'success');
      setSelectedItem(null);
      setConfirmOpen(false);
      await fetchData();
    } catch (err) {
      const mapped = getApiErrorMessage(err, 'Unable to allocate items.');
      const message = mapped === 'INVENTORY_CHANGED' ? INVENTORY_CHANGED_MESSAGE : mapped;
      setGrantError(message);
      showToast(message, 'error');
      setConfirmOpen(false);
      await fetchData();
    } finally {
      setGranting(false);
    }
  };

  const revert = async (grantId) => {
    if (!window.confirm('Reverting this allocation will return the allocated quantity to inventory.')) return;
    try {
      await adminAPI.revertGrant(grantId);
      showToast('Grant reverted. Inventory updated.', 'success');
      const res = await adminAPI.getEventGrantHistory(id);
      setHistory(res.data?.data || []);
      await fetchData();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Unable to revert grant.'), 'error');
    }
  };

  const itemsList = eventData?.items || [];
  const filtered = itemsList.filter((item) => (item.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const eventName = eventData?.eventDetails?.eventName || eventData?.event?.name || 'Event';

  return (
    <div>
      <Button variant="ghost" className="mb-4 px-0 border-none" onClick={() => navigate('/grant-allocation')}>
        ← BACK TO GRANT ALLOCATION
      </Button>
      <PageHeader
        title="GRANT ITEM ALLOCATION"
        subtitle={`${eventName.toUpperCase()} · ${(eventData?.eventDetails?.associationName || eventData?.event?.club_name || '').toUpperCase()}`}
        actions={
          <>
            <Button
              variant="secondary"
              loading={pdfLoading}
              onClick={async () => {
                try {
                  setPdfLoading(true);
                  let res;
                  let docName = `Allocation_${eventName}.pdf`;
                  try {
                    const mappedItems = itemsList.map(it => {
                      const master = getMaster(it.item_name);
                      return {
                        ...it,
                        item_name: it.item_name,
                        requested_quantity: it.quantity || it.requested_quantity || 0,
                        approved_quantity: it.allocated_quantity !== undefined ? it.allocated_quantity : (it.quantity_provided !== undefined ? it.quantity_provided : (it.approved_quantity !== undefined ? it.approved_quantity : 0)),
                        is_returnable: it.is_returnable !== undefined ? it.is_returnable : (master?.is_returnable ?? false)
                      };
                    });
                    res = await generateAllocationPdf({
                      ...(eventData?.event || {}),
                      event_name: eventName,
                      _id: id,
                      club_name: eventData?.eventDetails?.associationName || eventData?.event?.club_name || '',
                      items: mappedItems
                    });
                  } catch (_) {
                    res = await adminAPI.getAllocationPDF(id);
                  }
                  const url = await handlePdfBlob(res, { filename: docName, preview: true });
                  if (url) {
                    setPreviewUrl(url);
                    setPreviewFilename(docName);
                    setPreviewOpen(true);
                  }
                } catch (err) {
                  showToast(getApiErrorMessage(err, 'Unable to generate PDF preview.'), 'error');
                } finally {
                  setPdfLoading(false);
                }
              }}
            >
              PREVIEW PDF
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                setHistoryOpen(true);
                try {
                  const res = await adminAPI.getEventGrantHistory(id);
                  setHistory(res.data?.data || []);
                } catch (err) {
                  showToast(getApiErrorMessage(err, 'Unable to load grant history.'), 'error');
                }
              }}
            >
              GRANT HISTORY
            </Button>
          </>
        }
      />

      {loading && <TableSkeleton />}
      {error && <p className="text-[#FF4D67] text-[13px] mb-4 font-bold border border-[#FF4D67]/40 bg-[#050505] p-3">{error}</p>}

      {!loading && !error && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-[#252525] bg-[#000000] flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <h2 className="font-heading font-bold text-[#FFFFFF] text-sm uppercase tracking-wider">REQUESTED ITEMS DIRECTORY</h2>
            <div className="sm:w-64">
              <Input placeholder="SEARCH ITEMS..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon={Package} title="NO REQUESTED ITEMS" />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>ITEM</Th>
                  <Th numeric>REQUESTED</Th>
                  <Th numeric>PROVIDED</Th>
                  <Th numeric>REMAINING</Th>
                  <Th numeric>SU STOCK</Th>
                  <Th numeric>MAX ALLOCATABLE</Th>
                  <Th></Th>
                </tr>
              </THead>
              <tbody>
                {filtered.map((item) => {
                  const m = getAllocationMetrics(item, getStock(item.item_name));
                  const status =
                    m.remainingRequest === 0 ? 'fully_allocated' : m.alreadyAllocated > 0 ? 'partially_allocated' : 'pending';
                  return (
                    <Tr key={item._id || item.item_name}>
                      <Td className="text-[#FFFFFF] font-bold">{item.item_name}</Td>
                      <Td numeric>{m.requested}</Td>
                      <Td numeric>{m.alreadyAllocated}</Td>
                      <Td numeric>{m.remainingRequest}</Td>
                      <Td numeric>{m.availableStock}</Td>
                      <Td numeric className="text-[#00AEEF] font-bold">{m.maxAllocatable}</Td>
                      <Td>
                        <div className="flex items-center justify-end gap-2">
                          <Badge status={status} />
                          <Button disabled={m.maxAllocatable <= 0} onClick={() => openAllocate(item)}>
                            ALLOCATE
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      <Modal open={Boolean(selectedItem) && !confirmOpen} title="ALLOCATE ITEM" onClose={() => setSelectedItem(null)}>
        {selectedItem && metrics && (
          <form onSubmit={goConfirm} className="space-y-4">
            <p className="text-[14px] font-bold text-[#00AEEF] uppercase">{selectedItem.item_name}</p>
            <div className="grid grid-cols-2 gap-2 text-[13px] bg-[#000000] border border-[#252525] p-3">
              <p className="text-[#A0A0A0]">REQUESTED: <span className="text-[#FFFFFF] font-bold">{metrics.requested}</span></p>
              <p className="text-[#A0A0A0]">ALREADY ALLOCATED: <span className="text-[#FFFFFF] font-bold">{metrics.alreadyAllocated}</span></p>
              <p className="text-[#A0A0A0]">REMAINING REQUEST: <span className="text-[#FFFFFF] font-bold">{metrics.remainingRequest}</span></p>
              <p className="text-[#A0A0A0]">AVAILABLE SU STOCK: <span className="text-[#00AEEF] font-bold">{metrics.availableStock}</span></p>
            </div>
            <Input
              label={`ALLOCATION QUANTITY (MAX ALLOCATABLE: ${metrics.maxAllocatable})`}
              type="number"
              min="1"
              max={metrics.maxAllocatable}
              value={grantQuantity}
              onChange={(e) => setGrantQuantity(e.target.value)}
            />
            <Input label="NOTES / REMARKS" value={grantNotes} onChange={(e) => setGrantNotes(e.target.value)} />
            {grantError && <p className="text-[#FF4D67] text-[13px] font-bold">{grantError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={() => setSelectedItem(null)}>
                CANCEL
              </Button>
              <Button type="submit">CONTINUE</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={confirmOpen}
        title="CONFIRM ITEM ALLOCATION"
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              CANCEL
            </Button>
            <Button loading={granting} onClick={executeGrant}>
              CONFIRM ALLOCATION
            </Button>
          </>
        }
      >
        {selectedItem && metrics && (
          <div className="space-y-3 text-[13px] text-[#E5E5E5]">
            <div className="bg-[#000000] border border-[#252525] p-4 space-y-1.5 font-bold">
              <p>EVENT: <span className="text-[#00AEEF]">{eventName}</span></p>
              <p>ITEM: <span className="text-[#FFFFFF]">{selectedItem.item_name}</span></p>
              <p>REQUESTED: {metrics.requested}</p>
              <p>CURRENT ALLOCATION: {metrics.alreadyAllocated}</p>
              <p>NEW ALLOCATION QUANTITY: <span className="text-[#00D084]">{qty || 0}</span></p>
              <p>REMAINING SU STOCK AFTER ALLOCATION: {Math.max(0, metrics.availableStock - (qty || 0))}</p>
            </div>
            {grantError && <p className="text-[#FF4D67] font-bold">{grantError}</p>}
          </div>
        )}
      </Modal>

      <Modal open={historyOpen} title="EVENT GRANT HISTORY" onClose={() => setHistoryOpen(false)} wide>
        {history.length === 0 ? (
          <EmptyState title="NO GRANTS FOR THIS EVENT" />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>ITEM</Th>
                <Th numeric>QTY</Th>
                <Th>ADMIN</Th>
                <Th>STATUS</Th>
                <Th></Th>
              </tr>
            </THead>
            <tbody>
              {history.map((g) => (
                <Tr key={g._id}>
                  <Td className="text-[#FFFFFF] font-bold">{g.item_name}</Td>
                  <Td numeric>{g.quantity}</Td>
                  <Td>{g.granted_by?.username || g.granted_by || 'Admin'}</Td>
                  <Td>
                    <Badge status={g.grant_status || 'active'} />
                  </Td>
                  <Td>
                    {g.grant_status !== 'returned' && (
                      <Button variant="danger" onClick={() => revert(g._id)}>
                        REVERT
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal>

      <PdfPreviewModal
        open={previewOpen}
        url={previewUrl}
        filename={previewFilename || `Allocation_${eventName}.pdf`}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}

