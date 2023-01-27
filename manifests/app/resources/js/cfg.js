/* default app configuration */
var cfg = {
    profile: 'default',
    proxy: 'proxy.php',
    mapProxy: true,
    layerProxy: true,
    encoder: 'encoder.php',
    defaultLocale: 'en',
    availableLocales: ['gl', 'es', 'pt', 'en'],
    crs: L.CRS.EPSG3857,
    initialZoom: 7,
    minZoom: 0,
    maxZoom: 18,
    initialCenter: [42.522, -10.147],
    ignoreData: false,
    layersXML: {
        test: 'test.xml', //'http://mapas.intecmar.gal/plancamgal/config/capas.xml',
        public: 'http://coptool.plancamgal.gal/api/pub/map/visor/{user}/capabilities.xml',
        private: 'http://coptool.plancamgal.gal/api/map/visor/{user}/capabilities.xml'
    },
    toponymURL: 'http://www.intecmar.gal/wms/wfs',
    toponymField: 'TOPONIMO',
    toponymName: 'GN:ToponimiaCostera',
    toponymFeatName: 'feature:ToponimiaCostera',
    bitacoraUrl: location.protocol + '//' + location.host + location.pathname + 'bitacora/',
    episodes: 'http://coptool.plancamgal.gal/api/episodes/'
}