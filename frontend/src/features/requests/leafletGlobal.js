// [Person 2 – requests] The two Leaflet plugins we use (leaflet.markercluster and leaflet.heat) were written before
// JavaScript modules existed: they attach themselves to a GLOBAL variable called "L". This file creates that global.
// It must be its own file and be imported BEFORE the plugins (see mapPlugins.js), because imports run in order.
import L from 'leaflet';

window.L = L;
