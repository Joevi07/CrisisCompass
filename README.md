# TravelTech: CrisisCompass
> **Real-Time Crisis Communication Platform for Tourists During Extreme Weather Events**

TravelTech CrisisCompass is a complete, modern, responsive full-stack emergency communication platform built to assist tourists during extreme weather crises such as flash floods, cyclones, storm surges, and severe meteorological disruptions.

---

## 🌟 Key Features

### ✅ MVP Features (Complete - January 2026)

1. **Tourist Registration & Profile Management** *(NEW)*
   - User account creation with email and language preferences
   - Support for 5 languages: English, Tamil, Hindi, French, Spanish
   - Persistent user profiles with destination tracking
   - Emergency contact information storage
   - Profile editing and account management

2. **Emergency SOS & Incident Reporting** *(NEW)*
   - One-click emergency SOS button with automatic location sharing
   - Comprehensive incident/hazard reporting form
   - Citizen-sourced hazard information system
   - Severity classification (Low, Moderate, High, Critical)
   - Incident type categorization (floods, cyclones, storms, etc.)
   - Report history and tracking

3. **Safe Route Navigation** *(NEW)*
   - Hazard-aware route calculation avoiding danger zones
   - Distance and time estimation (walking/driving modes)
   - Safety score computation (0-100%)
   - Waypoint generation for alternate routes
   - Real-time hazard intersection detection
   - Safety recommendations and warnings

4. **Authority Dashboard** *(NEW)*
   - Real-time incident verification and resolution workflow
   - SOS request management and emergency response coordination
   - Dashboard statistics and KPIs
   - Incident filtering by status (unverified, verified, resolved)
   - Expedited response tracking

### Original Features (Already Complete)

5. **Weather Dashboard & Forecast Analytics**
   - Live meteorological data from **Open-Meteo** (Temperature, Precipitation, Wind Speed, Relative Humidity, WMO conditions).
   - Multi-day trend charts powered by Recharts.
   - City and destination locator with graceful fallback to known tourist coordinates.
   - Honest data origin tracking (`live_weather_api` vs `cached_provider_data`).

6. **Interactive Safety Map (Leaflet & OpenStreetMap)**
   - Custom SVG-rendered markers for **Emergency Shelters (Green)**, **Hospitals (Red)**, and **Hazard Zones**.
   - Geometric polygon rendering for flood inundation buffers and exclusion zones.
   - Detailed popups displaying capacity, current occupancy, verification timestamp, and open/closed status.
   - Quick sector jump buttons (Chennai sector, Miami sector).

7. **Disaster Alerts & Source Verification Registry**
   - Severity-classified alerts: *Critical*, *High*, *Moderate*, *Low*.
   - Domain-level allowlisting (NOAA, IMD, MeteoAlarm, BMDI, WHO, Red Cross) with anti-SSRF protections.
   - Status classifications: `Official source`, `Verified`, `Unverified report`, and `Expired`.
   - Clear distinction for simulation records with explicit **DEMO DATA** badges.

8. **AI Emergency Assistant (Zero-Hallucination Fallback Mode)**
   - Chatbot interface answering critical queries on flash floods, cyclone protocols, shelter guidance, and contact numbers.
   - Deterministic rule-based safety engine ensuring no fabricated facts, emergency numbers, or false safety guarantees.
   - Citations with direct links to verified civil protection authorities.

9. **Multilingual Interface & Emergency Guidance**
   - Full support for **English**, **Tamil (தமிழ்)**, **Hindi (हिन्दी)**, **French (Français)**, and **Spanish (Español)**.
   - Pre-mapped safety guidance preserving exact emergency meanings.

---

## 📚 New MVP Feature Documentation

For detailed implementation information on the 4 new MVP features, see:

- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Feature-by-feature breakdown with API endpoints and database schema
- **[QUICKSTART.md](./QUICKSTART.md)** - Step-by-step testing guide with example workflows for each feature
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture, data flow diagrams, and technical decisions

### Quick Access to New Features

After running the app (see section below):

1. **Tourist Registration** → http://localhost:5173/register
2. **View/Edit Profile** → http://localhost:5173/profile
3. **Report Incident/SOS** → http://localhost:5173/report (SOS button always visible)
4. **Navigate Safe Routes** → http://localhost:5173/route
5. **Authority Dashboard** → http://localhost:5173/admin

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router 7, Leaflet & React Leaflet, Recharts, Lucide React.
- **Backend**: Python 3.13, FastAPI, Pydantic v2, HTTPX, SQLAlchemy (SQLite), Pytest.
- **Data Integrations**: Open-Meteo API (Free, no key required), OpenStreetMap tiles.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+) and npm
- Python (v3.10+)

### Backend Setup

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment configuration:
   ```bash
   copy ..\.env.example .env
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The API will be live at `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).*

### Frontend Setup

1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser.*

---

## 🧪 Running Automated Tests

### Backend Test Suite
Run unit and integration tests using pytest:
```bash
cd backend
$env:PYTHONPATH="."
.\venv\Scripts\pytest.exe -v
```
**Test coverage includes:**
- Health check API status
- Live and geocoded weather retrieval
- Alert normalization and schema validity
- Domain allowlisting and SSRF protection
- Emergency assistant deterministic responses and citations
- Backend configuration and service health

### Frontend Build Verification
Verify TypeScript types and production bundle compilation:
```bash
cd frontend
npm run build
```

---

## 📋 Data Origin & Demo Policy

To ensure transparency during academic and hackathon evaluations:
- `live_weather_api`: Retrieved directly in real-time from Open-Meteo.
- `simulated_demo_data`: Realistic synthetic alerts and shelters clearly badged with **DEMO DATA** to prevent real-world panic.
- `official_alert_feed`: Validated against authorized meteorological domain allowlists.
- `user_report`: Flagged as **Unverified Report** until verified by authorities.
