export class WfsDownloader {
    constructor(baseWfsUrl = 'https://geoserverhomo23.sefin.fortaleza.ce.gov.br/geoserver/wfs') {
        this.baseWfsUrl = baseWfsUrl;
        this.currentLayerName = '';
        this.currentLayerTitle = '';
        this.currentDataUrl = null;
        this.formats = [
            { label: 'CSV', format: 'csv' },
            { label: 'SHP', format: 'shape-zip' },
            { label: 'GeoJSON', format: 'application/json' }
        ];
        this.init();
    }

    init() {
        this.card = document.getElementById('wfs-downloader-card');
        if (!this.card) {
            console.error('WFS downloader card not found in DOM');
            return;
        }
        this.setupDownloadButtons();
    }

    setupDownloadButtons() {
        const cardBody = this.card.querySelector('.card-body');
        if (!cardBody) {
            console.error('Card body not found');
            return;
        }

        let buttonHtml = this.formats.map(({ label }) => `
            <a href="#" class="btn btn-primary btn-sm wfs-download-btn m-1" 
               style="background-color: #10949e; border-color: #10949e" 
               data-label="${label}">
                ${label}
            </a>
        `).join('');

        // Add DataURL button if available
        buttonHtml += `
            <a href="#" class="btn btn-secondary btn-sm wfs-dataurl-btn m-1" 
               style="display: none;">
                DataURL
            </a>
        `;

        cardBody.innerHTML = buttonHtml;

        // Add click event listeners to WFS buttons
        const wfsButtons = cardBody.querySelectorAll('.wfs-download-btn');
        wfsButtons.forEach((button, index) => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.currentLayerName) {
                    window.open(this.createWfsUrl(this.formats[index].format), '_blank');
                } else {
                    alert('Por favor, selecione uma camada primeiro.');
                }
            });
        });

        // Add click event listener to DataURL button
        const dataUrlButton = cardBody.querySelector('.wfs-dataurl-btn');
        dataUrlButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.currentDataUrl) {
                window.open(this.currentDataUrl, '_blank');
            }
        });
    }

    createWfsUrl(format) {
        const params = {
            service: 'WFS',
            version: '2.0.0',
            request: 'GetFeature',
            typeName: this.currentLayerName,
            outputFormat: format,
            srsName: 'EPSG:4326'
        };
        return `${this.baseWfsUrl}?${new URLSearchParams(params)}`;
    }

    updateLayer(layerName, layerTitle = '', dataUrl = null) {
        if (!layerName) {
            console.warn('Layer name is missing.');
            return;
        }

        if (!this.card) {
            console.error('Card is not initialized.');
            return;
        }

        this.currentLayerName = layerName;
        this.currentLayerTitle = layerTitle;
        this.currentDataUrl = dataUrl;

        const titleEl = this.card.querySelector('#card-title');
        if (titleEl) {
            titleEl.textContent = layerTitle || layerName || 'Selecione uma camada';
        }

        // Update WFS button states
        const buttons = this.card.querySelectorAll('.wfs-download-btn');
        buttons.forEach(button => {
            button.classList.toggle('disabled', !layerName);
            button.style.opacity = layerName ? '1' : '0.6';
        });

        // Update DataURL button visibility
        const dataUrlButton = this.card.querySelector('.wfs-dataurl-btn');
        if (dataUrlButton) {
            dataUrlButton.style.display = dataUrl ? 'inline-block' : 'none';
        }

        // Show/hide the card based on layer selection
        this.toggleVisibility(!!layerName);
    }

    toggleVisibility(visible) {
        if (this.card) {
            this.card.style.display = visible ? 'block' : 'none';
        }
    }
}
