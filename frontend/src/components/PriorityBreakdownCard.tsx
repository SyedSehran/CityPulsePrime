import React from 'react';
import { Shield, AlertTriangle, Users, Clock, MapPin } from 'lucide-react';

interface PriorityBreakdownData {
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
}

interface PriorityBreakdownCardProps {
  score: number;
  breakdown?: PriorityBreakdownData;
  isOverdueBoosted?: boolean;
}

export const PriorityBreakdownCard: React.FC<PriorityBreakdownCardProps> = ({ score, breakdown, isOverdueBoosted }) => {
  const b: PriorityBreakdownData = breakdown || {
    severity_weighted_pts: Number((score * 0.4).toFixed(1)),
    cluster_size_weighted_pts: Number((score * 0.3).toFixed(1)),
    sla_risk_weighted_pts: Number((score * 0.2).toFixed(1)),
    ward_risk_weighted_pts: Number((score * 0.1).toFixed(1)),
  };

  return (
    <div className="glass-card p-4 my-3 border border-stone-200 bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-stone-200 pb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-600" />
          <span className="font-bold text-sm tracking-wide text-stone-900">
            Algorithmic Urgency Index P
          </span>
        </div>
        <div className={`priority-badge ${score >= 70 ? 'priority-high' : score >= 40 ? 'priority-medium' : 'priority-normal'}`}>
          P = {score} / 100 {isOverdueBoosted && <span className="text-xs text-red-600 font-extrabold">(+25% SLA OVERDUE)</span>}
        </div>
      </div>

      <p className="text-xs text-stone-500 mb-3 font-mono">
        Formula: <span className="text-orange-700 font-medium">P = (Severity × 0.4) + (Cluster Size × 0.3) + (SLA Risk × 0.2) + (Ward Risk × 0.1)</span>
      </p>

      {/* Grid of 4 formula components */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {/* Severity */}
        <div className="bg-stone-50 p-2.5 rounded-lg border border-red-200">
          <div className="flex items-center justify-between text-red-700 font-semibold mb-1">
            <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Severity</span>
            <span>40% Weight</span>
          </div>
          <div className="text-base font-extrabold text-stone-900">+{b.severity_weighted_pts ?? 0} pts</div>
          <div className="text-[10px] text-stone-500">Norm: {b.severity_norm ?? 0}/100</div>
        </div>

        {/* Cluster Size */}
        <div className="bg-stone-50 p-2.5 rounded-lg border border-amber-200">
          <div className="flex items-center justify-between text-amber-700 font-semibold mb-1">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Cluster Size</span>
            <span>30% Weight</span>
          </div>
          <div className="text-base font-extrabold text-stone-900">+{b.cluster_size_weighted_pts ?? 0} pts</div>
          <div className="text-[10px] text-stone-500">Reports: {b.total_reports ?? 1}</div>
        </div>

        {/* SLA Risk */}
        <div className="bg-stone-50 p-2.5 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between text-orange-700 font-semibold mb-1">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> SLA Risk</span>
            <span>20% Weight</span>
          </div>
          <div className="text-base font-extrabold text-stone-900">+{b.sla_risk_weighted_pts ?? 0} pts</div>
          <div className="text-[10px] text-stone-500">Active: {b.hours_active ?? 0}h</div>
        </div>

        {/* Ward Risk */}
        <div className="bg-stone-50 p-2.5 rounded-lg border border-sky-200">
          <div className="flex items-center justify-between text-sky-700 font-semibold mb-1">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Ward Risk</span>
            <span>10% Weight</span>
          </div>
          <div className="text-base font-extrabold text-stone-900">+{b.ward_risk_weighted_pts ?? 0} pts</div>
          <div className="text-[10px] text-stone-500">Base: {b.ward_risk_baseline ?? 50}</div>
        </div>
      </div>
    </div>
  );
};
