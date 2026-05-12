'use client';

import { Fragment, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const USA_CENTER = [39.5, -98.5];
const USA_ZOOM = 4;

// Two-color scheme: user location vs map center
const USER_COLOR = '#1976d2';   // blue
const CENTER_COLOR = '#d32f2f'; // red
const LINE_COLOR = '#757575';   // gray (connecting line)

// Fix Leaflet default-icon paths once on the client
function FixLeafletIcons() {
  useEffect(() => {
    (async () => {
      const L = (await import('leaflet')).default;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });
    })();
  }, []);
  return null;
}

export default function ActivityMapView({ records, onBoundsChange }) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const tileUrl = mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttribution = mapboxToken ? '© Mapbox © OpenStreetMap' : '© OpenStreetMap contributors';

  return (
    <MapContainer
      center={USA_CENTER}
      zoom={USA_ZOOM}
      style={{ height: '100%', width: '100%' }}
      worldCopyJump
    >
      <FixLeafletIcons />
      <TileLayer
        url={tileUrl}
        attribution={tileAttribution}
        maxZoom={18}
        tileSize={mapboxToken ? 512 : 256}
        zoomOffset={mapboxToken ? -1 : 0}
      />

      <InvalidateOnMount />
      <BoundsReporter onBoundsChange={onBoundsChange} />

      {records.map((rec) => {
        const userLat = rec.userLocation?.latitude;
        const userLng = rec.userLocation?.longitude;
        const mapLat = rec.mapCenter?.latitude;
        const mapLng = rec.mapCenter?.longitude;
        if (userLat == null || userLng == null || mapLat == null || mapLng == null) return null;

        const source = rec.userLocation?.source;
        const accuracy = rec.userLocation?.browserGps?.accuracy;
        const isGps = source === 'GoogleBrowser' && accuracy != null;
        const userId = rec.firebaseUserId?.slice(-8) || (rec.ip ? `ip:${rec.ip}` : 'anon');

        return (
          <Fragment key={rec.id}>
            {/* User location: blue dot. Optional accuracy ring when GPS. */}
            {isGps && (
              <Circle
                center={[userLat, userLng]}
                radius={accuracy}
                pathOptions={{ color: USER_COLOR, fillColor: USER_COLOR, fillOpacity: 0.1, weight: 1 }}
                interactive={false}
              />
            )}
            <CircleMarker
              center={[userLat, userLng]}
              radius={5}
              pathOptions={{ color: USER_COLOR, fillColor: USER_COLOR, fillOpacity: 0.85, weight: 1 }}
            >
              <Popup>
                <div style={{ fontSize: 12 }}>
                  <strong>User:</strong> {userId}<br />
                  <strong>Source:</strong> {source || 'unknown'}{isGps ? ` (±${Math.round(accuracy)}m)` : ''}<br />
                  <strong>Time:</strong> {new Date(rec.timestamp).toLocaleString()}
                </div>
              </Popup>
            </CircleMarker>

            {/* Map center: red dot */}
            <CircleMarker
              center={[mapLat, mapLng]}
              radius={5}
              pathOptions={{ color: CENTER_COLOR, fillColor: CENTER_COLOR, fillOpacity: 0.85, weight: 1 }}
            >
              <Popup>
                <div style={{ fontSize: 12 }}>
                  <strong>Map center viewed by</strong> {userId}<br />
                  <strong>At:</strong> {mapLat.toFixed(4)}, {mapLng.toFixed(4)}<br />
                  <strong>Time:</strong> {new Date(rec.timestamp).toLocaleString()}
                </div>
              </Popup>
            </CircleMarker>

            {/* Connecting line user → mapCenter */}
            <Polyline
              positions={[[userLat, userLng], [mapLat, mapLng]]}
              pathOptions={{ color: LINE_COLOR, weight: 1, opacity: 0.4, dashArray: '4 4' }}
            />
          </Fragment>
        );
      })}

      <RecenterIfEmpty hasRecords={records.length > 0} />
    </MapContainer>
  );
}

// If no records, ensure we stay on USA center (avoids any auto-fit weirdness from prior renders)
function RecenterIfEmpty({ hasRecords }) {
  const map = useMap();
  useEffect(() => {
    if (!hasRecords) {
      map.setView(USA_CENTER, USA_ZOOM);
    }
  }, [hasRecords, map]);
  return null;
}

// Force the map to recompute size after mount — fixes the case where a flex parent
// hasn't finished its layout pass when MapContainer first measures itself, leaving
// the map at 0×0 with no tiles loaded. Run on mount + once after a short delay.
function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const tick = () => map.invalidateSize();
    tick();
    const t = setTimeout(tick, 250);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

// Reports current viewport bounds to parent on mount + after pan/zoom.
// Plain object so the parent doesn't have to handle Leaflet types.
function BoundsReporter({ onBoundsChange }) {
  const emit = (map) => {
    if (!onBoundsChange) return;
    const b = map.getBounds();
    onBoundsChange({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    });
  };
  const map = useMapEvents({
    moveend: () => emit(map),
    zoomend: () => emit(map),
  });
  useEffect(() => { emit(map); /* report initial bounds once */ }, [map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
