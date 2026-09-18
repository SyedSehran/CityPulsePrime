import math
from typing import List, Dict, Any

class RouteOptimizer:
    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculates Great Circle distance between two points in Kilometers.
        """
        R = 6371.0 # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    @classmethod
    def solve_vrp_route(
        cls,
        depot_lat: float,
        depot_lng: float,
        incidents: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Solves Vehicle Routing Problem (VRP/TSP) using Nearest-Neighbor heuristic
        boosted by Incident Priority Score P.
        """
        if not incidents:
            return {
                "route_stops": [],
                "total_distance_km": 0.0,
                "estimated_time_minutes": 0,
                "depot": {"lat": depot_lat, "lng": depot_lng}
            }

        unvisited = list(incidents)
        current_lat = depot_lat
        current_lng = depot_lng

        route_stops = []
        total_distance = 0.0
        stop_index = 1

        while unvisited:
            # Score each candidate: Trade-off between distance (lower is better) and priority P (higher is better)
            best_candidate = None
            best_score = float('inf')
            best_dist = 0.0

            for candidate in unvisited:
                c_lat = candidate.get("latitude", depot_lat)
                c_lng = candidate.get("longitude", depot_lng)
                p_score = candidate.get("priority_score", 50)

                dist = cls.haversine_distance(current_lat, current_lng, c_lat, c_lng)
                # Weighted cost formula for crew routing: Distance / (1 + P / 100)
                cost = dist / (1.0 + (p_score / 50.0))

                if cost < best_score:
                    best_score = cost
                    best_candidate = candidate
                    best_dist = dist

            # Visit best candidate
            unvisited.remove(best_candidate)
            total_distance += best_dist

            c_lat = best_candidate.get("latitude", depot_lat)
            c_lng = best_candidate.get("longitude", depot_lng)
            current_lat = c_lat
            current_lng = c_lng

            route_stops.append({
                "stop_number": stop_index,
                "incident_id": best_candidate.get("id"),
                "title": best_candidate.get("title", "Civic Repair"),
                "category": best_candidate.get("category", "OTHER"),
                "priority_score": best_candidate.get("priority_score", 50),
                "address": best_candidate.get("address", "Municipal Site"),
                "latitude": c_lat,
                "longitude": c_lng,
                "leg_distance_km": round(best_dist, 2),
                "cumulative_distance_km": round(total_distance, 2)
            })

            stop_index += 1

        # Return leg to depot
        return_dist = cls.haversine_distance(current_lat, current_lng, depot_lat, depot_lng)
        total_distance += return_dist

        # Average crew travel speed: 25 km/h in urban areas + 20 mins per repair stop
        travel_time_min = (total_distance / 25.0) * 60.0
        repair_time_min = len(route_stops) * 20.0
        total_time_min = int(round(travel_time_min + repair_time_min))

        return {
            "depot": {"latitude": depot_lat, "longitude": depot_lng, "name": "Municipal Central Dispatch Depot"},
            "total_stops": len(route_stops),
            "total_distance_km": round(total_distance, 2),
            "estimated_time_minutes": total_time_min,
            "estimated_time_formatted": f"{total_time_min // 60}h {total_time_min % 60}m",
            "route_stops": route_stops
        }
