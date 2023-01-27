/* handler to control map */
var mapHandler = {
    bbox: null,
    resetExtent: function () {
        if (this.bbox) {
            map.fitBounds(this.bbox, true);
        } else {
            map.setView(cfg.initialCenter, cfg.initialZoom);
        }
    },
    export: function (filename) {
        const cover = document.querySelector('.view-cover');
        if (!cover.classList.contains('loading')) {
            cover.classList.add('loading');
        }
        html2canvas(document.querySelector('#map')).then((canvas) => {
            const base64image = canvas.toDataURL("image/png");

            var el = document.createElement("a");
            el.setAttribute("href", base64image);
            el.setAttribute("download", filename);
            document.body.appendChild(el);

            el.click();
            el.remove();

            cover.classList.remove('loading');
        });
    }
}
L.TiltHandler = L.Handler.extend({
    addHooks: function () {
        L.DomEvent.on(window, 'deviceorientation', this._tilt, this);
    },

    removeHooks: function () {
        L.DomEvent.off(window, 'deviceorientation', this._tilt, this);
    },

    _tilt: function (ev) {
        this._map.invalidateSize();
    }
});
L.Map.addInitHook('addHandler', 'tilt', L.TiltHandler);

L.CursorHandler = L.Handler.extend({
    addHooks: function () {
        this._map.on('mouseover', this._open, this);
        this._map.on('mousemove', this._update, this);
        //this._map.on('mouseout', this._close, this);
    },
    removeHooks: function () {
        this._map.off('mouseover', this._open, this);
        this._map.off('mousemove', this._update, this);
        //this._map.off('mouseout', this._close, this);
    },
    _open: function (e) {
        this._update(e);
        this._map.cursor_container.classList.add('open');
    },
    /*
        _close: function () {
            this._map.cursor_container.classList.remove('open');
        },
    */
    _update: function (e) {
        var dirLat = e.latlng.lat >= 0 ? 'N' : 'S'
        var h = e.latlng.lat | 0
        var m = (Math.abs(e.latlng.lat - h) * 60) | 0
        var s = parseInt((Math.abs(e.latlng.lat - h) * 3600) - m * 60)

        var lat = h + '° ' + m + '.' + (s > 9 ? s : '0' + s) + dirLat
        h = e.latlng.lng | 0
        m = (Math.abs(e.latlng.lng - h) * 60) | 0
        s = parseInt((Math.abs(e.latlng.lng - h) * 3600) - m * 60)
        var dirLng = e.latlng.lng >= 0 ? 'E' : 'W'

        var lng = h + '° ' + m + '.' + (s > 9 ? s : '0' + s) + dirLng
        this._map.cursor_container.querySelector('.coordinates-degrees').innerHTML = lat + ', ' + lng
        this._map.cursor_container.querySelector('.coordinates').innerHTML = ' (' + e.latlng.lat.toFixed(5) + ', ' + e.latlng.lng.toFixed(5) + ')'
    }
});

L.Map.addInitHook('addHandler', 'cursor', L.CursorHandler);