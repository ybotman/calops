'use client';

import { Fragment, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const USA_CENTER = [39.5, -98.5];
const USA_ZOOM = 4;

// CALOPS-58 Mod 1: color-by-source for user dots (restored from CALOPS-52 v1).
// CALOPS-58e: IPInfoIO darkened for better visibility on the OSM/Mapbox tile palette.
const SOURCE_COLORS = {
  GoogleBrowser:     '#2e7d32', // green — Browser GPS
  GoogleGeolocation: '#1976d2', // blue — Google IP
  IPInfoIO:          '#424242', // dark gray — IP lookup (was #757575)
};
const DEFAULT_USER_COLOR = '#1976d2';
const CENTER_COLOR = '#d32f2f'; // red
const LINE_COLOR   = '#757575'; // gray

// CALOPS-58 Mod 2: default accuracy ring radius (meters) for non-GPS sources.
// GPS uses real browserGps.accuracy.
const DEFAULT_ACCURACY_M = {
  GoogleGeolocation: 5000,   // Google IP geolocation ~5 km typical
  IPInfoIO:          50000,  // IP lookup ~50 km typical
};

function haversineKm(aLat, aLng, bLat, bLng) {
  if (aLat == null || aLng == null || bLat == null || bLng == null) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function formatKm(km) {
  if (km == null) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

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
        const mapLat  = rec.mapCenter?.latitude;
        const mapLng  = rec.mapCenter?.longitude;
        if (userLat == null || userLng == null || mapLat == null || mapLng == null) return null;

        const source   = rec.userLocation?.source;
        const userColor = SOURCE_COLORS[source] || DEFAULT_USER_COLOR;
        const gpsAccuracy = rec.userLocation?.browserGps?.accuracy;
        const ringRadius = source === 'GoogleBrowser'
          ? gpsAccuracy
          : (DEFAULT_ACCURACY_M[source] ?? null);
        const accuracyLabel = source === 'GoogleBrowser' && gpsAccuracy != null
          ? `±${Math.round(gpsAccuracy)} m (GPS)`
          : DEFAULT_ACCURACY_M[source] != null
            ? `~${Math.round(DEFAULT_ACCURACY_M[source] / 1000)} km (default)`
            : 'unknown';
        const userId = rec.firebaseUserId?.slice(-8) || (rec.ip ? `ip:${rec.ip}` : 'anon');
        const distKm = haversineKm(userLat, userLng, mapLat, mapLng);
        const distLabel = formatKm(distKm);

        // CALOPS-58e: precise sources (GPS) render dot+ring; imprecise sources (Google IP,
        // IP lookup) render only the translucent uncertainty circle — the circle IS the marker.
        // Avoids false-precision of a small dot at the centroid of a 5-50 km uncertainty cloud.
        const isPrecise = source === 'GoogleBrowser';
        const ringOpacity = isPrecise ? 0.12 : 0.20;

        const userPopupBody = (
          <Popup>
            <div style={{ fontSize: 12 }}>
              <strong>User:</strong> {userId}<br />
              <strong>Source:</strong> {source || 'unknown'}<br />
              <strong>Accuracy:</strong> {accuracyLabel}<br />
              <strong>Distance to viewed center:</strong> {distLabel}<br />
              <strong>Time:</strong> {new Date(rec.timestamp).toLocaleString()}
            </div>
          </Popup>
        );

        return (
          <Fragment key={rec.id}>
            {/* Accuracy ring — uncertainty cloud, sized by source. For imprecise sources, this
                IS the only marker (popup attached). For precise sources, paired with center dot. */}
            {ringRadius != null && (
              <Circle
                center={[userLat, userLng]}
                radius={ringRadius}
                pathOptions={{
                  color: userColor,
                  fillColor: userColor,
                  fillOpacity: ringOpacity,
                  weight: 1,
                }}
                interactive={!isPrecise}
              >
                {!isPrecise && userPopupBody}
              </Circle>
            )}

            {/* Solid user dot — only for precise (GPS) sources */}
            {isPrecise && (
              <CircleMarker
                center={[userLat, userLng]}
                radius={5}
                pathOptions={{ color: userColor, fillColor: userColor, fillOpacity: 0.85, weight: 1 }}
              >
                {userPopupBody}
              </CircleMarker>
            )}

            {/* Map center dot (red) */}
            <CircleMarker
              center={[mapLat, mapLng]}
              radius={5}
              pathOptions={{ color: CENTER_COLOR, fillColor: CENTER_COLOR, fillOpacity: 0.85, weight: 1 }}
            >
              <Popup>
                <div style={{ fontSize: 12 }}>
                  <strong>Map center viewed by</strong> {userId}<br />
                  <strong>At:</strong> {mapLat.toFixed(4)}, {mapLng.toFixed(4)}<br />
                  <strong>Distance from user:</strong> {distLabel}<br />
                  <strong>Time:</strong> {new Date(rec.timestamp).toLocaleString()}
                </div>
              </Popup>
            </CircleMarker>

            {/* Connecting line user → mapCenter with hover distance tooltip */}
            <Polyline
              positions={[[userLat, userLng], [mapLat, mapLng]]}
              pathOptions={{ color: LINE_COLOR, weight: 1, opacity: 0.4, dashArray: '4 4' }}
            >
              <Tooltip sticky direction="center" opacity={0.9}>
                <span style={{ fontSize: 11 }}>{distLabel}</span>
              </Tooltip>
            </Polyline>
          </Fragment>
        );
      })}

      <RecenterIfEmpty hasRecords={records.length > 0} />
    </MapContainer>
  );
}

function RecenterIfEmpty({ hasRecords }) {
  const map = useMap();
  useEffect(() => {
    if (!hasRecords) {
      map.setView(USA_CENTER, USA_ZOOM);
    }
  }, [hasRecords, map]);
  return null;
}

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
