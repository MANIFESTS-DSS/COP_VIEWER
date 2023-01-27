var toponymHandler = {
    defaultStyle: {
        radius: 6,
        opacity: 1,
        color: '#0066FF', //'#3388ff',
        weight: 2,
        fillColor: '#0066FF', //'#3388ff',
        fillOpacity: 0.3
    },
    hoverStyle: {
        radius: 8,
        opacity: 1,
        color: '#FB3640', //'#FF0000',
        weight: 2,
        fillColor: '#FB3640',
        fillOpacity: 0.3
    },
    executeQuery: function (toponym) {
        var filter = ['<filter><PropertyIsLike matchCase="false" wildCard="*" singleChar="." escapeChar="!"><PropertyName>' + cfg.toponymField + '</PropertyName><Literal>*' + toponym + '*</Literal></PropertyIsLike></filter>']
        var filter = ['<GetFeature typeName="', cfg.toponymName, '"><Query typeName="', cfg.toponymFeatName, '" srsName="EPSG:3857"><Filter><PropertyIsLike matchCase="false" wildCard="*" singleChar="." escapeChar="!"><PropertyName>', cfg.toponymField, '</PropertyName><Literal>*', toponym, '*</Literal></PropertyIsLike></Filter></Query></GetFeature>']
        var params = {
            service: 'WFS',
            version: '1.0.0',
            request: 'GetFeature',
            srsName: "EPSG:4326",
            typeName: cfg.toponymName,
            maxFeatures: 50000,
            filter: filter.join(''),
            outputFormat: 'application/json'
        }

        if (layerHandler.highlights.toponym) {
            map.removeLayer(layerHandler.highlights.toponym);
            delete layerHandler.highlights.toponym;

            layerHandler.removeCustomElementFromPanel('toponym');
        }

        requestHandler.request({ search: toponym, default: this.defaultStyle, hover: this.hoverStyle }, cfg.toponymURL + L.Util.getParamString(params), 'json', function (obj, data) {
            console.log('Query results: ' + data.features.length);

            layerHandler.highlights.toponym = L.geoJson(data, {
                style: function (feature) {
                    return obj.default;
                },
                coordsToLatLng: function (coords) {
                    return new L.LatLng(coords[1], coords[0]);
                },
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, null);
                },
                onEachFeature: function (feature, layer) {
                    popupOptions = { maxWidth: 200 };
                    layer.on({
                        mouseover: function (event) {
                            var layer = event.target;
                            layer.setStyle(obj.hover);
                        },
                        mouseout: function (event) {
                            var layer = event.target;
                            layer.setStyle(obj.default);
                        }
                    })
                    layer.bindPopup(feature.properties.TOPONIMO, popupOptions);
                }
            });

            layerHandler.highlights.toponym.type = 'highlight';
            layerHandler.highlights.toponym.id = 'toponym';
            layerHandler.highlights.toponym.title = 'toponimos';
            layerHandler.highlights.toponym.search = obj.search;
            layerHandler.highlights.toponym.count = data.features.length;

            if (data.features.length > 0) {
                layerHandler.highlights.toponym.addTo(map);
            }
        })
    },
    updateStyle: function (layer, style) {
        layer.setStyle(style);
    }
}