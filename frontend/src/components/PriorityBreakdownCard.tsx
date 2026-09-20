import React from 'react';
import { AlertTriangle, Users, Clock, MapPin, Sparkles } from 'lucide-react';

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

  const sevPts = b.severity_weighted_pts ?? 0;
  const clusterPts = b.cluster_size_weighted_pts ?? 0;
  const slaPts = b.sla_risk_weighted_pts ?? 0;
  const wardPts = b.ward_risk_weighted_pts ?? 0;

  return (
    <div className="mt-3 pt-3 border-t border-stone-100">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Priority Urgency Breakdown</span>
          {isOverdueBoosted && (
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 ml-1.5">
              +25% SLA Overdue
            </span>
          )}
        </div>
        
      </div>

      {/* 4 Clean Metric Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Severity */}
        <div className="bg-amber-50/50 hover:bg-amber-50/80 p-2 rounded-lg border border-amber-200/70 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-amber-900 font-medium mb-1">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" /> Severity
            </span>
            <span className="text-[9.5px] text-amber-700/80 font-bold">40%</span>
          </div>
          <span className="text-sm font-bold text-stone-900">+{sevPts}</span>
        </div>

        {/* Cluster Size */}
        <div className="bg-yellow-50/50 hover:bg-yellow-50/80 p-2 rounded-lg border border-yellow-200/70 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-yellow-900 font-medium mb-1">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-yellow-600" /> Cluster
            </span>
            <span className="text-[9.5px] text-yellow-700/80 font-bold">30%</span>
          </div>
          <span className="text-sm font-bold text-stone-900">+{clusterPts}</span>
        </div>

        {/* SLA Risk */}
        <div className="bg-orange-50/50 hover:bg-orange-50/80 p-2 rounded-lg border border-orange-200/70 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-orange-900 font-medium mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-orange-600" /> SLA
            </span>
            <span className="text-[9.5px] text-orange-700/80 font-bold">20%</span>
          </div>
          <span className="text-sm font-bold text-stone-900">+{slaPts}</span>
        </div>

        {/* Ward Risk */}
        <div className="bg-stone-50 hover:bg-stone-100/70 p-2 rounded-lg border border-stone-200 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-stone-800 font-medium mb-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-stone-600" /> Ward
            </span>
            <span className="text-[9.5px] text-stone-600 font-bold">10%</span>
          </div>
          <span className="text-sm font-bold text-stone-900">+{wardPts}</span>
        </div>
      </div>
    </div>
  );
};
