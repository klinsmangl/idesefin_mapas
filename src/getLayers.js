// URL of the WMS GetCapabilities request
const wmsUrl = 'https://geoserverhomo23.sefin.fortaleza.ce.gov.br/geoserver/ows?service=WMS&version=1.3.0&request=GetCapabilities';

// Helper function to recursively build the tree structure
function addToTree(tree, parts, layerInfo) {
  const currentPart = parts[0];
  
  if (!currentPart) {
    // We've reached the end of the parts array, add the layer
    if (!Array.isArray(tree.layers)) {
      tree.layers = [];
    }
    tree.layers.push(layerInfo);  // Store both name and title in layers
    return;
  }

  // Initialize the current node if it doesn't exist
  if (!tree.children) {
    tree.children = {};
  }
  
  if (!tree.children[currentPart]) {
    tree.children[currentPart] = {
      name: currentPart,
      children: {},
      layers: []
    };
  }

  // Recurse with the remaining parts
  addToTree(tree.children[currentPart], parts.slice(1), layerInfo);
}

// Main function to process WMS capabilities
function processWMSCapabilities(xmlText) {
  // Parse the XML text into a DOM object
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "application/xml");

  // Extract layers from the WMS capabilities XML
  const layers = xmlDoc.getElementsByTagName('Layer');

  // Initialize the hierarchical tree with a root node
  const menuTree = {
    name: 'root',
    children: {},
    layers: []
  };

  // Process each layer
  Array.from(layers).forEach(layer => {
    const layerName = layer.getElementsByTagName('Name')[0]?.textContent;
    const layerTitle = layer.getElementsByTagName('Title')[0]?.textContent;
    const keywordList = layer.getElementsByTagName('KeywordList')[0];
    const keywords = keywordList 
      ? Array.from(keywordList.getElementsByTagName('Keyword')).map(keyword => keyword.textContent)
      : [];

    // Check for MetadataURL and DataURL
    const metadataURL = layer.getElementsByTagName('MetadataURL')[0];
    const dataURL = layer.getElementsByTagName('DataURL')[0];
    const metadataHref = metadataURL ? metadataURL.getElementsByTagName('OnlineResource')[0]?.getAttribute('xlink:href') : null;
    const dataHref = dataURL ? dataURL.getElementsByTagName('OnlineResource')[0]?.getAttribute('xlink:href') : null;

    // Process keywords starting with 'menu'
    keywords.forEach(keyword => {
      if (keyword.startsWith('menu')) {
        // Remove 'menu' prefix and split remaining parts
        const parts = keyword.split('_').slice(1);
        if (parts.length > 0) {
          addToTree(menuTree, parts, { 
            name: layerName, 
            title: layerTitle, 
            metadataURL: metadataHref,
            dataURL: dataHref
          });
        }
      }
    });
  });

  return menuTree;
}

// Helper function to format the tree for logging
function formatTree(node, level = 0) {
  const indent = '  '.repeat(level);
  let output = '';

  if (node.name && node.name !== 'root') {
    output += `${indent}${node.name}\n`;
  }

  if (node.layers && node.layers.length > 0) {
    output += `${indent}Layers:\n`;
    node.layers.forEach(layer => {
      output += `${indent}  - ${layer}\n`;
    });
  }

  if (node.children) {
    Object.values(node.children).forEach(child => {
      output += formatTree(child, level + 1);
    });
  }

  return output;
}

// Export the menu tree
export const menuTree = fetch(wmsUrl)
  .then(response => response.text())
  .then(xmlText => {
    const tree = processWMSCapabilities(xmlText);
    console.log(JSON.stringify(tree, null, 2));  // Log the raw JSON structure with indentation
    return tree;  // Return the tree to be exported
  })
  .catch(error => {
    console.error('Error fetching WMS capabilities:', error);
    return {};  // Return an empty object in case of an error
  });

