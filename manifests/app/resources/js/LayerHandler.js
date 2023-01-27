/* handler to control layers */
var layerHandler = {
    htmlLayers: null,
    objectLayers: null,
    activePanel: null,
    opacityPanel: null,
    highlights: {},
    graticule: null,
    scale: null,
    zindex: 1,
    time: new Date().toISOString(),
    depth: 0,
    depthValues: [0, 0.5, 1, 2, 5, 10, 20, 40, 75, 125, 250],
    queryFeatures: false,
    tolerance: 0.00004, //0.0001,
    toleranceMax: 0.009,
    toleranceMin: 0.00004,
    toleranceMaxZoom: 18,
    toleranceMinZoom: 9,
    tolerancePointer: null,
    bitacora: null,
    mobileButtons: null,
    getCapabilities: function (id, callback) {
        var _layer = this.getLayerById(id);
        if (_layer && !_layer.loadedCapabilities) {
            var params = {
                request: 'GetCapabilities',
                service: 'WMS',
                version: '1.1.1'
            }

            requestHandler.request({
                layer: _layer, callback: callback, data: {
                    method: 'POST',
                    headers: new Headers({
                        "Content-type": "application/x-www-form-urlencoded"
                    }),
                    body: ['url=' + encodeURIComponent(_layer.url + L.Util.getParamString(params, null, true))]
                }
            }, 'proxy.php', 'xml', function (obj, data) {
                /*
                    'text', function (obj, data) {
                    if (data.startsWith('({') && data.endsWith('});')) {
                        data = data.match(/(?<=")(.*?)(?=")/g)[0];
                    }
                    var parser = new DOMParser();
                    data = parser.parseFromString(data, 'text/xml');
                    console.log(data)
                */
                var format = Array.from(data.querySelectorAll('Capability Request GetFeatureInfo Format')).map(format => {
                    return format.textContent
                });
                obj.layer.format = format;
                var def = Array.from(data.querySelectorAll('Layer[queryable="1"]')).filter(_layer => _layer.querySelector('Name').textContent == obj.layer.name);
                if (def && def.length > 0) {
                    def = def[0];
                    var timeRange = def.querySelector('Extent[name="time"]');
                    if (timeRange) {
                        timeRange = timeRange.textContent.trim().split(',');
                        if (timeRange.length > 0) {
                            obj.layer.dates = [timeRange[0], timeRange[timeRange.length - 1]];
                        }
                    }
                }
                obj.layer.supportWFS = false;
                var wfs = data.querySelector('Capability UserDefinedSymbolization');
                if (wfs) {
                    wfs = wfs.getAttribute('RemoteWFS');
                    if (wfs == '1') {
                        obj.layer.supportWFS = true;
                    }
                }
                obj.layer.loadedCapabilities = true;
            })
        }
    },
    createPanel: function (panel, index) {
        /* return html element */

        var _container = document.createElement('div');
        _container.className = 'service-panel-body';

        var _panel = document.createElement('div');
        _panel.className = 'service-panel';
        _panel.setAttribute('data-id', index);
        _panel.setAttribute('data-type', panel.getAttribute('type'));
        _panel.setAttribute('data-bs-toggle', 'collapse');
        _panel.setAttribute('data-bs-target', '#layercontainer_' + index);
        _panel.innerHTML = '<div class="service-panel-label">' + i18n._translate(panel.getAttribute('label')) + '</div>';

        var _body = document.createElement('div');
        _body.className = 'service-panel-body';
        _body.innerHTML = '<div id="layercontainer_' + index + '" class="service-panel-groups collapse"><div class="card card-body"></div></div>';

        _container.appendChild(_panel);
        _container.appendChild(_body);

        return _container;
    },
    createGroup: function (group, index) {
        /* return html element */

        var _container = document.createElement('div');
        _container.className = 'service-group-body';

        var _group = document.createElement('div');
        _group.className = 'service-group';
        _group.setAttribute('data-id', index);
        _group.setAttribute('data-bs-toggle', 'collapse');
        _group.setAttribute('data-bs-target', '#layercontainer_' + index);
        _group.innerHTML = '<div class="service-group-label">' + i18n._translate(group.getAttribute('group')) + '</div>';

        var _body = document.createElement('div');
        _body.className = 'service-group-body';
        _body.innerHTML = '<div id="layercontainer_' + index + '" class="service-group-layers collapse"><div class="card card-body"></div></div>';

        _container.appendChild(_group);
        _container.appendChild(_body);

        return _container;
    },
    createLayer: function (layer, index) {
        /* return html element */
        var _layer = document.createElement('div');
        _layer.className = 'service-layer';
        _layer.title = i18n._translate('toggleLayer');

        if (layer.querySelector('LatLonBoundingBox')) {
            var minx = layer.querySelector('LatLonBoundingBox').getAttribute('minx');
            var miny = layer.querySelector('LatLonBoundingBox').getAttribute('miny');
            var maxx = layer.querySelector('LatLonBoundingBox').getAttribute('maxx');
            var maxy = layer.querySelector('LatLonBoundingBox').getAttribute('maxy');
            var bbox = null;

            if (minx && miny && maxx && maxy) {
                bbox = [[miny, minx], [maxy, maxx]];
            }

            _layer.setAttribute('data-minx', minx);
            _layer.setAttribute('data-miny', miny);
            _layer.setAttribute('data-maxx', maxx);
            _layer.setAttribute('data-maxy', maxy);
        }

        _layer.setAttribute('data-id', index);
        _layer.setAttribute('data-queryable', layer.getAttribute('queryable'));
        _layer.setAttribute('data-srs', (layer.querySelector('SRS') ? layer.querySelector('SRS').textContent : cfg.crs.code));
        _layer.setAttribute('data-type', layer.querySelector('LayerType').textContent);
        _layer.setAttribute('data-zindex', null);
        _layer.setAttribute('data-opacity', 1);
        _layer.setAttribute('data-active', 0);
        _layer.setAttribute('data-visible', 0);

        _layer.innerHTML = '<div class="service-layer-label">' + i18n._translate(layer.querySelector('Title').textContent) + '</div>';

        return [_layer, bbox];
    },
    createGraticule: function (options) {
        if (L.AutoGraticule && !this.graticule) {
            var graticuleOptions = {
                redraw: 'moveend',
                minDistance: 100
            };
            if (options) {
                graticuleOptions = options
            }
            this.graticule = new L.AutoGraticule(graticuleOptions).addTo(map);
        }
    },
    deleteGraticule: function () {
        if (this.graticule) {
            map.removeLayer(this.graticule);
            delete this.graticule;
        }
    },
    createScale: function (options) {
        if (L.control.graphicScale && !this.scale) {
            var scaleOptions = {
                doubleLine: false,
                fill: 'hollow',
                showSubunits: false,
                maxUnitsWidth: 240
            }
            if (options) {
                scaleOptions = options
            }

            this.scale = L.control.graphicScale(scaleOptions).addTo(map);
        }
    },
    deleteScale: function () {
        if (this.scale) {
            this.scale.remove();
            delete this.scale;
        }
    },
    getLayersFromXml: function (urls, _callback, _error) {
        /* 
            url: url to request xml
            callback: function called after proccessing xml
        */
        var data = {};
        var url = urls.test;
        if (url_token != '0' && url_id != '0') {
            data.headers = new Headers({ "Authorization": "Bearer " + url_token });
            url = urls.private;
            url = url.replace('{user}', url_id);

            fetch(cfg.episodes + url_id, {
                headers: new Headers({ "Authorization": "Bearer " + url_token })
            })
                .then((response) => response.json())
                .then((ep) => {
                    cfg.episode = ep.name;

                    if (!ep.errorCode) {
                        this.addBitacora(cfg.bitacoraUrl, document.querySelector('.bitacora-container'), {
                            data: data,
                            url: url,
                            callback: _callback,
                            error: _error
                        });
                    }
                })
        } else if (url_id != '0') {
            url = urls.public;
            url = url.replace('{user}', url_id);

            this.loadLayers(data, url, _callback, _error)
        } else {
            this.loadLayers(data, url, _callback, _error)
        }

    },
    loadLayers: function (data, url, _callback, _error) {
        requestHandler.request({ layerHandler: this, data: data }, url, 'xml', function (obj, data) {
            if (data) {
                var latlng = data.querySelector('Tree LatLonBoundingBox');
                if (latlng) {
                    var c1 = L.latLng(latlng.getAttribute('maxy'), latlng.getAttribute('maxx'));
                    var c2 = L.latLng(latlng.getAttribute('miny'), latlng.getAttribute('minx'));
                    mapHandler.bbox = L.latLngBounds(c1, c2);
                    mapHandler.resetExtent();
                }
                var beginTime = data.querySelector('Tree BeginTime');
                var endTime = data.querySelector('Tree EndTime');
                if (beginTime) {
                    layerHandler.beginTime = beginTime.textContent;
                }
                if (endTime) {
                    layerHandler.endTime = endTime.textContent;
                }

                obj.layerHandler.htmlLayers = document.createElement('div');
                obj.layerHandler.objectLayers = {};

                obj.layerHandler.htmlLayers.className = 'layers-panel'
                var panels = data.querySelectorAll('Panel');
                if (panels) {
                    Array.from(panels).map((panel, i) => {
                        var _panel = obj.layerHandler.createPanel(panel, i);
                        var groups = panel.querySelectorAll('LayerGroup');
                        if (groups) {
                            Array.from(groups).map((group, j) => {
                                var _group = obj.layerHandler.createGroup(group, i + '_' + j);
                                var layers = group.querySelectorAll('Layer');
                                if (layers) {
                                    Array.from(layers).map((layer, u) => {
                                        var lpanel = obj.layerHandler.createLayer(layer, i + '_' + j + '_' + u);
                                        _group.querySelector('.card-body').appendChild(lpanel[0]);
                                        obj.layerHandler.objectLayers[i + '_' + j + '_' + u] = {
                                            name: layer.querySelector('Name').textContent,
                                            key: layer.querySelector('Title').textContent,
                                            title: lpanel[0].querySelector('.service-layer-label').textContent,
                                            url: layer.querySelector('Url').textContent.replace(/\?$/, ''),
                                            layer: null,
                                            dates: null,
                                            styles: (layer.querySelector('Style') ? layer.querySelector('Style').textContent : ''),
                                            format: 'image/png',
                                            transparent: true,
                                            srs: (layer.querySelector('SRS') ? layer.querySelector('SRS').textContent : null),
                                            version: null,
                                            type: (layer.querySelector('LayerType') ? parseInt(layer.querySelector('LayerType').textContent) : null),
                                            isSingleTile: (layer.querySelector('Type') ? (parseInt(layer.querySelector('Type').textContent) != 2 && parseInt(layer.querySelector('Type').textContent) != 3 ? true : false) : true),
                                            queryable: (layer.getAttribute('queryable') ? (parseInt(layer.getAttribute('queryable')) ? true : false) : false),
                                            isAshx: layer.querySelector('Url').textContent.replace(/\?$/, '').endsWith('.ashx') ? true : false,
                                            filter: layer.querySelector('Filter').textContent ? layer.querySelector('Filter').textContent : '',
                                            bbox: lpanel[1],
                                            html: lpanel[0],
                                            infoTitle: layer.querySelector('LayerTitle') && layer.querySelector('LayerTitle').textContent.length > 0 ? layer.querySelector('LayerTitle').textContent : null,
                                            infoTemplate: layer.querySelector('LayerMetadata') && layer.querySelector('LayerMetadata').textContent.length > 0 ? layer.querySelector('LayerMetadata').textContent : null
                                        };
                                    })
                                }
                                _panel.querySelector('.card-body').appendChild(_group);
                            })
                        }
                        obj.layerHandler.htmlLayers.appendChild(_panel);
                    })
                    localStorageHandler.loadData();

                    setTimeout(() => {
                        map.flyTo(cfg.initialCenter, cfg.initialZoom);
                        map.timeDimension.setCurrentTimeIndex(cfg.timeIndex);
                        /*
                            if (cfg.time && cfg.timeIndex) {
                                map.timeDimension.setCurrentTimeIndex(cfg.timeIndex);
                            }
                        */
                    }, 1000);
                }
            }
            if (_callback) {
                _callback();
            }
        })
    },
    createLayerPanel: function (_element) {
        if (this.htmlLayers) {
            _element.appendChild(this.htmlLayers);
            this.htmlLayers.addEventListener('click', () => this.htmlLayersClickEvent(event))
        }
    },
    createActivePanel: function (_element) {
        var div = document.createElement('div');
        div.className = 'active-panel-title';

        _element.appendChild(div);

        div = document.createElement('div');
        div.className = 'active-layers-panel';

        _element.appendChild(div);

        this.activePanel = div;
        this.activePanel.addEventListener('click', () => this.activePanelClickEvent(event));
        this.activePanel.addEventListener('dragstart', () => this.activePanelDragstartEvent(event));
        this.activePanel.addEventListener('dragover', () => this.activePanelDragoverEvent(event));
        this.activePanel.addEventListener('drop', () => this.activePanelDropEvent(event));

        var div = document.createElement('div');
        div.className = 'active-custom-panel-title';

        _element.appendChild(div);

        div = document.createElement('div');
        div.className = 'active-custom-layers-panel';

        _element.appendChild(div);

        this.activeCustomPanel = div;
        this.activeCustomPanel.addEventListener('click', () => this.activeCustomPanelClickEvent(event));
    },
    htmlLayersClickEvent: function (event) {
        var id = event.target.getAttribute('data-id');
        if (id && event.target.classList.contains('service-layer')) {
            this.toggleLayer(id);
            if (this.opacityPanel && this.opacityPanel.getAttribute('data-layer-id') == id) {
                this.toggleOpacityPanel(id);
            }
        }
    },
    activePanelClickEvent: function (event) {
        var id = event.target.getAttribute('data-id');
        if (id) {
            console.log(this)
        } else if (event.target.classList.contains('delete-layer')) {
            id = event.target.parentNode.parentNode.getAttribute('data-id');
            this.toggleLayer(event.target.parentNode.parentNode.getAttribute('data-id'));
            if (this.opacityPanel && this.opacityPanel.getAttribute('data-layer-id') == id) {
                this.toggleOpacityPanel(id);
            }
        } else if (event.target.classList.contains('zoom-extent')) {
            id = event.target.parentNode.parentNode.parentNode.parentNode.getAttribute('data-id');
            if (id) {
                this.zoomToExtent(id);
            }
        } else if (event.target.classList.contains('change-opacity')) {
            id = event.target.parentNode.parentNode.parentNode.parentNode.getAttribute('data-id');
            if (id) {
                this.toggleOpacityPanel(id);
            }
        } else if (event.target.classList.contains('download-features')) {
            id = event.target.parentNode.parentNode.parentNode.parentNode.getAttribute('data-id');
            if (id) {
                this.downloadFeatures(id);
            }
        } else if (event.target.classList.contains('toggle-legend')) {
            /*
                if (event.target.classList.contains('show')) {
                    event.target.classList.remove('show');
                    var img = event.target.parentNode.querySelector('img');
                    if (img) {
                        img.remove();
                    }
                } else {
                    id = event.target.parentNode.parentNode.parentNode.getAttribute('data-id');
                    if (id) {
                        event.target.classList.add('show');
                        this.getLegend(id);
                    }
                }
            */
            if (event.target.classList.contains('show')) {
                event.target.classList.remove('show');
                customModal.close(customModal.preview);
            } else {
                id = event.target.parentNode.parentNode.parentNode.getAttribute('data-id');
                if (id) {
                    event.target.classList.add('show');
                    this.getLegend(id, function (obj, data) {
                        var range = null;
                        if (obj.isAshx) {
                            range = data.match(/(?<=value:")([^"]*)/g);
                            data = 'data:image/png;base64,' + data.match(/(?<=image:")([^"]*)/g);
                        }
                        var img = new Image();
                        img.onload = function () {
                            img.setAttribute('data-width', img.width);
                            img.setAttribute('data-height', img.height);
                            img.setAttribute('data-id', obj.id);
                            var _layer = layerHandler.getLayerById(obj.id);
                            customModal.togglePreview(_layer.title, img);
                        }
                        img.src = data;
                        if (range) {
                            img.classList.add('range');
                            /*
                                img.style.setProperty("--content-min", `${range[0]}%`);
                                img.style.setProperty("--content-max", `${range[1]}%`);
                            */
                            img.setAttribute('data-min', range[0]);
                            img.setAttribute('data-max', range[1]);
                        }
                    });
                }
            }

        }
    },
    activeCustomPanelClickEvent: function (event) {
        var id = null;
        if (event.target.classList.contains('delete-layer')) {
            var element = event.target.parentNode.parentNode;
            id = element.getAttribute('data-id');

            if (layerHandler.highlights[id]) {
                if (layerHandler.highlights[id].options.id && layerHandler.highlights[id].options.id.startsWith('mLine_')) {
                    measureActionLine._clear(layerHandler.highlights[id].options.id);
                } else if (layerHandler.highlights[id].options.id && layerHandler.highlights[id].options.id.startsWith('mArea_')) {
                    measureActionArea._clear(layerHandler.highlights[id].options.id);
                } else {
                    map.removeLayer(layerHandler.highlights[id]);
                    delete layerHandler.highlights[id];
                }
            }
            element.remove();
        } else if (event.target.classList.contains('zoom-extent')) {
            id = event.target.parentNode.parentNode.parentNode.parentNode.getAttribute('data-id');
            if (layerHandler.highlights[id]) {
                map.invalidateSize();
                map.fitBounds(layerHandler.highlights[id].getBounds());
            }
        }
    },
    activePanelDragstartEvent: function (event) {
        var id = event.target.getAttribute('data-id');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData("text", id);
    },
    activePanelDragoverEvent: function (event) {
        event.preventDefault();
    },
    activePanelDropEvent: function (event) {
        event.preventDefault();
        if (!this.objectLayers[event.target.getAttribute('data-id')]) {
            return false;
        }
        var origin_id = event.dataTransfer.getData("text");
        var origin_el = this.activePanel.querySelector('[data-id="' + origin_id + '"]')
        var origin_zindex = parseInt(this.htmlLayers.querySelector('[data-id="' + origin_id + '"]').getAttribute('data-zindex'));
        var end_zindex = parseInt(this.htmlLayers.querySelector('[data-id="' + event.target.getAttribute('data-id') + '"]').getAttribute('data-zindex'));

        if (origin_zindex > end_zindex) {
            this.activePanel.insertBefore(origin_el, event.target.nextSibling);
        } else if (origin_zindex < end_zindex) {
            this.activePanel.insertBefore(origin_el, event.target);
        }
        this.updateActivePanelOrder();
    },
    addElementToPanel: function (id) {
        var el = document.createElement('div');
        el.className = 'layer-element';
        el.setAttribute('data-id', id);

        el.setAttribute('draggable', true);

        var _layer = this.getLayerById(id);
        var options = '<div class="layer-options">';

        if (_layer.bbox) {
            options += '<div class="zoom-extent layer-button" title="' + i18n._translate('layerExtent') + '"><span>center_focus_weak</span></div>';
        }
        if (_layer.type != 0) {
            options += '<div class="change-opacity layer-button" title="' + i18n._translate('layerOpacity') + '"><span>exposure</span></div>';
        }
        if (_layer.type == 1 || _layer.type == 5) {
            options += '<div class="download-features layer-button" title="' + i18n._translate('layerDownload') + '"><span>download</span></div>';
        }

        options += '</div>';

        el.innerHTML = '<div><div class="layer-button delete-layer" title="' + i18n._translate('removeLayer') + '"></div></div><div><div class="layer-container"><div class="layer-text">' + this.objectLayers[id].title + '</div>' + options + '</div><div><div class="toggle-legend" title="' + i18n._translate('showLegend') + '"></div><div class="layer-legend"></div></div></div>';
        this.activePanel.prepend(el);
        //this.getLegend(id);
    },
    addCustomElementToPanel: function (id, text, key) {
        var el = document.createElement('div');
        el.className = 'layer-element';
        el.setAttribute('data-id', id);

        var options = '<div class="layer-options"><div class="zoom-extent layer-button" title="' + i18n._translate('layerExtent') + '"><span>center_focus_weak</span></div></div>';
        var textContent = i18n._translate(text.toString());
        if (key) {
            textContent = i18n._translate(key) + ' ' + text
        }

        el.innerHTML = '<div><div class="layer-button delete-layer" title="' + i18n._translate('removeLayer') + '"></div></div><div><div class="layer-container"><div class="layer-text">' + textContent + '</div>' + options + '</div><div><div class="layer-legend"></div></div></div>';

        this.activeCustomPanel.prepend(el);
    },
    removeElementFromPanel: function (id) {
        var el = this.activePanel.querySelector('[data-id="' + id + '"]');
        if (el) {
            el.remove();
        }
    },
    removeCustomElementFromPanel: function (id) {
        var el = this.activeCustomPanel.querySelector('[data-id="' + id + '"]');
        if (el) {
            el.remove();
        }
    },
    updateLayersConfig: function () {
        var _cfg = null;
        if (!cfg.ignoreData) {
            _cfg = (localStorageHandler.getLayerData() ? localStorageHandler.getLayerData() : null);
        }
        active_layers = {};
        Object.values(this.objectLayers).map(_layer => {
            if (_layer.layer) {
                _layer.layer.options.uppercase = true;
                if (_layer.layer._url) {
                    var char = _layer.layer._url.slice(-1);
                    if (char == '?') {
                        _layer.layer._url = _layer.layer._url.slice(0, -1);
                    }
                }
                if (_layer.layer._wmsUrl) {
                    var char = _layer.layer._wmsUrl.slice(-1);
                    if (char == '?') {
                        _layer.layer._wmsUrl = _layer.layer._wmsUrl.slice(0, -1);
                    }
                }
                /*
                    if (!_layer.layer.wmsParams.time) {
                        _layer.layer.wmsParams.time = this.time;
                    }
                */

                if (_cfg) {
                    var _pointer = (_cfg ? _cfg.find(element => element.name == _layer.name && element.url == _layer.url && element.key == _layer.key) : null);
                    if (_pointer) {
                        var _temp = this.htmlLayers.querySelector('[data-id="' + _pointer.id + '"]');
                        if (_temp) {
                            //_temp.setAttribute('data-active', _pointer.active);
                            _temp.setAttribute('data-active', 0);
                            _temp.setAttribute('data-visible', _pointer.visible);
                            _temp.setAttribute('data-opacity', _pointer.opacity);
                            _temp.setAttribute('data-zindex', _pointer.zindex);
                            _temp.setAttribute('data-styles', _pointer.styles);
                        }
                        _layer.layer.setOpacity(parseFloat(_pointer.opacity));
                        if (_pointer.active == '1') {
                            active_layers[_pointer.zindex] = _layer.layer;
                        }
                    }
                } else if (_layer.type == 2) {
                    _layer.html.setAttribute('data-opacity', 0.4);
                }
            }
        })

        Object.values(active_layers).map(_layer => {
            /*
                this.getCapabilities(_layer.id);
                _layer.addTo(map);

                if (_layer.animate) {
                    playerHandler.applyTimesToLayer(_layer);
                }
            */
            setTimeout(() => {
                this.toggleLayer(_layer.id);
            }, 0);
            //this.toggleLayer(_layer.id);
        })
    },
    initializeLayers: function () {
        Object.keys(this.objectLayers).map(_id => {
            if (!this.objectLayers[_id].layer) {
                var params = { layers: this.objectLayers[_id].name, transparent: this.objectLayers[_id].transparent, format: this.objectLayers[_id].format };
                if (this.objectLayers[_id].styles) {
                    params.styles = this.objectLayers[_id].styles;
                    /*
                        L.Util.setOptions(_layer.layer, {styles: _layer.styles});
                        _layer.layer._baseLayer.setParams({styles: _layer.styles});
                    */
                   //_layer.layer.wmsParams.styles = _layer.styles;
                }
                //if (this.objectLayers[_id].srs) {
                //    params.crs = this.objectLayers[_id].srs;
                //    L.Util.setOptions(_layer.layer, {crs: _layer.srs});
                //}

                //params.crossOrigin = 'anonymous';
                params.uppercase = true;

                //L.Util.setOptions(_layer.layer._baseLayer, {crossOrigin: 'anonymous'});
                //_layer.layer._baseLayer.setParams({crossOrigin: 'anonymous'});

                /*
                * Types of layers:
                * 0: Static layer
                * 1: Dynamic layer (changes with time)
                * 2: Oilspill server -> opacity 40%
                * 3: Oilspill server: arrows -> opacity 100% 
                * 4: Layers with filters
                * 5: Layers with colorscalerange
                */
                switch (this.objectLayers[_id].type) {
                    /* case 2:
                        this.setOpacity(_layer.id, 0.4);
                        break;
                    */
                    case 4:
                        /*
                            L.Util.setOptions(_layer.layer, {cql_filter: _layer.filter});
                            _layer.layer._baseLayer.setParams({cql_filter: _layer.filter});
                        */
                       //_layer.layer.wmsParams.cql_filter = _layer.filter;
                        params.cql_filter = this.objectLayers[_id].filter;
                        break;
                    case 5:
                        /*
                            L.Util.setOptions(_layer.layer, {colorscalerange: '0,0.5'});
                            _layer.layer._baseLayer.setParams({colorscalerange: '0,0.5'});
                        */
                       //_layer.layer.wmsParams.colorscalerange = '0,0.5';
                        params.colorscalerange = '0,0.5';
                        this.objectLayers[_id].colorscalerange = '0,0.5';
                        break;
                }
                //if (this.objectLayers[_id].bbox) {
                //    params.bounds = new L.LatLngBounds([parseFloat(this.objectLayers[_id].bbox[0][1]), parseFloat(this.objectLayers[_id].bbox[0][0])],[parseFloat(this.objectLayers[_id].bbox[1][1]), parseFloat(this.objectLayers[_id].bbox[1][0])]);
                //}
                if (this.objectLayers[_id].isAshx) {
                    params.tileSize = 900;
                }

                params.crossOrigin = 'anonymous';
                var _tmp = this.objectLayers[_id].url;
                if (cfg.layerProxy) {
                    _tmp = cfg.proxy + '?url=' + _tmp + '|*|';
                }

                if (this.objectLayers[_id].isSingleTile && !this.objectLayers[_id].isAshx) {
                    this.objectLayers[_id].layer = L.nonTiledLayer.wms(_tmp, params);
                } else {
                    this.objectLayers[_id].layer = L.tileLayer.wms(_tmp, params);
                }
                if (this.objectLayers[_id].type != 0) {
                    this.objectLayers[_id].animate = true;
                    this.objectLayers[_id].layer = L.timeDimension.layer.wms(this.objectLayers[_id].layer, { requestTimeFromCapabilities: false, cache: 0 });
                }

                /*
                    if (this.objectLayers[_id].isSingleTile) {
                        this.objectLayers[_id].layer = L.nonTiledLayer.wms(this.objectLayers[_id].url, {layers: this.objectLayers[_id].name, transparent: this.objectLayers[_id].transparent, format: this.objectLayers[_id].format, crossOrigin: 'anonymous'});
                    } else {
                        this.objectLayers[_id].layer = L.tileLayer.wms(this.objectLayers[_id].url, {layers: this.objectLayers[_id].name, transparent: this.objectLayers[_id].transparent, format: this.objectLayers[_id].format, crossOrigin: 'anonymous'});
                    }
                */
                this.objectLayers[_id].layer.activePanel = true
                this.objectLayers[_id].layer.id = _id

                /*
                    this.objectLayers[_id].layer.on('loading', function(event){
                        event.target._ctx.canvas._image.crossOrigin = true
                        console.log('done')
                    })
                */

                this.objectLayers[_id].layer.on('error', function (error) {
                    var _layer = layerHandler.getLayerById(this.id);
                    if (_layer) {
                        map.removeLayer(_layer.layer);
                        var element = layerHandler.htmlLayers.querySelector('[data-id="' + _layer.layer.id + '"]');
                        if (element) {
                            element.setAttribute('data-visible', 0);
                        }
                    }
                })
            }
        })
        this.updateLayersConfig();
    },
    getLayerById: function (id) {
        var layer = this.objectLayers[id];
        if (!layer) {
            layer = Object.values(this.highlights).filter(layer => layer.id == id);
        }
        return layer;
    },
    toggleLayer: function (id) {
        var _layer = this.getLayerById(id);
        if (_layer) {
            if (_layer.html.getAttribute('data-active') == "0") {
                this.getCapabilities(id);
                _layer.html.setAttribute('data-active', 1);
                _layer.layer.addTo(map);
                this.setOpacity(id, parseFloat(_layer.html.getAttribute('data-opacity')));

                /*
                    _layer.layer.setParams({
                        depth: this.depthValues[this.depth]
                    }, false);
                */

                if (_layer.animate) {
                    playerHandler.applyTimesToLayer(_layer);
                }
            } else {
                _layer.html.setAttribute('data-active', 0);
                _layer.layer.removeFrom(map);
                if (Object.values(layerHandler.objectLayers).filter(_l => { return _l.html.getAttribute('data-active') == '1' && _l.layer._timeDimension }).length == 0) {
                    playerHandler.hide();
                }
            }
        }
    },
    setOpacity: function (id, opacity) {
        var _layer = this.htmlLayers.querySelector('[data-id="' + id + '"]')
        if (this.objectLayers[id] && this.objectLayers[id] && _layer) {
            this.objectLayers[id].layer.setOpacity(opacity);
            _layer.setAttribute('data-opacity', opacity);
        }
    },
    updateZIndex: function (id, index) {
        if (!this.objectLayers[id]) {
            return false;
        }

        var newIndex = index;
        if (!index) {
            newIndex = this.zindex;
            this.zindex += 1;
        }

        this.objectLayers[id].layer.options.zIndex = newIndex;
        this.objectLayers[id].layer.setZIndex(newIndex);
        this.objectLayers[id].html.setAttribute('data-zindex', newIndex);
    },
    updateOrder: function () {
        var layers = Array.from(this.htmlLayers.querySelectorAll('.service-layer[data-id][data-active="1"]')).sort(function (a, b) {
            var a = parseInt(a.getAttribute('data-zindex'));
            var b = parseInt(b.getAttribute('data-zindex'));

            return a < b ? -1 : (a > b ? 1 : 0);
        }).map((_layer, i) => {
            this.updateZIndex(_layer.getAttribute('data-id'), i + 1);
        })
        this.zindex = layers.length + 1;
    },
    updateActivePanelOrder: function () {
        Array.from(this.activePanel.querySelectorAll('[data-id]')).reverse().map((_layer, i) => {
            this.updateZIndex(_layer.getAttribute('data-id'), i + 1);
        })
    },
    applyFilters: function (id, filters) {
        /*
            add params to layer from object
        */
        if (filters) {
            var _layer = this.getLayerById(id);
            if (_layer) {
                _layer.layer.setParams(filters, false);
                if (_layer.html && _layer.html.getAttribute('data-active') == '1' && element.getAttribute('data-visible') == '0') {
                    _layer.html.setAttribute('data-visible', 1);
                    map.addLayer(_layer.layer);
                }
                /*
                    Object.keys(filters).map(filter => {
                        _layer.layer.wmsParams[filter] = filters[filter];
                        var element = this.htmlLayers.querySelector('[data-id="'+_layer.layer.id+'"]');
                        if (element && element.getAttribute('data-active') == '1' && element.getAttribute('data-visible') == '0') {
                            element.setAttribute('data-visible', 1);
                            map.addLayer(_layer.layer);
                        }
                    });
                */
            }
        }
    },
    toggleQueryFeatures: function () {
        this.queryFeatures = this.queryFeatures ? false : true;

        map._container.setAttribute('data-query', this.queryFeatures);

        var el = map._container.querySelector('div > div > .features-button');
        if (this.queryFeatures && !el.classList.contains('isActive')) {
            el.classList.add('isActive');
            this.mobileButtons.querySelector('.features-button').classList.add('isActive');
        } else if (!this.queryFeatures && el.classList.contains('isActive')) {
            el.classList.remove('isActive');
            this.mobileButtons.querySelector('.features-button').classList.remove('isActive');
            if (this.tolerancePointer) {
                map.removeLayer(this.tolerancePointer);
            }
        }
    },
    getFeatures: function (bbox, ids) {
        var confs = {};
        var titles = [];
        var types = [];
        var templates = [];

        ids.map((id, i) => {
            var _layer = this.getLayerById(id);
            if (_layer) {
                var params = null;
                if (_layer.supportWFS) {
                    params = {
                        request: 'GetFeature',
                        service: 'WFS',
                        version: '1.1.1',
                        typename: _layer.name,
                        maxFeatures: 20,
                        srsName: cfg.crs.code,
                        bbox: bbox.join(',') + ',' + cfg.crs.code
                    }
                } else {
                    params = {
                        request: 'GetFeatureInfo',
                        service: 'WMS',
                        version: '1.1.1',
                        layers: _layer.name,
                        query_layers: _layer.name,
                        feature_count: 20,
                        format: 'image/png',
                        //info_format: 'application/vnd.ogc.gml',
                        info_format: 'application/vnd.ogc.gml',
                        styles: _layer.styles,
                        srs: cfg.crs.code,
                        width: 1,
                        height: 1,
                        x: 0,
                        y: 0,
                        bbox: bbox.join(',')
                    }

                    /*
                        if (this.tolerancePointer) {
                            var bounds = this.tolerancePointer.getBounds();
                            var p1 = map.latLngToLayerPoint(bounds._northEast);
                            var p2 = map.latLngToLayerPoint(bounds._southWest);
                            var w = Math.abs(p1.x - p2.x);
                            var h = Math.abs(p1.y - p2.y);
        
                            params.width = Math.round(w);
                            params.height = Math.round(h);
                            params.x = Math.round(w / 2);
                            params.y = Math.round(h / 2);
                        }
                    */
                }

                if (_layer.format) {
                    if (_layer.format.includes('application/vnd.ogc.gml')) {
                        params.info_format = 'application/vnd.ogc.gml';
                    } else if (_layer.format.includes('text/xml')) {
                        params.info_format = 'text/xml';
                    } else if (_layer.format.includes('text/plain')) {
                        params.info_format = 'text/plain';
                    }
                }

                if (_layer.layer._timeDimension && _layer.layer._timeDimension._currentTimeIndex) {
                    params.time = _layer.layer._timeDimension._availableTimes[_layer.layer._timeDimension._currentTimeIndex];
                }

                confs[i] = {
                    url: 'encoder.php',
                    type: 'xml',
                    data: {
                        method: 'POST',
                        headers: new Headers({
                            "Content-type": "application/x-www-form-urlencoded"
                        }),
                        body: ['url=' + encodeURIComponent(_layer.url + L.Util.getParamString(params, null, true))]
                    }
                }

                titles.push(_layer.title);
                types.push(_layer.supportWFS);
                if (_layer.infoTitle && _layer.infoTemplate) {
                    templates.push({
                        title: _layer.infoTitle,
                        body: _layer.infoTemplate
                    });
                } else {
                    templates.push(null);
                }

                /*
                    requestHandler.request({index: i, title: _layer.title, data: {
                        method: 'POST',
                        headers: new Headers({
                            "Content-type": "application/x-www-form-urlencoded"
                        }),
                        body: ['url=' + encodeURIComponent(_layer.url + L.Util.getParamString(params, null , true))]
                    }}, 'encoder.php', 'xml', function(obj, data){
                        var _new = false    
                        if(obj.index == 0){
                            _new = true;
                        }
                        customModal.applyTemplate([data], null, [obj.title], _new);
                    })
                */
            }
        })

        requestHandler.requestAll({ titles: titles, types: types, templates: templates }, confs, function (obj, data) {
            customModal.applyTemplate(data, obj.templates, obj.titles, obj.types, true);
        })
        /*
            if (Object.keys(conf).length > 0) {
                requestHandler.requestAll({data: {}}, conf, function(obj, data){
                    customModal.applyTemplate(data, null, titles);
                })
            }
        */
    },
    downloadFeatures: function (id, bbox) {
        /* queryable = 1 and type = 5 */
        var url = null;
        var _layer = this.getLayerById(id);
        if (_layer) {
            if (_layer.url.search('/thredds/') != -1) {
                //_layer.layer.options.uppercase = false;
                url = _layer.url.replace('/wms/', '/ncss/');
                var params = {
                    var: _layer.download,
                    horizStride: 1,
                    time_start: '2022-07-23T00:00:00Z',
                    time_end: '2022-07-27T03:00:00Z',
                    timeStride: 1,
                    accept: 'netcdf'
                }
                if (_layer.dates) {
                    params.time_start = _layer.dates[0];
                    params.time_end = _layer.dates[_layer.dates.length - 1];
                }
                if (bbox) {
                    params.north = _layer.html.getAttribute('data-miny');
                    params.west = _layer.html.getAttribute('data-maxx');
                    params.east = _layer.html.getAttribute('data-minx');
                    params.south = _layer.html.getAttribute('data-maxy');
                }
                _layer.layer.options.uppercase = false;
            } else {
                url = _layer.url;
                var params = {
                    request: 'GetFeature',
                    service: 'WFS',
                    version: '1.0.0',
                    outputFormat: 'shape-zip',
                    typeName: _layer.name,
                    time: _layer.layer._currentTime ? _layer.layer._currentTime : playerHandler.timeDimension._availableTimes[playerHandler.timeDimension._currentTimeIndex]
                }
                if (bbox) {
                    params.bbox = bbox.join(',');
                } else {
                    params.bbox = [_layer.html.getAttribute('data-minx'), _layer.html.getAttribute('data-miny'), _layer.html.getAttribute('data-maxx'), _layer.html.getAttribute('data-maxy')].join(',')
                }
                if (_layer.srs) {
                    params.bbox += ',' + _layer.srs;
                }
            }
        }
        var link = document.createElement('a');
        link.target = '_blank';
        link.href = url + L.Util.getParamString(params, null, _layer.layer.options.uppercase);
        link.click();

        delete link;
        //_layer.layer.options.uppercase = false;
    },
    getLegend: function (id, _callback) {
        var _layer = this.getLayerById(id);
        if (_layer) {
            var params = {};
            var rtype = 'blob';

            if (_layer.isAshx) {
                params = {
                    request: 'GetColorScale',
                    format: 'image/png',
                    width: 100,
                    height: 15,
                    transparent: true,
                    style: _layer.styles,
                    layers: _layer.name
                }
                rtype = 'text';
            } else {
                params = {
                    service: 'WMS',
                    request: 'GetLegendGraphic',
                    version: '1.1.1',
                    format: 'image/png',
                    transparent: true,
                    style: _layer.styles,
                    layer: _layer.name
                }
            }

            if (_layer.layer._currentTime) {
                params.time = _layer.layer._currentTime
            }
            if (_layer.type == 5) {
                params.colorscalerange = _layer.colorscalerange;
            }
            //requestHandler.request({id: id, data: {}, proxy: true}, _layer.url + L.Util.getParamString(params, null , true), 'blob', _callback/*function(obj, data){
            //    var panel = layerHandler.activePanel.querySelector('[data-id="'+id+'"] .layer-legend');
            //    if (panel) {
            //        var img = new Image();
            //        img.onload = function(){
            //            img.setAttribute('data-width', img.width);
            //            img.setAttribute('data-height', img.height);
            //            panel.appendChild(img);
            //        }
            //        img.src = data;
            //    }
            //}*/, function(obj, data){
            //    var panel = layerHandler.activePanel.querySelector('[data-id="'+obj.id+'"] .layer-legend');
            //    if(panel){
            //        panel.textContent = i18n._translate('errorLegend');
            //    }
            //})
            requestHandler.request({ id: id, data: {}, isAshx: _layer.isAshx, proxy: false }, _layer.url + L.Util.getParamString(params, null, true), rtype, _callback, function (obj, data) {
                //var panel = layerHandler.activePanel.querySelector('[data-id="'+obj.id+'"] .layer-legend');
                //if(panel){
                //    panel.textContent = i18n._translate('errorLegend');
                //}
                requestHandler.request({ id: id, data: {}, isAshx: _layer.isAshx, proxy: true }, _layer.url + L.Util.getParamString(params, null, true), rtype, _callback
                /*
                    function (obj, data) {
                        var panel = layerHandler.activePanel.querySelector('[data-id="'+id+'"] .layer-legend');
                        if (panel) {
                            var img = new Image();
                            img.onload = function(){
                                img.setAttribute('data-width', img.width);
                                img.setAttribute('data-height', img.height);
                                panel.appendChild(img);
                            }
                            img.src = data;
                        }
                    }
                */
               , function (obj, data) {
                        var panel = layerHandler.activePanel.querySelector('[data-id="' + obj.id + '"] .layer-legend');
                        if (panel) {
                            panel.textContent = i18n._translate('errorLegend');
                        }
                    })
            })
        }
    },
    zoomToExtent: function (id) {
        var _layer = this.getLayerById(id);
        if (_layer && _layer.bbox) {
            map.invalidateSize();
            map.fitBounds(_layer.bbox);
        }
    },
    toggleOpacityPanel: function (id) {
        var _layer = this.getLayerById(id);
        if (_layer) {
            if (!this.opacityPanel) {
                this.opacityPanel = document.createElement('div');
                this.opacityPanel.className = 'opacity-panel';
                this.opacityPanel.draggable = true;

                var slider = document.createElement('input');
                slider.type = 'range';
                slider.min = '0';
                slider.max = '100';
                slider.step = '1';
                slider.value = '100';
                slider.className = 'opacity-slider';

                var text = document.createElement('div');

                this.opacityPanel.appendChild(slider);
                this.opacityPanel.appendChild(text);

                slider.addEventListener('change', (event) => {
                    var opacity = event.target.value;
                    this.setOpacity(event.target.parentNode.getAttribute('data-layer-id'), opacity / 100);
                    this.opacityPanel.querySelector('div').textContent = i18n._translate('opacity').format(opacity);
                })
                slider.addEventListener('input', (event) => {
                    //const min = +event.target.min || 0;
                    //const max = +event.target.max || 100;
                    //const value = +event.target.value;

                    //const size = (value - min) / (max - min) * 100;

                    event.target.style.setProperty("--background-size", `${event.target.value}%`);
                })

                this.opacityPanel.addEventListener('click', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                });
                this.opacityPanel.addEventListener('dragstart', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                });
            }
            this.opacityPanel.remove();

            var attr = this.opacityPanel.getAttribute('data-layer-id');
            if (attr != id) {
                this.opacityPanel.setAttribute('data-layer-id', id);

                var opacity = parseFloat(_layer.html.getAttribute('data-opacity')) * 100
                this.opacityPanel.querySelector('input.opacity-slider').style.setProperty("--background-size", `${opacity}%`);
                this.opacityPanel.querySelector('input.opacity-slider').value = opacity;
                this.opacityPanel.querySelector('div').textContent = i18n._translate('opacity').format(opacity);

                this.activePanel.querySelector('[data-id="' + id + '"] .change-opacity').appendChild(this.opacityPanel);
            } else {
                this.opacityPanel.removeAttribute('data-layer-id');
            }
        }
    },
    createDepthSlider: function (element) {
        var div = document.createElement('div');
        div.className = 'depth-panel';

        var title = document.createElement('div');
        title.className = 'depth-panel-title';
        title.textContent = i18n._translate('depthPanel');

        var body = document.createElement('div');
        body.className = 'depth-panel-body';

        div.appendChild(title);
        div.appendChild(body);

        element.appendChild(div);

        var slider = document.createElement('input');
        slider.className = 'depth-slider';
        slider.type = 'range';
        slider.min = 0;
        slider.max = 10;
        slider.value = this.depth;
        slider.step = 1;

        var label = document.createElement('div');
        label.className = 'depth-label';
        label.textContent = this.depthValues[this.depth] + ' ' + i18n._translate('depthUnits');

        body.appendChild(slider);
        body.appendChild(label);

        slider.addEventListener('input', this.depthEventHandler);
        slider.style.setProperty("--background-size", `${this.depth * 10}%`);
    },
    depthEventHandler: function (event) {
        layerHandler.depth = event.target.value;
        event.target.style.setProperty("--background-size", `${event.target.value * 10}%`);

        var label = event.target.parentNode.querySelector('.depth-label');
        label.textContent = layerHandler.depthValues[layerHandler.depth] + ' ' + i18n._translate('depthUnits');

        Object.values(layerHandler.objectLayers).map(_layer => {
            _layer.layer.setParams({
                depth: layerHandler.depthValues[layerHandler.depth]
            }, false);
            if (_layer.layer._layers) {
                Object.values(_layer.layer._layers).map(l => {
                    l.setParams({
                        depth: layerHandler.depthValues[layerHandler.depth]
                    }, false);
                })
            }
        })
    },
    normalize: function (val, maxVal, minVal, max, min) {
        return (((val - minVal) / (maxVal - minVal)) * (max - min)) + min;
    },
    calculateDistance: function () {
        var val = map.getZoom();
        if (val > this.toleranceMaxZoom) {
            val = this.toleranceMaxZoom;
        } else if (val < this.toleranceMinZoom) {
            val = this.toleranceMinZoom;
        }
        val = map.getMaxZoom() - val;

        return this.normalize(val, this.toleranceMinZoom, 0, this.toleranceMax, this.toleranceMin); //this.tolerance / map.getZoom();
    },
    createTolerancePointer: function (event) {
        var dist = this.calculateDistance();
        var lat = event.latlng.lat;
        var lng = event.latlng.lng;
        var bounds = [[lat - dist, lng - dist], [lat + dist, lng + dist]];

        this.tolerancePointer = L.rectangle(bounds, { color: "#ff0000", weight: 1 }).addTo(map);
    },
    updateTolerancePointer: function (event) {
        var dist = this.calculateDistance();
        var bounds = null;
        var lat = null;
        var lng = null;

        if (event.type == 'zoomend') {
            var center = this.tolerancePointer.getCenter();
            lat = center.lat;
            lng = center.lng;
            /*
                bounds = this.tolerancePointer.getBounds();
                bounds._northEast.lat -= dist;
                bounds._northEast.lng -= dist;
                bounds._southWest.lat += dist;
                bounds._southWest.lng += dist;
            */
        } else {
            lat = event.latlng.lat;
            lng = event.latlng.lng;
        }
        bounds = [[lat - dist, lng - dist], [lat + dist, lng + dist]];

        this.tolerancePointer.setBounds(bounds);
    },
    removeTolerancePointer: function () {
        this.tolerancePointer.removeFrom(map);
        delete this.tolerancePointer;
    },
    addBitacora: function (url, container, obj) {
        /* bitacora button creation */
        var bitacoraButton = document.createElement('div');
        bitacoraButton.classList = 'toggle-bitacora';
        bitacoraButton.setAttribute('title', i18n._translate('toggleBitacora'));
        L.DomEvent.disableClickPropagation(bitacoraButton);
        L.DomEvent.disableScrollPropagation(bitacoraButton);
        bitacoraButton.addEventListener('click', function (event) {
            if (layerHandler.bitacora.button.classList.contains('new')) {
                layerHandler.bitacora.button.classList.remove('new');
            }
            layerHandler.bitacora.iframe.parentNode.classList.toggle('show');
        });

        var bitacoraControl = document.createElement('div');
        bitacoraControl.className = 'leaflet-control-bitacora leaflet-bar leaflet-control';
        bitacoraControl.style.display = 'none';
        bitacoraControl.appendChild(bitacoraButton);

        map._container.querySelector('.leaflet-control-container .leaflet-top.leaflet-right').insertBefore(bitacoraControl, map._container.querySelector('.leaflet-control-container .leaflet-top.leaflet-right .leaflet-features.leaflet-control'));

        /* wait iframe messages */
        window.onmessage = (e) => {
            if (e.data == 'new') {
                if (!layerHandler.bitacora.button.classList.contains('new') && !layerHandler.bitacora.iframe.parentNode.classList.contains('show')) {
                    layerHandler.bitacora.button.classList.add('new');
                }
            } else if (e.data == 'auth') {
                layerHandler.bitacora.control.style.display = 'block';
            } else if (e.data == 'no-auth') {
                layerHandler.bitacora.iframe.remove();
                this.loadLayers(obj.data, obj.url, obj.callback, obj.error);
            } else if (typeof e.data === 'object' && e.data !== null) {
                if (e.data.name) {
                    let session = document.querySelector('#session');
                    session.innerHTML = '<b>' + i18n._translate('user') + ':</b> ' + e.data.name + ' <b>' + i18n._translate('episode') + ':</b> ' + cfg.episode;
                    document.querySelector('#app').style.height = 'calc(100vh - ' + session.getBoundingClientRect().height + 'px)'
                    document.querySelector('#app .map-container').style.height = 'calc(100vh - ' + session.getBoundingClientRect().height + 'px)';
                    map.invalidateSize();

                    localStorageHandler.setSession(e.data.name, cfg.episode);
                    this.loadLayers(obj.data, obj.url, obj.callback, obj.error);
                }
            }
        };

        /* load bitacora */
        var url = new URL(url);
        url.searchParams.set('locale', i18n.locale);
        url.searchParams.set('id', url_id);
        url.searchParams.set('token', url_token);

        var bitacora = document.createElement('iframe');
        bitacora.id = 'bitacora';
        bitacora.src = url;

        container.querySelector('span.close-bitacora').addEventListener('click', function (e) {
            e.target.parentNode.classList.remove('show');
        })
        container.querySelector('span.new-tab').addEventListener('click', function (e) {
            window.open(e.target.parentNode.querySelector('iframe').src, '_blank');
        })

        container.appendChild(bitacora);

        this.bitacora = {
            iframe: bitacora,
            control: bitacoraControl,
            button: bitacoraButton
        }
    }
}

