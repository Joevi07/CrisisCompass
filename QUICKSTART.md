# CrisisCompass MVP - Quick Start Guide

## ✅ What's Implemented

All **6 MVP features** are complete and ready for testing:

1. ✅ **Tourist Registration & Language Preference** - User accounts with 5-language support
2. ✅ **Real-time Alert Integration** - Live weather alerts from Open-Meteo API  
3. ✅ **Multilingual Alert Translation** - Alerts translated to EN, TA, HI, FR, ES
4. ✅ **Interactive Hazard & Shelter Map** - Leaflet map with hazard zones and facilities
5. ✅ **Safe-Route Guidance & SOS** - Emergency location sharing + hazard-aware routing
6. ✅ **Authority Dashboard** - Admin panel for incident verification and alert publishing

---

## 🚀 Quick Start (30 seconds)

### Prerequisites
- Python 3.10+ installed
- Node.js 16+ installed
- Port 8000 (backend) and 5173 (frontend) available

### Start Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
✅ Server at `http://localhost:8000`  
📚 API Docs at `http://localhost:8000/docs`

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```
✅ App at `http://localhost:5173`

---

## 📱 Testing the Features

### Feature 1: Register a Tourist Account
**URL:** `http://localhost:5173/register`

1. Click "Register" button
2. Fill in:
   - Email: `tourist@example.com`
   - Full Name: `John Doe`
   - Destination: `Chennai, India`
   - Language: `Tamil` (or any of 5 languages)
   - Phone: Optional
   - Emergency Contact: Optional
3. Click "Register"
4. You'll be redirected to your profile page
5. Your **User ID** is saved to localStorage

**Check it worked:**
- Navigate to `/profile` to see your saved profile
- Edit any field and click "Save"

---

### Feature 2: Multilingual Alerts & Map
**URL:** `http://localhost:5173/alerts`

1. See live weather alerts for your destination
2. Click language dropdown (top-right) to switch languages
3. Alerts automatically translate to selected language
4. See alert details: location, severity, recommendations

**URL:** `http://localhost:5173/map`

1. View interactive map with:
   - 🟥 Red zones = Hazards (flood, cyclone, storm)
   - 🏥 Green markers = Hospitals
   - 🏠 Blue markers = Shelters
2. Click markers for details
3. Zoom and pan to explore your destination

---

### Feature 3: SOS & Incident Reporting
**URL:** `http://localhost:5173/report`

#### Submit SOS (Emergency)
1. Click the **red SOS button** (bottom-right corner)
2. Allow location access when prompted
3. Optionally add emergency message
4. Click "Send SOS"
5. ✅ Your location is shared with emergency services

#### Report Incident/Hazard
1. Click "Report Incident" button
2. Fill in:
   - Title: "Flooding in Market"
   - Description: "Water level rising near central market"
   - Type: Select hazard type (flood, cyclone, etc.)
   - Severity: Low/Moderate/High/Critical
   - Photo URL: Optional
3. Click "Submit Report"
4. ✅ Report appears in "Your Reported Incidents" section

---

### Feature 4: Safe Route Navigation
**URL:** `http://localhost:5173/route`

1. **Auto-detection:** Starting location is auto-filled from your device
2. Enter destination:
   - Example: `13.1939, 80.2109` (South Chennai)
3. Select mode: Walking or Driving
4. Click "Calculate Safe Route"
5. View results:
   - 📏 Distance in km
   - ⏱️ Estimated time
   - 🛡️ Safety score (0-100%)
   - ⚠️ Number of hazards on direct route
   - 📍 Waypoints to take (if hazards detected)
   - 💡 Safety recommendations

**Example:** If the direct route passes through a flooded area:
- Route distance increases (detour factor applied)
- Safety score drops
- Alternative waypoints shown
- Warning message displayed

---

### Feature 5: Citizen Incident Reporting
*(Covered in Feature 3)*

- Go to `/report`
- Submit incidents about local hazards
- Your reports help the authority dashboard
- See your report history in the same page

---

### Feature 6: Authority Dashboard
**URL:** `http://localhost:5173/admin`

#### View Statistics
- Total users in system
- Incident counts (unverified, verified, resolved)
- Active SOS requests
- Critical hazards detected

