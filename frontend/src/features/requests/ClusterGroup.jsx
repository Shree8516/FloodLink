// [Person 2 – requests] Marker clustering for react-leaflet: nearby markers merge into one bubble with a count,
// which splits apart as you zoom in. A thin wrapper around leaflet.markercluster: every <Marker> rendered inside
// <ClusterGroup> is added to the cluster layer instead of straight to the map.
import L from 'leaflet';
import { createElementObject, createLayerComponent, extendContext } from '@react-leaflet/core';
import './mapPlugins';

// Bubble size grows with the number of requests inside. "urgent" (a request above the pulse priority) turns it red.
function clusterIcon(cluster, pulsePriority) {
  const markers = cluster.getAllChildMarkers();
  const count = markers.length;
  const urgent = markers.some((marker) => marker.options.priorityScore > pulsePriority);
  const size = count < 10 ? 36 : count < 50 ? 44 : 52;
  return L.divIcon({
    html: `<div class="fl-cluster${urgent ? ' fl-cluster--urgent' : ''}"><span>${count}</span></div>`,
    className: 'fl-cluster-wrap',
    iconSize: [size, size],
  });
}

const ClusterGroup = createLayerComponent(
  ({ children, pulsePriority = 80, ...options }, context) => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      // From street level on, show every marker so a single house can be clicked
      disableClusteringAtZoom: 16,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => clusterIcon(cluster, pulsePriority),
      ...options,
    });
    // Children (the markers) are added to the cluster group, not to the map
    return createElementObject(group, extendContext(context, { layerContainer: group }));
  }
);

export default ClusterGroup;
