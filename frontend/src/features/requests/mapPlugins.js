// [Person 2 – requests] Loads the Leaflet plugins, in the right order, plus the map styles.
// Import this file (for its side effects) from any component that clusters markers or draws a heatmap.
import './leafletGlobal';
import 'leaflet.markercluster';
import 'leaflet.heat';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import './map.css';
