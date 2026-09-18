import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Send, Shield, AlertTriangle, ThumbsUp, ThumbsDown, CheckCircle, Navigation, Layers } from 'lucide-react';
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
    <div className="min-h-screen bg-[#090d16] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Report Issue Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-blue-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/40">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Report Civic Issue</h2>
                <p className="text-xs text-slate-400">Spatial AI Deduplication (50m radius auto-merge)</p>
              </div>
            </div>

            {triageMsg && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>{triageMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReport} className="space-y-4">
              {/* Image Upload Box */}
              <div className="aspect-video bg-slate-900 rounded-xl border border-dashed border-slate-700 hover:border-blue-500 transition-all flex flex-col items-center justify-center relative overflow-hidden">
                {preview ? (
                  <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-center">
                    <Camera className="w-8 h-8 text-blue-400 mb-2" />
                    <span className="text-xs font-semibold text-slate-200">Upload Issue Photograph</span>
                    <span className="text-[10px] text-slate-400 mt-1">JPEG, PNG or WEBP</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* Location Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address or Landmark</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Connaught Place, Block B, New Delhi"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">GPS Latitude</span>
                  <span className="font-mono text-blue-400">{latitude.toFixed(6)}</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">GPS Longitude</span>
                  <span className="font-mono text-blue-400">{longitude.toFixed(6)}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Details / Context</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe severity, hazards, or structural damage..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 h-20"
                />
              </div>

              <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
                <Send className="w-4 h-4" /> {submitting ? "Processing Triage & Spatial Merge..." : "Submit Civic Complaint"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Community Incidents Feed */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" /> Active Community Incident Clusters
                </h2>
                <p className="text-xs text-slate-400">Proximity-Weighted Voting (&lt;100m = 1.0x, &lt;1km = 0.5x, &gt;1km = 0.1x)</p>
              </div>
              <a href="/public" className="btn-secondary text-xs">View Public Map</a>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 text-sm">Loading incident feed...</div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No active incidents reported yet.</div>
            ) : (
              <div className="space-y-4">
                {incidents.map((inc) => (
                  <div key={inc.id} className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 hover:border-blue-500/30 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                      <h3 className="font-bold text-base text-white">{inc.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="priority-badge priority-high">P = {inc.priority_score} / 100</span>
                        {inc.is_disputed && (
                          <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                            FLAGGED DISPUTED
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 mb-3 flex flex-wrap gap-4">
                      <span>Status: <strong className="text-blue-400">{inc.status}</strong></span>
                      <span>Address: <strong className="text-slate-200">{inc.address}</strong></span>
                      <span>Total Reports: <strong className="text-purple-400">{inc.total_reports} Verified</strong></span>
                    </div>

                    {/* Formula Breakdown Card */}
                    <PriorityBreakdownCard score={inc.priority_score} breakdown={inc.priority_breakdown} isOverdueBoosted={inc.is_sla_overdue} />

                    {/* Resolution Proof & Voting Section */}
                    {inc.status === 'RESOLVED_PENDING_VERIFICATION' && (
                      <div className="mt-4 p-3 bg-slate-800/80 rounded-xl border border-emerald-500/30 space-y-3">
                        <div className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
                          <span>Municipal Repair Proof Uploaded</span>
                          <span>Vote Verification Required</span>
                        </div>
                        {inc.resolution_image_url && (
                          <div className="aspect-video max-h-44 rounded-lg overflow-hidden border border-slate-700">
                            <img src={inc.resolution_image_url} alt="Resolution Proof" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-3 pt-2">
                          <span className="text-xs text-slate-400">Confirm Repair Quality:</span>
                          <button onClick={() => handleProximityVote(inc.id, true)} className="btn-secondary text-xs text-emerald-400 hover:bg-emerald-500/20">
                            <ThumbsUp className="w-4 h-4" /> YES (Fixed)
                          </button>
                          <button onClick={() => handleProximityVote(inc.id, false)} className="btn-secondary text-xs text-rose-400 hover:bg-rose-500/20">
                            <ThumbsDown className="w-4 h-4" /> NO (Dispute)
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
