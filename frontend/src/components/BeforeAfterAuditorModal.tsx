import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, Upload, Sparkles } from 'lucide-react';

interface BeforeAfterAuditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: any;
  onSuccess: () => void;
}

export const BeforeAfterAuditorModal: React.FC<BeforeAfterAuditorModalProps> = ({
  isOpen,
  onClose,
  incident,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !incident) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setAuditResult(null);
      setErrorMsg(null);
    }
  };

  const handleAuditAndSubmit = async () => {
    if (!file) {
      setErrorMsg("Please upload a post-repair 'After' photograph.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('resolution_notes', notes);

    try {
      const res = await fetch(`/api/v1/complaints/incidents/${incident.id}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        const detail = data.detail;
        if (typeof detail === 'object' && detail.message) {
          setErrorMsg(`CV AUDIT REJECTED: ${detail.message}`);
        } else {
          setErrorMsg(typeof detail === 'string' ? detail : "CV Audit failed.");
        }
      } else {
        setAuditResult(data.cv_audit);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg("Network error or backend unreachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4">
      <div className="glass-card max-w-4xl w-full p-6 relative rounded-2xl border border-amber-200 bg-white overflow-hidden max-h-[90vh] overflow-y-auto shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-800 p-1">
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
            <Sparkles className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 font-heading">CV "Before vs. After" Resolution Auditor</h2>
            <p className="text-xs text-stone-500">Automated structural computer vision audit preventing fake ticket closures</p>
          </div>
        </div>

        {/* Split Image Canvas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Before Photo */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-800 mb-2">
              <span>BEFORE: Reported Problem</span>
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">Original Ticket</span>
            </div>
            <div className="aspect-video bg-stone-100 rounded-lg overflow-hidden flex items-center justify-center border border-stone-200">
              <img
                src={incident.primary_image_url || "/static/test_images/pothole_test.jpg"}
                alt="Before"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80";
                }}
              />
            </div>
          </div>

          {/* After Photo Upload */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 mb-2">
              <span>AFTER: Upload Proof of Repair</span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Worker Verification</span>
            </div>
            <div className="aspect-video bg-white rounded-lg overflow-hidden relative flex flex-col items-center justify-center border-2 border-dashed border-amber-300 hover:border-amber-500 transition-all cursor-pointer">
              {preview ? (
                <img src={preview} alt="After Preview" className="w-full h-full object-cover" />
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-center">
                  <Upload className="w-8 h-8 text-amber-600 mb-2" />
                  <span className="text-xs text-stone-800 font-bold">Click to select 'After' photo</span>
                  <span className="text-[10px] text-stone-500 mt-0.5">High resolution proof photo required</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Audit Status Display */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 mb-4 font-medium">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {auditResult && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 mb-4 font-medium">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold">CV AUDIT PASSED (Structural Shift Verified)</div>
              <div>{auditResult.details}</div>
            </div>
          </div>
        )}

        {/* Resolution Notes input */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-stone-700 mb-1.5 font-heading">
            Work Performed & Material Specs
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Asphalting completed, drainage pipe unblocked, site cleaned..."
            className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 shadow-sm"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
          <button onClick={onClose} className="btn-secondary text-xs">Cancel</button>
          <button onClick={handleAuditAndSubmit} disabled={loading} className="btn-primary text-xs">
            {loading ? "Running Computer Vision Audit..." : "Run CV Audit & Resolve Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
};
