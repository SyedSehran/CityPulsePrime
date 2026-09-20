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
    <div className="p-4 my-3 border border-amber-200/80 bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-600" />
          <span className="font-bold text-sm tracking-wide text-stone-900">
            Algorithmic Urgency Index P
          </span>
        </div>
        <div className={`priority-badge ${score >= 70 ? 'priority-high' : score >= 40 ? 'priority-medium' : 'priority-normal'}`}>
          P = {score} / 100 {isOverdueBoosted && <span className="text-xs text-rose-600 font-extrabold ml-1">(+25% SLA OVERDUE)</span>}
        </div>
      </div>

      <p className="text-xs text-stone-500 mb-3 font-mono">
        Formula: <span className="text-amber-800 font-semibold">P = (Severity × 0.4) + (Cluster Size × 0.3) + (SLA Risk × 0.2) + (Ward Risk × 0.1)</span>
      </p>

      {/* Grid of 4 formula components - Matching White and Yellow/Amber Scheme */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
        {/* Severity (40% Weight) */}
        <div className="bg-amber-50/40 p-2.5 rounded-lg border border-amber-200/90 hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-amber-800 font-semibold mb-1">
            <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Severity</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">40%</span>
          </div>
          <div className="text-base font-extrabold text-stone-900">+{b.severity_weighted_pts ?? 0} pts</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Norm: {b.severity_norm ?? 0}/100</div>
        </div>

        {/* Cluster Size (30% Weight) */}
        <div className="bg-yellow-50/40 p-2.5 rounded-lg border border-yellow-200/90 hover:border-yellow-300 transition-colors">
          <div className="flex items-center justify-between text-amber-800 font-semibold mb-1">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-yellow-600" /> Cluster Size</span>
            <span className="text-[10px] bg-yellow-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">30%</span>
          </div>
          <div className="text-base font-extrabold text-stone-900">+{b.cluster_size_weighted_pts ?? 0} pts</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Reports: {b.total_reports ?? 1}</div>
        </div>

        {/* SLA Risk (20% Weight) */}
        <div className="bg-orange-50/40 p-2.5 rounded-lg border border-orange-200/90 hover:border-orange-300 transition-colors">
          <div className="flex items-center justify-between text-orange-800 font-semibold mb-1">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-orange-600" /> SLA Risk</span>
            <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-bold">20%</span>
          </div>
          <div className="text-base font-extrabold text-stone-900">+{b.sla_risk_weighted_pts ?? 0} pts</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Active: {b.hours_active ?? 0}h</div>
        </div>

        {/* Ward Risk (10% Weight - Warm Honey & Gold instead of blue) */}
        <div className="bg-amber-50/30 p-2.5 rounded-lg border border-stone-200 hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-stone-700 font-semibold mb-1">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-600" /> Ward Risk</span>
            <span className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-bold">10%</span>
          </div>
          <div className="text-base font-extrabold text-stone-900">+{b.ward_risk_weighted_pts ?? 0} pts</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Base: {b.ward_risk_baseline ?? 50}</div>
        </div>
      </div>
    </div>
  );
};
