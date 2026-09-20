import React, { useState, useEffect } from 'react';
import { Shield, Truck, FileText, AlertTriangle, Sparkles } from 'lucide-react';
import { PriorityBreakdownCard } from '../components/PriorityBreakdownCard';
import { RouteOptimizerModal } from '../components/RouteOptimizerModal';
import { BeforeAfterAuditorModal } from '../components/BeforeAfterAuditorModal';

export const GovDashboardPage: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [isVrpOpen, setIsVrpOpen] = useState(false);
  const [selectedIncidentForAudit, setSelectedIncidentForAudit] = useState<any | null>(null);

  useEffect(() => {
    fetchIncidents();
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

  const handleDownloadRfp = (incidentId: string) => {
    window.open(`/api/v1/complaints/incidents/${incidentId}/download-rfp`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Executive Command Header */}
        <div className="glass-card p-6 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 via-white to-orange-50/60 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-700 font-extrabold text-xs uppercase tracking-widest mb-1.5 font-heading">
                <Shield className="w-4 h-4 text-amber-600" /> Municipal Command & Dispatch Hub
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 font-heading">
                CityPulse Prime <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Executive Operations</span>
              </h1>
              <p className="text-sm text-stone-600 mt-1">
                Algorithmic Priority Triage, CV Before-vs-After Audit Control, VRP Crew Dispatch, & Agentic Contractor RFPs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsVrpOpen(true)} className="btn-primary text-xs">
                <Truck className="w-4 h-4" /> Launch Crew VRP Router
              </button>
              <a href="/public" className="btn-secondary text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Public Analytics
              </a>
            </div>
          </div>
        </div>

        {/* Incident Command Center */}
        <div className="glass-card p-6 rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2 font-heading">
                <AlertTriangle className="w-5 h-5 text-amber-600" /> Active Incident Dispatch Queue
              </h2>
              <p className="text-xs text-stone-500">Ranked strictly by Priority P = (Severity × 0.4) + (Cluster Size × 0.3) + (SLA Risk × 0.2) + (Ward Risk × 0.1)</p>
            </div>
            <button onClick={fetchIncidents} className="btn-secondary text-xs">Refresh Feed</button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-stone-400 text-sm font-medium">Loading operations queue...</div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm font-medium">No active tickets queued for dispatch.</div>
          ) : (
            <div className="space-y-4">
              {incidents.map((inc) => (
                <div key={inc.id} className="bg-white p-5 rounded-xl border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-base text-stone-900 font-heading">{inc.title}</h3>
                      {inc.is_sla_overdue && (
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
                          SLA OVERDUE (+25% BOOST)
                        </span>
                      )}
                    </div>
                    <span className="priority-badge priority-high">P = {inc.priority_score} / 100</span>
                  </div>

                  <div className="text-xs text-stone-600 mb-3 flex flex-wrap gap-4">
                    <span>Category: <strong className="text-stone-800">{inc.category}</strong></span>
                    <span>Address: <strong className="text-stone-800">{inc.address}</strong></span>
                    <span>Reports: <strong className="text-amber-800 font-semibold">{inc.total_reports} Verified</strong></span>
                    <span>Status: <strong className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{inc.status}</strong></span>
                  </div>

                  {/* Formula Breakdown Component (White & Yellow/Amber Scheme) */}
                  <PriorityBreakdownCard score={inc.priority_score} breakdown={inc.priority_breakdown} isOverdueBoosted={inc.is_sla_overdue} />

                  {/* Operational Controls Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-stone-100">
                    <div className="text-xs text-stone-500">
                      Ref ID: <span className="font-mono text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded font-semibold">{inc.id}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Agentic RFP Generator Downloader */}
                      <button onClick={() => handleDownloadRfp(inc.id)} className="btn-secondary text-xs text-amber-800 border-amber-200 hover:bg-amber-50">
                        <FileText className="w-4 h-4 text-amber-600" /> Download Agentic PDF RFP
                      </button>

                      {/* CV Auditor Resolution Trigger */}
                      {inc.status !== 'CLOSED_VERIFIED' && (
                        <button
                          onClick={() => setSelectedIncidentForAudit(inc)}
                          className="btn-primary text-xs"
                        >
                          <Sparkles className="w-4 h-4" /> Run CV Audit & Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      <RouteOptimizerModal isOpen={isVrpOpen} onClose={() => setIsVrpOpen(false)} />
      <BeforeAfterAuditorModal
        isOpen={!!selectedIncidentForAudit}
        onClose={() => setSelectedIncidentForAudit(null)}
        incident={selectedIncidentForAudit}
        onSuccess={fetchIncidents}
      />
    </div>
  );
};
