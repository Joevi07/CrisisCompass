import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import DBUser, DBIncident, DBSOS
from app.models.schemas import UserRegister, UserUpdate, UserProfile, IncidentCreate, IncidentResponse, SOSCreate, SOSResponse

class UserService:
    
    @staticmethod
    def register_user(db: Session, user_data: UserRegister) -> UserProfile:
        """Register a new tourist."""
        # Check if email already exists
        existing_user = db.query(DBUser).filter(DBUser.email == user_data.email).first()
        if existing_user:
            raise ValueError(f"User with email {user_data.email} already exists")
        
        user_id = str(uuid.uuid4())
        new_user = DBUser(
            id=user_id,
            email=user_data.email,
            full_name=user_data.full_name,
            phone_number=user_data.phone_number,
            destination=user_data.destination,
            language_preference=user_data.language_preference,
            emergency_contact=user_data.emergency_contact
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return UserService._db_user_to_profile(new_user)
    
    @staticmethod
    def get_user(db: Session, user_id: str) -> UserProfile:
        """Get user profile by ID."""
        user = db.query(DBUser).filter(DBUser.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        return UserService._db_user_to_profile(user)
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> UserProfile:
        """Get user profile by email."""
        user = db.query(DBUser).filter(DBUser.email == email).first()
        if not user:
            raise ValueError(f"User with email {email} not found")
        return UserService._db_user_to_profile(user)
    
    @staticmethod
    def update_user(db: Session, user_id: str, update_data: UserUpdate) -> UserProfile:
        """Update user profile."""
        user = db.query(DBUser).filter(DBUser.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        update_dict = update_data.dict(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(user, key, value)
        
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        
        return UserService._db_user_to_profile(user)
    
    @staticmethod
    def delete_user(db: Session, user_id: str) -> bool:
        """Soft delete user (deactivate)."""
        user = db.query(DBUser).filter(DBUser.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        user.is_active = False
        user.updated_at = datetime.utcnow()
        db.commit()
        return True
    
    @staticmethod
    def _db_user_to_profile(user: DBUser) -> UserProfile:
        """Convert DBUser to UserProfile schema."""
        return UserProfile(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone_number=user.phone_number,
            destination=user.destination,
            language_preference=user.language_preference,
            latitude=user.latitude,
            longitude=user.longitude,
            emergency_contact=user.emergency_contact,
            created_at=user.created_at,
            is_active=user.is_active
        )

class IncidentService:
    
    @staticmethod
    def create_incident(db: Session, user_id: str, incident_data: IncidentCreate) -> IncidentResponse:
        """Create a new incident report."""
        incident_id = str(uuid.uuid4())
        new_incident = DBIncident(
            id=incident_id,
            user_id=user_id,
            title=incident_data.title,
            description=incident_data.description,
            latitude=incident_data.latitude,
            longitude=incident_data.longitude,
            incident_type=incident_data.incident_type,
            severity=incident_data.severity,
            photo_url=incident_data.photo_url
        )
        db.add(new_incident)
        db.commit()
        db.refresh(new_incident)
        
        return IncidentService._db_incident_to_response(new_incident)
    
    @staticmethod
    def get_incident(db: Session, incident_id: str) -> IncidentResponse:
        """Get incident by ID."""
        incident = db.query(DBIncident).filter(DBIncident.id == incident_id).first()
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")
        return IncidentService._db_incident_to_response(incident)
    
    @staticmethod
    def get_user_incidents(db: Session, user_id: str) -> list:
        """Get all incidents by a user."""
        incidents = db.query(DBIncident).filter(DBIncident.user_id == user_id).all()
        return [IncidentService._db_incident_to_response(i) for i in incidents]
    
    @staticmethod
    def update_incident_status(db: Session, incident_id: str, status: str, verified_by: str = None) -> IncidentResponse:
        """Update incident status (for authorities)."""
        incident = db.query(DBIncident).filter(DBIncident.id == incident_id).first()
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")
        
        incident.status = status
        incident.verification_status = "verified" if status != "unverified" else "unverified"
        if verified_by:
            incident.verified_by = verified_by
        incident.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(incident)
        
        return IncidentService._db_incident_to_response(incident)
    
    @staticmethod
    def _db_incident_to_response(incident: DBIncident) -> IncidentResponse:
        """Convert DBIncident to IncidentResponse schema."""
        return IncidentResponse(
            id=incident.id,
            user_id=incident.user_id,
            title=incident.title,
            description=incident.description,
            latitude=incident.latitude,
            longitude=incident.longitude,
            incident_type=incident.incident_type,
            severity=incident.severity,
            status=incident.status,
            verification_status=incident.verification_status,
            photo_url=incident.photo_url,
            created_at=incident.created_at,
            updated_at=incident.updated_at
        )


class SOSService:
    
    @staticmethod
    def create_sos(db: Session, user_id: str, sos_data: SOSCreate) -> SOSResponse:
        """Create a new SOS request."""
        sos_id = str(uuid.uuid4())
        new_sos = DBSOS(
            id=sos_id,
            user_id=user_id,
            latitude=sos_data.latitude,
            longitude=sos_data.longitude,
            message=sos_data.message
        )
        db.add(new_sos)
        db.commit()
        db.refresh(new_sos)
        
        return SOSService._db_sos_to_response(new_sos)
    
    @staticmethod
    def get_sos(db: Session, sos_id: str) -> SOSResponse:
        """Get SOS request by ID."""
        sos = db.query(DBSOS).filter(DBSOS.id == sos_id).first()
        if not sos:
            raise ValueError(f"SOS request {sos_id} not found")
        return SOSService._db_sos_to_response(sos)
    
    @staticmethod
    def get_active_sos_requests(db: Session) -> list:
        """Get all active SOS requests (for authority dashboard)."""
        sos_requests = db.query(DBSOS).filter(DBSOS.status == "active").all()
        return [SOSService._db_sos_to_response(s) for s in sos_requests]
    
    @staticmethod
    def resolve_sos(db: Session, sos_id: str, resolved_by: str = None) -> SOSResponse:
        """Mark SOS as resolved."""
        sos = db.query(DBSOS).filter(DBSOS.id == sos_id).first()
        if not sos:
            raise ValueError(f"SOS request {sos_id} not found")
        
        sos.status = "resolved"
        sos.resolved_at = datetime.utcnow()
        if resolved_by:
            sos.resolved_by = resolved_by
        db.commit()
        db.refresh(sos)
        
        return SOSService._db_sos_to_response(sos)
    
    @staticmethod
    def _db_sos_to_response(sos: DBSOS) -> SOSResponse:
        """Convert DBSOS to SOSResponse schema."""
        return SOSResponse(
            id=sos.id,
            user_id=sos.user_id,
            latitude=sos.latitude,
            longitude=sos.longitude,
            status=sos.status,
            message=sos.message,
            created_at=sos.created_at
        )
