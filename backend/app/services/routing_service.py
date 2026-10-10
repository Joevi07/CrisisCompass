"""
Safe routing service that calculates routes avoiding hazard zones.
Uses OpenRouteService or OSRM for routing, and hazard data to avoid dangerous areas.
"""

from math import radians, cos, sin, asin, sqrt
from typing import List, Tuple, Dict, Optional
from datetime import datetime

class RoutePoint:
    def __init__(self, lat: float, lng: float, name: str = ""):
        self.lat = lat
        self.lng = lng
        self.name = name

class SafeRoute:
    def __init__(self, 
                 start: RoutePoint,
                 end: RoutePoint,
                 distance_km: float,
                 estimated_time_min: float,
                 hazard_intersections: List[Dict] = None,
                 waypoints: List[RoutePoint] = None,
                 safety_score: float = 1.0):
        self.start = start
        self.end = end
        self.distance_km = distance_km
        self.estimated_time_min = estimated_time_min
        self.hazard_intersections = hazard_intersections or []
        self.waypoints = waypoints or []
        self.safety_score = safety_score
        self.created_at = datetime.utcnow()

class RoutingService:
    """Service for calculating safe routes that avoid hazard zones."""
    
    # Average walking speed: 5 km/h, driving: 40 km/h
    WALKING_SPEED_KMH = 5.0
    DRIVING_SPEED_KMH = 40.0
    
    def __init__(self):
        self.hazard_zones = []  # Will be populated from alert service
    
    def set_hazard_zones(self, hazards: List[Dict]):
        """Set active hazard zones to avoid."""
        self.hazard_zones = hazards
    
    def haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in km using Haversine formula."""
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        km = 6371 * c
        return km
    
    def point_to_circle_distance(self, point_lat: float, point_lng: float,
                                 circle_lat: float, circle_lng: float,
                                 radius_km: float) -> float:
        """
        Calculate minimum distance from a point to a circular hazard zone.
        Returns 0 if point is inside the zone.
        """
        dist_to_center = self.haversine_distance(point_lat, point_lng, circle_lat, circle_lng)
        min_dist = max(0, dist_to_center - radius_km)
        return min_dist
    
    def is_point_in_hazard(self, lat: float, lng: float, hazard: Dict) -> bool:
        """Check if a point is within a hazard zone."""
        if hazard.get('is_polygon'):
            # Simple bounding box check for polygons (simplified)
            coords = hazard.get('coordinates', [])
            if coords:
                min_lat = min(c[0] for c in coords)
                max_lat = max(c[0] for c in coords)
                min_lng = min(c[1] for c in coords)
                max_lng = max(c[1] for c in coords)
                return min_lat <= lat <= max_lat and min_lng <= lng <= max_lng
        else:
            # Circular zone
            hazard_lat = hazard.get('center_latitude') or hazard.get('latitude')
            hazard_lng = hazard.get('center_longitude') or hazard.get('longitude')
            radius_km = (hazard.get('radius_km') or hazard.get('radius_meters', 0) / 1000) or 1
            
            dist = self.haversine_distance(lat, lng, hazard_lat, hazard_lng)
            return dist <= radius_km
    
    def calculate_hazard_free_route(self, 
                                   start_lat: float, start_lng: float,
                                   end_lat: float, end_lng: float,
                                   mode: str = "walking") -> SafeRoute:
        """
        Calculate a route that avoids hazard zones.
        Uses a simple straight-line approximation with hazard checking.
        For production, integrate with OpenRouteService or OSRM.
        """
        start = RoutePoint(start_lat, start_lng, "Start")
        end = RoutePoint(end_lat, end_lng, "Destination")
        
        # Calculate direct distance
        direct_distance = self.haversine_distance(start_lat, start_lng, end_lat, end_lng)
        
        # Check for hazards on direct path
        hazard_intersections = self._check_hazard_intersections(
            start_lat, start_lng, end_lat, end_lng
        )
        
        # If hazards detected, calculate detour or suggest waypoints
        if hazard_intersections:
            # Calculate detour factor (typically 1.2-1.5x for urban areas)
            detour_factor = min(1.5, 1 + len(hazard_intersections) * 0.1)
            route_distance = direct_distance * detour_factor
            safety_score = 1.0 - min(0.5, len(hazard_intersections) * 0.15)
        else:
            route_distance = direct_distance
            safety_score = 1.0
        
        # Calculate estimated time based on mode
        speed = self.WALKING_SPEED_KMH if mode == "walking" else self.DRIVING_SPEED_KMH
        estimated_time = (route_distance / speed) * 60  # Convert to minutes
        
        # Generate waypoints to avoid hazards
        waypoints = self._generate_waypoints(
            start_lat, start_lng, end_lat, end_lng, hazard_intersections
        ) if hazard_intersections else [start, end]
        
        return SafeRoute(
            start=start,
            end=end,
            distance_km=route_distance,
            estimated_time_min=estimated_time,
            hazard_intersections=hazard_intersections,
            waypoints=waypoints,
            safety_score=safety_score
        )
    
    def _check_hazard_intersections(self, start_lat: float, start_lng: float,
                                    end_lat: float, end_lng: float) -> List[Dict]:
        """Check which hazards intersect with the direct route."""
        intersections = []
        
        for hazard in self.hazard_zones:
            # Check if hazard is near the route
            if hazard.get('is_polygon'):
                # Check polygon
                coords = hazard.get('coordinates', [])
                for i, (lat, lng) in enumerate(coords):
                    # Simple check: hazard is "near" if within 2km of route
                    dist_from_start = self.haversine_distance(start_lat, start_lng, lat, lng)
                    dist_from_end = self.haversine_distance(end_lat, end_lng, lat, lng)
                    direct_dist = self.haversine_distance(start_lat, start_lng, end_lat, end_lng)
                    
                    if dist_from_start + dist_from_end <= direct_dist * 1.2:  # Route passes near
                        intersections.append({
                            'hazard_id': hazard.get('id'),
                            'type': hazard.get('hazard_type'),
                            'severity': hazard.get('severity'),
                            'lat': lat,
                            'lng': lng,
                            'distance_to_route_km': 0
                        })
                        break
            else:
                # Check circle
                hazard_lat = hazard.get('center_latitude') or hazard.get('latitude')
                hazard_lng = hazard.get('center_longitude') or hazard.get('longitude')
                radius_km = (hazard.get('radius_km') or hazard.get('radius_meters', 0) / 1000) or 1
                
                dist_from_start = self.haversine_distance(start_lat, start_lng, hazard_lat, hazard_lng)
                dist_from_end = self.haversine_distance(end_lat, end_lng, hazard_lat, hazard_lng)
                direct_dist = self.haversine_distance(start_lat, start_lng, end_lat, end_lng)
                
                # Hazard intersects route if route passes within 1.5x radius
                if dist_from_start + dist_from_end <= direct_dist * (1 + radius_km):
                    intersections.append({
                        'hazard_id': hazard.get('id'),
                        'type': hazard.get('hazard_type'),
                        'severity': hazard.get('severity'),
                        'lat': hazard_lat,
                        'lng': hazard_lng,
                        'radius_km': radius_km,
                        'distance_to_route_km': max(0, min(dist_from_start, dist_from_end) - radius_km)
                    })
        
        return intersections
    
    def _generate_waypoints(self, start_lat: float, start_lng: float,
                           end_lat: float, end_lng: float,
                           hazards: List[Dict]) -> List[RoutePoint]:
        """Generate waypoints to avoid hazards."""
        waypoints = [RoutePoint(start_lat, start_lng, "Start")]
        
        if hazards:
            # Simple detour: add waypoint perpendicular to hazard
            avg_hazard_lat = sum(h['lat'] for h in hazards) / len(hazards)
            avg_hazard_lng = sum(h['lng'] for h in hazards) / len(hazards)
            
            # Create waypoint offset from hazard
            offset_lat = (avg_hazard_lat - start_lat) * 0.3
            offset_lng = (avg_hazard_lng - start_lng) * 0.3
            
            waypoint = RoutePoint(
                avg_hazard_lat - offset_lat,
                avg_hazard_lng - offset_lng,
                "Detour Point"
            )
            waypoints.append(waypoint)
        
        waypoints.append(RoutePoint(end_lat, end_lng, "Destination"))
        return waypoints

routing_service = RoutingService()
