// Import the menuTree from the external file
import { menuTree } from './getLayers.js';

// Helper function to escape HTML entities (minimal XSS protection)
function escapeHtml(str) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return str.replace(/[&<>"']/g, m => map[m]);
}

// Helper function to make a valid CSS selector ID
function makeValidId(str) {
    return str.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

// Recursive function to generate an HTML list from the menu tree
function renderList(node, depth = 0, parentId = 'root') {
    if (!node || typeof node !== 'object' || depth > 10) {
        console.warn('Invalid node or maximum depth exceeded:', node);
        return '';
    }

    const currentId = `${parentId}-${depth}-${makeValidId(node.name || 'root')}`;
    const displayTitle = escapeHtml(node.title || node.name || '');

    const icon = getIcon(node.name);
    const childrenHtml = renderChildren(node, depth + 1, currentId);
    const subLayersHtml = renderSubLayers(node);

    if (node.name && node.name !== 'root') {
        return `
            <div class="accordion-item mb-2">
                <h2 class="accordion-header" id="heading-${currentId}">
                    <button class="accordion-button collapsed text-uppercase" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${currentId}" aria-expanded="false" aria-controls="collapse-${currentId}">
                        ${icon}&nbsp${displayTitle}
                    </button>
                </h2>
                <div id="collapse-${currentId}" class="accordion-collapse collapse" aria-labelledby="heading-${currentId}">
                    <div class="accordion-body">
                        ${subLayersHtml}
                        ${childrenHtml}
                    </div>
                </div>
            </div>
        `;
    }

    return childrenHtml;
}

function getIcon(name) {
    const icons = {
        'Aerolevantamento': '<i class="bi bi-airplane"></i>',
        'teste': '<i class="bi bi-bug"></i>',
        'Imageamento': '<i class="bi bi-camera"></i>',
        'Tributário': '<i class="bi bi-currency-dollar"></i>',
        'Limites Administrativos': '<i class="bi bi-bounding-box-circles"></i>',
        'Cartografia Base': '<i class="bi bi-map"></i>',
        'Zoneamentos':'<i class="bi bi-subtract"></i>',
        'Observatório do Mercado Imobiliário':'<i class="bi bi-binoculars"></i>',
        'Uso Solo':'<i class="bi bi-buildings"></i>',
        'IBGE':'<i class="bi bi-compass"></i>'

    };

    return icons[name] || '';
}

function renderSubLayers(node) {
    if (!Array.isArray(node.layers) || node.layers.length === 0) return '';

    return `
        <ul class="list-group list-group-flush">
            ${node.layers.map(layer => `
                <li class="list-group-item layer-item" data-layer-name="${escapeHtml(layer.name)}">
                    <button class="btn btn-link text-decoration-none text-left w-100" data-layer="${escapeHtml(layer.name)}">
                        ${escapeHtml(layer.title || layer.name)}
                    </button>
                </li>
            `).join('')}
        </ul>
    `;
}

function renderChildren(node, depth, parentId) {
    if (!node.children || typeof node.children !== 'object') return '';

    return `
        <div class="accordion" role="tablist">
            ${Object.values(node.children).map(childNode => renderList(childNode, depth, parentId)).join('')}
        </div>
    `;
}

// Attach a click listener to dynamically update the WMS layer
function setupLayerSelection(callback) {
    document.addEventListener('click', event => {
        const target = event.target.closest('[data-layer]');
        if (target) {
            const layerName = target.getAttribute('data-layer');
            const layerTitle = target.textContent.trim(); // Extract the visible title from the button
            if (layerName && callback) callback(layerName, layerTitle); // Pass both layerName and layerTitle
        }
    });
}

async function initMenu(onLayerSelect) {
    const menuContainer = document.getElementById('menu-container');
    const loadingSpinner = `<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>`;

    try {
        if (!menuContainer) throw new Error('Menu container element not found');

        // Display loading spinner
        menuContainer.innerHTML = `<div class="text-center">${loadingSpinner}</div>`;

        const resolvedMenuTree = await menuTree;
        if (!resolvedMenuTree || typeof resolvedMenuTree !== 'object') {
            throw new Error('Invalid menu tree structure');
        }

        menuContainer.innerHTML = renderList(resolvedMenuTree);

        // Setup layer selection callback
        setupLayerSelection(onLayerSelect);
    } catch (error) {
        console.error('Failed to initialize menu:', error);
        if (menuContainer) {
            menuContainer.innerHTML = `<div class="alert alert-danger text-center" role="alert">
                Failed to load menu structure. Please try again later.
            </div>`;
        }
    }
}

export { renderList, initMenu };

