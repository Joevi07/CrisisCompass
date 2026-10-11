"""Live, location-aware disaster and place data with short server-side caches."""
import hashlib
import html
import math
import re
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any

import httpx

from app.models.schemas import (
    AlertBase, DataOrigin, Facility, FacilityType, HazardType,
    HazardZone, SeverityLevel, VerificationStatus,
)

GDACS_FEEDS = [
    ("https://data.gdacs.org/xml/rss_fl_3m.xml", HazardType.FLOOD),
    ("https://data.gdacs.org/xml/rss_tc_3m.xml", HazardType.CYCLONE),
    ("https://data.gdacs.org/xml/rss.xml", None),
]
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
CACHE_SECONDS = 300

# Geo-boundaries for Indian States & Union Territories to map exact affected areas
INDIAN_STATE_BOUNDS = [
    ("Uttar Pradesh", 23.8, 31.5, 77.0, 84.8),
    ("Sikkim", 27.0, 28.2, 88.0, 89.0),
    ("West Bengal", 21.5, 27.5, 85.8, 89.9),
    ("Karnataka", 11.5, 18.5, 74.0, 78.6),
    ("Andhra Pradesh", 12.6, 19.9, 76.7, 84.8),
    ("Tamil Nadu", 8.1, 13.6, 76.2, 80.3),
    ("Kerala", 8.3, 12.8, 74.8, 77.4),
    ("Maharashtra", 15.6, 22.0, 72.6, 80.9),
    ("Odisha", 17.8, 22.6, 81.4, 87.5),
    ("Bihar", 24.3, 27.5, 83.3, 88.3),
    ("Assam", 24.1, 28.2, 89.7, 96.1),
    ("Gujarat", 20.1, 24.7, 68.1, 74.5),
    ("Madhya Pradesh", 21.3, 26.9, 74.0, 82.8),
    ("Rajasthan", 23.0, 30.2, 69.5, 78.3),
    ("Himachal Pradesh", 30.4, 33.2, 75.6, 79.0),
    ("Uttarakhand", 28.7, 31.5, 77.6, 81.0),
    ("Punjab", 29.5, 32.5, 73.9, 76.9),
    ("Jammu & Kashmir", 32.3, 37.1, 73.8, 80.3),
]


def _tag(element: ET.Element, name: str) -> str:
    for child in element.iter():
        if child.tag.rsplit("}", 1)[-1].lower() == name.lower():
            return (child.text or "").strip()
    return ""


def _resolve_indian_state(lat: float | None, lon: float | None, country: str, title: str) -> str:
    if lat is not None and lon is not None:
        for state, min_lat, max_lat, min_lon, max_lon in INDIAN_STATE_BOUNDS:
            if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
                return f"{state}, India"
    if "southern india" in country.lower() or "southern india" in title.lower():
        return "Southern India (Karnataka, Andhra Pradesh & Tamil Nadu)"
    return "India"