/* custom add/remove actions */
L.Layer.prototype.addTo = function (t) {
    if (this.activePanel) {
        layerHandler.addElementToPanel(this.id);
        layerHandler.updateZIndex(this.id);
    } else if (this.type == 'highlight') {
        if (this.search) {
            layerHandler.addCustomElementToPanel(this.id, this.count, this.title);
        } else {
            layerHandler.addCustomElementToPanel(this.id, this.title);
        }
    }
    return t.addLayer(this), this;
}
L.NonTiledLayer.prototype.addTo = function (t) {
    if (this.activePanel) {
        layerHandler.addElementToPanel(this.id);
        layerHandler.updateZIndex(this.id);
    } else if (this.type == 'highlight') {
        layerHandler.addElementToPanel(this.id, this.title);
    }
    return t.addLayer(this), this;
}
L.TimeDimension.Layer.prototype.onAdd = function (t) {
    if (this.activePanel) {
        layerHandler.addElementToPanel(this.id);
        layerHandler.updateZIndex(this.id);
    } else if (this.type == 'highlight') {
        layerHandler.addElementToPanel(this.id, this.title);
    }

    this._map = t,
        !this._timeDimension && t.timeDimension && (this._timeDimension = t.timeDimension),
        this._timeDimension.on("timeloading", this._onNewTimeLoading, this),
        this._timeDimension.on("timeload", this._update, this),
        this._timeDimension.registerSyncedLayer(this),
        this._update()
}
L.Layer.prototype.removeFrom = function (t) {
    if (this.activePanel) {
        layerHandler.removeElementFromPanel(this.id);
        layerHandler.updateOrder();
    }
    return t && t.removeLayer(this), this;
}