/**
 * DeliveryRouteMap.js
 *
 * A real interactive delivery route map for GoviLink.
 *
 * Stack (all free, no API key required):
 *   - react-native-webview  → renders inline HTML inside the native view
 *   - Leaflet.js (CDN)      → map rendering with OpenStreetMap tiles
 *   - Nominatim (OSM)       → free geocoding of address strings → lat/lng
 *   - OSRM public demo API  → free road-following route polyline
 *
 * Props:
 *   pickupAddress  {string}  – farm / pickup location text from order doc
 *   destAddress    {string}  – buyer delivery address text from order doc
 *   pickupLat      {number}  – optional pre-stored latitude  (skips geocoding)
 *   pickupLng      {number}  – optional pre-stored longitude (skips geocoding)
 *   destLat        {number}  – optional pre-stored latitude
 *   destLng        {number}  – optional pre-stored longitude
 *   statusLabel    {string}  – delivery status shown as overlay badge
 *   height         {number}  – map card height (default 240)
 *
 * Behaviour:
 *   - If both lat/lng pairs are given directly → skips geocoding
 *   - If addresses are given → geocodes via Nominatim, biased to Sri Lanka
 *   - Draws road-following polyline via OSRM public API
 *   - If OSRM fails → keeps markers, shows "Route unavailable" notice
 *   - If geocoding fails for one end → shows single marker only
 *   - If both fail → shows "Location unavailable" message (no map rendered)
 */

import React, { useRef, useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FARMER_COLORS as C } from './FarmerDesign';

// ─── Status colour helper (matches DeliveryTrackingScreen) ────────────────────
const STATUS_COLORS = {
  PENDING:          { bg: '#FEF3C7', text: '#D97706' },
  ASSIGNED:         { bg: '#DBEAFE', text: '#2563EB' },
  ACCEPTED:         { bg: '#DBEAFE', text: '#2563EB' },
  PREPARING:        { bg: '#DBEAFE', text: '#2563EB' },
  READY_FOR_PICKUP: { bg: '#DBEAFE', text: '#2563EB' },
  IN_TRANSIT:       { bg: '#DCFCE7', text: '#0D503D' },
  DELIVERED:        { bg: '#E8F5E9', text: '#006837' },
  CANCELLED:        { bg: '#FEE2E2', text: '#DC2626' },
};

// ─── Inline HTML template ─────────────────────────────────────────────────────
// This runs entirely inside the WebView. It:
//   1. Geocodes both addresses via Nominatim (skipped if coords provided directly)
//   2. Requests a road route from OSRM
//   3. Draws the route polyline + markers on a Leaflet map
//   4. Posts status messages back to React Native via window.ReactNativeWebView.postMessage
//   5. Fits the map camera to show both endpoints with padding

