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

GDACS_FLOOD_FEED = "https://data.gdacs.org/xml/rss_fl_3m.xml"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
CACHE_SECONDS = 600


def _tag(element: ET.Element, name: str) -> str:
    for child in element.iter():
        if child.tag.rsplit("}", 1)[-1].lower() == name.lower():
            return (child.text or "").strip()
    return ""


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
    ) -> list[AlertBase]:
        if time.monotonic() - self._alerts_at > CACHE_SECONDS or not self._alerts_loaded:
            async with httpx.AsyncClient(timeout=12, headers={"User-Agent": "CrisisCompass/1.0 (disaster safety app)"}) as client:
                response = await client.get(GDACS_FLOOD_FEED)
                response.raise_for_status()
            root = ET.fromstring(response.content)
            self._alerts = self._parse_flood_feed(root)
            self._alerts_at = time.monotonic()
            self._alerts_loaded = True

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

    @staticmethod
    def _parse_flood_feed(root: ET.Element) -> list[AlertBase]:
        alerts: list[AlertBase] = []
        for item in root.iter():
            if item.tag.rsplit("}", 1)[-1].lower() != "item":
                continue
            title = html.unescape(_tag(item, "title"))
            description = html.unescape(re.sub(r"<[^>]+>", " ", _tag(item, "description"))).strip()
            link = _tag(item, "link")
            if not title or not link:
                continue
            lat = lon = None
            point = _tag(item, "point")
            if point:
                try:
                    lat, lon = (float(value) for value in point.replace(",", " ").split()[:2])
                except (ValueError, TypeError):
                    lat = lon = None
            if lat is None or lon is None:
                try:
                    lat, lon = float(_tag(item, "lat")), float(_tag(item, "long"))
                except ValueError:
                    lat = lon = None
            raw_date = _tag(item, "pubDate") or _tag(item, "updated")
            try:
                published = parsedate_to_datetime(raw_date).astimezone(timezone.utc).replace(tzinfo=None)
            except (TypeError, ValueError, OverflowError):
                published = datetime.utcnow()
            lower_title = title.casefold()
            severity = SeverityLevel.CRITICAL if "red" in lower_title else SeverityLevel.HIGH if "orange" in lower_title else SeverityLevel.MODERATE
            stable_id = hashlib.sha256((_tag(item, "guid") or link).encode("utf-8")).hexdigest()[:20]
            alerts.append(AlertBase(
                id=f"gdacs-flood-{stable_id}",
                title=title,
                description=description or "Flood alert published by the Global Disaster Alert and Coordination System.",
                hazard_type=HazardType.FLOOD,
                severity=severity,
                affected_location=title,
                latitude=lat,
                longitude=lon,
            radius_km=None,
                issuing_authority="GDACS (UN / European Commission cooperation framework)",
                source_url=link,
                published_at=published,
                updated_at=published,
                verification_status=VerificationStatus.VERIFIED,
                data_origin=DataOrigin.OFFICIAL_ALERT_FEED,
                recommended_action="Open the source bulletin and confirm current conditions with local authorities before changing travel plans.",
            ))
        return alerts

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

