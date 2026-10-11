# TravelTech: CrisisCompass

> **Real-Time Crisis Communication Platform for Tourists During Extreme Weather Events**

<p align="center">
  <a href="https://crisiscompass-three.vercel.app/"><strong>🌐 Live Demo</strong></a>
  &nbsp; | &nbsp;
  <a href="https://drive.google.com/file/d/1zbRdURr4uSQKGRbOgbMhAnPK_ANGz2Dx/view?usp=sharing"><strong>🎥 Demo Video</strong></a>
</p>

TravelTech CrisisCompass is a modern, responsive, full-stack emergency communication platform designed to assist tourists during extreme weather events such as flash floods, cyclones, storm surges, and severe weather disruptions.

The platform brings together real-time weather information, disaster alerts, interactive safety maps, hazard-aware route planning, multilingual emergency guidance, AI-assisted safety information, and emergency reporting in one place.

**Note:** The live website provides the frontend experience. Features requiring backend connectivity depend on the availability and configuration of the deployed API.

---

##  Key Features

<<<<<<< HEAD
###  MVP Features
=======
### 1. Tourist Registration & Profile Management
>>>>>>> 64c426b (updated Readme)

- User account creation with email and language preferences.
- Multilingual support and persistent user profiles.
- Destination and emergency contact information management.
- Profile editing and account management.

### 2. Emergency SOS & Incident Reporting

- Emergency SOS interface with GPS-based location information.
- Incident and hazard reporting with descriptions and photographs.
- Hazard classification by type and severity.
- Report history and incident tracking.

### 3. Safe Route Navigation

- Hazard-aware route planning around mapped danger zones.
- Walking and driving modes.
- Route distance and estimated travel time.
- Hazard intersection analysis and safety recommendations.

### 4. Authority Dashboard

- Protected authority sign-in.
- Incident and SOS record management.
- Incident filtering and response tracking.
- Dashboard statistics and incident resolution workflows.

### 5. Weather Dashboard & Forecasts

- Current weather information from the Open-Meteo API.
- Temperature, rainfall, wind speed, and humidity.
- Weather forecasts and trend visualizations.
- Location search and weather data origin tracking.

### 6. Interactive Safety Map

- Interactive maps powered by Leaflet and OpenStreetMap.
- Map markers for shelters, healthcare facilities, and hazards.
- Flood bulletins and mapped hazard zones.
- Search and filtering of nearby safety resources.

### 7. Disaster Alerts & Source Verification

- Severity-based weather and disaster alerts.
- Search and filter alerts by category and location.
- Source information and recommended safety actions.
- Source allowlisting and protections against server-side request forgery (SSRF).
- Distinction between official information, unverified reports, and simulated demonstration data.

### 8. AI Emergency Assistant

- Conversational guidance for floods, cyclones, shelters, and emergency contacts.
- Rule-based safety responses and emergency protocols.
- References to relevant safety sources.
- Voice input and response playback where supported.

### 9. Multilingual Emergency Guidance

- Language preferences for emergency information.
- Support for English, Tamil, Hindi, French, and Spanish in the documented language configuration.
- Localized safety instructions designed to preserve important emergency guidance.

---

<<<<<<< HEAD
##  New MVP Feature Documentation
=======
## 🔗 Demo & Documentation
>>>>>>> 64c426b (updated Readme)