def _distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lon / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class LiveGeoService:
    def __init__(self) -> None:
        self._alerts: list[AlertBase] = []
        self._alerts_at = 0.0
        self._alerts_loaded = False
        self._facility_cache: dict[tuple[float, float, int], tuple[float, list[Facility]]] = {}

    async def flood_alerts(
        self,
        location: str | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
        radius_km: float = 500,
        india_only: bool = True,
    ) -> list[AlertBase]:
        if time.monotonic() - self._alerts_at > CACHE_SECONDS or not self._alerts_loaded:
            parsed_alerts = await self._fetch_live_indian_alerts()
            if parsed_alerts:
                self._alerts = parsed_alerts
                self._alerts_at = time.monotonic()
                self._alerts_loaded = True
            elif not self._alerts_loaded:
                # If network fetch completely failed on initial boot, keep list empty so UI displays honest empty/error state
                self._alerts = []
                self._alerts_at = time.monotonic() - CACHE_SECONDS + 30

        query = (location or "").strip().casefold()
        output = []
        for alert in self._alerts:
            text = f"{alert.title} {alert.description} {alert.affected_location}".casefold()
            if query and (latitude is None or longitude is None) and query not in text:
                continue
            if latitude is not None and longitude is not None and alert.latitude is not None and alert.longitude is not None:
                if _distance_km(latitude, longitude, alert.latitude, alert.longitude) > radius_km:
                    continue
            output.append(alert)
        return output

    async def _fetch_live_indian_alerts(self) -> list[AlertBase]:
        seen_links = set()
        collected_alerts: list[AlertBase] = []

        async with httpx.AsyncClient(timeout=6.0, headers={"User-Agent": "CrisisCompass/1.0 (disaster safety app)"}) as client:
            for feed_url, default_hazard in GDACS_FEEDS:
                try:
                    response = await client.get(feed_url)
                    if response.status_code != 200:
                        continue
                    root = ET.fromstring(response.content)
                    items = [i for i in root.iter() if i.tag.rsplit("}", 1)[-1].lower() == "item"]
                    for item in items:
                        alert = self._parse_feed_item(item, default_hazard)
                        if alert and alert.source_url not in seen_links:
                            seen_links.add(alert.source_url)
                            collected_alerts.append(alert)
                except Exception:
                    continue

        return collected_alerts

    @staticmethod
    def _parse_feed_item(item: ET.Element, default_hazard: HazardType | None) -> AlertBase | None:
        title = html.unescape(_tag(item, "title"))
        link = _tag(item, "link")
        if not title or not link:
            return None

        country = _tag(item, "country")
        iso3 = _tag(item, "iso3").upper()

        # Strict filter for India, avoiding false positives like Indonesia
        is_india = False
        if "IND" in iso3:
            is_india = True
        elif "INDIA" in country.upper():
            parts = [p.strip().upper() for p in country.split(",")]
            for p in parts:
                if "INDIA" in p and "INDONESIA" not in p:
                    is_india = True
                    break

        if not is_india:
            return None

        # Coordinates
        lat = lon = None
        lat_str = _tag(item, "lat")
        long_str = _tag(item, "long")
        if lat_str and long_str:
            try:
                lat, lon = float(lat_str), float(long_str)
            except ValueError:
                lat = lon = None

        if lat is None or lon is None:
            point = _tag(item, "point")
            if point:
                try:
                    lat, lon = (float(v) for v in point.replace(",", " ").split()[:2])
                except (ValueError, TypeError):
                    lat = lon = None

        # Resolve Indian State / Territory
        affected_area = _resolve_indian_state(lat, lon, country, title)

        # Hazard type
        ev_type = _tag(item, "eventtype").upper()
        if ev_type == "FL":
            hazard_type = HazardType.FLOOD
        elif ev_type == "TC":
            hazard_type = HazardType.CYCLONE
        elif ev_type == "DR":
            hazard_type = HazardType.HEATWAVE
        elif default_hazard:
            hazard_type = default_hazard
        else:
            hazard_type = HazardType.OTHER

        # Severity
        alert_level = _tag(item, "alertlevel").casefold()
        if "red" in alert_level or "red" in title.casefold():
            severity = SeverityLevel.CRITICAL
        elif "orange" in alert_level or "orange" in title.casefold():
            severity = SeverityLevel.HIGH
        elif "green" in alert_level or "green" in title.casefold():
            severity = SeverityLevel.MODERATE
        else:
            severity = SeverityLevel.LOW

        # Dates
        raw_date = _tag(item, "pubDate") or _tag(item, "updated") or _tag(item, "dateadded")
        try:
            published = parsedate_to_datetime(raw_date).astimezone(timezone.utc).replace(tzinfo=None)
        except Exception:
            published = datetime.utcnow()

        raw_mod = _tag(item, "datemodified")
        try:
            updated = parsedate_to_datetime(raw_mod).astimezone(timezone.utc).replace(tzinfo=None)
        except Exception:
            updated = published

        raw_to = _tag(item, "todate")
        valid_until = None
        if raw_to:
            try:
                valid_until = parsedate_to_datetime(raw_to).astimezone(timezone.utc).replace(tzinfo=None)
            except Exception:
                valid_until = None

        # Clean description and casualty metrics
        raw_desc = html.unescape(re.sub(r"<[^>]+>", " ", _tag(item, "description"))).strip()
        from_d = _tag(item, "fromdate")
        to_d = _tag(item, "todate")
        glide = _tag(item, "glide")

        # Create informative, accurate title and description
        if hazard_type == HazardType.FLOOD:
            clean_title = f"{alert_level.capitalize() or 'Active'} Flood Alert – {affected_area}"
            action = "Monitor water levels closely, avoid low-lying roads and culverts, and follow State Disaster Management instructions."
        elif hazard_type == HazardType.CYCLONE:
            event_name = _tag(item, "eventname") or "Tropical System"
            clean_title = f"Cyclone Warning ({event_name}) – {affected_area}"
            action = "Avoid coastal promenades, secure outdoor property, and heed regional cyclone warning center advisories."
        elif hazard_type == HazardType.HEATWAVE:
            clean_title = f"Drought & Heat Advisory – {affected_area}"
            action = "Stay hydrated, minimize prolonged outdoor exposure during peak daylight, and follow local water preservation guidelines."
        else:
            clean_title = f"Disaster Advisory – {affected_area}"
            action = "Follow regional emergency authority guidance and check source bulletins."

        desc_parts = [raw_desc]
        if glide:
            desc_parts.append(f"GLIDE Registry: {glide}.")
        clean_description = " ".join(desc_parts)

        stable_id = hashlib.sha256((_tag(item, "guid") or link).encode("utf-8")).hexdigest()[:20]

        return AlertBase(
            id=f"gdacs-{ev_type.lower()}-{stable_id}",
            title=clean_title,
            description=clean_description,
            hazard_type=hazard_type,
            severity=severity,
            affected_location=affected_area,
            latitude=lat,
            longitude=lon,
            radius_km=None,
            issuing_authority="GDACS (UN / European Commission cooperation framework)",
            source_url=link,
            published_at=published,
            updated_at=updated,
            valid_until=valid_until,
            verification_status=VerificationStatus.OFFICIAL,
            data_origin=DataOrigin.OFFICIAL_ALERT_FEED,
            recommended_action=action,
        )

    async def hazards_near(
        self,
        latitude: float | None = None,
        longitude: float | None = None,
        radius_km: float = 500,
    ) -> list[HazardZone]:
        alerts = await self.flood_alerts(latitude=latitude, longitude=longitude, radius_km=radius_km)
        return [HazardZone(
            id=alert.id,
            hazard_type=alert.hazard_type,
            severity=alert.severity,
            title=alert.title,
            description=alert.description,
            coordinates=[[alert.latitude, alert.longitude]] if alert.latitude is not None and alert.longitude is not None else [],
            radius_meters=None,
            is_polygon=False,
            source_organization=alert.issuing_authority,
            source_url=alert.source_url,
            reported_at=alert.published_at,
            data_origin=alert.data_origin,
            verification_status=alert.verification_status,
        ) for alert in alerts if alert.latitude is not None and alert.longitude is not None]

    async def nearby_facilities(self, latitude: float, longitude: float, radius_km: float = 20) -> list[Facility]:
        radius_km = min(max(radius_km, 1), 50)
        key = (round(latitude, 1), round(longitude, 1), int(radius_km))
        cached = self._facility_cache.get(key)
        if cached and time.monotonic() - cached[0] < CACHE_SECONDS:
            return cached[1]

        radius_m = int(radius_km * 1000)
        query = (
            f'[out:json][timeout:10];('
            f'node(around:{radius_m},{latitude},{longitude})[amenity~"^(shelter|hospital|clinic)$"];'
            f'way(around:{radius_m},{latitude},{longitude})[amenity~"^(shelter|hospital|clinic)$"];'
            f'relation(around:{radius_m},{latitude},{longitude})[amenity~"^(shelter|hospital|clinic)$"];'
            f');out center tags;'
        )
        async with httpx.AsyncClient(timeout=14, headers={"User-Agent": "CrisisCompass/1.0 (OpenStreetMap nearby places)"}) as client:
            response = await client.post(OVERPASS_URL, data={"data": query})
            response.raise_for_status()
        elements: list[dict[str, Any]] = response.json().get("elements", [])
        facilities: list[Facility] = []
        for element in elements[:100]:
            tags = element.get("tags") or {}
            center = element.get("center") or element
            lat, lon = center.get("lat"), center.get("lon")
            if lat is None or lon is None:
                continue
            amenity = tags.get("amenity", "")
            street = " ".join(part for part in [tags.get("addr:housenumber"), tags.get("addr:street")] if part)
            address = ", ".join(part for part in [street, tags.get("addr:city"), tags.get("addr:state")] if part) or "Address not listed"
            facilities.append(Facility(
                id=f"osm-{element.get('type')}-{element.get('id')}",
                name=tags.get("name") or ("Shelter" if amenity == "shelter" else "Healthcare facility"),
                facility_type=FacilityType.SHELTER if amenity == "shelter" else FacilityType.HOSPITAL,
                latitude=float(lat),
                longitude=float(lon),
                address=address,
                contact_number=tags.get("contact:phone") or tags.get("phone"),
                is_open=False,
                status_verified_at=datetime.utcnow(),
                data_origin=DataOrigin.COMMUNITY_MAP_DATA,
                source_notes="OpenStreetMap community listing. Operating status and emergency suitability are not verified.",
            ))
        self._facility_cache[key] = (time.monotonic(), facilities)
        return facilities


live_geo_service = LiveGeoService()

