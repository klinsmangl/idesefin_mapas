$(document).ready(function () {
    const getCapabilitiesUrl = "https://geoserver.sefin.fortaleza.ce.gov.br/geoserver/wms?service=WMS&version=1.3.0&request=GetCapabilities";
    const baseWmsUrl = "https://geoserver.sefin.fortaleza.ce.gov.br/geoserver/wms";

    let selectedLayer = null;
    let selectedTitle = null;
    let selectedAbstract = null;
    let selectedMetadataUrl = null;
    let selectedDataUrl = "semData";

    const iconMap = {
        'Aerolevantamento': '<i class="bi bi-airplane"></i>',
        'teste': '<i class="bi bi-bug"></i>',
        'Imageamento': '<i class="bi bi-camera"></i>',
        'Tributário': '<i class="bi bi-currency-dollar"></i>',
        'Limites Administrativos': '<i class="bi bi-bounding-box-circles"></i>',
        'Cartografia Base': '<i class="bi bi-map"></i>',
        'Zoneamentos': '<i class="bi bi-subtract"></i>',
        'Observatório do Mercado Imobiliário': '<i class="bi bi-binoculars"></i>',
        'Uso Solo': '<i class="bi bi-buildings"></i>',
        'IBGE': '<i class="bi bi-compass"></i>'
    };

    const map = L.map('map').setView([-3.71722, -38.5434], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    let wmsLayer = null;

    function addToTree(tree, path, layerData) {
        let node = tree;
        path.forEach(part => {
            if (!node[part]) {
                node[part] = {};
            }
            node = node[part];
        });
        if (!node.layers) {
            node.layers = [];
        }
        node.layers.push(layerData);
    }

    function processWMSCapabilities(xml) {
        const tree = {};
        $(xml).find("Layer > Layer").each(function () {
            const layerName = $(this).find("Name").first().text();
            const title = $(this).find("Title").first().text();
            const abstract = $(this).find("Abstract").first().text() || "N/A";

            const metadataUrl = $(this).find("MetadataURL[type='ISO19115:2003'] OnlineResource").attr("xlink:href") || "N/A";
            const dataUrlAttr = $(this).find("DataURL OnlineResource").attr("xlink:href");
            const dataUrl = dataUrlAttr && dataUrlAttr.toLowerCase() !== 'null' ? dataUrlAttr : "semData";
            const keywords = $(this).find("KeywordList > Keyword").map(function () {
                return $(this).text();
            }).get();

            const menuKeywords = keywords.filter(k => k.startsWith("menu_"));
            if (menuKeywords.length > 0) {
                const hierarchy = menuKeywords[0].replace("menu_", "").split("_");
                addToTree(tree, hierarchy, { layerName, title, abstract, metadataUrl, dataUrl });
            }
        });
        renderList(tree, "#accordionMenu");
    }

    function renderList(tree, containerId) {
        let accordionIndex = 0;

        function createAccordionItem(node, path) {
            const id = `accordion-item-${accordionIndex++}`;
            const title = path[path.length - 1];
            const icon = iconMap[title] || ''; // Icon for the main accordion item only
            const layersHtml = node.layers ? node.layers.map(layer => `
                <li class="list-group-item d-flex justify-content-between">
                    <button class="btn btn-link text-start text-primary text-decoration-none" onclick="selectLayer('${layer.layerName}', '${layer.title}', '${layer.abstract}', '${layer.metadataUrl}', '${layer.dataUrl}')">
                       ${layer.title}
                    </button>
                </li>
            `).join("") : "";

            const childrenHtml = Object.keys(node).filter(key => key !== "layers").map(childKey => 
                createAccordionItem(node[childKey], [...path, childKey])
            ).join("");
            return `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="heading-${id}">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${id}" aria-expanded="false" aria-controls="collapse-${id}">
                            ${icon} &nbsp;${title}
                        </button>
                    </h2>
                    <div id="collapse-${id}" class="accordion-collapse collapse" aria-labelledby="heading-${id}">
                        <div class="accordion-body">
                            <ul class="list-group">
                                ${layersHtml}
                            </ul>
                            <div class="list-group mt-3">
                                ${childrenHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        const html = Object.keys(tree).map(key => createAccordionItem(tree[key], [key])).join("");
        $(containerId).html(html);
    }

    window.selectLayer = function(layerName, title, abstract, metadataUrl, dataUrl) {
        selectedLayer = layerName;
        selectedTitle = title;
        selectedAbstract = abstract;
        selectedMetadataUrl = metadataUrl;
        selectedDataUrl = dataUrl;

        // Atualiza informações no DOM
        $("#layerTitle").text(selectedTitle);
        $("#layerName").text(selectedLayer);
        $("#layerAbstract").text(selectedAbstract);
        $("#layerMetadataUrl").attr("href", selectedMetadataUrl);
        $("#layerDataUrl").attr("href", selectedDataUrl);
        $("#layerInfoCard").show();

        // Atualiza seção de downloads
        const downloadFormats = [
            { format: "Shapefile", url: `${baseWmsUrl}?service=WFS&version=1.1.0&request=GetFeature&typeName=${selectedLayer}&outputFormat=shape-zip`, icon: "bi-bounding-box" },
            { format: "CSV", url: `${baseWmsUrl}?service=WFS&version=1.1.0&request=GetFeature&typeName=${selectedLayer}&outputFormat=csv`, icon: "bi-table" },
            { format: "GeoJSON", url: `${baseWmsUrl}?service=WFS&version=1.1.0&request=GetFeature&typeName=${selectedLayer}&outputFormat=application%2Fjson`, icon: "bi-braces" },
            { format: "KML", url: `${baseWmsUrl}/kml?layers=${selectedLayer}`, icon: "bi-globe" },
            { format: "ZIP", url: selectedDataUrl, icon: "bi-file-earmark-zip" }
        ];

        const downloadHtml = downloadFormats.map(f => {
            if (f.format === "ZIP" && selectedDataUrl === "semData") {
                return ""; // Não exibe o botão ZIP se dataUrl for "semData"
            }
            if ((f.format === "Shapefile" || f.format === "CSV" || f.format === "GeoJSON") && selectedDataUrl !== "semData") {
                return ""; // Não exibe Shapefile, CSV e GeoJSON se dataUrl não for "semData"
            }
            return `
                <a href="${f.url}" target="_blank" class="btn btn-outline-primary m-1">
                    <i class="bi ${f.icon}"></i> ${f.format}
                </a>
            `;
        }).join("");

        $("#downloadLinks").html(downloadHtml);

        // Atualiza links de geosserviços
        const layerNameReplaced = selectedLayer.replace(":", "/");
        const geoservicesHtml = `
            <a href="https://geoserverhomo23.sefin.fortaleza.ce.gov.br/geoserver/${layerNameReplaced}/ows?service=WMS&request=GetCapabilities" target="_blank" class="btn btn-outline-secondary m-1">
                <i class="bi bi-globe"></i> WMS
            </a>
            <a href="https://geoserverhomo23.sefin.fortaleza.ce.gov.br/geoserver/${layerNameReplaced}/ows?service=WFS&request=GetCapabilities" target="_blank" class="btn btn-outline-secondary m-1">
                <i class="bi bi-vector-pen"></i> WFS
            </a>
            <a href="${selectedMetadataUrl}" target="_blank" class="btn btn-outline-secondary m-1">
                <i class="bi bi-braces-asterisk"></i> WCS
            </a>
        `;

        $("#geoservicesLinks").html(geoservicesHtml);

        // Solicita a legenda da camada
        const legendUrl = `${baseWmsUrl}?service=WMS&request=GetLegendGraphic&format=image/png&layer=${selectedLayer}&LEGEND_OPTIONS=dpi:120;forceLabels:on;fontAntiAliasing:true;countMatched:false;fontName:sans;hideEmptyRules:false;forceTitles:off`;
        $("#layerLegend").attr("src", legendUrl); // Atualiza a legenda no DOM

        // Remove camada anterior
        if (wmsLayer) {
            map.removeLayer(wmsLayer);
        }

        // Adiciona nova camada ao mapa
        wmsLayer = L.tileLayer.wms(baseWmsUrl, {
            layers: selectedLayer,
            format: 'image/png',
            transparent: true,
            maxZoom: 20
        }).addTo(map);
    };

    function fetchWMSCapabilities() {
        $.ajax({
            url: getCapabilitiesUrl,
            method: "GET",
            success: function (data) {
                processWMSCapabilities(data);
            },
            error: function () {
                alert("Erro ao buscar as capacidades do WMS.");
            }
        });
    }
    fetchWMSCapabilities();
});

