// [Person 2 – requests] Heatmap layer for react-leaflet (leaflet.heat): areas with many or very urgent requests glow.
// Each request counts with its priority as weight, so one trapped family outweighs several shelter requests.
// Used by the RequestMap "Heatmap" toggle and by Person 3's hotspot map on the admin dashboard.
import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import './mapPlugins';

// Cool to hot: blue for a few low-priority requests, through amber, to red for clusters of urgent ones
const GRADIENT = { 0.2: '#3b82f6', 0.45: '#a855f7', 0.7: '#f59e0b', 1.0: '#ef4444' };

export default function HeatLayer({ requests }) {
  const map = useMap();
  // [latitude, longitude, weight 0..1]; only recalculated when the list changes
  const points = useMemo(
    () => requests.map((request) => [request.latitude, request.longitude, Math.max(request.priorityScore, 10) / 100]),
    [requests]
  );

  // Leaflet layers live outside React: add on mount, remove in the cleanup (also when the points change)
  useEffect(() => {
    const layer = L.heatLayer(points, { radius: 30, blur: 24, maxZoom: 14, minOpacity: 0.35, gradient: GRADIENT });
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}
