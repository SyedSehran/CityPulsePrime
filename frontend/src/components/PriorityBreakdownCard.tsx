import React from 'react';
import { Shield, AlertTriangle, Users, Clock, MapPin } from 'lucide-react';

interface PriorityBreakdownCardProps {
  score: number;
  breakdown?: {
    severity_weighted_pts?: number;
    severity_norm?: number;
    severity_weight?: number;

    cluster_size_weighted_pts?: number;
    cluster_size_norm?: number;
    cluster_size_weight?: number;
    total_reports?: number;

    sla_risk_weighted_pts?: number;
    sla_risk_norm?: number;
    sla_risk_weight?: number;
    hours_active?: number;

    ward_risk_weighted_pts?: number;
    ward_risk_norm?: number;
    ward_risk_weight?: number;
    ward_risk_baseline?: number;
  };
  isOverdueBoosted?: boolean;
}

export const PriorityBreakdownCard: React.FC<PriorityBreakdownCardProps> = ({ score, breakdown, isOverdueBoosted }) => {
  const b = breakdown || {
    severity_weighted_pts: round(score * 0.4, 1),
    cluster_size_weighted_pts: round(score * 0.3, 1),
    sla_risk_weighted_pts: round(score * 0.2, 1),
    ward_risk_weighted_pts: round(score * 0.1, 1),
  };

  function round(val: number, decimals: number) {
    return Number(val || 0).toFixed(decimals);
  }

  return (
    <div className="glass-card p-4 my-3 border border-blue-500/20 bg-slate-900/60 rounded-xl">
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-sm tracking-wide text-slate-100">
            Algorithmic Urgency Index P
          </span>
        </div>
        <div className={`priority-badge ${score >= 70 ? 'priority-high' : score >= 40 ? 'priority-medium' : 'priority-normal'}`}>
          P = {score} / 100 {isOverdueBoosted && <span className="text-xs text-red-400 font-extrabold">(+25% SLA OVERDUE)</span>}
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-3 font-mono">
        Formula: <span className="text-blue-300">P = (Severity × 0.4) + (Cluster Size × 0.3) + (SLA Risk × 0.2) + (Ward Risk × 0.1)</span>
      </p>

      {/* Grid of 4 formula components */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {/* Severity */}
        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-rose-500/20">
          <div className="flex items-center justify-between text-rose-400 font-semibold mb-1">
            <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Severity</span>
            <span>40% Weight</span>
          </div>
          <div className="text-base font-extrabold text-white">+{b.severity_weighted_pts || 0} pts</div>
          <div className="text-[10px] text-slate-400">Norm: {b.severity_norm || 0}/100</div>
        </div>

        {/* Cluster Size */}
        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-purple-500/20">
          <div className="flex items-center justify-between text-purple-400 font-semibold mb-1">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Cluster Size</span>
            <span>30% Weight</span>
          </div>
          <div className="text-base font-extrabold text-white">+{b.cluster_size_weighted_pts || 0} pts</div>
          <div className="text-[10px] text-slate-400">Reports: {b.total_reports || 1}</div>
        </div>

        {/* SLA Risk */}
        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-amber-500/20">
          <div className="flex items-center justify-between text-amber-400 font-semibold mb-1">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> SLA Risk</span>
            <span>20% Weight</span>
          </div>
          <div className="text-base font-extrabold text-white">+{b.sla_risk_weighted_pts || 0} pts</div>
          <div className="text-[10px] text-slate-400">Active: {b.hours_active || 0}h</div>
        </div>

        {/* Ward Risk */}
        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-cyan-500/20">
          <div className="flex items-center justify-between text-cyan-400 font-semibold mb-1">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Ward Risk</span>
            <span>10% Weight</span>
          </div>
          <div className="text-base font-extrabold text-white">+{b.ward_risk_weighted_pts || 0} pts</div>
          <div className="text-[10px] text-slate-400">Base: {b.ward_risk_baseline || 50}</div>
        </div>
      </div>
    </div>
  );
};