- **Live Website:** [CrisisCompass](https://crisiscompass-three.vercel.app/)
- **Demo Video:** [Watch the project demonstration on Google Drive](https://drive.google.com/file/d/1zbRdURr4uSQKGRbOgbMhAnPK_ANGz2Dx/view?usp=sharing)

### Additional Project Documentation

- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) — feature implementation, API endpoints, and database schema.
- [Quick Start Guide](./QUICKSTART.md) — local testing instructions and example workflows.
- [Architecture Documentation](./ARCHITECTURE.md) — system architecture, data flow, and technical decisions.

### Quick Access to Features

When running locally, the main routes include:

| Feature | Route |
|---|---|
| Registration | `/register` |
| Profile | `/profile` |
| Hazard Reporting & SOS | `/report` |
| Safe Route | `/route` |
| Authority Desk | `/admin` |
| Safety Map | `/map` |
| AI Copilot | `/assistant` |
| Live Alerts | `/alerts` |
| Sources & Status | `/settings` |

---

## 🏗️ Architecture & Technology Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router 7
- Leaflet and React Leaflet
- Recharts
- Lucide React

### Backend

- Python
- FastAPI
- Pydantic v2
- HTTPX
- SQLAlchemy
- SQLite
- Pytest

### External Integrations

- **Open-Meteo API:** Weather information and forecasts.
- **OpenStreetMap:** Map tiles and geographic visualization.
- **Leaflet:** Interactive map rendering.

### System Architecture

The React frontend provides the user interface and communicates with the FastAPI backend through HTTP API requests. The backend handles application logic, data processing, and database operations. SQLAlchemy provides database access, while SQLite is used for local data persistence.

External services supply weather and map information. The frontend and backend must be configured to communicate correctly in both local and production environments.

---

##  Getting Started

### Prerequisites

- Node.js 18 or later and npm.
- Python 3.10 or later, compatible with the project's dependencies.
- Git.

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_DIRECTORY>
```

Replace the placeholders with your actual repository URL and directory name.

### 2. Configure the Backend

Open a terminal in the project root:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
```

**macOS/Linux:**

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the environment variables using the project's environment example file, if available. Set secure values for `ADMIN_ACCESS_CODE` and `ADMIN_TOKEN_SECRET` before enabling the Authority Desk. Keep secrets out of version control.

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

The API should be available at:

- API: http://localhost:8000
- Interactive API documentation: http://localhost:8000/docs

### 3. Configure the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

For local development, configure the frontend API URL and Vite proxy according to the project's existing configuration.

---

## ☁️ Production Deployment

### Frontend — Vercel

The frontend is deployed on Vercel:

**Live URL:** https://crisiscompass-three.vercel.app/

### Backend — FastAPI

The FastAPI backend must also be deployed to a Python-compatible hosting service for production features that require server-side processing or persistent data.

Configure the frontend environment variable `VITE_API_BASE_URL` with the public backend API origin, if supported by the current frontend implementation. Configure the backend's `CORS_ALLOWED_ORIGINS` to include the deployed Vercel domain.

After changing Vercel environment variables, rebuild and redeploy the frontend.

**Important:** A Vercel frontend deployment alone does not guarantee that backend API endpoints are available. Verify the backend hosting URL, environment variables, database persistence, and API connectivity before relying on production functionality.

---

## 🧪 Testing & Build Verification

### Backend Tests

Activate the backend virtual environment and run:

```bash
cd backend
python -m pytest -v
```

The documented test areas include:

- Health checks and service configuration.
- Weather retrieval and geocoding.
- Alert normalization and schema validation.
- Source allowlisting and SSRF protection.
- Emergency assistant responses and citations.

### Frontend Production Build

```bash
cd frontend
npm run build
```

This verifies the frontend production build and applicable TypeScript checks configured in the project.

---

<<<<<<< HEAD
##  Data Origin & Demo Policy
=======
## 📋 Data Origin & Safety
>>>>>>> 64c426b (updated Readme)

CrisisCompass distinguishes between different types of information:

- **Live weather data:** Information retrieved from the Open-Meteo API.
- **Demonstration data:** Simulated records used to demonstrate application features.
- **Official alert sources:** Information attributed to configured trusted sources.
- **User-submitted reports:** Reports that may require verification before being treated as confirmed incidents.

Map listings and shelter availability may be incomplete or unverified. Users should confirm local conditions and follow official emergency instructions.

**Emergency disclaimer:** CrisisCompass is an informational support tool, not a replacement for official emergency services. In India, call **112** for immediate emergency assistance. Do not assume that submitting an SOS through the application automatically dispatches emergency responders.

---

## 👥 Contributors

See the repository's contributor history and existing contributor information.

---
