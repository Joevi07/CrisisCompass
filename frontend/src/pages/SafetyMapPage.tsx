import React, { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Facility, HazardZone, WeatherResponse } from '../types';
import { AlertTriangle, Hospital, Layers, LocateFixed, RefreshCw, Search, Home } from 'lucide-react';
import { fetchWithOfflineFallback } from '../utils/offlineCache';

const createCustomIcon = (bgColor: string, text: string) => L.divIcon({
  className: 'custom-map-icon',
  html: `<div style="background-color:${bgColor};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px;box-shadow:0 4px 6px rgba(0,0,0,.3);border:2px solid white">${text}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const shelterIcon = createCustomIcon('#10b981', '⌂');
const hospitalIcon = createCustomIcon('#ef4444', '+');

export const SafetyMapPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [hazards, setHazards] = useState<HazardZone[]>([]);
  const [center, setCenter] = useState<[number, number]>([22.5, 79.0]);
  const [zoom, setZoom] = useState(5);
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'shelter' | 'hospital'>('all');
  const [showHazards, setShowHazards] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationLabel, setLocationLabel] = useState('India overview');
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');

  const loadMapData = useCallback(async (latitude: number, longitude: number) => {
    setLoading(true);
    setWarning('');
    const key = `${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
    const params = `latitude=${latitude}&longitude=${longitude}`;
    const [facilityResult, hazardResult] = await Promise.allSettled([
      fetchWithOfflineFallback<Facility[]>(`/api/map/nearby?${params}&radius_km=25`, `nearby_facilities_${key}`),
      fetchWithOfflineFallback<HazardZone[]>(`/api/map/hazards?${params}&radius_km=1500`, `nearby_hazards_${key}`),
    ]);
    if (facilityResult.status === 'fulfilled') setFacilities(facilityResult.value.data || []);
    if (hazardResult.status === 'fulfilled') setHazards(hazardResult.value.data || []);
    setWarning(facilityResult.status === 'rejected' || hazardResult.status === 'rejected'
      ? 'Some map layers could not refresh. Showing saved map data where available.' : '');
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('crisiscompass_map_center');
    if (saved) {
      try {
        const point = JSON.parse(saved) as [number, number];
        if (Number.isFinite(point[0]) && Number.isFinite(point[1])) {
          setCenter(point);
          setZoom(11);
          setLocationLabel('Last viewed location');
          return;
        }
      } catch { /* Use country overview when no valid saved center exists. */ }
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
          setZoom(11);
          setLocationLabel('Your current area');
        },
        () => { void loadMapData(22.5, 79.0); },
        { enableHighAccuracy: false, maximumAge: 300000, timeout: 7000 },
      );
    } else {
      void loadMapData(22.5, 79.0);
    }
  }, [loadMapData]);

  useEffect(() => {
    localStorage.setItem('crisiscompass_map_center', JSON.stringify(center));
    void loadMapData(center[0], center[1]);
  }, [center, loadMapData]);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setLoading(true);
    setWarning('');
    try {
      const result = await fetchWithOfflineFallback<WeatherResponse>(
        `/api/weather?location=${encodeURIComponent(query)}`,
        `location_search_${query.toLowerCase()}`,
      );
      setCenter([result.data.current.latitude, result.data.current.longitude]);
      setZoom(11);
      setLocationLabel(result.data.current.location_name);
    } catch {
      setWarning('Could not locate that place. Connect to the internet or open a location searched on this device before.');
      setLoading(false);
    }
  };

  const filteredFacilities = facilities.filter((facility) => facilityFilter === 'all' || facility.facility_type === facilityFilter);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-black text-slate-900"><Layers className="h-5 w-5 text-emerald-600" />Safety Map</h1>
            <p className="text-xs text-slate-500">Search any mapped place in India or nearby countries; hazard feed and community-mapped facilities update when connected.</p>
          </div>
          <form onSubmit={handleSearch} className="flex w-full gap-2 lg:max-w-xl">
            <input aria-label="Search a place" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search a city, district, village, or border area" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <button disabled={loading} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0F4C5C] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"><Search className="h-4 w-4" />Search</button>
            <button type="button" title="Refresh nearby data" onClick={() => void loadMapData(center[0], center[1])} className="rounded-xl border border-slate-300 p-2 text-slate-700"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
          </form>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 font-semibold"><LocateFixed className="h-3.5 w-3.5" />{locationLabel}</span>
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
            <span>Facilities</span>
            <select value={facilityFilter} onChange={(event) => setFacilityFilter(event.target.value as typeof facilityFilter)} className="bg-transparent font-medium">
              <option value="all">All</option><option value="shelter">Shelters</option><option value="hospital">Healthcare</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={showHazards} onChange={(event) => setShowHazards(event.target.checked)} />Show flood reports</label>
          <span>{loading ? 'Refreshing data…' : lastUpdated ? `Checked ${lastUpdated}` : 'Saved data may be shown offline'}</span>
        </div>
        {warning && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{warning}</p>}
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-[min(70vh,680px)] min-h-[420px] w-full">
          <MapContainer center={center} zoom={zoom} scrollWheelZoom style={{ height: '100%', width: '100%' }} key={`${center[0]}-${center[1]}-${zoom}`}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filteredFacilities.map((facility) => (
              <Marker key={facility.id} position={[facility.latitude, facility.longitude]} icon={facility.facility_type === 'shelter' ? shelterIcon : hospitalIcon}>
                <Popup>
                  <div className="max-w-xs p-1">
                    <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase">{facility.facility_type}</span>
                    <h2 className="mt-2 font-bold">{facility.name}</h2>
                    <p className="text-xs">{facility.address}</p>
                    {facility.contact_number && <p className="mt-1 text-xs">Phone: {facility.contact_number}</p>}
                    <p className="mt-2 text-xs text-amber-800">{facility.source_notes}</p>
                    <a className="mt-1 inline-block text-xs text-blue-700 underline" href={`https://www.openstreetmap.org/${facility.id.split('-').slice(1).join('/')}`} target="_blank" rel="noreferrer">Open map listing</a>
                  </div>
                </Popup>
              </Marker>
            ))}
            {showHazards && hazards.map((hazard) => (
              hazard.coordinates?.[0] && <CircleMarker
                key={hazard.id}
                center={hazard.coordinates[0] as [number, number]}
                radius={9}
                pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.25, weight: 2 }}
              >
                <Popup>
                  <div className="max-w-xs p-1">
                    <span className="rounded bg-red-100 px-2 py-1 text-[10px] font-bold uppercase text-red-800">{hazard.severity} flood alert</span>
                    <h2 className="mt-2 font-bold">{hazard.title}</h2>
                    <p className="text-xs">{hazard.description}</p>
                    <p className="mt-2 text-xs text-slate-600">Source: {hazard.source_organization} · {new Date(hazard.reported_at).toLocaleString()}</p>
                    <a href={hazard.source_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-blue-700 underline">Open original bulletin</a>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
        <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 bg-slate-900 p-4 text-xs text-white">
          <strong className="text-slate-300">Map legend:</strong>
          <span className="inline-flex items-center gap-1"><Home className="h-3.5 w-3.5 text-emerald-400" />Community-listed shelters</span>
          <span className="inline-flex items-center gap-1"><Hospital className="h-3.5 w-3.5 text-red-400" />Community-listed healthcare</span>
          <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-red-400" />GDACS flood bulletin</span>
          <span className="ml-auto text-slate-400">Facility availability is not verified. Confirm locally before relying on a listing.</span>
        </footer>
      </section>
    </div>
  );
};

