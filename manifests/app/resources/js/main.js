var map = null;
errorHandler.catchErrors(function () {
    /* load translations */
    i18n._init_(function () {
        var _zoom = cfg.initialZoom;
        var _center = cfg.initialCenter;

        /* create modal */
        customModal._init_();
        customModal.setCallbacks({
            preview: {
                close: function () {
                    var img = customModal.preview.querySelector('img');
                    if (img) {
                        var show = layerHandler.activePanel.querySelector('[data-id="' + img.getAttribute('data-id') + '"] .toggle-legend.show');
                        if (show) {
                            show.classList.remove('show');
                        }
                    }
                }
            }
        });

        /* load saved data and activate save mode */
        localStorageHandler.checkDataExistance();
        localStorageHandler.loadData();
        localStorageHandler.saveOnExit();

        /* configure proxy */
        requestHandler.setProxy(cfg.proxy, 'url');

        /* configure map */
        map = L.map('map', {
            crs: cfg.crs, zoomControl: false, preferCanvas: true, timeDimension: true, timeDimensionControl: true, timeDimensionControlOptions: {
                playerOptions: {
                    loop: true,
                    buffer: 5
                },
                timeZones: ["UTC"]
            }
        }).setView(cfg.initialCenter, cfg.initialZoom);

        map.whenReady(function () {
            Array.from(document.querySelectorAll('.leaflet-top')).map(element => {
                element.setAttribute('data-html2canvas-ignore', true);
            })
        })

        cfg.initialZoom = _zoom;
        cfg.initialCenter = _center;

        delete _zoom;
        delete _center;

        /* override default player */
        playerHandler._init_(map, new Date().toISOString(), 72, '1');
        playerHandler.appendTo(document.querySelector('#map-player'));

        /* mobile options */
        layerHandler.mobileButtons = document.createElement('nav');
        layerHandler.mobileButtons.className = 'leaflet-bar leaflet-control navbar navbar-expand-lg navbar-light bg-light';
        layerHandler.mobileButtons.innerHTML = `
        <span></span>
        <button class="navbar-toggler" type="button">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="mobileOptions">
          <ul class="navbar-nav mr-auto">
            <li class="nav-item">
                <div class="features-button"></div>
            </li>
            <li class="nav-item">
                <div class="measure-area"></div>
            </li>
            <li class="nav-item">
                <div class="measure-line"></div>
            </li>
            <li class="nav-item">
                <div class="toggle-graticule"></div>
            </li>
            <li class="nav-item">
                <div class="toggle-active-panel"></div>
            </li>
            <li class="nav-item">
                <div class="download-png-button"></div>
            </li>
          </ul>          
        </div>
        `
        L.DomEvent.disableClickPropagation(layerHandler.mobileButtons);
        L.DomEvent.disableScrollPropagation(layerHandler.mobileButtons);

        layerHandler.mobileButtons.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();

            if (event.target.tagName == 'SPAN') {
                const mobilePanel = layerHandler.mobileButtons.querySelector('#mobileOptions');
                if (mobilePanel.className == 'collapse navbar-collapse') {
                    mobilePanel.className = 'navbar-collapse collapse show';
                } else {
                    mobilePanel.className = 'collapse navbar-collapse';
                }
            } else if (event.target.tagName == 'DIV') {
                const button = document.querySelector('#app #map .leaflet-top.leaflet-right > div > .' + event.target.classList[0]);
                if (button) {
                    button.click();
                }
            }
        })

        map._container.querySelector('.leaflet-control-container .leaflet-top.leaflet-right').prepend(layerHandler.mobileButtons);

        /* fullscreen controller */
        var fullscreen = document.createElement('div');
        fullscreen.classList = 'toggle-fullscreen';
        fullscreen.setAttribute('title', i18n._translate('toggleFullscreen'));
        L.DomEvent.disableClickPropagation(fullscreen);
        L.DomEvent.disableScrollPropagation(fullscreen);
        fullscreen.addEventListener('click', function (event) {
            var app = document.querySelector('main');
            if ((window.fullScreen) || (event.target.classList.contains('isActive')) /*|| (window.innerWidth == screen.width && window.innerHeight == screen.height)*/) {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                    if (event.target.classList.contains('isActive')) {
                        event.target.classList.remove('isActive');
                    }
                } else if (document.webkitExitFullscreen) { /* Safari */
                    document.webkitExitFullscreen();
                    if (event.target.classList.contains('isActive')) {
                        event.target.classList.remove('isActive');
                    }
                } else if (document.msExitFullscreen) { /* IE11 */
                    document.msExitFullscreen();
                    if (event.target.classList.contains('isActive')) {
                        event.target.classList.remove('isActive');
                    }
                }
            } else {
                if (app.requestFullscreen) {
                    app.requestFullscreen();
                    if (!event.target.classList.contains('isActive')) {
                        event.target.classList.add('isActive');
                    }
                } else if (app.webkitRequestFullscreen) { /* Safari */
                    app.webkitRequestFullscreen();
                    if (!event.target.classList.contains('isActive')) {
                        event.target.classList.add('isActive');
                    }
                } else if (app.msRequestFullscreen) { /* IE11 */
                    app.msRequestFullscreen();
                    if (!event.target.classList.contains('isActive')) {
                        event.target.classList.add('isActive');
                    }
                }
            }
        });

        document.addEventListener('fullscreenchange', map.invalidateSize(), false);
        document.addEventListener('mozfullscreenchange', map.invalidateSize(), false);
        document.addEventListener('MSFullscreenChange', map.invalidateSize(), false);
        document.addEventListener('webkitfullscreenchange', map.invalidateSize(), false);

        var fullscreenControl = document.createElement('div');
        fullscreenControl.className = 'leaflet-control-fullscreen leaflet-bar leaflet-control';
        fullscreenControl.appendChild(fullscreen);

        map._container.querySelector('.leaflet-control-container .leaflet-top.leaflet-right').prepend(fullscreenControl);

        /* language */
        var languageSelector = document.createElement('div');
        languageSelector.className = 'language-container leaflet-control';
        languageSelector.setAttribute('data-lang', i18n.locale);
        languageSelector.setAttribute('data-state', 0);
        languageSelector.innerHTML = '<div class="language-button" title="' + i18n._translate('idioma') + '"><span class="material-symbols-outlined">public</span><div class="language-info">' + i18n.locale + '</div></div><div class="language-panel"><span class="language-panel-title">' + i18n_locale.lang[i18n.locale] + '</span></div>';
        cfg.availableLocales.map(language => {
            var radio = document.createElement('div');
            radio.innerHTML = `
                <input type="radio" name="lang" value="${language}" ${i18n.locale == language ? 'checked' : ''}>
                <label class="${i18n.locale == language ? 'checked' : ''}">${i18n_locale.lang[language]}</label>
            `
            languageSelector.querySelector('.language-panel').appendChild(radio);
        })
        languageSelector.addEventListener('click', function (e) {
            if (e.target.classList.contains('language-button')) {
                e.target.parentNode.setAttribute('data-state', e.target.parentNode.getAttribute('data-state') == '0' ? '1' : '0');
            } else if (e.target.name == 'lang') {
                var nUrl = new URL(window.location.href);
                nUrl.searchParams.set('locale', e.target.value);
                window.location = nUrl;
                //window.location.reload()
            }
        })
        map._container.querySelector('.leaflet-top.leaflet-left').prepend(languageSelector);


        /* custom zoom control */
        zoomControl = L.control.zoom({ position: 'topright' }).addTo(map);

        var reset_extent = document.createElement('div');
        reset_extent.className = 'reset-extent-button';
        reset_extent.setAttribute('title', i18n._translate('resetExtent'));
        reset_extent.addEventListener('click', () => mapHandler.resetExtent())
        L.DomEvent.disableClickPropagation(reset_extent);
        L.DomEvent.disableScrollPropagation(reset_extent);

        zoomControl._container.insertBefore(reset_extent, zoomControl._zoomOutButton);

        zoomControl._zoomInButton.setAttribute('title', i18n._translate('zoomIn'));
        zoomControl._zoomOutButton.setAttribute('title', i18n._translate('zoomOut'));

        map.setMinZoom(cfg.minZoom);
        map.setMaxZoom(cfg.maxZoom);

        /* custom basemap control */
        var basemapButton = document.createElement('div');
        basemapButton.classList = 'toggle-basemap-panel';
        basemapButton.setAttribute('title', i18n._translate('basemapPanel'));
        L.DomEvent.disableClickPropagation(basemapButton);
        L.DomEvent.disableScrollPropagation(basemapButton);
        basemapButton.addEventListener('click', function (event) {
            event.target.nextSibling.classList.toggle('show');
            event.target.classList.toggle('isActive');
        });

        var basemapControl = document.createElement('div');
        basemapControl.className = 'leaflet-control-basemaps leaflet-bar leaflet-control';
        basemapControl.appendChild(basemapButton);

        map._container.querySelector('.leaflet-control-container .leaflet-top.leaflet-right').appendChild(basemapControl);

        /* get features button */
        var featurePanel = document.createElement('div');
        featurePanel.className = 'leaflet-features leaflet-bar leaflet-control';

        var featureButton = document.createElement('div');
        featureButton.className = 'features-button';
        featureButton.title = i18n._translate('featuresButton');

        L.DomEvent.disableClickPropagation(featureButton);
        L.DomEvent.disableScrollPropagation(featureButton);

        featureButton.addEventListener('click', function (event) {
            layerHandler.toggleQueryFeatures();
        })

        map.on('click', function (event) {
            if (layerHandler.queryFeatures) {
                var ids = []
                Array.from(layerHandler.htmlLayers.querySelectorAll('[data-active="1"][data-queryable="1"]')).map(layer => {
                    ids.push(layer.getAttribute('data-id'));
                })
                if (ids.length > 0) {
                    /*var dist = layerHandler.tolerance;
                    var lat = event.latlng.lat;
                    var lng = event.latlng.lng;
                    var c1 = {};
                    var c2 = {};
                    c1.lng = lng - dist;
                    c1.lat = lat - dist;
                    c2.lng = lng + dist;
                    c2.lat = lat + dist;*/
                    var c1 = layerHandler.tolerancePointer.getBounds()._southWest;
                    var c2 = layerHandler.tolerancePointer.getBounds()._northEast;
                    //var latlng = cfg.crs.project(event.latlng);
                    c1 = cfg.crs.project(c1);
                    c2 = cfg.crs.project(c2);
                    layerHandler.getFeatures([c1.x, c1.y, c2.x, c2.y], ids);
                }
            }
        })

        map.on('mousemove', function (event) {
            if (layerHandler.queryFeatures && layerHandler.tolerancePointer) {
                layerHandler.updateTolerancePointer(event);
            } else if (layerHandler.queryFeatures) {
                layerHandler.createTolerancePointer(event);
            } else if (!layerHandler.queryFeatures && layerHandler.tolerancePointer) {
                layerHandler.removeTolerancePointer();
            }
        })

        map.on('zoomend', function (event) {
            if (layerHandler.queryFeatures && layerHandler.tolerancePointer) {
                layerHandler.updateTolerancePointer(event);
            }
        });

        featurePanel.appendChild(featureButton);

        map._container.querySelector('.leaflet-control-container .leaflet-top.leaflet-right').appendChild(featurePanel);

        /* override measure language */
        L.Measure = {
            linearMeasurement: i18n._translate('measureDistance'),
            areaMeasurement: i18n._translate('measureArea'),
            start: i18n._translate('measureStart'),
            meter: i18n._translate('unitsm'),
            kilometer: i18n._translate('unitskm'),
            squareMeter: i18n._translate('unitsm2'),
            squareKilometers: i18n._translate('unitskm2'),
        };

        /* measures */
        measureActionArea = null;
        measureActionLine = null;


        /* measure area button */
        var measureArea = document.createElement('div');
        measureArea.className = 'leaflet-measure-area leaflet-bar leaflet-control';

        var measureAreaButton = document.createElement('div');
        measureAreaButton.className = 'measure-area';
        measureAreaButton.title = i18n._translate('measureAreaButton');

        L.DomEvent.disableClickPropagation(measureAreaButton);
        L.DomEvent.disableScrollPropagation(measureAreaButton);

        measureActionArea = new L.MeasureAction(map, {
            model: "area",
            color: '#007BC4',
            layerHandler: layerHandler.highlights
        });

        measureAreaButton.addEventListener('click', function (event) {
            /*if(measureActionArea._measurePath){
                measureActionArea._measurePath.removeFrom(map);
                measureActionArea._measurePath._renderer.removeFrom(map);
            }
            if(measureActionArea._directPath){
                measureActionArea._directPath.removeFrom(map);
                measureActionArea._directPath._renderer.removeFrom(map);
            }
            if(measureActionArea._trail && measureActionArea._trail.overlays){
                measureActionArea._trail.overlays.map(point=>{
                    point.removeFrom(map);
                })
            }*/
            if (measureActionArea._measurementStarted) {
                measureActionArea._clearOverlay();
                measureActionArea._disableMeasure();
                if (event.target.classList.contains('isActive')) {
                    event.target.classList.remove('isActive');
                    layerHandler.mobileButtons.querySelector('.measure-area').classList.remove('isActive');
                }
            } else {
                if (measureActionLine._measurementStarted) {
                    measureActionLine._clearOverlay();
                    measureActionLine._disableMeasure();
                    var _container = document.querySelector('#app #map .measure-line');
                    if (_container && _container.classList.contains('isActive')) {
                        _container.classList.remove('isActive');
                        layerHandler.mobileButtons.querySelector('.measure-line').classList.remove('isActive');
                    }
                }
                measureActionArea.enable();
                if (!event.target.classList.contains('isActive')) {
                    event.target.classList.add('isActive');
                    layerHandler.mobileButtons.querySelector('.measure-area').classList.add('isActive');
                }
            }
        })

        measureArea.appendChild(measureAreaButton);

        map.on('measurefinish', function (event) {
            console.log(event)
        })

        map._container.querySelector('.leaflet-control-container .leaflet-top.leaflet-right').appendChild(measureArea);

        /* measure line button */
        var measureLine = document.createElement('div');
        measureLine.className = 'leaflet-measure-line leaflet-bar leaflet-control';

        var measureLineButton = document.createElement('div');
        measureLineButton.className = 'measure-line';
        measureLineButton.title = i18n._translate('measureLineButton');

        L.DomEvent.disableClickPropagation(measureLineButton);
        L.DomEvent.disableScrollPropagation(measureLineButton);

        measureActionLine = new L.MeasureAction(map, {
            model: "distance",
            color: '#007BC4',
            layerHandler: layerHandler.highlights
        });

        measureLineButton.addEventListener('click', function (event) {
            if (measureActionLine._measurementStarted) {
                measureActionLine._clearOverlay();
                measureActionLine._disableMeasure();
                if (event.target.classList.contains('isActive')) {
                    event.target.classList.remove('isActive');
                    layerHandler.mobileButtons.querySelector('.measure-line').classList.remove('isActive');
                }
            } else {
                if (measureActionArea._measurementStarted) {
                    measureActionArea._clearOverlay();
                    measureActionArea._disableMeasure();
                    var _container = document.querySelector('#app #map .measure-area');
                    if (_container && _container.classList.contains('isActive')) {
                        _container.classList.remove('isActive');
                        layerHandler.mobileButtons.querySelector('.measure-area').classList.remove('isActive');
                    }
                }
                measureActionLine.enable();
                if (!event.target.classList.contains('isActive')) {
                    event.target.classList.add('isActive');
                    layerHandler.mobileButtons.querySelector('.measure-line').classList.add('isActive');
                }
            }
        })

        measureLine.appendChild(measureLineButton);

        map._container.querySelector('.leaflet-control-container .leaflet-top.leaflet-right').appendChild(measureLine);

        /* toggle graticule button */
        var graticuleButton = document.createElement('div');
        graticuleButton.classList = 'toggle-graticule';
        graticuleButton.setAttribute('title', i18n._translate('graticule'));
        L.DomEvent.disableClickPropagation(graticuleButton);
        L.DomEvent.disableScrollPropagation(graticuleButton);
        graticuleButton.addEventListener('click', function (event) {
            if (layerHandler.graticule) {
                layerHandler.deleteGraticule();
                if (event.target.classList.contains('isActive')) {
                    event.target.classList.remove('isActive');
                    layerHandler.mobileButtons.querySelector('.toggle-graticule').classList.remove('isActive');
                }
            } else {
                layerHandler.createGraticule();
                if (!event.target.classList.contains('isActive')) {
                    event.target.classList.add('isActive');
                    layerHandler.mobileButtons.querySelector('.toggle-graticule').classList.add('isActive');
                }
            }
        });

        var graticulePanelControl = document.createElement('div');
        graticulePanelControl.className = 'leaflet-control-graticule leaflet-bar leaflet-control';
        graticulePanelControl.appendChild(graticuleButton);

        map._container.querySelector('.leaflet-control-container .leaflet-top.leaflet-right').appendChild(graticulePanelControl);

        /* active panel button */
        var activePanelButton = document.createElement('div');
        activePanelButton.classList = 'toggle-active-panel';
        activePanelButton.setAttribute('title', i18n._translate('activePanel'));
        L.DomEvent.disableClickPropagation(activePanelButton);
        L.DomEvent.disableScrollPropagation(activePanelButton);
        activePanelButton.addEventListener('click', function (event) {
            document.querySelector('#app .right-sidebar').classList.toggle('close');
            if (!event.target.classList.contains('isActive')) {
                event.target.classList.add('isActive');
                layerHandler.mobileButtons.querySelector('.toggle-active-panel').classList.add('isActive');
            } else {
                event.target.classList.remove('isActive');
                layerHandler.mobileButtons.querySelector('.toggle-active-panel').classList.remove('isActive');
            }
        });

        var activePanelControl = document.createElement('div');
        activePanelControl.className = 'leaflet-control-active-layers leaflet-bar leaflet-control';
        activePanelControl.appendChild(activePanelButton);

        map._container.querySelector('.leaflet-control-container .leaflet-top.leaflet-right').appendChild(activePanelControl);

        /* export image */
        var exportImage = document.createElement('div');
        exportImage.className = 'download-png-panel leaflet-control';
        exportImage.innerHTML = '<div class="download-png-button" title="' + i18n._translate('downloadImage') + '"><div class="download-png-info"><input type="text" placeholder="' + i18n._translate('pngPlaceholder') + '"><input type="button" value="' + i18n._translate('pngButton') + '"></div></div>';

        document.querySelector('div.leaflet-top.leaflet-right').append(exportImage);

        L.DomEvent.disableClickPropagation(exportImage);
        L.DomEvent.disableScrollPropagation(exportImage);

        exportImage.querySelector('.download-png-button').addEventListener('click', function (e) {
            if (e.target.classList.contains('download-png-button')) {
                e.target.classList.toggle('show');
                layerHandler.mobileButtons.querySelector('.download-png-button').classList.toggle('isActive');
            } else if (e.target.tagName == 'INPUT' && e.target.getAttribute('type') == 'button') {
                mapHandler.export(e.target.parentNode.querySelector('input[type="text"]').value + '_' + new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
                e.target.parentNode.parentNode.classList.remove('show');
                layerHandler.mobileButtons.querySelector('.download-png-button').classList.remove('isActive');
            }
        })

        /* search */
        var searchInput = document.createElement('input');
        searchInput.classList = 'custom-search';
        searchInput.setAttribute('title', i18n._translate('customSearch'));
        searchInput.setAttribute('placeholder', i18n._translate('customSearchPlaceholder'));
        L.DomEvent.disableClickPropagation(searchInput);
        L.DomEvent.disableScrollPropagation(searchInput);

        searchInput.addEventListener('keyup', function (event) {
            if (event.key == 'Enter') {
                toponymHandler.executeQuery(event.target.value);
            }
        });

        var searchPanel = document.createElement('div');
        searchPanel.className = 'leaflet-control-search leaflet-bar leaflet-control';

        searchPanel.appendChild(searchInput);

        map._container.querySelector('.leaflet-control-container .leaflet-top.leaflet-left').appendChild(searchPanel);

        /* scale */
        layerHandler.createScale();

        /* layers from xml */
        layerHandler.getLayersFromXml(cfg.layersXML, function () {
            layerHandler.createLayerPanel(document.querySelector('.legend-panel'));
            layerHandler.createActivePanel(document.querySelector('.active-panel'));
            basemapHandler._init_(document.querySelector('.leaflet-control-basemaps'));

            map.timeDimension.addEventListener('waitForReady', function (e) {
                console.log(e)
            })

            layerHandler.initializeLayers();

            document.querySelector('#app .right-sidebar .active-panel > .active-panel-title').textContent = i18n._translate('activeLayers');
            document.querySelector('#app .right-sidebar .active-panel > .active-custom-panel-title').textContent = i18n._translate('customLayers');

            playerHandler.setLayers(layerHandler.objectLayers);

            if (layerHandler.beginTime && layerHandler.endTime) {
                playerHandler.update(layerHandler.endTime, layerHandler.beginTime);
            } else if (layerHandler.beginTime) {
                playerHandler.update(new Date().toISOString(), layerHandler.beginTime);
            } else if (layerHandler.endTime) {
                playerHandler.update(layerHandler.endTime);
            } else {
                playerHandler.update(new Date().toISOString());
            }
        });

        /* create depth panel */
        layerHandler.createDepthSlider(document.querySelector('#app .right-sidebar'));

        /* mouse coordinates */
        map.cursor_container = document.createElement('div');
        map.cursor_container.className = 'cursor-container leaflet-control';
        map.cursor_container.innerHTML = '<div class="coordinates-icon"></div><div class="coordinates-values"><span class="coordinates-degrees"></span><span class="coordinates"></span></div>';
        document.querySelector('div.leaflet-bottom.leaflet-right').appendChild(map.cursor_container);

        if (window.innerWidth > 800) {
            map.cursor.enable();
        } else {
            map.cursor.disable();
        }

        window.addEventListener('resize', function (event) {
            if (window.innerWidth > 800) {
                map.cursor.enable();
            } else {
                map.cursor.disable();
            }
        }, true);

        /* translate sidebar */
        document.querySelector('#app .left-sidebar .button-toggle.no-highlight').title = i18n._translate('toggleLeftSidebar');

        /* translate player */
        playerHandler.player.querySelector('.timecontrol-backward').title = i18n._translate('playerBack');
        playerHandler.player.querySelector('.timecontrol-forward').title = i18n._translate('playerForward');
        playerHandler.player.querySelector('.timecontrol-play').title = i18n._translate('playerPlay');
        playerHandler.player.querySelector('.timecontrol-date').title = i18n._translate('playerTime');
    });

    /* initialize sidebar events */
    document.querySelector('#app .left-sidebar .button-toggle').addEventListener('click', function (event) {
        this.parentNode.classList.toggle('close');
    });
    /*
        document.querySelector('#app .right-sidebar .button-toggle').addEventListener('click', function(event){
            this.parentNode.classList.toggle('close');
        });
    */
    document.querySelector('#app .right-sidebar .close-active-panel .close-button-active-panel').addEventListener('click', function (event) {
        layerHandler.mobileButtons.querySelector('.toggle-active-panel').click();
    });
    document.querySelector('#app .left-sidebar').addEventListener('transitionend', function (event) {
        if (event.target.classList.contains('left-sidebar') && event.target.classList.contains('close')) {
            map.invalidateSize();
        }
    })
    document.querySelector('#app .right-sidebar').addEventListener('transitionend', function (event) {
        if (event.target.classList.contains('right-sidebar') && event.target.classList.contains('close')) {
            map.invalidateSize();
        }
    })

    /* show left sidebar on desktop */
    let agent = navigator.userAgent || navigator.vendor || window.opera;
    if (!/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(agent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(agent.substr(0, 4))) {
        document.querySelector('#app .left-sidebar').classList.remove('close');
    }
});