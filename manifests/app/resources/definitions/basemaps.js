var basemaps = {
    /*
        0: {
            name: 'EMODnet',
            url: 'http://ows.emodnet-bathymetry.eu/wms',
            layers: ['emodnet:mean_atlas_land', 'world:sea_names', 'coastlines'],
            crs: 'EPSG:3857',
            version: '1.3.0',
            attribution: '',
            default: true
        },
        1: {
            name: 'IGN-BASE (imprimible)',
            url: 'http://www.ign.es/wms-inspire/ign-base',
            layers: ['IGNBaseTodo'],
            crs: 'EPSG:3857',
            version: '1.3.0',
            attribution: '&#x00A9; Instituto Geogr&aacute;fico Nacional de Espa&ntilde;a',
        },
        2: {
            name: 'IGN-BASE',
            url: 'http://www.ign.es/wmts/ign-base',
            layers: ['IGNBaseTodo'],
            crs: 'EPSG:3857',
            version: '1.3.0',
            attribution: '&#x00A9; Instituto Geogr&aacute;fico Nacional de Espa&ntilde;a',
        },
        3: {
            name: 'PNOA',
            url: 'http://www.ign.es/wmts/pnoa-ma',
            layers: ['OI.OrthoimageCoverage'],
            crs: 'EPSG:3857',
            version: '1.3.0',
            attribution: 'PNOA cedido por &#x00A9; Instituto Geogr&aacute;fico Nacional de Espa&ntilde;a',
        }
    */
    0: {
        name: 'Batimetría',
        url: 'https://ows.emodnet-bathymetry.eu/wms',
        layers: ['emodnet:mean_atlas_land'],
        crs: 'EPSG:3857',
        version: '1.3.0',
        attribution: 'EMODnet Bathymetry'
    },
    1: {
        name: 'IGN-BASE',
        url: 'http://www.ign.es/wms-inspire/ign-base',
        layers: ['IGNBaseTodo'],
        crs: 'EPSG:3857',
        version: '1.3.0',
        attribution: '&#x00A9; Instituto Geogr&aacute;fico Nacional de Espa&ntilde;a',
    },
    2: {
        name: 'OpenStreetMap',
        url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        layers: [],
        crs: 'EPSG:3857',
        version: '1.3.0',
        attribution: 'OpenStreetMap',
    },
    3: {
        name: 'PNOA',
        url: 'https://www.ign.es/wms-inspire/pnoa-ma',
        layers: ['fondo', 'OI.OrthoimageCoverage'],
        crs: 'EPSG:3857',
        version: '1.3.0',
        attribution: '© Instituto Geográfico Nacional de España',
        default: true
    },
    4: {
        name: 'Sentinel-2',
        url: 'https://tiles.maps.eox.at/wms',
        layers: ['s2cloudless-2020_3857_512'],
        crs: 'EPSG:3857',
        version: '1.3.0',
        attribution: '<a xmlns:dct="http://purl.org/dc/terms/" href="https://s2maps.eu" property="dct:title">Sentinel-2 cloudless - https://s2maps.eu</a> by <a xmlns:cc="http://creativecommons.org/ns#" href="https://eox.at" property="cc:attributionName" rel="cc:attributionURL">EOX IT Services GmbH</a> (Contains modified Copernicus Sentinel data 2020)',
    }
}