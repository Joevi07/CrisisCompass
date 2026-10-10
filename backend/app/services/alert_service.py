from datetime import datetime, timedelta
from typing import List, Optional
from app.models.schemas import (
    AlertBase, SeverityLevel, VerificationStatus, DataOrigin, HazardType,
    Facility, FacilityType, HazardZone
)
from app.services.verifier_service import source_verifier

class AlertService:
    def __init__(self):
        # Seed realistic demonstration and verified records
        self._seed_data()

    def _seed_data(self):
        now = datetime.utcnow()
        self.demo_alerts: List[AlertBase] = [
            AlertBase(
                id="alert-demo-001",
                title="Red Alert: Severe Flash Flooding Warning",
                description="Intense low-pressure weather system causing extreme precipitation exceeding 180mm. Low-lying coastal and urban areas are experiencing rapidly rising waters.",
                hazard_type=HazardType.FLOOD,
                severity=SeverityLevel.CRITICAL,
                affected_location="Chennai, India (Marina & Velachery Sectors)",
                latitude=13.0827,
                longitude=80.2707,
                radius_km=15.0,
                issuing_authority="Regional Meteorological Centre / IMD",
                source_url="https://imd.gov.in/alerts/chennai-flash-flood-2026",
                published_at=now - timedelta(hours=2),
                updated_at=now - timedelta(minutes=25),
                valid_until=now + timedelta(hours=14),
                verification_status=VerificationStatus.OFFICIAL,
                data_origin=DataOrigin.SIMULATED_DEMO_DATA,
                recommended_action="Do not attempt to traverse flooded roads. Move valuables and yourself to 1st floor or higher. Keep mobile devices charged."
            ),
            AlertBase(
                id="alert-demo-003",
                title="Yellow Advisory: Inundation and Transport Disruption",
                description="Heavy continuous downpour leading to water accumulation along tourist transit corridors and metro underpasses.",
                hazard_type=HazardType.HEAVY_RAIN,
                severity=SeverityLevel.MODERATE,
                affected_location="Bangkok, Thailand (Sukhumvit & Riverside)",
                latitude=13.7563,
                longitude=100.5018,
                radius_km=12.0,
                issuing_authority="Metropolitan Disaster Management",
                source_url="https://bmdi.gov/weather-advisory-rain",
                published_at=now - timedelta(hours=3),
                updated_at=now - timedelta(minutes=45),
                valid_until=now + timedelta(hours=8),
                verification_status=VerificationStatus.OFFICIAL,
                data_origin=DataOrigin.SIMULATED_DEMO_DATA,
                recommended_action="Expect taxi and train delays. Seek shelter in commercial buildings away from underpass roads."
            ),
            AlertBase(
                id="alert-demo-004",
                title="Unverified Report: River Embankment Overflow",
                description="Social post claims water breach near local heritage canal. No confirmation from civil administration yet.",
                hazard_type=HazardType.RESTRICTED,
                severity=SeverityLevel.LOW,
                affected_location="Paris, France (Seine Quays)",
                latitude=48.8566,
                longitude=2.3522,
                radius_km=3.0,
                issuing_authority="Local Citizen Safety Net",
                source_url="https://unverified-social-forum.org/paris-water",
                published_at=now - timedelta(hours=1),
                updated_at=now - timedelta(hours=1),
                valid_until=now + timedelta(hours=3),
                verification_status=VerificationStatus.UNVERIFIED,
                data_origin=DataOrigin.USER_REPORT,
                recommended_action="Exercise caution around river banks. Await official police validation."
            )
        ]

        self.facilities: List[Facility] = [
            Facility(
                id="fac-shelter-1",
                name="Central Community Cyclone Relief Shelter",
                facility_type=FacilityType.SHELTER,
                latitude=13.0850,
                longitude=80.2650,
                address="45 EVR Periyar Salai, Chennai",
                contact_number="+91 44 2538 4520",
                capacity=500,
                current_occupancy=140,
                is_open=True,
                status_verified_at=now - timedelta(minutes=30),
                data_origin=DataOrigin.SIMULATED_DEMO_DATA,
                source_notes="Verified open shelter with drinking water, dry rations, and medical responder."
            ),
            Facility(
                id="fac-shelter-2",
                name="Coastal Safe Evacuation Hall (High Elevation)",
                facility_type=FacilityType.SHELTER,
                latitude=13.0720,
                longitude=80.2580,
                address="12 Cathedral Road, Chennai",
                contact_number="+91 44 2811 0290",
                capacity=350,
                current_occupancy=85,
                is_open=True,
                status_verified_at=now - timedelta(minutes=45),
                data_origin=DataOrigin.SIMULATED_DEMO_DATA,
                source_notes="Equipped with backup generator and bilingual tourist desk."
            ),
            Facility(
                id="fac-hosp-1",
                name="Government General Hospital (Emergency Trauma Center)",
                facility_type=FacilityType.HOSPITAL,
                latitude=13.0810,
                longitude=80.2780,
                address="Poonamallee High Rd, Chennai",
                contact_number="+91 44 2530 5000",
                capacity=1200,
                current_occupancy=900,
                is_open=True,
                status_verified_at=now - timedelta(minutes=15),
                data_origin=DataOrigin.SIMULATED_DEMO_DATA,
                source_notes="24/7 Level 1 Trauma Emergency facility."
            ),
        ]

        self.hazard_zones: List[HazardZone] = [
            HazardZone(
                id="zone-chennai-flood-1",
                hazard_type=HazardType.FLOOD,
                severity=SeverityLevel.CRITICAL,
                title="Adyar River Flood Inundation Buffer",
                description="River basin overflowing bank lines. Submerged roads and flash inundation.",
                coordinates=[
                    [13.010, 80.245],
                    [13.015, 80.260],
                    [13.005, 80.265],
                    [13.000, 80.250]
                ],
                is_polygon=True,
                source_organization="Disaster Management Authority",
                source_url="https://imd.gov.in/hazards/adyar",
                reported_at=now - timedelta(hours=1),
                data_origin=DataOrigin.SIMULATED_DEMO_DATA,
                verification_status=VerificationStatus.OFFICIAL
            ),
            HazardZone(
                id="zone-chennai-flood-2",
                hazard_type=HazardType.RESTRICTED,
                severity=SeverityLevel.HIGH,
                title="Marina Beach Seafront Red Zone",
                description="High waves and storm surge exceeding 3.5 meters. Beach closed by coast guard.",
                coordinates=[[13.055, 80.283]],
                radius_meters=1800.0,
                is_polygon=False,
                source_organization="Coastal Police Division",
                source_url="https://imd.gov.in/coastal-warning",
                reported_at=now - timedelta(hours=2),
                data_origin=DataOrigin.SIMULATED_DEMO_DATA,
                verification_status=VerificationStatus.OFFICIAL
            )
        ]

    def get_alerts(self, location: Optional[str] = None, severity: Optional[str] = None) -> List[AlertBase]:
        now = datetime.utcnow()
        results: List[AlertBase] = []
        for alert in self.demo_alerts:
            # Check expiration
            if alert.valid_until and alert.valid_until < now:
                alert.verification_status = VerificationStatus.EXPIRED

            # Filter location
            if location and location.lower() not in alert.affected_location.lower():
                continue

            # Filter severity
            if severity and alert.severity.value.lower() != severity.lower():
                continue

            results.append(alert)
        return results

    def get_alert_by_id(self, alert_id: str) -> Optional[AlertBase]:
        for alert in self.demo_alerts:
            if alert.id == alert_id:
                return alert
        return None

    def get_facilities(self, facility_type: Optional[str] = None) -> List[Facility]:
        if not facility_type:
            return self.facilities
        return [f for f in self.facilities if f.facility_type.value.lower() == facility_type.lower()]

    def get_hazard_zones(self) -> List[HazardZone]:
        return self.hazard_zones

alert_service = AlertService()
