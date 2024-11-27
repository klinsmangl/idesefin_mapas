// Import necessary modules
import { initMenu } from './menuLayers.js';
import { WfsDownloader } from './wfsDownloader.js';

// Initialize the WFS downloader
const wfsDownloader = new WfsDownloader();

// Initialize the map
const map = L.map('map').setView([-3.7619, -38.534117], 12);

// Add a tile layer
const baseLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
    minZoom: 0
}).addTo(map);

// Initialize WMS layer with default layer
let wmsLayer = L.tileLayer.wms("https://geoserverhomo23.sefin.fortaleza.ce.gov.br/geoserver/wms", {
    layers: "LIMITES_ADMINISTRATIVOS:limite_municipal",
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    attribution: '&copy; <a href="https://ide.sefin.fortaleza.ce.gov.br/">IDESEFIN</a> ',
    maxZoom: 22
});

// Add the initial WMS layer to the map
map.addLayer(wmsLayer);

// Enhanced updateWmsLayer function that handles both WMS and WFS updates
function updateWmsLayer(layerName, layerTitle) {
    if (!layerName) return;

    try {
        // Remove the existing WMS layer if it exists
        if (map.hasLayer(wmsLayer)) {
            map.removeLayer(wmsLayer);
        }

        // Create and add new WMS layer
        wmsLayer = L.tileLayer.wms("https://geoserverhomo23.sefin.fortaleza.ce.gov.br/geoserver/wms", {
            layers: layerName,
            format: "image/png",
            transparent: true,
            version: "1.1.1",
            attribution: '&copy; <a href="https://ide.sefin.fortaleza.ce.gov.br/">IDESEFIN</a> ',
            maxZoom: 22
        });

        map.addLayer(wmsLayer);

        // Update the WFS downloader with the new layer information
        wfsDownloader.updateLayer(layerName, layerTitle);

        // Make sure the download card is visible
        wfsDownloader.toggleVisibility(true);

        console.log(`Layer updated successfully: ${layerTitle || layerName}`);

    } catch (error) {
        console.error('Error updating layer:', error);
        alert('Error updating layer. Please try again.');
    }
}

// Initialize the menu with the enhanced updateWmsLayer function
initMenu((layerName, layerTitle) => {
    if (layerName && layerTitle) {
        console.log(`Layer selected: ${layerName} - ${layerTitle}`);
        updateWmsLayer(layerName, layerTitle); // Pass both to update the WMS layer and WFS downloader
    }
});


// Map event handlers for layer visibility management
map.on('layerremove', (e) => {
    if (e.layer === wmsLayer) {
        wfsDownloader.toggleVisibility(false);
    }
});

map.on('layeradd', (e) => {
    if (e.layer === wmsLayer) {
        wfsDownloader.toggleVisibility(true);
    }
});

// Keyboard shortcut to toggle WFS downloader visibility
document.addEventListener('keydown', (e) => {
    if (e.key === 'D' && e.ctrlKey) { // Ctrl + D
        const isVisible = wfsDownloader.card.style.display !== 'none';
        wfsDownloader.toggleVisibility(!isVisible);
        e.preventDefault();
    }
});

// Export necessary functions and objects
export { map, wmsLayer, wfsDownloader };
