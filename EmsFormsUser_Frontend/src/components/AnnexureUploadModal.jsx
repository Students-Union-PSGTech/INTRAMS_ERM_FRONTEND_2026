import React, { useState, useEffect } from 'react';
import { resolveAssetUrl, userAPI } from '../api/api';
import { UploadCloud, FileText, Trash2, Loader2, AlertCircle, X, Download } from 'lucide-react';

function AnnexureUploadModal({ eventId, eventName, onClose }) {
  const [annexures, setAnnexures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchAnnexures();
  }, [eventId]);

  const fetchAnnexures = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userAPI.getAnnexures(eventId);
      setAnnexures(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch annexures');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit');
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await userAPI.uploadAnnexure(eventId, formData);
      setFile(null);
      fetchAnnexures();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload file attachment');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (annexureId) => {
    if (!window.confirm('Are you sure you want to delete this annexure?')) return;
    setDeletingId(annexureId);
    try {
      await userAPI.deleteAnnexure(annexureId);
      fetchAnnexures();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete attachment');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg">
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-[2rem] p-8 max-w-xl w-full shadow-[0_0_40px_rgba(14,165,233,0.15)] space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500"></div>
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
            <FileText className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white font-heading">Annexure Attachments</h2>
            <p className="text-slate-400 text-sm mt-1">Manage documents for <span className="font-semibold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">{eventName}</span></p>
          </div>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="relative group overflow-hidden border-2 border-dashed border-slate-700 hover:border-sky-500/50 rounded-2xl p-6 text-center transition-all bg-slate-950/40 hover:bg-slate-900/60">
          <UploadCloud className="w-12 h-12 mx-auto text-sky-400/80 mb-3 group-hover:scale-110 group-hover:text-sky-400 transition-transform" />
          <p className="text-base font-bold text-slate-200">Upload Supporting Document</p>
          <p className="text-xs text-slate-400 mb-4 font-medium">PDF, DOC, DOCX, PNG, JPG (Max 10MB)</p>

          <input
            type="file"
            id="annexure-file-input"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <label
              htmlFor="annexure-file-input"
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 text-sm font-bold rounded-xl cursor-pointer transition-all border border-slate-600 hover:border-sky-500/50"
            >
              {file ? file.name : 'Browse Files'}
            </label>

            {file && (
              <button
                type="submit"
                disabled={uploading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50 transform hover:scale-[1.02]"
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upload Attachment'}
              </button>
            )}
          </div>
        </form>

        {error && (
          <div className="bg-rose-950/50 border border-rose-800 text-rose-300 text-sm rounded-xl p-4 flex items-center gap-3 shadow-lg shadow-rose-900/20">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* List of Attachments */}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md pb-2 pt-1 z-10">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Uploaded Documents ({annexures.length})</h3>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-sky-500">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-400">Fetching documents...</p>
            </div>
          ) : annexures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 bg-slate-950/50 rounded-2xl border border-slate-800">
              <FileText className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-400">No attachments uploaded yet.</p>
            </div>
          ) : (
            annexures.map((item) => (
              <div key={item._id} className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800 rounded-xl hover:border-sky-500/40 hover:bg-slate-900 transition-all shadow-sm group">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-700 group-hover:border-sky-500/50 transition-colors">
                    <FileText className="w-5 h-5 text-sky-400 flex-shrink-0" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">{item.original_name || item.file_name}</p>
                    <p className="text-xs font-medium text-slate-500">{(item.file_size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={resolveAssetUrl(item.file_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-800 hover:bg-sky-500 hover:text-white text-sky-400 rounded-lg transition-all"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(item._id)}
                    disabled={deletingId === item._id}
                    className="p-2 bg-rose-950/60 hover:bg-rose-600 hover:text-white text-rose-400 rounded-lg transition-all disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === item._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AnnexureUploadModal;