#### Manage Incidents
1. View all incident reports
2. Filter by status: All, Unverified, Verified, Resolved
3. Click incident to expand details:
   - Location coordinates
   - Reporter ID
   - Full description
4. Actions:
   - **Verify** - Mark incident as verified (if unverified)
   - **Resolve** - Mark incident as resolved

#### Manage SOS Requests
1. See real-time active SOS alerts
2. Click "Mark Resolved" after responding
3. Auto-refreshes every 30 seconds

---

## 🧪 Test Workflow

### Complete End-to-End Test (5 minutes)

1. **Register Account**
   - Go to `/register`
   - Create account for "Test User"
   - Copy your User ID

2. **Submit SOS Alert**
   - Go to `/report`
   - Click red SOS button
   - Allow location access
   - Send SOS with message "Testing emergency system"

3. **Authority Response**
   - Go to `/admin` (in same or another browser tab)
   - See new SOS in "Active SOS Requests"
   - Click "Mark Resolved" after 10 seconds

4. **Report Incident**
   - Go back to `/report`
   - Click "Report Incident"
   - Fill details about a fake hazard
   - Submit report

5. **Verify in Authority Dashboard**
   - Go to `/admin`
   - See new incident in "Incident Reports"
   - Click to expand
   - Click "Verify" button
   - Status changes to "Verified"

6. **Calculate Safe Route**
   - Go to `/route`
   - Try different destination coordinates
   - See safety scores based on hazard zones

---

## 📊 API Examples

### Register User
```bash
curl -X POST http://localhost:8000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "full_name": "Test User",
    "destination": "Chennai",
    "language_preference": "en"
  }'
```

### Submit SOS
```bash
curl -X POST "http://localhost:8000/api/sos?user_id=abc-123" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 13.0827,
    "longitude": 80.2707,
    "message": "Help needed!"
  }'
```

### Get Dashboard Stats
```bash
curl http://localhost:8000/api/admin/stats
```

### Calculate Safe Route
```bash
curl -X POST http://localhost:8000/api/route/safe \
  -H "Content-Type: application/json" \
  -d '{
    "start_lat": 13.0827,
    "start_lng": 80.2707,
    "end_lat": 13.1939,
    "end_lng": 80.2109,
    "mode": "walking"
  }'
```

---

## 🔧 Troubleshooting

### "Port 8000 already in use"
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9  # macOS/Linux
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process  # Windows
```

### "Database locked" error
```bash
# Remove old database
rm backend/crisis_compass.db
# Restart backend
```

### Location not sharing in browser
- Make sure to click "Allow" on browser permission prompt
- Use `https://` or `localhost` (not IP address)
- Check browser privacy settings

### Frontend shows blank page
```bash
# Clear cache and reinstall
rm -rf frontend/node_modules
npm install
npm run dev
```

---

## 📁 Key Files Changed

**Backend:**
- `backend/app/database.py` - Added 3 new tables (users, incidents, sos_requests)
- `backend/app/services/user_service.py` - User, incident, SOS business logic
- `backend/app/services/routing_service.py` - Hazard-aware route calculation
- `backend/app/api/endpoints.py` - 30+ new API endpoints
- `backend/app/models/schemas.py` - Data validation schemas

**Frontend:**
- `frontend/src/pages/RegistrationPage.tsx` - User registration
- `frontend/src/pages/ProfilePage.tsx` - User profile management
- `frontend/src/pages/ReportPage.tsx` - SOS & incident reporting
- `frontend/src/pages/RoutePage.tsx` - Safe route calculator
- `frontend/src/pages/AdminDashboard.tsx` - Authority management panel
- `frontend/src/App.tsx` - Integrated new routes

---

## 🎯 Next Steps

1. **Test all features** using the guides above
2. **Provide feedback** on UI/UX
3. **Submit production issues** with details
4. **Plan integrations** for:
   - Real SMS/Push notifications
   - Government emergency APIs
   - Cloud storage for photos
   - WebSocket for real-time updates

---

## 📞 Support

For issues or questions:
1. Check API docs: `http://localhost:8000/docs`
2. View server logs in terminal
3. Check browser console (F12)
4. Check database: `backend/crisis_compass.db`

---

**Status:** ✅ MVP Ready for Testing  
**Last Updated:** January 2026  
**Branch:** `Joe-features`
