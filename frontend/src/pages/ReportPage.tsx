import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MapPin, Phone, Camera, CheckCircle2, Share2, ShieldAlert, PhoneCall } from 'lucide-react';
import { IncidentReport } from '../types';

export default function ReportPage() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);

  // Check-in state
  const [checkInStatus, setCheckInStatus] = useState<'Safe' | 'Need Assistance' | 'Evacuated'>('Safe');
  const [checkInNote, setCheckInNote] = useState('');
  const [checkInMessage, setCheckInMessage] = useState('');

  const [sosData, setSosData] = useState({
    message: ''
  });

  const [incidentData, setIncidentData] = useState({
    title: '',
    description: '',
    incident_type: 'other',
    severity: 'Moderate',
    photo_url: ''
  });

  useEffect(() => {
    if (!userId) {
      navigate('/register');
      return;
    }
    
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Location error:', error)
      );
    }
    
    // Fetch user's incidents
    fetchIncidents();
  }, [userId]);

  const fetchIncidents = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/users/${userId}/incidents`);
      if (response.ok) {
        const data = await response.json();
        setIncidents(data);
      }
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image file must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setIncidentData(prev => ({ ...prev, photo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSOS = async () => {
    if (!userLocation) {
      setError('Could not get your location. Please enable location services.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:8000/api/sos?user_id=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          message: sosData.message || 'Emergency SOS request'
        }),
      });

      if (!response.ok) throw new Error('Failed to send SOS');
      
      setSuccess('SOS request sent! Recorded in authority queue. Dial 112 for immediate dispatch.');
      setSosData({ message: '' });
      setShowSOSModal(false);
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReportIncident = async () => {
    if (!userLocation) {
      setError('Could not get your location. Please enable location services.');
      return;
    }

    if (!incidentData.title || !incidentData.description) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:8000/api/incidents?user_id=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: incidentData.title,
          description: incidentData.description,
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          incident_type: incidentData.incident_type,
          severity: incidentData.severity,
          photo_url: incidentData.photo_url
        }),
      });

      if (!response.ok) throw new Error('Failed to report incident');
      
      const newIncident = await response.json();
      setIncidents([newIncident, ...incidents]);
      setSuccess('Incident reported successfully! Tagged with GPS and photograph.');
      setIncidentData({
        title: '',
        description: '',
        incident_type: 'other',
        severity: 'Moderate',
        photo_url: ''
      });
      setShowIncidentForm(false);
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInGenerate = () => {
    const locStr = userLocation ? `GPS: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Location shared';
    const msg = `CRISISCOMPASS SAFETY CHECK-IN:\nStatus: ${checkInStatus.toUpperCase()}\n${checkInNote ? `Note: ${checkInNote}\n` : ''}${locStr}\nTimestamp: ${new Date().toLocaleString()}`;
    setCheckInMessage(msg);
  };

  const handleShareCheckIn = async (platform: 'whatsapp' | 'copy') => {
    if (!checkInMessage) return;
    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(checkInMessage)}`, '_blank');
    } else {
      await navigator.clipboard.writeText(checkInMessage);
      setSuccess('Safety check-in message copied to clipboard!');
      setTimeout(() => setSuccess(''), 4000);
    }
  };

  const emergencyContacts = [
    { title: 'National Emergency', number: '112', desc: 'Universal Police, Fire & Medical' },
    { title: 'Ambulance / Medical', number: '108', desc: 'Emergency Medical Dispatch' },
    { title: 'Police Assistance', number: '100', desc: 'Local Law Enforcement' },
    { title: 'Fire Services', number: '101', desc: 'Fire rescue and extraction' },
    { title: 'Disaster Management', number: '1070', desc: 'State Disaster Response Force' },
    { title: 'District Control Room', number: '1077', desc: 'District Collectorate Alert Desk' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Floating Emergency SOS Button */}
        <button
          onClick={() => setShowSOSModal(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-red-600 text-white rounded-full shadow-2xl hover:bg-red-700 flex items-center justify-center transform hover:scale-110 transition z-40"
          title="Emergency SOS"
        >
          <AlertCircle className="w-8 h-8 animate-pulse" />
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h1 className="text-3xl font-black text-gray-900 mb-2">SOS Rescue & Incident Reporting</h1>
          <p className="text-gray-600 text-sm">
            Report extreme weather hazards with GPS and photos, send SOS rescue alerts, share safety check-ins, or access emergency helplines.
          </p>
        </div>

        {/* Messages */}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg flex items-center gap-3 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1">{success}</div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-300 text-red-800 rounded-lg flex items-start gap-3 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setShowSOSModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-5 rounded-xl shadow-lg flex flex-col items-center justify-center text-center gap-2 transform hover:scale-[1.02] transition"
          >
            <Phone className="w-7 h-7" />
            <div>
              <div className="text-base font-extrabold">Emergency SOS</div>
              <div className="text-xs font-normal text-red-100">Broadcast distress signal</div>
            </div>
          </button>

          <button
            onClick={() => setShowIncidentForm(!showIncidentForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-5 rounded-xl shadow-lg flex flex-col items-center justify-center text-center gap-2 transform hover:scale-[1.02] transition"
          >
            <MapPin className="w-7 h-7" />
            <div>
              <div className="text-base font-extrabold">Report Hazard</div>
              <div className="text-xs font-normal text-blue-100">Attach photo & GPS location</div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowCheckInModal(true);
              handleCheckInGenerate();
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-5 rounded-xl shadow-lg flex flex-col items-center justify-center text-center gap-2 transform hover:scale-[1.02] transition"
          >
            <CheckCircle2 className="w-7 h-7" />
            <div>
              <div className="text-base font-extrabold">Tourist Check-In</div>
              <div className="text-xs font-normal text-emerald-100">Share "I am Safe" status</div>
            </div>
          </button>
        </div>

        {/* Emergency Helplines Directory */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-red-600" />
            Official Emergency Helpline Directory (India)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {emergencyContacts.map((contact, idx) => (
              <a
                key={idx}
                href={`tel:${contact.number}`}
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-xl transition group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-red-700">{contact.title}</div>
                  <div className="text-[11px] text-slate-500">{contact.desc}</div>
                </div>
                <span className="text-sm font-black text-red-600 bg-red-100 group-hover:bg-red-600 group-hover:text-white px-2.5 py-1 rounded-lg transition">
                  {contact.number}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Incident Report Form */}
        {showIncidentForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Submit Verified Incident Report</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Incident Title *
                </label>
                <input
                  type="text"
                  value={incidentData.title}
                  onChange={(e) => setIncidentData({ ...incidentData, title: e.target.value })}
                  placeholder="e.g., Road flooded near Beach Road"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={incidentData.description}
                  onChange={(e) => setIncidentData({ ...incidentData, description: e.target.value })}
                  placeholder="Describe flood depth, road blockage, or stranded persons..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Incident Type
                  </label>
                  <select
                    value={incidentData.incident_type}
                    onChange={(e) => setIncidentData({ ...incidentData, incident_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="flood">Flood Inundation</option>
                    <option value="cyclone">Cyclone / Storm Damage</option>
                    <option value="storm">Severe Storm</option>
                    <option value="heavy_rain">Heavy Rainfall</option>
                    <option value="tsunami">Tsunami / High Surge</option>
                    <option value="heatwave">Heatwave</option>
                    <option value="restricted">Blocked Road / Restricted</option>
                    <option value="other">Other Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={incidentData.severity}
                    onChange={(e) => setIncidentData({ ...incidentData, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload Component */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Attach Photograph (Optional)
                </label>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-300 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-600" />
                    Choose Image File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-400">or enter image URL below</span>
                </div>
                <input
                  type="url"
                  value={incidentData.photo_url}
                  onChange={(e) => setIncidentData({ ...incidentData, photo_url: e.target.value })}
                  placeholder="https://... or select file above"
                  className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {incidentData.photo_url && (
                  <div className="mt-3">
                    <span className="text-xs font-semibold text-slate-600">Photo Preview:</span>
                    <img
                      src={incidentData.photo_url}
                      alt="Preview"
                      className="mt-1 h-32 w-auto object-cover rounded-lg border border-slate-200"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleReportIncident}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition text-sm disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
                <button
                  onClick={() => setShowIncidentForm(false)}
                  className="px-4 py-2.5 bg-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-400 text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Incidents List */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Reported Hazards</h2>
          
          {incidents.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">No incident reports submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div key={incident.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-sm transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{incident.title}</h3>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{incident.incident_type}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      incident.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                      incident.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                      incident.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {incident.severity}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-3">{incident.description}</p>
                  
                  {incident.photo_url && (
                    <div className="mb-3">
                      <img
                        src={incident.photo_url}
                        alt="Incident Evidence"
                        className="h-40 w-auto object-cover rounded-lg border border-slate-200"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-slate-100">
                    <span>
                      Status: <span className="font-bold text-slate-700 capitalize">{incident.status}</span> ({incident.verification_status})
                    </span>
                    <span>
                      {new Date(incident.created_at).toLocaleDateString()} at{' '}
                      {new Date(incident.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SOS Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-red-100">
            <div className="text-center mb-4">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-2 animate-bounce" />
              <h2 className="text-2xl font-black text-gray-900">EMERGENCY SOS</h2>
              <p className="text-xs text-gray-600 mt-1">
                Your GPS coordinates will be sent to the CrisisCompass authority desk.
              </p>
            </div>

            {userLocation && (
              <div className="mb-4 p-3 bg-red-50 rounded-xl text-xs text-red-800 border border-red-200 font-mono">
                <strong>Current GPS:</strong> {userLocation.lat.toFixed(5)}°, {userLocation.lng.toFixed(5)}°
              </div>
            )}

            <textarea
              value={sosData.message}
              onChange={(e) => setSosData({ message: e.target.value })}
              placeholder="Describe emergency (e.g., Stranded near beach road, flood level rising)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex gap-2">
              <button
                onClick={handleSOS}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                {loading ? 'Sending SOS...' : 'Send SOS Alert'}
              </button>
              <button
                onClick={() => setShowSOSModal(false)}
                className="px-4 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 text-sm cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <a
                href="tel:112"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:underline"
              >
                <PhoneCall className="w-3.5 h-3.5" /> Direct Call National Emergency: 112
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tourist Safety Check-In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-emerald-100">
            <div className="text-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h2 className="text-2xl font-black text-gray-900">Tourist Safety Check-In</h2>
              <p className="text-xs text-gray-600 mt-1">
                Broadcast your current status & coordinates to family or travel companions.
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Current Status</label>
                <select
                  value={checkInStatus}
                  onChange={(e) => {
                    setCheckInStatus(e.target.value as any);
                    setTimeout(handleCheckInGenerate, 50);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Safe">SAFE & OK</option>
                  <option value="Evacuated">EVACUATED TO SHELTER</option>
                  <option value="Need Assistance">NEED ASSISTANCE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Custom Note (Optional)</label>
                <input
                  type="text"
                  value={checkInNote}
                  onChange={(e) => {
                    setCheckInNote(e.target.value);
                    setTimeout(handleCheckInGenerate, 50);
                  }}
                  placeholder="e.g. Staying at Anna Nagar Relief Center"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs whitespace-pre-line text-slate-700">
                {checkInMessage || 'Generating safety status message...'}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleShareCheckIn('whatsapp')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp Share
              </button>
              <button
                onClick={() => handleShareCheckIn('copy')}
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-3 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Copy Text
              </button>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="px-3 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
