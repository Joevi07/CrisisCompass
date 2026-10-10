# CrisisCompass MVP Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CRISIS COMPASS MVP                          │
│                   Travel Safety Emergency Platform                  │
└─────────────────────────────────────────────────────────────────────┘

                           ┌─────────────────┐
                           │  Frontend (UI)  │
                           │ React + Vite    │
                           └────────┬────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
        ┌───────────▼───────┐  ┌────▼─────┐  ┌────▼──────────┐
        │  Tourist Pages    │  │Dashboards│  │Authority      │
        │                   │  │          │  │Admin Panel    │
        │ • Registration    │  │ • Map    │  │               │
        │ • Profile         │  │ • Alerts │  │ • Incidents   │
        │ • Report/SOS      │  │ • Route  │  │ • SOS Mgmt    │
        │ • Settings        │  │ • Assist │  │ • Stats       │
        └───────────────────┘  └──────────┘  └───────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                    HTTP REST API   │
                    ┌───────────────▼─────────────────┐
                    │    FastAPI Backend (Port 8000)  │
                    │    - Request validation         │
                    │    - Business logic layer       │
                    │    - Database transaction mgmt  │
                    └───────────────┬─────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
    ┌───▼────────┐         ┌────────▼──────┐       ┌──────────▼──┐
    │   Services │         │   API Routes  │       │ Security &  │
    │            │         │               │       │  Validation │
    │ • Weather  │         │ • Users       │       │             │
    │ • Alerts   │         │ • Incidents   │       │ • CORS      │
    │ • Routing  │         │ • SOS         │       │ • Auth      │
    │ • Translate│         │ • Routes      │       │ • Input     │
    │ • Assistant│         │ • Admin       │       │   Validation│
    └───────────┬┘         └────────┬──────┘       └──────────┬──┘
                │                   │                         │
                └───────────────────┼─────────────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │   SQLAlchemy ORM Layer          │
                    │   - Query builder               │
                    │   - Model management            │
                    │   - Session management          │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │   SQLite Database               │
                    │                                 │
                    │ • users table                   │
                    │ • incidents table               │
                    │ • sos_requests table            │
                    │ • alerts table                  │
                    │ • facilities table              │
                    └─────────────────────────────────┘
```

---

## Feature Architecture

### Feature 1: User Registration & Profile
```
┌─────────────────────────┐
│  RegistrationPage.tsx   │
│  - Email input          │
│  - Language selection   │
│  - Destination field    │
└────────────┬────────────┘
             │
    POST /api/users/register
             │
        ┌────▼──────────┐
        │  UserService  │
        │  - validate   │
        │  - hash pwd   │
        │  - create rec │
        └────┬──────────┘
             │
        ┌────▼──────────┐
        │  DBUser table │
        │  (SQLite)     │
        └───────────────┘
```

### Feature 2: SOS & Incident Reporting
```
┌──────────────────────────┐
│    ReportPage.tsx        │
│                          │
│  ┌──────────────────┐    │
│  │ SOS Button (Red) │    │
│  └────────┬─────────┘    │
│           │              │
│  ┌────────▼──────────┐   │
│  │ LocationShare     │   │
│  │ Message (opt)     │   │
│  └─────────┬─────────┘   │
│            │             │
│  ┌─────────▼──────────┐  │
│  │ IncidentForm       │  │
│  │ - Title            │  │
│  │ - Description      │  │
│  │ - Type             │  │
│  │ - Severity         │  │
│  │ - Photo URL        │  │
│  └──────────┬─────────┘  │
└─────────────┼────────────┘
              │
    POST /api/sos
    POST /api/incidents
              │
         ┌────▼──────────────┐
         │  SOSService       │
         │  IncidentService  │
         └────┬───────────────┘
              │
         ┌────▼──────────────┐
         │  DBSOS table      │
         │  DBIncident table │
         └───────────────────┘
```

### Feature 3: Safe Routing
```
┌──────────────────────┐
│   RoutePage.tsx      │
│                      │
│ • Start location     │
│ • End location       │
│ • Mode (walk/drive)  │
└────────┬─────────────┘
         │
    POST /api/route/safe
         │
    ┌────▼─────────────────┐
    │  RoutingService      │
    │                      │
    │ • Haversine calc     │
    │ • Hazard detection   │
    │ • Safety scoring     │
    │ • Waypoint gen       │
    └────┬─────────────────┘
         │
    ┌────▼─────────────────┐
    │ GET Hazard Zones     │
    │ GET Active Alerts    │
    └──────────────────────┘
```

### Feature 4: Authority Dashboard
```
┌──────────────────────────┐
│  AdminDashboard.tsx      │
│                          │
│  ┌────────────────────┐  │
│  │ Stats Cards        │  │
│  │ - Total users      │  │
│  │ - Incidents count  │  │
│  │ - Active SOS       │  │
│  │ - Hazards          │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ Incident List      │  │
│  │ - Filter by status │  │
│  │ - View details     │  │
│  │ - Verify/Resolve   │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ Active SOS List    │  │
│  │ - Mark resolved    │  │
│  └────────────────────┘  │
└────────┬─────────────────┘
         │
    GET /api/admin/stats
    GET /api/admin/incidents
    GET /api/admin/sos/active
    PUT /api/admin/incidents/{id}/verify
    PUT /api/admin/incidents/{id}/resolve
         │
    ┌────▼──────────────────┐
    │  Admin Services       │
    │  - Query incidents    │
    │  - Query SOS requests │
    │  - Calculate stats    │
    └────┬─────────────────┘
         │
    ┌────▼──────────────────┐
    │  Database Query       │
    │  (Multiple tables)    │
    └──────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW - MVP                              │