const buildMapHtml = (pickupAddress, destAddress, pickupLat, pickupLng, destLat, destLng) => {
  // Serialize coords so JS inside the page can read them (null if not available)
  const p_lat = typeof pickupLat === 'number' ? pickupLat : null;
  const p_lng = typeof pickupLng === 'number' ? pickupLng : null;
  const d_lat = typeof destLat === 'number' ? destLat : null;
  const d_lng = typeof destLng === 'number' ? destLng : null;

  // Sanitise address strings for safe embedding in JS string literal
  const safePickup = (pickupAddress || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
  const safeDest   = (destAddress   || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body, #map { width:100%; height:100%; background:#E8F3EC; }
  .loading-overlay {
    position:fixed; inset:0; display:flex; flex-direction:column;
    align-items:center; justify-content:center; background:rgba(232,243,236,0.92);
    z-index:9999; gap:10px; font-family:system-ui,sans-serif;
  }
  .loading-overlay .spinner {
    width:28px; height:28px; border:3px solid #C5E2D0;
    border-top-color:#167458; border-radius:50%;
    animation:spin .8s linear infinite;
  }
  @keyframes spin { to { transform:rotate(360deg); } }
  .loading-overlay p { font-size:13px; color:#0D503D; font-weight:600; }

  .route-badge {
    position:absolute; bottom:10px; left:50%; transform:translateX(-50%);
    z-index:500; background:rgba(255,255,255,0.95);
    border:1px solid #E0E7DF; border-radius:20px;
    padding:4px 14px; font-size:11px; font-weight:700;
    color:#718078; white-space:nowrap; pointer-events:none;
  }
  .error-box {
    position:fixed; inset:0; display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    background:#F5F7F2; font-family:system-ui,sans-serif; gap:8px;
  }
  .error-box p { font-size:13px; color:#718078; text-align:center; padding:0 20px; }
</style>
</head>
<body>
<div id="loading" class="loading-overlay">
  <div class="spinner"></div>
  <p>Loading delivery route…</p>
</div>
<div id="error-box" class="error-box" style="display:none">
  <p id="error-msg">Location unavailable.</p>
</div>
<div id="map" style="display:none"></div>
<div class="route-badge" id="route-badge" style="display:none"></div>

<script>
(function() {
  function post(msg) {
    try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg)); } catch(e) {}
  }

  function showError(msg) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('map').style.display = 'none';
    var eb = document.getElementById('error-box');
    eb.style.display = 'flex';
    document.getElementById('error-msg').textContent = msg;
    post({ type: 'error', message: msg });
  }

  // Coordinates provided directly (no geocoding needed)
  var PRE_PICKUP = ${p_lat !== null ? `{lat:${p_lat},lng:${p_lng}}` : 'null'};
  var PRE_DEST   = ${d_lat !== null ? `{lat:${d_lat},lng:${d_lng}}` : 'null'};
  var PICKUP_ADDR = '${safePickup}';
  var DEST_ADDR   = '${safeDest}';

  // ── Nominatim geocode (bias to Sri Lanka bounding box) ──
  function geocode(address, callback) {
    if (!address || !address.trim()) { callback(null); return; }
    // countrycodes=lk biases towards Sri Lanka; viewbox is roughly Sri Lanka
    var url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1'
      + '&countrycodes=lk'
      + '&q=' + encodeURIComponent(address + ', Sri Lanka');
    fetch(url, { headers: { 'Accept-Language': 'en' } })
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (data && data.length > 0) {
          callback({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        } else {
          callback(null);
        }
      })
      .catch(function(){ callback(null); });
  }

  // ── OSRM road route ──
  function fetchRoute(from, to, callback) {
    var url = 'https://router.project-osrm.org/route/v1/driving/'
      + from.lng + ',' + from.lat + ';'
      + to.lng   + ',' + to.lat
      + '?overview=full&geometries=geojson';
    fetch(url)
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
          var route = data.routes[0];
          callback({
            coords: route.geometry.coordinates.map(function(c){ return [c[1], c[0]]; }),
            distanceKm: (route.distance / 1000).toFixed(1),
            durationMin: Math.round(route.duration / 60)
          });
        } else {
          callback(null);
        }
      })
      .catch(function(){ callback(null); });
  }

  // ── Leaflet SVG icon builder ──
  function makeIcon(color, label) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">'
      + '<path d="M16 0C9.37 0 4 5.37 4 12c0 9 12 30 12 30s12-21 12-30C28 5.37 22.63 0 16 0z" fill="' + color + '" stroke="#fff" stroke-width="2"/>'
      + '<circle cx="16" cy="12" r="5" fill="#fff" opacity="0.9"/>'
      + '</svg>';
    return L.divIcon({
      html: svg,
      className: '',
      iconSize: [32, 42],
      iconAnchor: [16, 42],
      popupAnchor: [0, -44]
    });
  }

  // ── Main render ──
  function render(pickup, dest) {
    if (!pickup && !dest) {
      showError('Delivery location information\\nis not available for this order.');
      return;
    }

    document.getElementById('loading').style.display = 'none';
    document.getElementById('map').style.display = 'block';

    // Default centre: Sri Lanka
    var centre = pickup || dest || { lat: 7.8731, lng: 80.7718 };
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false
    }).setView([centre.lat, centre.lng], pickup && dest ? 9 : 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(map);

    var pickupIcon = makeIcon('#167458', 'P');
    var destIcon   = makeIcon('#326A8D', 'D');

    var markers = [];

    if (pickup) {
      var pm = L.marker([pickup.lat, pickup.lng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup('<b>Pickup</b>' + (PICKUP_ADDR ? '<br><small>' + PICKUP_ADDR + '</small>' : ''));
      markers.push([pickup.lat, pickup.lng]);
    }
    if (dest) {
      var dm = L.marker([dest.lat, dest.lng], { icon: destIcon })
        .addTo(map)
        .bindPopup('<b>Destination</b>' + (DEST_ADDR ? '<br><small>' + DEST_ADDR + '</small>' : ''));
      markers.push([dest.lat, dest.lng]);
    }

    // Fit to markers if both present
    if (markers.length === 2) {
      map.fitBounds(markers, { padding: [40, 40] });
    }

    post({ type: 'markersReady', pickup: pickup, dest: dest });

    // Try to get OSRM road route
    if (pickup && dest) {
      fetchRoute(pickup, dest, function(routeResult) {
        if (routeResult) {
          // Draw road-following polyline
          L.polyline(routeResult.coords, {
            color: '#167458',
            weight: 4,
            opacity: 0.85,
            lineJoin: 'round',
            lineCap: 'round'
          }).addTo(map);

          // Fit to route, re-fit
          map.fitBounds(routeResult.coords, { padding: [44, 44] });

          // Show route metrics badge
          var badge = document.getElementById('route-badge');
          badge.style.display = 'block';
          badge.textContent = routeResult.distanceKm + ' km  ·  ~' + routeResult.durationMin + ' min drive';

          post({ type: 'routeReady', distanceKm: routeResult.distanceKm, durationMin: routeResult.durationMin });
        } else {
          // Route fetch failed — keep markers, show notice
          var badge = document.getElementById('route-badge');
          badge.style.display = 'block';
          badge.textContent = 'Route unavailable';
          post({ type: 'routeError', message: 'OSRM route unavailable' });
        }
      });
    }
  }

  // ── Coordinate resolution ──
  if (PRE_PICKUP && PRE_DEST) {
    // Both coords pre-supplied — render immediately, no geocoding
    render(PRE_PICKUP, PRE_DEST);
  } else if (PRE_PICKUP && !PRE_DEST) {
    if (!DEST_ADDR) { render(PRE_PICKUP, null); return; }
    geocode(DEST_ADDR, function(dest) { render(PRE_PICKUP, dest); });
  } else if (!PRE_PICKUP && PRE_DEST) {
    if (!PICKUP_ADDR) { render(null, PRE_DEST); return; }
    geocode(PICKUP_ADDR, function(pickup) { render(pickup, PRE_DEST); });
  } else {
    // Both need geocoding
    var hasPickup = !!PICKUP_ADDR;
    var hasDest   = !!DEST_ADDR;

    if (!hasPickup && !hasDest) {
      showError('No pickup or destination address\\navailable for this delivery.');
      return;
    }

    var pickupCoord = null;
    var destCoord   = null;
    var pending = 0;

    if (hasPickup) pending++;
    if (hasDest)   pending++;

    function done() {
      pending--;
      if (pending <= 0) render(pickupCoord, destCoord);
    }

    if (hasPickup) { geocode(PICKUP_ADDR, function(c) { pickupCoord = c; done(); }); }
    if (hasDest)   { geocode(DEST_ADDR,   function(c) { destCoord   = c; done(); }); }
  }
})();
</script>
</body>
</html>`;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DeliveryRouteMap({
  pickupAddress,
  destAddress,
  pickupLat,
  pickupLng,
  destLat,
  destLng,
  statusLabel,
  height = 240,
}) {
  const webviewRef = useRef(null);
  const [webState, setWebState] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [routeMetrics, setRouteMetrics] = useState(null); // { distanceKm, durationMin }
  const [errorMsg, setErrorMsg] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const hasPickupAddress = !!(pickupAddress && pickupAddress.trim());
  const hasDestAddress   = !!(destAddress && destAddress.trim());
  const hasAnyLocation   = hasPickupAddress || hasDestAddress ||
    (typeof pickupLat === 'number') || (typeof destLat === 'number');

  // Only rebuild HTML when the location inputs actually change
  const htmlSource = useMemo(() => ({
    html: buildMapHtml(
      hasPickupAddress ? pickupAddress : '',
      hasDestAddress   ? destAddress   : '',
      typeof pickupLat === 'number' ? pickupLat : null,
      typeof pickupLng === 'number' ? pickupLng : null,
      typeof destLat   === 'number' ? destLat   : null,
      typeof destLng   === 'number' ? destLng   : null,
    ),
    baseUrl: 'https://govilink.app',
  }), [
    pickupAddress, destAddress,
    pickupLat, pickupLng,
    destLat, destLng,
    retryKey,
  ]);

  const handleMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'markersReady') {
        setWebState('ready');
      } else if (msg.type === 'routeReady') {
        setRouteMetrics({ distanceKm: msg.distanceKm, durationMin: msg.durationMin });
      } else if (msg.type === 'error') {
        setWebState('error');
        setErrorMsg(msg.message || 'Location unavailable.');
      }
    } catch (_) {}
  }, []);

  const sc = STATUS_COLORS[(statusLabel || '').toUpperCase()] || STATUS_COLORS.DELIVERED;

  if (!hasAnyLocation) {
    return (
      <View style={[styles.card, { height, justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialCommunityIcons name="map-marker-off-outline" size={32} color={C.muted} />
        <Text style={styles.noLocText}>Delivery location unavailable</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { height }]}>
      {/* WebView renders the Leaflet map */}
      <WebView
        key={retryKey}
        ref={webviewRef}
        style={styles.webview}
        originWhitelist={['*']}
        source={htmlSource}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        // Silence mixed-content warning on Android (all resources are HTTPS)
        mixedContentMode="compatibility"
        // Prevent the WebView from stealing the parent ScrollView gesture
        scrollEnabled={false}
        onError={() => {
          setWebState('error');
          setErrorMsg('Map failed to load.');
        }}
      />

      {/* Loading overlay rendered outside WebView (native side) */}
      {webState === 'loading' && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color={C.green} />
          <Text style={styles.loadingText}>Loading delivery route…</Text>
        </View>
      )}

      {/* Status badge — top-left */}
      {statusLabel ? (
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]} pointerEvents="none">
          <Text style={[styles.statusBadgeText, { color: sc.text }]}>
            {statusLabel.replace(/_/g, ' ')}
          </Text>
        </View>
      ) : null}

      {/* "DELIVERY ROUTE" label — top-right */}
      <View style={styles.routeLabel} pointerEvents="none">
        <MaterialCommunityIcons name="map-marker-path" size={11} color={C.greenDark} style={{ marginRight: 4 }} />
        <Text style={styles.routeLabelText}>DELIVERY ROUTE</Text>
      </View>

      {/* Route metrics pill — bottom (shown when route is loaded) */}
      {routeMetrics && webState === 'ready' && (
        <View style={styles.metricsPill} pointerEvents="none">
          <MaterialCommunityIcons name="road-variant" size={12} color={C.muted} style={{ marginRight: 4 }} />
          <Text style={styles.metricsText}>
            {routeMetrics.distanceKm} km · ~{routeMetrics.durationMin} min drive
          </Text>
        </View>
      )}

      {/* Route-failed retry button (only if markers loaded but route failed) */}
      {webState === 'ready' && !routeMetrics && (
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setRetryKey(k => k + 1);
            setWebState('loading');
            setRouteMetrics(null);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={12} color={C.muted} style={{ marginRight: 4 }} />
          <Text style={styles.retryText}>Route unavailable · Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.mint,
    position: 'relative',
    // shadow
    shadowColor: '#16352D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  // Native loading overlay (shows while WebView bootstraps)
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(232,243,236,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.greenDark,
  },
  // Top-left status badge
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  // Top-right "DELIVERY ROUTE" label
  routeLabel: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  routeLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.greenDark,
    letterSpacing: 0.6,
  },
  // Bottom metrics pill
  metricsPill: {
    position: 'absolute',
    bottom: 10,
    left: '50%',
    transform: [{ translateX: -70 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    minWidth: 140,
    justifyContent: 'center',
  },
  metricsText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
  },
  // Retry button (route-failed state)
  retryBtn: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    left: '25%',
    right: '25%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  retryText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.muted,
  },
  // No-location fallback
  noLocText: {
    fontSize: 13,
    color: C.muted,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
});
