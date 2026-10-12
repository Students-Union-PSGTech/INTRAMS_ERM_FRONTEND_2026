import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../../context/ToastContext';

export default function PdfPreviewModal({ open, url, filename, onClose }) {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!open) {
      setPage(1);
      setZoom(100);
      setRotation(0);
    }
  }, [open]);

  const download = async () => {
    try {
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      showToast('Unable to download preview.', 'error');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to download.'), 'error');
    }
  };

  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const nextPage = () => setPage((p) => p + 1);
  const zoomIn = () => setZoom((z) => Math.min(300, z + 25));
  const zoomOut = () => setZoom((z) => Math.max(50, z - 25));
  const rotate = () => setRotation((r) => (r + 90) % 360);

  const timestamp = new Date().toLocaleString('en-GB');

  return (
    <Modal open={open} onClose={onClose} title={`${filename || 'Document Preview'} — ${timestamp}`} wide>
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-[#09090b] p-3 border border-[#27272a] rounded-lg">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={prevPage}>Prev</Button>
          <div className="px-2 text-[12px] font-bold text-[#A0A0A0]">Page</div>
          <div className="font-bold text-[#FFFFFF] text-[13px]">{page}</div>
          <Button variant="secondary" onClick={nextPage}>Next</Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={zoomOut}>-</Button>
          <div className="px-2 text-[12px] font-bold text-[#A0A0A0]">{zoom}%</div>
          <Button variant="secondary" onClick={zoomIn}>+</Button>
          <Button variant="secondary" onClick={rotate}>Rotate</Button>
          <Button onClick={download}>Download PDF</Button>
        </div>
      </div>

      {/* PDF View Container with scroll enabled */}
      {url ? (
        <div className="relative h-[70vh] min-h-[480px] w-full border border-[#27272a] bg-[#09090b] rounded-lg overflow-auto">
          <iframe
            title="PDF Preview"
            src={`${url}#page=${page}&zoom=${zoom}`}
            className="w-full h-full bg-white border-0 block"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        </div>
      ) : (
        <div className="p-12 text-center text-[#A0A0A0] font-bold uppercase tracking-wider">Loading preview…</div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}
