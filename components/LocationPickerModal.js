/**
 * LocationPickerModal.js
 *
 * Reusable coordinate-capture modal used in:
 *   - BuyerHomeScreen (delivery destination)
 *   - AddProduceScreen / FarmerHomeScreen (pickup location)
 *
 * Two ways for the user to pick a location:
 *   1. "Use Current Location" — requests GPS via expo-location
 *   2. "Pick on Map" — interactive Leaflet/OSM map in a WebView
 *      The user taps a marker, confirms, and coordinates are returned.
 *
 * Props:
 *   visible         {boolean}                   — show/hide the modal
 *   onClose         {()=>void}                  — called when user dismisses
 *   onConfirm       {({latitude, longitude, address})=>void}  — called with confirmed location
 *   initialAddress  {string}                    — pre-fill address text (optional)
 *   title           {string}                    — modal title (optional)
 *   confirmLabel    {string}                    — confirm button label (optional)
 *
 * Returned object shape:
 *   { latitude: number, longitude: number, address: string }
 *
 * Notes:
 *   - GPS is only requested when the user explicitly taps "Use Current Location"
 *   - The user must tap "Confirm Location" after placing the pin
 *   - If the user closes without confirming, onConfirm is NOT called
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { FARMER_COLORS as C } from './FarmerDesign';

// ─── Inline Leaflet map HTML ──────────────────────────────────────────────────
// The map centres on Sri Lanka by default and lets the user tap to place a pin.
// When the user taps on the map, the marker moves to that position and the coords
// are posted back via ReactNativeWebView.postMessage.
// The host side sends a JSON message of { type:'moveMarker', lat, lng } to
// move the marker programmatically (e.g. after GPS fix).

const buildPickerMapHtml = (initialLat, initialLng) => {
  const lat = typeof initialLat === 'number' ? initialLat : 7.8731;
  const lng = typeof initialLng === 'number' ? initialLng : 80.7718;
  const zoom = typeof initialLat === 'number' ? 13 : 8;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
html,body,#map { width:100%; height:100%; }
.instruction {
  position:absolute; top:10px; left:50%; transform:translateX(-50%);
  z-index:500; background:rgba(255,255,255,0.95);
  border:1px solid #E0E7DF; border-radius:16px;
  padding:6px 14px; font-size:12px; font-weight:600;
  color:#0D503D; white-space:nowrap; pointer-events:none;
}
</style>
</head>
<body>
<div id="map"></div>
<div class="instruction" id="hint">Tap map to place pin</div>
<script>
(function(){
  var picked = { lat: ${lat}, lng: ${lng} };
  var hasPick = ${typeof initialLat === 'number' ? 'true' : 'false'};

  function post(data){ try{ window.ReactNativeWebView.postMessage(JSON.stringify(data)); }catch(e){} }

  function makeIcon(color){
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">'
      +'<path d="M16 0C9.37 0 4 5.37 4 12c0 9 12 30 12 30s12-21 12-30C28 5.37 22.63 0 16 0z" fill="'+color+'" stroke="#fff" stroke-width="2"/>'
      +'<circle cx="16" cy="12" r="5" fill="#fff" opacity="0.9"/>'
      +'</svg>';
    return L.divIcon({ html:svg, className:'', iconSize:[32,42], iconAnchor:[16,42], popupAnchor:[0,-44] });
  }

  var map = L.map('map',{ zoomControl:true, attributionControl:false })
    .setView([picked.lat, picked.lng], ${zoom});

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ maxZoom:18 }).addTo(map);

  var marker = null;

  function placeMark(lat,lng){
    picked = { lat:lat, lng:lng };
    if(!marker){ marker = L.marker([lat,lng],{icon:makeIcon('#167458'),draggable:true}).addTo(map); }
    else { marker.setLatLng([lat,lng]); }
    marker.off('dragend');
    marker.on('dragend', function(e){
      var p = e.target.getLatLng();
      picked = { lat:p.lat, lng:p.lng };
      post({ type:'pick', lat:p.lat, lng:p.lng });
    });
    document.getElementById('hint').textContent = 'Drag pin to adjust, then confirm';
    post({ type:'pick', lat:lat, lng:lng });
  }

  if(hasPick){ placeMark(picked.lat, picked.lng); }

  map.on('click', function(e){ placeMark(e.latlng.lat, e.latlng.lng); });

  // Listen for messages from React Native (e.g. GPS fix → move marker)
  document.addEventListener('message', function(e){ handleMsg(e.data); });
  window.addEventListener('message', function(e){ handleMsg(e.data); });
  function handleMsg(raw){
    try{
      var msg = JSON.parse(raw);
      if(msg.type === 'moveMarker'){
        placeMark(msg.lat, msg.lng);
        map.setView([msg.lat, msg.lng], 15);
      }
    }catch(e){}
  }
})();
</script>
</body>
</html>`;
};

// ─── Reverse-geocode using Nominatim (called only once after user confirms) ───
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=0`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    return data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch (_) {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LocationPickerModal({
  visible,
  onClose,
  onConfirm,
  initialAddress = '',
  title = 'Set Location',
  confirmLabel = 'Confirm Location',
}) {
  const webviewRef = useRef(null);
  const [mode, setMode] = useState('choose'); // 'choose' | 'map' | 'gps'
  const [pendingCoords, setPendingCoords] = useState(null); // { latitude, longitude }
  const [addressText, setAddressText] = useState(initialAddress);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Reset state whenever the modal opens
  useEffect(() => {
    if (visible) {
      setMode('choose');
      setPendingCoords(null);
      setAddressText(initialAddress);
      setIsGeocoding(false);
      setIsGpsLoading(false);
      setMapReady(false);
    }
  }, [visible]);

  // When user moves pin on the map
  const handleMapMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'pick') {
        setPendingCoords({ latitude: msg.lat, longitude: msg.lng });
        // Reverse geocode once the user has picked (non-blocking, updates address text)
        (async () => {
          setIsGeocoding(true);
          const addr = await reverseGeocode(msg.lat, msg.lng);
          setAddressText(addr);
          setIsGeocoding(false);
        })();
      }
    } catch (_) {}
  }, []);

  // "Use Current Location" button
  const handleUseGps = async () => {
    setIsGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsGpsLoading(false);
        Alert.alert(
          'Location Permission Required',
          'Please allow location access so GoviLink can set your delivery or pickup coordinates.'
        );
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      setPendingCoords({ latitude, longitude });

      // Move into map mode so user can verify and adjust the pin
      setMode('map');

      // Reverse geocode the GPS fix
      setIsGeocoding(true);
      const addr = await reverseGeocode(latitude, longitude);
      setAddressText(addr);
      setIsGeocoding(false);

      // After WebView renders, tell it to move the marker
      // Use a short delay to allow the WebView to initialise
      setTimeout(() => {
        webviewRef.current?.injectJavaScript(
          `(function(){ var e = new Event('message'); e.data = JSON.stringify({type:'moveMarker',lat:${latitude},lng:${longitude}}); window.dispatchEvent(e); })();`
        );
      }, 1200);
    } catch (err) {
      setIsGpsLoading(false);
      Alert.alert('Location Error', 'Could not get your current location. Please try again or pick on the map.');
    }
    setIsGpsLoading(false);
  };

  // "Confirm" button
  const handleConfirm = () => {
    if (!pendingCoords) {
      Alert.alert('No Location Selected', 'Please tap on the map or use your current location first.');
      return;
    }
    onConfirm({
      latitude: pendingCoords.latitude,
      longitude: pendingCoords.longitude,
      address: addressText.trim() || `${pendingCoords.latitude.toFixed(5)}, ${pendingCoords.longitude.toFixed(5)}`,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={C.muted} />
            </TouchableOpacity>
          </View>

          {/* ── Mode: choose ── */}
          {mode === 'choose' && (
            <View style={styles.chooseBody}>
              <Text style={styles.chooseHint}>
                How would you like to set this location?
              </Text>

              <TouchableOpacity
                style={styles.chooseOptionBtn}
                onPress={handleUseGps}
                disabled={isGpsLoading}
                activeOpacity={0.85}
              >
                {isGpsLoading ? (
                  <ActivityIndicator size="small" color={C.green} />
                ) : (
                  <Ionicons name="locate-outline" size={22} color={C.green} style={{ marginRight: 12 }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.chooseOptionTitle}>Use Current Location</Text>
                  <Text style={styles.chooseOptionSub}>GPS coordinates from this device</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.muted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.chooseOptionBtn}
                onPress={() => setMode('map')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="map-marker-outline" size={22} color={C.blue} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.chooseOptionTitle}>Pick on Map</Text>
                  <Text style={styles.chooseOptionSub}>Tap the map to place your pin</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Mode: map ── */}
          {mode === 'map' && (
            <>
              {/* Map */}
              <View style={styles.mapContainer}>
                {!mapReady && (
                  <View style={styles.mapLoading}>
                    <ActivityIndicator size="small" color={C.green} />
                    <Text style={styles.mapLoadingText}>Loading map…</Text>
                  </View>
                )}
                <WebView
                  ref={webviewRef}
                  style={[styles.webview, !mapReady && { opacity: 0 }]}
                  originWhitelist={['*']}
                  source={{ html: buildPickerMapHtml(
                    pendingCoords?.latitude,
                    pendingCoords?.longitude
                  )}}
                  onMessage={handleMapMessage}
                  onLoad={() => setMapReady(true)}
                  javaScriptEnabled
                  domStorageEnabled
                  scrollEnabled={false}
                />
              </View>

              {/* Address result */}
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={16} color={C.green} style={{ marginRight: 8, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.addressLabel}>Selected address</Text>
                  {isGeocoding ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ActivityIndicator size="small" color={C.muted} />
                      <Text style={styles.addressValue}>Resolving address…</Text>
                    </View>
                  ) : pendingCoords ? (
                    <>
                      <Text style={styles.addressValue} numberOfLines={2}>{addressText || 'Address not resolved'}</Text>
                      <Text style={styles.coordsText}>
                        {pendingCoords.latitude.toFixed(6)}, {pendingCoords.longitude.toFixed(6)}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.addressHint}>Tap the map to place your pin</Text>
                  )}
                </View>
              </View>

              {/* Optional address override */}
              <View style={styles.addressOverrideRow}>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Edit address label (optional)…"
                  placeholderTextColor={C.muted}
                  value={addressText}
                  onChangeText={setAddressText}
                />
              </View>

              {/* Back + GPS button row */}
              <View style={styles.mapActionRow}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => setMode('choose')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={15} color={C.muted} style={{ marginRight: 4 }} />
                  <Text style={styles.secondaryBtnText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.gpsBtn}
                  onPress={handleUseGps}
                  disabled={isGpsLoading}
                  activeOpacity={0.85}
                >
                  {isGpsLoading
                    ? <ActivityIndicator size="small" color={C.green} />
                    : <Ionicons name="locate-outline" size={15} color={C.green} style={{ marginRight: 4 }} />
                  }
                  <Text style={styles.gpsBtnText}>My Location</Text>
                </TouchableOpacity>
              </View>

              {/* Confirm button */}
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  !pendingCoords && styles.confirmBtnDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!pendingCoords}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12,35,26,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: C.ink,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.canvas,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Choose mode ── */
  chooseBody: {
    padding: 20,
    gap: 12,
  },
  chooseHint: {
    fontSize: 13,
    color: C.muted,
    marginBottom: 4,
  },
  chooseOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.canvas,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    minHeight: 68,
  },
  chooseOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.ink,
    marginBottom: 2,
  },
  chooseOptionSub: {
    fontSize: 12,
    color: C.muted,
  },

  /* ── Map mode ── */
  mapContainer: {
    height: 300,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    position: 'relative',
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.mint,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  mapLoadingText: {
    fontSize: 12,
    color: C.greenDark,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: C.ink,
    lineHeight: 18,
  },
  addressHint: {
    fontSize: 13,
    color: C.muted,
    fontStyle: 'italic',
  },
  coordsText: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  addressOverrideRow: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  addressInput: {
    backgroundColor: C.canvas,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: C.ink,
  },
  mapActionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.canvas,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.muted,
  },
  gpsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C5E2D0',
    backgroundColor: C.mint,
  },
  gpsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.greenDark,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.green,
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 16,
    minHeight: 52,
  },
  confirmBtnDisabled: {
    backgroundColor: '#A0B1A7',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
