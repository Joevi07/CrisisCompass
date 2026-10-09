import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Facility, HazardZone } from '../types';
import { Shield, Home, Hospital, AlertTriangle, Navigation, RotateCcw, Filter, Layers } from 'lucide-react';

// Custom Map Markers using standard Leaflet DivIcon with inline SVG styling
const createCustomIcon = (bgColor: string, text: string) => {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div style="background-color: ${bgColor}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white;">
        ${text}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const shelterIcon = createCustomIcon('#10b981', '🏠');
const hospitalIcon = createCustomIcon('#ef4444', '🏥');
const floodIcon = createCustomIcon('#3b82f6', '🌊');
const cycloneIcon = createCustomIcon('#8b5cf6', '🌀');
const dangerIcon = createCustomIcon('#dc2626', '⚠️');

export const SafetyMapPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [hazards, setHazards] = useState<HazardZone[]>([]);
  const [center, setCenter] = useState<[number, number]>([13.0827, 80.2707]); // Default Chennai
  const [zoom] = useState(12);
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'shelter' | 'hospital'>('all');
  const [showHazards, setShowHazards] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadMapData = async () => {
    try {
      const fRes = await fetch('/api/map/shelters');
      if (fRes.ok) {
        const fData = await fRes.json();
        setFacilities(fData);
      }

      const hRes = await fetch('/api/map/hazards');
      if (hRes.ok) {
        const hData = await hRes.json();
        setHazards(hData);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Failed to load map data:', e);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  const handleCenterChennai = () => {
    setCenter([13.0827, 80.2707]);
  };

  const handleCenterMiami = () => {
    setCenter([25.7617, -80.1918]);
  };

  const filteredFacilities = facilities.filter((f) => {
    if (facilityFilter === 'all') return true;
    return f.facility_type === facilityFilter;
  });

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Interactive Tourist Safety Map
          </h1>
          <p className="text-xs text-slate-500">
            OpenStreetMap live tiles with verified evacuation centres and hazard exclusion zones.
          </p>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value as any)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Facilities: All</option>
              <option value="shelter">Shelters Only (Green)</option>
              <option value="hospital">Hospitals Only (Red)</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={showHazards}
              onChange={(e) => setShowHazards(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
            />
            Show Hazard Polygons
          </label>

          {/* Quick Relocate Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleCenterChennai}
              className="px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <Navigation className="w-3 h-3 text-orange-400" />
              Chennai Sector
            </button>
            <button
              onClick={handleCenterMiami}
              className="px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <Navigation className="w-3 h-3 text-blue-400" />
              Miami Sector
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="h-[600px] w-full z-0">
          <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            key={`${center[0]}-${center[1]}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Facilities: Shelters & Hospitals */}
            {filteredFacilities.map((fac) => (
              <Marker
                key={fac.id}
                position={[fac.latitude, fac.longitude]}
                icon={fac.facility_type === 'shelter' ? shelterIcon : hospitalIcon}
              >
                <Popup>
                  <div className="p-1 max-w-xs">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${fac.facility_type === 'shelter' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                        {fac.facility_type.toUpperCase()}
                      </span>
                      {fac.is_open && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          VERIFIED OPEN
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 mb-1">{fac.name}</h4>
                    <p className="text-xs text-slate-600 mb-2">{fac.address}</p>
                    <div className="bg-slate-50 p-2 rounded text-xs space-y-1 mb-2">
                      <p><strong>Contact:</strong> {fac.contact_number || 'N/A'}</p>
                      {fac.capacity && (
                        <p><strong>Capacity:</strong> {fac.current_occupancy || 0} / {fac.capacity} occupants</p>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 italic mb-2">{fac.source_notes}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-t pt-1">
                      <span>Status verified: {new Date(fac.status_verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="font-medium text-amber-600">{fac.data_origin}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Hazard Zones (Polygons or Circles) */}
            {showHazards && hazards.map((h) => {
              if (h.is_polygon) {
                return (
                  <Polygon
                    key={h.id}
                    positions={h.coordinates as [number, number][]}
                    pathOptions={{
                      color: h.hazard_type === 'flood' ? '#2563eb' : '#dc2626',
                      fillColor: h.hazard_type === 'flood' ? '#3b82f6' : '#ef4444',
                      fillOpacity: 0.35,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="p-1 max-w-xs">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 uppercase">
                          {h.severity} {h.hazard_type} ZONE
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1">{h.title}</h4>
                        <p className="text-xs text-slate-600 my-1">{h.description}</p>
                        <p className="text-[11px] text-slate-500">Source: {h.source_organization}</p>
                        <span className="text-[10px] text-amber-600 font-semibold block mt-1">
                          [{h.data_origin}]
                        </span>
                      </div>
                    </Popup>
                  </Polygon>
                );
              } else if (h.radius_meters) {
                return (
                  <Circle
                    key={h.id}
                    center={h.coordinates[0] as [number, number]}
                    radius={h.radius_meters}
                    pathOptions={{
                      color: '#dc2626',
                      fillColor: '#ef4444',
                      fillOpacity: 0.3,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="p-1 max-w-xs">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 uppercase">
                          RESTRICTED EXCLUSION ZONE
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1">{h.title}</h4>
                        <p className="text-xs text-slate-600 my-1">{h.description}</p>
                        <p className="text-[11px] text-slate-500">Source: {h.source_organization}</p>
                      </div>
                    </Popup>
                  </Circle>
                );
              }
              return null;
            })}
          </MapContainer>
        </div>

        {/* Legend Overlay */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-300">Map Legend:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block"></span>
              Emergency Shelter (Verified Open)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 inline-block"></span>
              Level 1 Trauma Hospital
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-blue-500/50 border border-blue-500 inline-block"></span>
              Flood Inundation Polygon
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-red-500/50 border border-red-500 inline-block"></span>
              Coastal Danger Exclusion Zone
            </span>
          </div>

          <div className="text-slate-400">
            Data refreshed: {lastUpdated || 'Just now'} • Tiles: &copy; OpenStreetMap
          </div>
        </div>
      </div>
    </div>
  );
};
