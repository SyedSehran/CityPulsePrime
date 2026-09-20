import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Send, ThumbsUp, ThumbsDown, CheckCircle, Layers, Sparkles } from 'lucide-react';
import { PriorityBreakdownCard } from '../components/PriorityBreakdownCard';

export const CitizenDashboardPage: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(28.6139);
  const [longitude, setLongitude] = useState(77.2090);
  const [submitting, setSubmitting] = useState(false);
  const [triageMsg, setTriageMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchIncidents();
    // Get browser location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
      }, () => {});
    }
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/v1/complaints/incidents');
      const data = await res.json();
      setIncidents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload a photo of the civic issue.");
      return;
    }

    setSubmitting(true);
    setTriageMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());
    formData.append('description', description);
    formData.append('address', address);

    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/complaints/report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setTriageMsg(data.message);
        setFile(null);
        setPreview(null);
        setDescription('');
        fetchIncidents();
      } else {
        alert(data.detail || "Report submission failed.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProximityVote = async (incidentId: string, isFixed: boolean) => {
    try {
      const formData = new FormData();
      formData.append('is_fixed', isFixed.toString());
      formData.append('citizen_lat', latitude.toString());
      formData.append('citizen_lng', longitude.toString());

      const res = await fetch(`/api/v1/complaints/incidents/${incidentId}/vote-proximity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchIncidents();
      } else {
        alert(data.detail || "Vote recording failed.");
      }
    } catch (err) {
      alert("Failed to submit vote.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Report Issue Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-amber-200/80 bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                <Camera className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900 font-heading">Report Civic Issue</h2>
                <p className="text-xs text-stone-500">Spatial AI Deduplication (50m radius auto-merge)</p>
              </div>
            </div>

            {triageMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 mb-4 flex items-center gap-2 font-medium">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{triageMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReport} className="space-y-4">
              {/* Image Upload Box */}
              <div className="aspect-video bg-stone-50 rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-50/30 transition-all flex flex-col items-center justify-center relative overflow-hidden">
                {preview ? (
                  <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-center">
                    <div className="p-2.5 bg-white rounded-full shadow-sm border border-amber-200 mb-2">
                      <Camera className="w-6 h-6 text-amber-600" />
                    </div>
                    <span className="text-xs font-bold text-stone-800">Upload Issue Photograph</span>
                    <span className="text-[10px] text-stone-500 mt-0.5">JPEG, PNG or WEBP</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* Location Input */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5 font-heading">
                  Street Address or Landmark
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Connaught Place, Block B, New Delhi"
                    className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 shadow-sm"
                    required
                  />
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/80">
                  <span className="text-stone-500 block text-[10px] font-medium">GPS Latitude</span>
                  <span className="font-mono text-amber-800 font-bold">{latitude.toFixed(6)}</span>
                </div>
                <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/80">
                  <span className="text-stone-500 block text-[10px] font-medium">GPS Longitude</span>
                  <span className="font-mono text-amber-800 font-bold">{longitude.toFixed(6)}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5 font-heading">
                  Issue Details / Context
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe severity, hazards, or structural damage..."
                  className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 h-20 shadow-sm"
                />
              </div>

              <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-2.5">
                <Send className="w-4 h-4" /> {submitting ? "Processing Triage & Spatial Merge..." : "Submit Civic Complaint"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Community Incidents Feed */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2 font-heading">
                  <Layers className="w-5 h-5 text-amber-600" /> Active Community Incident Clusters
                </h2>
                <p className="text-xs text-stone-500">Proximity-Weighted Voting (&lt;100m = 1.0x, &lt;1km = 0.5x, &gt;1km = 0.1x)</p>
              </div>
              <a href="/public" className="btn-secondary text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> View Public Map
              </a>
            </div>

            {loading ? (
              <div className="text-center py-12 text-stone-400 text-sm font-medium">Loading incident feed...</div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-sm font-medium">No active incidents reported yet.</div>
            ) : (
              <div className="space-y-4">
                {incidents.map((inc) => (
                  <div key={inc.id} className="bg-white p-5 rounded-xl border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                      <h3 className="font-bold text-base text-stone-900 font-heading">{inc.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="priority-badge priority-high">P = {inc.priority_score} / 100</span>
                        {inc.is_disputed && (
                          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
                            FLAGGED DISPUTED
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-stone-600 mb-3 flex flex-wrap gap-4">
                      <span>Status: <strong className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{inc.status}</strong></span>
                      <span>Address: <strong className="text-stone-800">{inc.address}</strong></span>
                      <span>Total Reports: <strong className="text-amber-800 font-semibold">{inc.total_reports} Verified</strong></span>
                    </div>

                    {/* Formula Breakdown Card (White & Yellow/Amber Scheme) */}
                    <PriorityBreakdownCard score={inc.priority_score} breakdown={inc.priority_breakdown} isOverdueBoosted={inc.is_sla_overdue} />

                    {/* Resolution Proof & Voting Section */}
                    {inc.status === 'RESOLVED_PENDING_VERIFICATION' && (
                      <div className="mt-4 p-3.5 bg-amber-50/40 rounded-xl border border-amber-200 space-y-3">
                        <div className="text-xs font-semibold text-amber-900 flex items-center justify-between">
                          <span>Municipal Repair Proof Uploaded</span>
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] font-bold">Vote Verification Required</span>
                        </div>
                        {inc.resolution_image_url && (
                          <div className="aspect-video max-h-48 rounded-lg overflow-hidden border border-stone-200 shadow-sm">
                            <img src={inc.resolution_image_url} alt="Resolution Proof" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-3 pt-2">
                          <span className="text-xs text-stone-600 font-medium">Confirm Repair Quality:</span>
                          <button onClick={() => handleProximityVote(inc.id, true)} className="btn-secondary text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                            <ThumbsUp className="w-4 h-4 text-emerald-600" /> YES (Fixed)
                          </button>
                          <button onClick={() => handleProximityVote(inc.id, false)} className="btn-secondary text-xs text-rose-700 border-rose-300 hover:bg-rose-50">
                            <ThumbsDown className="w-4 h-4 text-rose-600" /> NO (Dispute)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
