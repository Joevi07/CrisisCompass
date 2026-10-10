import { useState, useEffect } from 'react';
import { BarChart3, AlertTriangle, CheckCircle, Clock, Users, Phone } from 'lucide-react';

interface Incident {
  id: string;
  user_id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  incident_type: string;
  severity: string;
  status: string;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

interface SOSRequest {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  status: string;
  message?: string;
  created_at: string;
}

interface DashboardStats {
  total_incidents: number;
  unverified_incidents: number;
  verified_incidents: number;
  resolved_incidents: number;
  active_sos_requests: number;
  critical_hazards: number;
  total_users: number;
}

export default function AdminDashboard() {
  const adminId = localStorage.getItem('adminId') || 'admin-001';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [sosRequests, setSosRequests] = useState<SOSRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch stats
      const statsRes = await fetch('http://localhost:8000/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch incidents
      const incidentsRes = await fetch('http://localhost:8000/api/admin/incidents');
      if (incidentsRes.ok) {
        const incidentsData = await incidentsRes.json();
        setIncidents(incidentsData);
      }

      // Fetch SOS requests
      const sosRes = await fetch('http://localhost:8000/api/admin/sos/active');
      if (sosRes.ok) {
        const sosData = await sosRes.json();
        setSosRequests(sosData);
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIncident = async (incidentId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/incidents/${incidentId}/verify?admin_id=${adminId}`,
        { method: 'PUT' }
      );

      if (response.ok) {
        setIncidents(incidents.map(i =>
          i.id === incidentId ? { ...i, status: 'verified', verification_status: 'verified' } : i
        ));
        setSelectedIncident(null);
      }
    } catch (err) {
      console.error('Failed to verify incident:', err);
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/incidents/${incidentId}/resolve?admin_id=${adminId}`,
        { method: 'PUT' }
      );

      if (response.ok) {
        setIncidents(incidents.map(i =>
          i.id === incidentId ? { ...i, status: 'resolved' } : i
        ));
        setSelectedIncident(null);
      }
    } catch (err) {
      console.error('Failed to resolve incident:', err);
    }
  };

  const handleResolveSOS = async (sosId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/sos/${sosId}/resolve?admin_id=${adminId}`,
        { method: 'PUT' }
      );

      if (response.ok) {
        setSosRequests(sosRequests.filter(s => s.id !== sosId));
      }
    } catch (err) {
      console.error('Failed to resolve SOS:', err);
    }
  };

  const filteredIncidents = incidents.filter(i => {
    if (filterStatus === 'all') return true;
    return i.status === filterStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'verified': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Authority Dashboard</h1>
          </div>
          <p className="text-gray-600">
            Manage incidents, verify reports, and coordinate emergency responses
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_users}</p>
                </div>
                <Users className="w-10 h-10 text-blue-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Incidents</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_incidents}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-yellow-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active SOS</p>
                  <p className="text-3xl font-bold text-red-600">{stats.active_sos_requests}</p>
                </div>
                <Phone className="w-10 h-10 text-red-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Critical Hazards</p>
                  <p className="text-3xl font-bold text-red-600">{stats.critical_hazards}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-red-600 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Stats Breakdown */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Incident Status</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Unverified</span>
                  <span className="font-bold text-yellow-600">{stats.unverified_incidents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Verified</span>
                  <span className="font-bold text-blue-600">{stats.verified_incidents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Resolved</span>
                  <span className="font-bold text-green-600">{stats.resolved_incidents}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active SOS Requests */}
        {sosRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-6 h-6 text-red-600" />
              Active SOS Requests ({sosRequests.length})
            </h2>
            
            <div className="space-y-3">
              {sosRequests.map((sos) => (
                <div key={sos.id} className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Emergency SOS from User {sos.user_id.substring(0, 8)}...
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Location: {sos.latitude.toFixed(4)}°N, {sos.longitude.toFixed(4)}°E
                      </p>
                      {sos.message && (
                        <p className="text-sm text-gray-700 mt-2">Message: {sos.message}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Submitted: {new Date(sos.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleResolveSOS(sos.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incident Management */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            Incident Reports ({filteredIncidents.length})
          </h2>

          {/* Filter */}
          <div className="mb-6 flex gap-2">
            {['all', 'unverified', 'verified', 'resolved'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Incidents List */}
          {filteredIncidents.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No incidents found</p>
          ) : (
            <div className="space-y-4">
              {filteredIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition hover:shadow-md ${
                    getSeverityColor(incident.severity)
                  }`}
                  onClick={() => setSelectedIncident(selectedIncident === incident.id ? null : incident.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{incident.title}</h3>
                      <p className="text-sm text-gray-600">{incident.incident_type}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(incident.status)}`}>
                        {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-white">
                        {incident.severity}
                      </span>
                    </div>
                  </div>

                  {selectedIncident === incident.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                        <p className="text-gray-700">{incident.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Location</p>
                          <p className="text-sm font-mono">
                            {incident.latitude.toFixed(4)}°N, {incident.longitude.toFixed(4)}°E
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Reporter</p>
                          <p className="text-sm font-mono">{incident.user_id.substring(0, 12)}...</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600 mb-1">Submitted</p>
                        <p className="text-sm">{new Date(incident.created_at).toLocaleString()}</p>
                      </div>

                      {incident.status !== 'resolved' && (
                        <div className="flex gap-2 pt-2">
                          {incident.status === 'unverified' && (
                            <button
                              onClick={() => handleVerifyIncident(incident.id)}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                            >
                              <CheckCircle className="w-4 h-4 inline mr-1" />
                              Verify
                            </button>
                          )}
                          <button
                            onClick={() => handleResolveIncident(incident.id)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                          >
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            Resolve
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
