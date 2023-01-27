/* operations to control storage */
var localStorageHandler = {
    hasData: false,
    ignoreData: cfg.ignoreData,
    sessionName: null,
    sessionEpisode: null,
    current: 0,
    max: 5,
    old: 0,
    root: 'contingencias',
    setSession: function (name, episode) {
        this.sessionName = name;
        this.sessionEpisode = episode;

        this.checkDataExistance();
    },
    checkDataExistance: function () {
        let session = localStorage.getItem(this.root);

        if (session) {
            let _cfg = JSON.parse(session);
            this.old = _cfg.pointer ? _cfg.pointer : this.old;
            let keys = Object.keys(_cfg);
            let data = false;

            for (var i = 0; i < keys.length; i++) {
                if (this.sessionName && this.sessionEpisode) {
                    if (_cfg[keys[i]].name == this.sessionName && _cfg[keys[i]].episode == this.sessionEpisode) {
                        data = true;
                        this.current = keys[i];
                    }
                } else {
                    if (_cfg[keys[i]].profile == cfg.profile) {
                        data = true;
                        this.current = keys[i];
                    }
                }
            }

            if (!data) {
                this.current = keys.length < this.max ? keys.length : this.old;
                this.old = this.old == this.current ? (this.old < this.max ? (this.old + 1) : 0) : this.old;
            }

            this.hasData = data; //(localStorage.getItem('session_cfg')?true:false);
        } else {
            this.hasData = false;
        }
    },
    toggleIgnoreData: function () {
        /*
            if ignoreData has value true the save process will 
            ignore changes and keep previous data if exists

            if ignoreData in cfg is true there wont be 
            initial data load
        */
        this.ignoreData = this.ignoreData ? false : true;
    },
    loadData: function () {
        /* update app configuration with saved configuration values */
        if (this.hasData && !this.ignoreData) {
            let _cfg = JSON.parse(localStorage.getItem(this.root));
            let session = _cfg[this.current].config;

            cfg.time = _cfg[this.current].time;
            cfg.timeIndex = _cfg[this.current].timeIndex;
            cfg.initialZoom = session.zoom;
            cfg.defaultLocale = session.locale;
            cfg.initialCenter = session.center;
            layerHandler.zindex = session.zIndex;
            basemapHandler.initialName = session.basemap;
        }
    },
    saveData: function () {
        /* save map and layers configuration */
        let data = localStorage.getItem(this.root);
        if (data) {
            data = JSON.parse(data);
        } else {
            data = {};
        }

        this.clearData();

        let basemap = null;

        let _basemap = Object.values(basemapHandler.basemapsObject).filter(basemap => { if (basemap.active) { return basemap.name } })[0];
        if (_basemap) {
            basemap = _basemap.name
        }

        if (!this.ignoreData) {
            let timeIndex = null;
            let time = null;

            if (map.timeDimension && map.timeDimension._currentTimeIndex != -1) {
                timeIndex = map.timeDimension._currentTimeIndex;
                time = map.timeDimension._availableTimes[map.timeDimension._currentTimeIndex];
            }

            data.pointer = this.old;
            data[this.current] = {
                time: time,
                timeIndex: timeIndex,
                name: this.sessionName,
                episode: this.sessionEpisode,
                profile: (this.sessionName && this.sessionEpisode ? false : cfg.profile),
                config: {
                    zoom: map.getZoom(),
                    center: [map.getCenter().lat, map.getCenter().lng],
                    zIndex: layerHandler.zindex,
                    locale: i18n.locale,
                    basemap: basemap
                },
                layers: Array.from(layerHandler.htmlLayers.querySelectorAll('.service-layer')).map(_layer => {
                    let oLayer = layerHandler.getLayerById(_layer.getAttribute('data-id'));
                    return {
                        id: _layer.getAttribute('data-id'),
                        name: oLayer.name,
                        key: oLayer.key,
                        styles: oLayer.styles,
                        opacity: _layer.getAttribute('data-opacity'),
                        visible: _layer.getAttribute('data-visible'),
                        active: _layer.getAttribute('data-active'),
                        zindex: _layer.getAttribute('data-zindex'),
                        url: oLayer.url
                    }
                })
            }
            console.log(data)

            localStorage.setItem(this.root, JSON.stringify(data));

            /*
                localStorage.setItem('session_cfg', JSON.stringify({
                    zoom: map.getZoom(),
                    center: [map.getCenter().lat,  map.getCenter().lng],
                    zIndex: layerHandler.zindex,
                    locale: i18n.locale,
                    basemap: basemap
                }));
                localStorage.setItem('session_layers', JSON.stringify({
                    layers: Array.from(layerHandler.htmlLayers.querySelectorAll('.service-layer')).map(_layer =>{
                        let oLayer = layerHandler.getLayerById(_layer.getAttribute('data-id'));
                        return {
                            id: _layer.getAttribute('data-id'),
                            name: oLayer.name,
                            key: oLayer.key,
                            styles: oLayer.styles,
                            opacity: _layer.getAttribute('data-opacity'),
                            visible: _layer.getAttribute('data-visible'),
                            active: _layer.getAttribute('data-active'),
                            zindex: _layer.getAttribute('data-zindex'),
                            url: oLayer.url
                        }
                    })
                }));
            */
        }
    },
    clearSession: function () {
        localStorage.removeItem(localStorageHandler.root);
    },
    clearData: function () {
        localStorage.clear();
    },
    saveOnExit: function () {
        /* trys to save data on tab close, page exit */
        window.addEventListener('unload', () => this.saveData());
    },
    getLayerData: function () {
        /* returns json with layers configuration */
        let data = localStorage.getItem(localStorageHandler.root);
        let layers = null;

        if (data) {
            data = JSON.parse(data);
            layers = data[localStorageHandler.current].layers;
        }

        return layers;
    }
}