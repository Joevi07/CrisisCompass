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
                id="alert-demo-002",
                title="Orange Alert: Severe Cyclone Approaching Coast",
                description="Severe cyclonic storm system tracking Northwest across Bay of Bengal with sustained winds of 90-110 km/h and gusts up to 125 km/h. High tidal surges predicted along coastal areas.",
                hazard_type=HazardType.CYCLONE,
                severity=SeverityLevel.HIGH,
                affected_location="Puri, Odisha, India (Coastal Heritage Belt)",
                latitude=19.8135,
                longitude=85.8312,
                radius_km=30.0,
                issuing_authority="India Meteorological Department (IMD) / OSDMA",
                source_url="https://imd.gov.in/cyclone-bulletin-2026",
                published_at=now - timedelta(hours=5),
                updated_at=now - timedelta(hours=1),
                valid_until=now + timedelta(hours=24),
                verification_status=VerificationStatus.OFFICIAL,
                data_origin=DataOrigin.SIMULATED_DEMO_DATA,
                recommended_action="Secure loose outdoor furniture, avoid beachside promenades, and heed district administration evacuation orders for coastal zones."
            ),
            AlertBase(
                id="alert-demo-003",
                title="Yellow Advisory: Inundation and Transport Disruption",
                description="Heavy continuous monsoon downpour leading to water accumulation along tourist transit corridors, local train underpasses, and arterial highways.",
                hazard_type=HazardType.HEAVY_RAIN,
                severity=SeverityLevel.MODERATE,
                affected_location="Mumbai, Maharashtra, India (South Mumbai & Suburbs)",
                latitude=18.9220,
                longitude=72.8347,
                radius_km=15.0,
                issuing_authority="Brihanmumbai Municipal Corporation (BMC) Disaster Cell",
                source_url="https://imd.gov.in/weather-advisory-mumbai",
                published_at=now - timedelta(hours=3),
                updated_at=now - timedelta(minutes=45),
                valid_until=now + timedelta(hours=8),
                verification_status=VerificationStatus.OFFICIAL,
                data_origin=DataOrigin.SIMULATED_DEMO_DATA,
                recommended_action="Expect taxi and suburban train delays. Seek shelter in commercial buildings away from underpass roads and seafront promenades."
            ),
            AlertBase(
                id="alert-demo-004",
                title="Advisory: River Embankment Overflow Watch",
                description="Intermittent heavy discharge from upstream reservoir causing water level rise along tourist riverfront ghats. Civil defense team monitoring embankments.",
                hazard_type=HazardType.RESTRICTED,
                severity=SeverityLevel.LOW,
                affected_location="Kochi, Kerala, India (Fort Kochi & Mattancherry)",
                latitude=9.9656,
                longitude=76.2421,
                radius_km=5.0,
                issuing_authority="Kerala State Disaster Management Authority (KSDMA)",
                source_url="https://imd.gov.in/hazards/kochi-water-watch",
                published_at=now - timedelta(hours=1),
                updated_at=now - timedelta(hours=1),
                valid_until=now + timedelta(hours=6),
                verification_status=VerificationStatus.OFFICIAL,
                data_origin=DataOrigin.SIMULATED_DEMO_DATA,
                recommended_action="Exercise caution around river banks and boating jetties. Avoid ferry transit during peak water surge."
            )
        ]

        self.facilities: List[Facility] = [
            Facility(
                id="fac-shelter-1",
                name="Central Community Cyclone Relief Shelter",
                facility_type=FacilityType.SHELTER,
                latitude=13.0850,
                longitude=80.2650,
                address="45 EVR Periyar Salai, Chennai, Tamil Nadu, India",
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
                address="12 Cathedral Road, Chennai, Tamil Nadu, India",
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
                address="Poonamallee High Rd, Chennai, Tamil Nadu, India",
                contact_number="+91 44 2530 5000",
                capacity=1200,
                current_occupancy=900,
                is_open=True,
                status_verified_at=now - timedelta(minutes=15),
                data_origin=DataOrigin.SIMULATED_DEMO_DATA,
                source_notes="24/7 Level 1 Trauma Emergency facility."
            ),
            # Mumbai Facilities
            Facility(
                id="fac-mumbai-shelter-1",
                name="South Mumbai Municipal Disaster Relief Shelter",
                facility_type=FacilityType.SHELTER,
                latitude=18.9320,
                longitude=72.8310,
                address="Dr. D.N. Road, Fort, Mumbai, Maharashtra, India",
                contact_number="+91 22 2269 4725",
                capacity=600,
                current_occupancy=180,
                is_open=True,
                status_verified_at=now - timedelta(hours=1),
                data_origin=DataOrigin.SIMULATED_DEMO_DATA,
                source_notes="BMC-verified emergency flood and monsoon shelter with food supplies."
            ),
            Facility(
                id="fac-mumbai-hosp-1",
                name="KEM Emergency & Trauma Care Hospital",
                facility_type=FacilityType.HOSPITAL,
                latitude=19.0028,
                longitude=72.8432,
                address="Acharya Donde Marg, Parel, Mumbai, Maharashtra, India",
                contact_number="+91 22 2410 7000",
                capacity=1800,
                current_occupancy=1350,
                is_open=True,
                status_verified_at=now - timedelta(minutes=20),
                data_origin=DataOrigin.SIMULATED_DEMO_DATA,
                source_notes="Designated disaster receiving tertiary healthcare and trauma center."
            )
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

    def get_alerts(self, location: Optional[str] = None, severity: Optional[str] = None, india_only: bool = True) -> List[AlertBase]:
        now = datetime.utcnow()
        results: List[AlertBase] = []
        for alert in self.demo_alerts:
            # Check expiration
            if alert.valid_until and alert.valid_until < now:
                alert.verification_status = VerificationStatus.EXPIRED

            # Enforce India-focused safety filtering
            if india_only and "india" not in alert.affected_location.lower():
                continue

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
