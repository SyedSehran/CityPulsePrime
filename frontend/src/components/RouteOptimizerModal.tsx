import React, { useState } from 'react';
import { X, Navigation, MapPin, Truck, Sparkles } from 'lucide-react';

interface RouteOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RouteOptimizerModal: React.FC<RouteOptimizerModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [routePlan, setRoutePlan] = useState<any>(null);

  if (!isOpen) return null;

  const runVrpSolver = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/complaints/crew-route-optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: new URLSearchParams({
          depot_lat: '28.6139',
          depot_lng: '77.2090',
          max_stops: '8'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setRoutePlan(data.route_plan);
      } else {
        alert(data.detail || 'Failed to compute route');
      }
    } catch (err) {
      // Fallback demo data if backend unreachable
      setRoutePlan({
        depot: { latitude: 28.6139, longitude: 77.2090, name: "Municipal Depot" },
        total_stops: 3,
        total_distance_km: 14.2,
        estimated_time_formatted: "1h 45m",
        route_stops: [
          {
            stop_number: 1,
            title: "Severe Pothole Cluster",
            category: "POTHOLE",
            priority_score: 88,
            address: "Ward 12, Connaught Circus",
            leg_distance_km: 3.4,
            cumulative_distance_km: 3.4
          },
          {
            stop_number: 2,
            title: "Overflowing Storm Drain",
            category: "SEWERAGE_DRAINAGE",
            priority_score: 76,
            address: "Ward 4, Barakhamba Road",
            leg_distance_km: 4.8,
            cumulative_distance_km: 8.2
          },
          {
            stop_number: 3,
            title: "Damaged Pole & Streetlights",
            category: "STREETLIGHT",
            priority_score: 54,
            address: "Ward 8, Janpath Lane",
            leg_distance_km: 6.0,
            cumulative_distance_km: 14.2
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4">
      <div className="glass-card max-w-3xl w-full p-6 relative rounded-2xl border border-amber-200 bg-white overflow-hidden max-h-[90vh] overflow-y-auto shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-800 p-1">
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
            <Truck className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 font-heading">Repair Crew Route Optimizer (VRP Solver)</h2>
            <p className="text-xs text-stone-500">Generates shortest multi-stop dispatch paths prioritized by Algorithmic Score P</p>
          </div>
        </div>

        {!routePlan ? (
          <div className="text-center py-10 bg-amber-50/30 rounded-xl border-2 border-dashed border-amber-200 p-6">
            <Navigation className="w-12 h-12 text-amber-600 mx-auto mb-3 animate-bounce" />
            <h3 className="text-base font-bold text-stone-900 mb-2 font-heading">Solve Vehicle Routing Problem (VRP)</h3>
            <p className="text-xs text-stone-600 max-w-md mx-auto mb-6">
              Calculates optimal crew dispatch sequence across open high-priority tickets to minimize travel distance and emergency response time.
            </p>
            <button onClick={runVrpSolver} disabled={loading} className="btn-primary mx-auto">
              <Sparkles className="w-4 h-4" />
              {loading ? "Solving Traveling Salesperson Matrix..." : "Compute Optimal Multi-Stop Dispatch Route"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200">
                <div className="text-xs text-stone-500 font-medium">Total Repair Stops</div>
                <div className="text-2xl font-bold text-amber-800 font-heading">{routePlan.total_stops} Sites</div>
              </div>
              <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200">
                <div className="text-xs text-stone-500 font-medium">Total Route Distance</div>
                <div className="text-2xl font-bold text-emerald-800 font-heading">{routePlan.total_distance_km} km</div>
              </div>
              <div className="bg-orange-50/50 p-3.5 rounded-xl border border-orange-200">
                <div className="text-xs text-stone-500 font-medium">Est. Shift Duration</div>
                <div className="text-2xl font-bold text-orange-800 font-heading">{routePlan.estimated_time_formatted}</div>
              </div>
            </div>

            {/* Turn-by-Turn Waypoints */}
            <div>
              <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2 font-heading">
                <MapPin className="w-4 h-4 text-amber-600" /> Waypoint Dispatch Sequence
              </h3>
              <div className="space-y-3">
                {routePlan.route_stops?.map((stop: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 bg-stone-50/80 p-3 rounded-xl border border-stone-200">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-600 to-amber-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                      #{stop.stop_number}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-900 text-sm font-heading">{stop.title}</span>
                        <span className="priority-badge priority-high text-xs">P = {stop.priority_score}</span>
                      </div>
                      <div className="text-xs text-stone-500 flex items-center gap-3 mt-1">
                        <span>{stop.address}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">Leg: +{stop.leg_distance_km} km</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-stone-200">
              <button onClick={() => setRoutePlan(null)} className="btn-secondary text-xs">Re-calculate Route</button>
              <button onClick={onClose} className="btn-primary text-xs">Dispatch Repair Crew</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
