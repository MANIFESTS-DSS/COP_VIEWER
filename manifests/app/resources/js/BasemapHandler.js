var basemapHandler = {
    basemapsDefinition: basemaps,
    basemapsObject: {},
    basemapsHtml: null,
    basemapGroup: null,
    initialName: null,
    activeId: null,
    _init_: function (container) {
        this.basemapGroup = L.layerGroup();
        this.basemapGroup.addTo(map);

        this.getLayersFromDefinition(this.basemapsDefinition);

        if (this.basemapsHtml) {
            container.appendChild(this.basemapsHtml);
            this.basemapsHtml.addEventListener('click', () => this.handleClickEvent(event));
        }
        Object.values(this.basemapsObject).map((_layer, i) => {
            if (this.initialName) {
                if (_layer.name == this.initialName) {
                    this.activeLayer(i);
                }
            } else if (_layer.active) {
                this.activeLayer(i);
            }
        })
    },
    createPanel: function () {
        var _container = document.createElement('div');
        _container.className = 'basemaps-panel';

        var _panel = document.createElement('div');
        _panel.className = 'basemap-panel';
        _panel.setAttribute('data-bs-toggle', 'collapse');
        _panel.setAttribute('data-bs-target', '#basemapcontainer');
        _panel.innerHTML = '<div class="basemap-panel-label">' + i18n._translate('capas_base') + '</div>';

        var _body = document.createElement('div');
        _body.className = 'basemap-panel-body';
        _body.innerHTML = '<div id="basemapcontainer" class="basemap-panel-groups collapse"><div class="card card-body"></div></div>';

        _container.appendChild(_panel);
        _container.appendChild(_body);

        return _container;
    },
    createLayer: function (index, name) {
        var _layer = document.createElement('div');
        _layer.className = 'basemap-layer';
        _layer.setAttribute('data-id', index);
        _layer.setAttribute('data-active', 0);
        _layer.setAttribute('data-visible', 0);
        _layer.innerHTML = '<input type="radio" value="' + index + '" name="group-basemap"><div class="basemap-layer-label">' + i18n._translate(name) + '</div>';

        return _layer;
    },
    handleClickEvent: function (event) {
        var id = event.target.getAttribute('data-id');
        if (id) {
            this.activeLayer(parseInt(id));
        }
    },
    getLayersFromDefinition: function (def) {
        if (!def) {
            return;
        }

        if (!this.basemapsHtml) {
            this.basemapsHtml = this.createPanel();
        }

        var index = 0;
        if (this.basemapsObject && Object.keys(this.basemapsObject).length != 0) {
            index = Object.keys(this.basemapsObject);
            index = index[index.length - 1];
        }
        Object.values(def).map(basemap => {
            var _tmp = basemap.url;
            if (cfg.mapProxy) {
                _tmp = cfg.proxy + '?url=' + _tmp + '|*|';
            }
            this.basemapsObject[index] = {
                name: basemap.name,
                layer: L.tileLayer.wms(_tmp, { layers: basemap.layers, transparent: true, format: 'image/png', attribution: basemap.attribution, crossOrigin: 'anonymous' }),
                active: basemap.default ? 1 : 0
            }
            this.basemapsHtml.querySelector('.card-body').appendChild(this.createLayer(index, basemap.name));
            index += 1;
        })
    },
    getLayerById: function (id) {
        var layer = this.basemapsObject[id];

        return layer;
    },
    activeLayer: function (id) {
        if (id == this.activeId) {
            return;
        }
        if ((this.activeId || this.activeId == 0) && id != this.activeId) {
            /*this.basemapGroup.eachLayer(function (layer) {
                this.basemapGroup.removeLayer(layer)
            });*/
            var _layer = this.getLayerById(this.activeId);
            if (_layer) {
                this.basemapGroup.removeLayer(_layer.layer);
                _layer.active = 0;
            }
        }
        var _layer = this.getLayerById(id);
        if (_layer) {
            _layer.layer.addTo(this.basemapGroup);
            _layer.layer.setZIndex(0);
            _layer.active = 1;
            this.activeId = id;

            var input = this.basemapsHtml.querySelector('input[type="radio"][name="group-basemap"][value="' + id + '"]')
            if (input) {
                input.checked = true;
            }
        }
    }
}