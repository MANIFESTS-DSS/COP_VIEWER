(function(){ try {var elementStyle = document.createElement('style'); elementStyle.innerText = ".leaflet-grid-label .gridlabel-vert {\n    margin-left: 8px;\n    -webkit-transform: rotate(90deg);\n    transform: rotate(90deg);\n}\n\n.leaflet-grid-label .gridlabel-vert,\n.leaflet-grid-label .gridlabel-horiz {\n    padding-left:2px;\n    text-shadow: -2px 0 #FFFFFF, 0 2px #FFFFFF, 2px 0 #FFFFFF, 0 -2px #FFFFFF;\n}"; document.head.appendChild(elementStyle);} catch(e) {console.error('vite-plugin-css-injected-by-js', e);} })();(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory(require("leaflet")) : typeof define === "function" && define.amd ? define(["leaflet"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.L = global.L || {}, global.L.AutoGraticule = factory(global.L));
})(this, function(L) {
  "use strict";
  function _interopDefaultLegacy(e) {
    return e && typeof e === "object" && "default" in e ? e : { "default": e };
  }
  var L__default = /* @__PURE__ */ _interopDefaultLegacy(L);
  var L_AutoGraticule = "";
  class AutoGraticule extends L__default["default"].LayerGroup {
    constructor(options) {
      super();
      this.options = {
        redraw: "moveend",
        minDistance: 100
      };
      this.lineStyle = {
        stroke: true,
        color: "#111",
        opacity: 0.6,
        weight: 1,
        interactive: false
      };
      L__default["default"].Util.setOptions(this, options);
    }
    onAdd(map) {
      this._map = map;
      this.redraw();
      this._map.on("viewreset " + this.options.redraw, this.redraw, this);
      this.eachLayer(map.addLayer, map);
      return this;
    }
    onRemove(map) {
      map.off("viewreset " + this.options.redraw, this.redraw, this);
      this.eachLayer(this.removeLayer, this);
      return this;
    }
    redraw() {
      this._bounds = this._map.getBounds().pad(0.5);
      this.clearLayers();
      this.constructLines();
      return this;
    }
    constructLines() {
      const bounds = this._map.getBounds();
      const zoom = this._map.getZoom();
      this._bounds = AutoGraticule.bboxIntersect(bounds, [[-85, -180], [85, 180]]);
      const getBoundsBkp = this._map.getBounds;
      try {
        this._map.getBounds = function() {
          return AutoGraticule.bboxIntersect(getBoundsBkp.apply(this), [[-85, -180], [85, 180]]);
        };
        const center = this._map.project(bounds.getCenter(), zoom);
        const dist = AutoGraticule.niceRound(AutoGraticule.round(this._map.unproject(center.add([this.options.minDistance / 2, 0]), zoom).lng - this._map.unproject(center.subtract([this.options.minDistance / 2, 0]), zoom).lng, 12), false);
        const west = Math.max(bounds.getWest(), -180);
        const east = Math.min(bounds.getEast(), 180);
        for (let lng = Math.ceil(AutoGraticule.round(west / dist, 12)) * dist; lng <= east; lng += dist) {
          this.addLayer(this.buildXLine(lng));
          this.addLayer(this.buildLabel("gridlabel-horiz", AutoGraticule.round(lng, 12)));
        }
        if (bounds.getNorth() > 0) {
          let lat = Math.max(0, bounds.getSouth());
          let first = true;
          while (lat < bounds.getNorth() && lat < 85) {
            const point = this._map.project([lat, bounds.getCenter().lng], zoom);
            const point2LatLng = this._map.unproject(point.subtract([0, this.options.minDistance]), zoom);
            const dist2 = AutoGraticule.niceRound(AutoGraticule.round(point2LatLng.lat - lat, 12), true);
            lat = AutoGraticule.round(first ? Math.ceil(AutoGraticule.round(lat / dist2, 12)) * dist2 : Math.ceil(AutoGraticule.round(point2LatLng.lat / dist2, 12)) * dist2, 2);
            first = false;
            this.addLayer(this.buildYLine(lat));
            this.addLayer(this.buildLabel("gridlabel-vert", lat));
          }
        }
        if (bounds.getSouth() < 0) {
          let lat = Math.min(0, bounds.getNorth());
          let first = true;
          while (lat > bounds.getSouth() && lat > -85) {
            const point = this._map.project([lat, bounds.getCenter().lng], zoom);
            const point2LatLng = this._map.unproject(point.add([0, this.options.minDistance]), zoom);
            const dist2 = AutoGraticule.niceRound(AutoGraticule.round(lat - point2LatLng.lat, 12), true);
            lat = AutoGraticule.round(first ? Math.floor(AutoGraticule.round(lat / dist2, 12)) * dist2 : Math.floor(AutoGraticule.round(point2LatLng.lat / dist2, 12)) * dist2, 2);
            first = false;
            this.addLayer(this.buildYLine(lat));
            this.addLayer(this.buildLabel("gridlabel-vert", lat));
          }
        }
      } finally {
        this._map.getBounds = getBoundsBkp;
      }
    }
    buildXLine(x) {
      const bottomLL = new L__default["default"].LatLng(this._bounds.getSouth(), x);
      const topLL = new L__default["default"].LatLng(this._bounds.getNorth(), x);
      return new L__default["default"].Polyline([bottomLL, topLL], this.lineStyle);
    }
    buildYLine(y) {
      const leftLL = new L__default["default"].LatLng(y, this._bounds.getWest());
      const rightLL = new L__default["default"].LatLng(y, this._bounds.getEast());
      return new L__default["default"].Polyline([leftLL, rightLL], this.lineStyle);
    }
    buildLabel(axis, val) {
      const bounds = this._map.getBounds().pad(-3e-3);
      let latLng;
      if (axis == "gridlabel-horiz") {
        latLng = new L__default["default"].LatLng(bounds.getNorth(), val);
      } else {
        latLng = new L__default["default"].LatLng(val, bounds.getWest());
      }
      return L__default["default"].marker(latLng, {
        interactive: false,
        icon: L__default["default"].divIcon({
          iconSize: [0, 0],
          className: "leaflet-grid-label",
          html: '<div class="' + axis + '">' + val + "&#8239;\xB0</div>"
        })
      });
    }
    static round(number, digits) {
      const fac = Math.pow(10, digits);
      return Math.round(number * fac) / fac;
    }
    static niceRound(number, variableDistance) {
      if (number <= 0 || !isFinite(number))
        throw "Invalid number " + number;
      else {
        if (variableDistance && number >= 5)
          return 5;
        if (number <= 10) {
          let fac = 1;
          while (number > 1) {
            fac *= 10;
            number /= 10;
          }
          while (number <= 0.1) {
            fac /= 10;
            number *= 10;
          }
          if (number == 0.1)
            return AutoGraticule.round(0.1 * fac, 12);
          else if (number <= 0.2)
            return AutoGraticule.round(0.2 * fac, 12);
          else if (number <= 0.5)
            return AutoGraticule.round(0.5 * fac, 12);
          else
            return fac;
        } else if (number <= 30)
          return 30;
        else if (number <= 45)
          return 45;
        else if (number <= 60)
          return 60;
        else
          return 90;
      }
    }
    static bboxIntersect(bbox1, bbox2) {
      const bounds1 = bbox1 instanceof L.LatLngBounds ? bbox1 : L__default["default"].latLngBounds(bbox1);
      const bounds2 = bbox2 instanceof L.LatLngBounds ? bbox2 : L__default["default"].latLngBounds(bbox2);
      return L__default["default"].latLngBounds([
        [Math.max(bounds1.getSouth(), bounds2.getSouth()), Math.max(bounds1.getWest(), bounds2.getWest())],
        [Math.min(bounds1.getNorth(), bounds2.getNorth()), Math.min(bounds1.getEast(), bounds2.getEast())]
      ]);
    }
  }
  return AutoGraticule;
});
//# sourceMappingURL=L.AutoGraticule.js.map