└─────────────────────────────────────────────────────────────────────┘

1. USER REGISTRATION
   Frontend (Email, Name, Lang) ──HTTP POST──> Backend ──Validate──> DB Store
                                                   │
                                              Save UserID
                                                   │
                                        Return to /profile

2. INCIDENT/HAZARD REPORT
   Frontend (Report Form) ──HTTP POST──> Backend ──Validate──> DB Store
                                             │
                                        Generate ID
                                             │
                                   Return to Report List

3. SOS EMERGENCY
   Frontend (Location, Msg) ──HTTP POST──> Backend ──Get GPS──> DB Store
                  │                            │
            Enable GPS                   Timestamp
                  │                            │
          Share Location          Notify Authority
                  │                            │
            Close Modal                  Query Active
                  │                            │
         Show Success             Return SOS List

4. SAFE ROUTE CALCULATION
   Frontend (Start, End) ──HTTP POST──> Backend ──Fetch Hazards──> Calculate
                                             │
                                        Check Route
                                             │
                                     Detect Intersections
                                             │
                                      Score Safety
                                             │
                                   Return Results
                                             │
                                    Display on Map

5. AUTHORITY REVIEW
   Dashboard (Query) ──HTTP GET──> Backend ──Query DB──> Results
       │                                │
   Filter/Sort                    Join Tables
       │                                │
   Click Incident             Return Incident List
       │                                │
   Select Action          Verify/Resolve
       │                                │
   HTTP PUT ──────────────> Update DB
```

---

## Database Schema Relationships

```
┌──────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                           │
└──────────────────────────────────────────────────────────────┘

        ┌──────────────────┐
        │      users       │
        │                  │
        │ id (PK)          │◄──┐
        │ email (UNIQUE)   │   │ 1-to-many
        │ full_name        │   │
        │ phone_number     │   │
        │ destination      │   │
        │ language_pref    │   │
        │ is_active        │   │
        │ created_at       │   │
        └──────────────────┘   │
                               │
                ┌──────────────┴──────────┐
                │                         │
        ┌───────▼────────────┐  ┌────────▼──────────┐
        │    incidents       │  │  sos_requests     │
        │                    │  │                   │
        │ id (PK)            │  │ id (PK)           │
        │ user_id (FK) ──────┘  │ user_id (FK) ─────┘
        │ title              │  │ latitude          │
        │ description        │  │ longitude         │
        │ latitude           │  │ status            │
        │ longitude          │  │ message           │
        │ incident_type      │  │ created_at        │
        │ severity           │  │ resolved_at       │
        │ status             │  │ resolved_by       │
        │ verification_status│  │ (admin_id)        │
        │ verified_by        │  └───────────────────┘
        │ created_at         │
        └────────────────────┘

Other tables (from Bloomskyh):
        │
        ├─ alerts (weather & disaster alerts)
        ├─ facilities (shelters, hospitals)
        └─ hazard_zones (georeferenced danger areas)
```

---

## API Endpoint Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/users/register` | POST | Create new user account |
| `/users/{user_id}` | GET, PUT, DELETE | Manage user profile |
| `/incidents` | POST, GET | Report & retrieve incidents |
| `/users/{user_id}/incidents` | GET | User's incident history |
| `/sos` | POST | Submit emergency SOS |
| `/sos/{sos_id}` | GET, PUT | View & resolve SOS |
| `/sos/active` | GET | Active SOS for admin |
| `/route/safe` | POST | Calculate safe route |
| `/admin/stats` | GET | Dashboard statistics |
| `/admin/incidents` | GET, PUT | Manage incident reports |
| `/admin/sos/active` | GET | Active SOS requests |

---

## Technology Dependencies

**Backend:**
- FastAPI 0.141+ (Web framework)
- SQLAlchemy 2.0.30+ (ORM)
- Uvicorn 0.53+ (ASGI server)
- Pydantic 2.8+ (Data validation)
- geopy (Distance calculations)

**Frontend:**
- React 18 (UI framework)
- TypeScript (Type safety)
- Tailwind CSS (Styling)
- Vite (Build tool)
- React Router v6 (Navigation)
- Lucide React (Icons)

**Database:**
- SQLite (Local development)
- Ready for PostgreSQL/MySQL migration

---

## Deployment Architecture (Future)

```
┌─────────────────────────────────────────────────────────────┐
│                  CLOUD DEPLOYMENT (Future)                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐
│   CDN/Static     │      │   Load Balancer  │
│   (Vercel/CF)    │      │   (AWS/GCP)      │
└────────┬─────────┘      └────────┬─────────┘
         │                         │
         └──────────┬──────────────┘
                    │
      ┌─────────────┼─────────────┐
      │             │             │
  ┌───▼──┐      ┌───▼──┐     ┌───▼──┐
  │ API  │      │ API  │     │ API  │
  │Pod-1 │      │Pod-2 │     │Pod-N │
  └───┬──┘      └───┬──┘     └───┬──┘
      │             │             │
      └─────────────┼─────────────┘
                    │
         ┌──────────▼──────────┐
         │  Database Cluster   │
         │  - Read Replicas    │
         │  - Write Primary    │
         │  - Backups          │
         └─────────────────────┘
                    │
         ┌──────────▼──────────┐
         │  Cache Layer        │
         │  (Redis)            │
         └─────────────────────┘
```

---

**Architecture Diagram Created:** January 2026  
**Status:** ✅ Complete - Ready for MVP Testing
