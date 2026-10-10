import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MapPin, Phone, Send } from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  incident_type: string;
  severity: string;
  status: string;
  created_at: string;
}

export default function ReportPage() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);

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
      
      setSuccess('SOS request sent! Emergency services are being notified.');
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
      setSuccess('Incident reported successfully! Thank you for your contribution.');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Emergency SOS Button (Fixed Position) */}
        <button
          onClick={() => setShowSOSModal(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-red-600 text-white rounded-full shadow-xl hover:bg-red-700 flex items-center justify-center transform hover:scale-110 transition z-40"
          title="Emergency SOS"
        >
          <AlertCircle className="w-8 h-8" />
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Safety Reporting</h1>
          <p className="text-gray-600">
            Report incidents or emergencies to help protect yourself and other travelers
          </p>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-start gap-3">
            <div className="flex-1">{success}</div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setShowSOSModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center gap-3 transform hover:scale-105 transition"
          >
            <Phone className="w-6 h-6" />
            <div>
              <div className="text-lg">Emergency SOS</div>
              <div className="text-sm font-normal">Send distress signal</div>
            </div>
          </button>

          <button
            onClick={() => setShowIncidentForm(!showIncidentForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center gap-3 transform hover:scale-105 transition"
          >
            <MapPin className="w-6 h-6" />
            <div>
              <div className="text-lg">Report Incident</div>
              <div className="text-sm font-normal">Share hazard information</div>
            </div>
          </button>
        </div>

        {/* Incident Report Form */}
        {showIncidentForm && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Report an Incident</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Incident Title *
                </label>
                <input
                  type="text"
                  value={incidentData.title}
                  onChange={(e) => setIncidentData({ ...incidentData, title: e.target.value })}
                  placeholder="e.g., Flooding in Market Area"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={incidentData.description}
                  onChange={(e) => setIncidentData({ ...incidentData, description: e.target.value })}
                  placeholder="Describe what you've observed..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Incident Type
                  </label>
                  <select
                    value={incidentData.incident_type}
                    onChange={(e) => setIncidentData({ ...incidentData, incident_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="flood">Flood</option>
                    <option value="cyclone">Cyclone</option>
                    <option value="storm">Storm</option>
                    <option value="heavy_rain">Heavy Rain</option>
                    <option value="tsunami">Tsunami</option>
                    <option value="heatwave">Heatwave</option>
                    <option value="restricted">Restricted Area</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={incidentData.severity}
                    onChange={(e) => setIncidentData({ ...incidentData, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo URL (optional)
                </label>
                <input
                  type="url"
                  value={incidentData.photo_url}
                  onChange={(e) => setIncidentData({ ...incidentData, photo_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleReportIncident}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
                <button
                  onClick={() => setShowIncidentForm(false)}
                  className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Incidents */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Reported Incidents</h2>
          
          {incidents.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No incidents reported yet</p>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div key={incident.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{incident.title}</h3>
                      <p className="text-sm text-gray-600">{incident.incident_type}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      incident.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                      incident.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                      incident.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {incident.severity}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{incident.description}</p>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>
                      Status: <span className="font-medium capitalize">{incident.status}</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-gray-900">EMERGENCY SOS</h2>
              <p className="text-gray-600 mt-2">
                Your location will be shared with emergency services
              </p>
            </div>

            {userLocation && (
              <div className="mb-4 p-3 bg-blue-100 rounded-lg text-sm text-blue-800">
                <strong>Location:</strong> {userLocation.lat.toFixed(4)}°, {userLocation.lng.toFixed(4)}°
              </div>
            )}

            <textarea
              value={sosData.message}
              onChange={(e) => setSosData({ message: e.target.value })}
              placeholder="Describe your emergency (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex gap-2">
              <button
                onClick={handleSOS}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                {loading ? 'Sending...' : 'Send SOS'}
              </button>
              <button
                onClick={() => setShowSOSModal(false)}
                className="px-4 py-3 bg-gray-400 text-white rounded-md hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Emergency services and your emergency contacts will be notified immediately
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
