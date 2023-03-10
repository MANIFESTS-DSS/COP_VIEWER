/* 
 * Leaflet TimeDimension v1.1.1 - 2019-11-05 
 * 
 * Copyright 2019 Biel Frontera (ICTS SOCIB) 
 * datacenter@socib.es 
 * http://www.socib.es/ 
 * 
 * Licensed under the MIT license. 
 * 
 * Demos: 
 * http://apps.socib.es/Leaflet.TimeDimension/ 
 * 
 * Source: 
 * git://github.com/socib/Leaflet.TimeDimension.git 
 * 
 */

!function(i, e) {
    if ("function" == typeof define && define.amd)
        define(["leaflet", "iso8601-js-period"], i);
    else if ("object" == typeof exports)
        module.exports = i(require("leaflet"), require("iso8601-js-period"));
    else if (void 0 !== e && e.L && "undefined" != typeof L) {
        var t = nezasa.iso8601;
        e.L.TimeDimension = i(L, t)
    }
}(function(i, e) {
    if (void 0 === t)
        var t = {
            iso8601: e
        };
    return i.TimeDimension = (i.Layer || i.Class).extend({
        includes: i.Evented || i.Mixin.Events,
        initialize: function(e) {
            i.setOptions(this, e),
            this._availableTimes = this._generateAvailableTimes(),
            this._currentTimeIndex = -1,
            this._loadingTimeIndex = -1,
            this._loadingTimeout = this.options.loadingTimeout || 3e3,
            this._syncedLayers = [],
            this._availableTimes.length > 0 && this.setCurrentTime(this.options.currentTime || this._getDefaultCurrentTime()),
            this.options.lowerLimitTime && this.setLowerLimit(this.options.lowerLimitTime),
            this.options.upperLimitTime && this.setUpperLimit(this.options.upperLimitTime)
        },
        getAvailableTimes: function() {
            return this._availableTimes
        },
        getCurrentTimeIndex: function() {
            return -1 === this._currentTimeIndex ? this._availableTimes.length - 1 : this._currentTimeIndex
        },
        getCurrentTime: function() {
            var i = -1;
            return (i = -1 !== this._loadingTimeIndex ? this._loadingTimeIndex : this.getCurrentTimeIndex()) >= 0 ? this._availableTimes[i] : null
        },
        isLoading: function() {
            return -1 !== this._loadingTimeIndex
        },
        setCurrentTimeIndex: function(i) {
            var e = this._upperLimit || this._availableTimes.length - 1
              , t = this._lowerLimit || 0;
            if (!((i = Math.min(Math.max(t, i), e)) < 0)) {
                this._loadingTimeIndex = i;
                var s = this._availableTimes[i];
                this._checkSyncedLayersReady(this._availableTimes[this._loadingTimeIndex]) ? this._newTimeIndexLoaded() : (this.fire("timeloading", {
                    time: s
                }),
                setTimeout(function(i) {
                    i == this._loadingTimeIndex && this._newTimeIndexLoaded()
                }
                .bind(this, i), this._loadingTimeout))
            }
        },
        _newTimeIndexLoaded: function() {
            if (-1 !== this._loadingTimeIndex) {
                var i = this._availableTimes[this._loadingTimeIndex];
                this._currentTimeIndex = this._loadingTimeIndex,
                this.fire("timeload", {
                    time: i
                }),
                this._loadingTimeIndex = -1
            }
        },
        _checkSyncedLayersReady: function(i) {
            for (var e = 0, t = this._syncedLayers.length; e < t; e++)
                if (this._syncedLayers[e].isReady && !this._syncedLayers[e].isReady(i))
                    return !1;
            return !0
        },
        setCurrentTime: function(i) {
            var e = this._seekNearestTimeIndex(i);
            this.setCurrentTimeIndex(e)
        },
        seekNearestTime: function(i) {
            var e = this._seekNearestTimeIndex(i);
            return this._availableTimes[e]
        },
        nextTime: function(i, e) {
            i || (i = 1);
            var t = this._currentTimeIndex
              , s = this._upperLimit || this._availableTimes.length - 1
              , n = this._lowerLimit || 0;
            this._loadingTimeIndex > -1 && (t = this._loadingTimeIndex),
            (t += i) > s && (t = e ? n : s),
            t < n && (t = e ? s : n),
            this.setCurrentTimeIndex(t)
        },
        prepareNextTimes: function(i, e, t) {
            i || (i = 1);
            var s = this._currentTimeIndex
              , n = s;
            this._loadingTimeIndex > -1 && (s = this._loadingTimeIndex);
            for (var a = 0, o = this._syncedLayers.length; a < o; a++)
                this._syncedLayers[a].setMinimumForwardCache && this._syncedLayers[a].setMinimumForwardCache(e);
            for (var r = e, h = this._upperLimit || this._availableTimes.length - 1, l = this._lowerLimit || 0; r > 0; ) {
                if ((s += i) > h) {
                    if (!t)
                        break;
                    s = l
                }
                if (s < l) {
                    if (!t)
                        break;
                    s = h
                }
                if (n === s)
                    break;
                this.fire("timeloading", {
                    time: this._availableTimes[s]
                }),
                r--
            }
        },
        getNumberNextTimesReady: function(i, e, t) {
            i || (i = 1);
            var s = this._currentTimeIndex;
            this._loadingTimeIndex > -1 && (s = this._loadingTimeIndex);
            for (var n = e, a = 0, o = this._upperLimit || this._availableTimes.length - 1, r = this._lowerLimit || 0; n > 0; ) {
                if ((s += i) > o) {
                    if (!t) {
                        n = 0,
                        a = e;
                        break
                    }
                    s = r
                }
                if (s < r) {
                    if (!t) {
                        n = 0,
                        a = e;
                        break
                    }
                    s = o
                }
                var h = this._availableTimes[s];
                this._checkSyncedLayersReady(h) && a++,
                n--
            }
            return a
        },
        previousTime: function(i, e) {
            this.nextTime(-1 * i, e)
        },
        registerSyncedLayer: function(i) {
            this._syncedLayers.push(i),
            i.on("timeload", this._onSyncedLayerLoaded, this)
        },
        unregisterSyncedLayer: function(i) {
            var e = this._syncedLayers.indexOf(i);
            -1 != e && this._syncedLayers.splice(e, 1),
            i.off("timeload", this._onSyncedLayerLoaded, this)
        },
        _onSyncedLayerLoaded: function(i) {
            i.time == this._availableTimes[this._loadingTimeIndex] && this._checkSyncedLayersReady(i.time) && this._newTimeIndexLoaded()
        },
        _generateAvailableTimes: function() {
            if (this.options.times)
                return i.TimeDimension.Util.parseTimesExpression(this.options.times);
            if (this.options.timeInterval) {
                var e = i.TimeDimension.Util.parseTimeInterval(this.options.timeInterval)
                  , t = this.options.period || "P1D"
                  , s = this.options.validTimeRange || void 0;
                return i.TimeDimension.Util.explodeTimeRange(e[0], e[1], t, s)
            }
            return []
        },
        _getDefaultCurrentTime: function() {
            var i = this._seekNearestTimeIndex((new Date).getTime());
            return this._availableTimes[i]
        },
        _seekNearestTimeIndex: function(i) {
            for (var e = 0, t = this._availableTimes.length; e < t && !(i < this._availableTimes[e]); e++)
                ;
            return e > 0 && e--,
            e
        },
        setAvailableTimes: function(e, t) {
            var s = this.getCurrentTime()
              , n = this.getLowerLimit()
              , a = this.getUpperLimit();
            if ("extremes" == t) {
                var o = this.options.period || "P1D";
                this._availableTimes = i.TimeDimension.Util.explodeTimeRange(new Date(e[0]), new Date(e[e.length - 1]), o)
            } else {
                var r = i.TimeDimension.Util.parseTimesExpression(e);
                if (0 === this._availableTimes.length)
                    this._availableTimes = r;
                else if ("intersect" == t)
                    this._availableTimes = i.TimeDimension.Util.intersect_arrays(r, this._availableTimes);
                else if ("union" == t)
                    this._availableTimes = i.TimeDimension.Util.union_arrays(r, this._availableTimes);
                else {
                    if ("replace" != t)
                        throw "Merge available times mode not implemented: " + t;
                    this._availableTimes = r
                }
            }
            n && this.setLowerLimit(n),
            a && this.setUpperLimit(a),
            this.setCurrentTime(s),
            this.fire("availabletimeschanged", {
                availableTimes: this._availableTimes,
                currentTime: s
            })
        },
        getLowerLimit: function() {
            return this._availableTimes[this.getLowerLimitIndex()]
        },
        getUpperLimit: function() {
            return this._availableTimes[this.getUpperLimitIndex()]
        },
        setLowerLimit: function(i) {
            var e = this._seekNearestTimeIndex(i);
            this.setLowerLimitIndex(e)
        },
        setUpperLimit: function(i) {
            var e = this._seekNearestTimeIndex(i);
            this.setUpperLimitIndex(e)
        },
        setLowerLimitIndex: function(i) {
            this._lowerLimit = Math.min(Math.max(i || 0, 0), this._upperLimit || this._availableTimes.length - 1),
            this.fire("limitschanged", {
                lowerLimit: this._lowerLimit,
                upperLimit: this._upperLimit
            })
        },
        setUpperLimitIndex: function(i) {
            this._upperLimit = Math.max(Math.min(i, this._availableTimes.length - 1), this._lowerLimit || 0),
            this.fire("limitschanged", {
                lowerLimit: this._lowerLimit,
                upperLimit: this._upperLimit
            })
        },
        getLowerLimitIndex: function() {
            return this._lowerLimit
        },
        getUpperLimitIndex: function() {
            return this._upperLimit
        }
    }),
    i.Map.addInitHook(function() {
        this.options.timeDimension && (this.timeDimension = i.timeDimension(this.options.timeDimensionOptions || {}))
    }),
    i.timeDimension = function(e) {
        return new i.TimeDimension(e)
    }
    ,
    i.TimeDimension.Util = {
        getTimeDuration: function(i) {
            if (void 0 === t)
                throw "iso8601-js-period library is required for Leatlet.TimeDimension: https://github.com/nezasa/iso8601-js-period";
            return t.iso8601.Period.parse(i, !0)
        },
        addTimeDuration: function(i, e, t) {
            void 0 === t && (t = !0),
            ("string" == typeof e || e instanceof String) && (e = this.getTimeDuration(e));
            var s = e.length
              , n = t ? "getUTC" : "get"
              , a = t ? "setUTC" : "set";
            s > 0 && 0 != e[0] && i[a + "FullYear"](i[n + "FullYear"]() + e[0]),
            s > 1 && 0 != e[1] && i[a + "Month"](i[n + "Month"]() + e[1]),
            s > 2 && 0 != e[2] && i[a + "Date"](i[n + "Date"]() + 7 * e[2]),
            s > 3 && 0 != e[3] && i[a + "Date"](i[n + "Date"]() + e[3]),
            s > 4 && 0 != e[4] && i[a + "Hours"](i[n + "Hours"]() + e[4]),
            s > 5 && 0 != e[5] && i[a + "Minutes"](i[n + "Minutes"]() + e[5]),
            s > 6 && 0 != e[6] && i[a + "Seconds"](i[n + "Seconds"]() + e[6])
        },
        subtractTimeDuration: function(i, e, t) {
            ("string" == typeof e || e instanceof String) && (e = this.getTimeDuration(e));
            for (var s = [], n = 0, a = e.length; n < a; n++)
                s.push(-e[n]);
            this.addTimeDuration(i, s, t)
        },
        parseAndExplodeTimeRange: function(i, e) {
            var t = i.split("/")
              , s = new Date(Date.parse(t[0]))
              , n = new Date(Date.parse(t[1]))
              , a = t.length > 2 && t[2].length ? t[2] : "P1D";
            return void 0 !== e && null !== e && (a = e),
            this.explodeTimeRange(s, n, a)
        },
        explodeTimeRange: function(i, e, t, s) {
            var n = this.getTimeDuration(t)
              , a = []
              , o = new Date(i.getTime())
              , r = null
              , h = null
              , l = null
              , m = null;
            if (void 0 !== s) {
                var u = s.split("/");
                r = u[0].split(":")[0],
                h = u[0].split(":")[1],
                l = u[1].split(":")[0],
                m = u[1].split(":")[1]
            }
            for (; o < e; )
                (void 0 === s || o.getUTCHours() >= r && o.getUTCHours() <= l) && (o.getUTCHours() != r || o.getUTCMinutes() >= h) && (o.getUTCHours() != l || o.getUTCMinutes() <= m) && a.push(o.getTime()),
                this.addTimeDuration(o, n);
            return o >= e && a.push(e.getTime()),
            a
        },
        parseTimeInterval: function(i) {
            var e = i.split("/");
            if (2 != e.length)
                throw "Incorrect ISO9601 TimeInterval: " + i;
            var t = Date.parse(e[0])
              , s = null
              , n = null;
            return isNaN(t) ? (n = this.getTimeDuration(e[0]),
            s = Date.parse(e[1]),
            t = new Date(s),
            this.subtractTimeDuration(t, n, !0),
            s = new Date(s)) : (s = Date.parse(e[1]),
            isNaN(s) ? (n = this.getTimeDuration(e[1]),
            s = new Date(t),
            this.addTimeDuration(s, n, !0)) : s = new Date(s),
            t = new Date(t)),
            [t, s]
        },
        parseTimesExpression: function(i, e) {
            var t = [];
            if (!i)
                return t;
            if ("string" == typeof i || i instanceof String)
                for (var s, n, a = i.split(","), o = 0, r = a.length; o < r; o++)
                    3 == (s = a[o]).split("/").length ? t = t.concat(this.parseAndExplodeTimeRange(s, e)) : (n = Date.parse(s),
                    isNaN(n) || t.push(n));
            else
                t = i;
            return t.sort(function(i, e) {
                return i - e
            })
        },
        intersect_arrays: function(i, e) {
            for (var t = i.slice(0), s = e.slice(0), n = []; t.length > 0 && s.length > 0; )
                t[0] < s[0] ? t.shift() : t[0] > s[0] ? s.shift() : (n.push(t.shift()),
                s.shift());
            return n
        },
        union_arrays: function(i, e) {
            for (var t = i.slice(0), s = e.slice(0), n = []; t.length > 0 && s.length > 0; )
                t[0] < s[0] ? n.push(t.shift()) : t[0] > s[0] ? n.push(s.shift()) : (n.push(t.shift()),
                s.shift());
            return t.length > 0 ? n = n.concat(t) : s.length > 0 && (n = n.concat(s)),
            n
        },
        sort_and_deduplicate: function(i) {
            for (var e = [], t = null, s = 0, n = (i = i.slice(0).sort()).length; s < n; s++)
                i[s] !== t && (e.push(i[s]),
                t = i[s]);
            return e
        }
    },
    i.TimeDimension.Layer = (i.Layer || i.Class).extend({
        includes: i.Evented || i.Mixin.Events,
        options: {
            opacity: 1,
            zIndex: 1
        },
        initialize: function(e, t) {
            i.setOptions(this, t || {}),
            this._map = null,
            this._baseLayer = e,
            this._currentLayer = null,
            this._timeDimension = this.options.timeDimension || null
        },
        addTo: function(i) {
            return i.addLayer(this),
            this
        },
        onAdd: function(i) {
            this._map = i,
            !this._timeDimension && i.timeDimension && (this._timeDimension = i.timeDimension),
            this._timeDimension.on("timeloading", this._onNewTimeLoading, this),
            this._timeDimension.on("timeload", this._update, this),
            this._timeDimension.registerSyncedLayer(this),
            this._update()
        },
        onRemove: function(i) {
            this._timeDimension.unregisterSyncedLayer(this),
            this._timeDimension.off("timeloading", this._onNewTimeLoading, this),
            this._timeDimension.off("timeload", this._update, this),
            this.eachLayer(i.removeLayer, i),
            this._map = null
        },
        eachLayer: function(i, e) {
            return i.call(e, this._baseLayer),
            this
        },
        setZIndex: function(i) {
            return this.options.zIndex = i,
            this._baseLayer.setZIndex && this._baseLayer.setZIndex(i),
            this._currentLayer && this._currentLayer.setZIndex && this._currentLayer.setZIndex(i),
            this
        },
        setOpacity: function(i) {
            return this.options.opacity = i,
            this._baseLayer.setOpacity && this._baseLayer.setOpacity(i),
            this._currentLayer && this._currentLayer.setOpacity && this._currentLayer.setOpacity(i),
            this
        },
        bringToBack: function() {
            if (this._currentLayer)
                return this._currentLayer.bringToBack(),
                this
        },
        bringToFront: function() {
            if (this._currentLayer)
                return this._currentLayer.bringToFront(),
                this
        },
        _onNewTimeLoading: function(i) {
            this.fire("timeload", {
                time: i.time
            })
        },
        isReady: function(i) {
            return !0
        },
        _update: function() {
            return !0
        },
        getBaseLayer: function() {
            return this._baseLayer
        },
        getBounds: function() {
            var e = new i.LatLngBounds;
            return this._currentLayer && e.extend(this._currentLayer.getBounds ? this._currentLayer.getBounds() : this._currentLayer.getLatLng()),
            e
        }
    }),
    i.timeDimension.layer = function(e, t) {
        return new i.TimeDimension.Layer(e,t)
    }
    ,
    i.TimeDimension.Layer.WMS = i.TimeDimension.Layer.extend({
        initialize: function(e, t) {
            i.TimeDimension.Layer.prototype.initialize.call(this, e, t),
            this._timeCacheBackward = this.options.cacheBackward || this.options.cache || 0,
            this._timeCacheForward = this.options.cacheForward || this.options.cache || 0,
            this._wmsVersion = this.options.wmsVersion || this.options.version || e.options.version || "1.1.1",
            this._getCapabilitiesParams = this.options.getCapabilitiesParams || {},
            this._getCapabilitiesAlternateUrl = this.options.getCapabilitiesUrl || null,
            this._getCapabilitiesAlternateLayerName = this.options.getCapabilitiesLayerName || null,
            this._proxy = this.options.proxy || null,
            this._updateTimeDimension = this.options.updateTimeDimension || !1,
            this._setDefaultTime = this.options.setDefaultTime || !1,
            this._updateTimeDimensionMode = this.options.updateTimeDimensionMode || "intersect",
            this._period = this.options.period || null,
            this._layers = {},
            this._defaultTime = 0,
            this._availableTimes = [],
            this._capabilitiesRequested = !1,
            (this._updateTimeDimension || this.options.requestTimeFromCapabilities) && this._requestTimeDimensionFromCapabilities(),
            this._baseLayer.on("load", function() {
                this._baseLayer.setLoaded(!0),
                this.fire("timeload", {
                    time: this._defaultTime
                })
            }
            .bind(this))
        },
        getEvents: function() {
            var e = i.bind(this._unvalidateCache, this);
            return {
                moveend: e,
                zoomend: e
            }
        },
        eachLayer: function(e, t) {
            for (var s in this._layers)
                this._layers.hasOwnProperty(s) && e.call(t, this._layers[s]);
            return i.TimeDimension.Layer.prototype.eachLayer.call(this, e, t)
        },
        _onNewTimeLoading: function(i) {
            var e = this._getLayerForTime(i.time);
            this._map.hasLayer(e) || this._map.addLayer(e)
        },
        isReady: function(i) {
            var e = this._getLayerForTime(i);
            return !(!this.options.bounds || !this._map || this._map.getBounds().contains(this.options.bounds)) || e.isLoaded()
        },
        onAdd: function(e) {
            i.TimeDimension.Layer.prototype.onAdd.call(this, e),
            0 == this._availableTimes.length ? this._requestTimeDimensionFromCapabilities() : this._updateTimeDimensionAvailableTimes()
        },
        _update: function() {
            if (this._map) {
                var i = this._timeDimension.getCurrentTime()
                  , e = this._getLayerForTime(i);
                null == this._currentLayer && (this._currentLayer = e),
                this._map.hasLayer(e) ? this._showLayer(e, i) : this._map.addLayer(e)
            }
        },
        setOpacity: function(e) {
            i.TimeDimension.Layer.prototype.setOpacity.apply(this, arguments);
            for (var t in this._layers)
                this._layers.hasOwnProperty(t) && this._layers[t].setOpacity && this._layers[t].setOpacity(e)
        },
        setZIndex: function(e) {
            i.TimeDimension.Layer.prototype.setZIndex.apply(this, arguments);
            for (var t in this._layers)
                this._layers.hasOwnProperty(t) && this._layers[t].setZIndex && this._layers[t].setZIndex(e)
        },
        setParams: function(e, t) {
            i.extend(this._baseLayer.options, e),
            this._baseLayer.setParams && this._baseLayer.setParams(e, t);
            for (var s in this._layers)
                this._layers.hasOwnProperty(s) && this._layers[s].setParams && (this._layers[s].setLoaded(!1),
                this._layers[s].setParams(e, t));
            return this
        },
        _unvalidateCache: function() {
            var i = this._timeDimension.getCurrentTime();
            for (var e in this._layers)
                i != e && this._layers.hasOwnProperty(e) && (this._layers[e].setLoaded(!1),
                this._layers[e].redraw())
        },
        _evictCachedTimes: function(i, e) {
            var t = this._getLoadedTimes()
              , s = String(this._currentTime)
              , n = t.indexOf(s)
              , a = [];
            if (e > -1 && (o = n - e) > 0 && (a = t.splice(0, o),
            this._removeLayers(a)),
            i > -1) {
                n = t.indexOf(s);
                var o = t.length - n - i - 1;
                o > 0 && (a = t.splice(n + i + 1, o),
                this._removeLayers(a))
            }
        },
        _showLayer: function(i, e) {
            this._currentLayer && this._currentLayer !== i && this._currentLayer.hide(),
            i.show(),
            this._currentLayer && this._currentLayer === i || (this._currentLayer = i,
            this._currentTime = e,
            this._evictCachedTimes(this._timeCacheForward, this._timeCacheBackward))
        },
        _getLayerForTime: function(i) {
            if (0 == i || i == this._defaultTime || null == i)
                return this._baseLayer;
            if (this._layers.hasOwnProperty(i))
                return this._layers[i];
            var e = this._getNearestTime(i);
            if (this._layers.hasOwnProperty(e))
                return this._layers[e];
            var t = this._createLayerForTime(e);
            return this._layers[i] = t,
            t.on("load", function(i, e) {
                i.setLoaded(!0),
                this._layers[e] || (this._layers[e] = i),
                this._timeDimension && e == this._timeDimension.getCurrentTime() && !this._timeDimension.isLoading() && this._showLayer(i, e),
                this.fire("timeload", {
                    time: e
                })
            }
            .bind(this, t, i)),
            t.onAdd = function(i) {
                Object.getPrototypeOf(this).onAdd.call(this, i),
                this.hide()
            }
            .bind(t),
            t
        },
        _createLayerForTime: function(i) {
            var e = this._baseLayer.options;
            return e.time = new Date(i).toISOString(),
            new this._baseLayer.constructor(this._baseLayer.getURL(),e)
        },
        _getLoadedTimes: function() {
            var i = [];
            for (var e in this._layers)
                this._layers.hasOwnProperty(e) && i.push(e);
            return i.sort(function(i, e) {
                return i - e
            })
        },
        _removeLayers: function(i) {
            for (var e = 0, t = i.length; e < t; e++)
                this._map && this._map.removeLayer(this._layers[i[e]]),
                delete this._layers[i[e]]
        },
        setMinimumForwardCache: function(i) {
            i > this._timeCacheForward && (this._timeCacheForward = i)
        },
        _requestTimeDimensionFromCapabilities: function() {
            if (!this._capabilitiesRequested && this.options.requestTimeFromCapabilities) {
                this._capabilitiesRequested = !0;
                var i = this._getCapabilitiesUrl();
                this._proxy && (i = this._proxy + "?url=" + encodeURIComponent(i));
                var e = new XMLHttpRequest;
                e.addEventListener("load", function(i) {
                    var e = i.currentTarget.responseXML;
                    null !== e && (this._defaultTime = Date.parse(this._getDefaultTimeFromCapabilities(e)),
                    this._setDefaultTime = this._setDefaultTime || this._timeDimension && 0 == this._timeDimension.getAvailableTimes().length,
                    this.setAvailableTimes(this._parseTimeDimensionFromCapabilities(e)),
                    this._setDefaultTime && this._timeDimension && this._timeDimension.setCurrentTime(this._defaultTime))
                }
                .bind(this)),
                e.overrideMimeType("application/xml"),
                e.open("GET", i),
                e.send()
            }
        },
        _getCapabilitiesUrl: function() {
            var e = this._baseLayer.getURL();
            this._getCapabilitiesAlternateUrl && (e = this._getCapabilitiesAlternateUrl);
            var t = i.extend({}, this._getCapabilitiesParams, {
                request: "GetCapabilities",
                service: "WMS",
                version: this._wmsVersion
            });
            return e += i.Util.getParamString(t, e, t.uppercase)
        },
        _parseTimeDimensionFromCapabilities: function(i) {
            var e = i.querySelectorAll('Layer[queryable="1"]')
              , t = this._baseLayer.wmsParams.layers
              , s = null
              , n = null;
            return e.forEach(function(i) {
                i.querySelector("Name").innerHTML === t && (s = i)
            }),
            s && ((n = this._getTimesFromLayerCapabilities(s)) || (n = this._getTimesFromLayerCapabilities(s.parentNode))),
            n
        },
        _getTimesFromLayerCapabilities: function(i) {
            for (var e = null, t = i.children, s = 0, n = t.length; s < n; s++)
                if (("Extent" === t[s].nodeName || "Dimension" === t[s].nodeName) && "time" === t[s].getAttribute("name") && t[s].textContent.length) {
                    e = t[s].textContent.trim();
                    break
                }
            return e
        },
        _getDefaultTimeFromCapabilities: function(i) {
            var e = i.querySelectorAll('Layer[queryable="1"]')
              , t = this._baseLayer.wmsParams.layers
              , s = null;
            e.forEach(function(i) {
                i.querySelector("Name").innerHTML === t && (s = i)
            });
            var n = 0;
            return s && 0 == (n = this._getDefaultTimeFromLayerCapabilities(s)) && (n = this._getDefaultTimeFromLayerCapabilities(s.parentNode)),
            n
        },
        _getDefaultTimeFromLayerCapabilities: function(i) {
            for (var e = 0, t = i.children, s = 0, n = t.length; s < n; s++)
                if (("Extent" === t[s].nodeName || "Dimension" === t[s].nodeName) && "time" === t[s].getAttribute("name") && t[s].attributes.default && t[s].attributes.default.textContent.length) {
                    e = t[s].attributes.default.textContent.trim();
                    break
                }
            return e
        },
        setAvailableTimes: function(e) {
            this._availableTimes = i.TimeDimension.Util.parseTimesExpression(e, this._period),
            this._updateTimeDimensionAvailableTimes()
        },
        _updateTimeDimensionAvailableTimes: function() {
            (this._timeDimension && this._updateTimeDimension || this._timeDimension && 0 == this._timeDimension.getAvailableTimes().length) && (this._timeDimension.setAvailableTimes(this._availableTimes, this._updateTimeDimensionMode),
            this._setDefaultTime && this._defaultTime > 0 && this._timeDimension.setCurrentTime(this._defaultTime))
        },
        _getNearestTime: function(i) {
            if (this._layers.hasOwnProperty(i))
                return i;
            if (0 == this._availableTimes.length)
                return i;
            for (var e = 0, t = this._availableTimes.length; e < t && !(i < this._availableTimes[e]); e++)
                ;
            return e > 0 && e--,
            this._availableTimes[e],
            this._availableTimes[e]
        }
    }),
    i.NonTiledLayer || (i.NonTiledLayer = (i.Layer || i.Class).extend({})),
    i.NonTiledLayer.include({
        _visible: !0,
        _loaded: !1,
        _originalUpdate: i.NonTiledLayer.prototype._update,
        _originalOnRemove: i.NonTiledLayer.prototype.onRemove,
        _update: function() {
            !this._visible && this._loaded || this._originalUpdate()
        },
        onRemove: function(i) {
            this._loaded = !1,
            this._originalOnRemove(i)
        },
        setLoaded: function(i) {
            this._loaded = i
        },
        isLoaded: function() {
            return this._loaded
        },
        hide: function() {
            this._visible = !1,
            this._div.style.display = "none"
        },
        show: function() {
            this._visible = !0,
            this._div.style.display = "block"
        },
        getURL: function() {
            return this._wmsUrl
        }
    }),
    i.TileLayer.include({
        _visible: !0,
        _loaded: !1,
        _originalUpdate: i.TileLayer.prototype._update,
        _update: function() {
            !this._visible && this._loaded || this._originalUpdate()
        },
        setLoaded: function(i) {
            this._loaded = i
        },
        isLoaded: function() {
            return this._loaded
        },
        hide: function() {
            this._visible = !1,
            this._container && (this._container.style.display = "none")
        },
        show: function() {
            this._visible = !0,
            this._container && (this._container.style.display = "block")
        },
        getURL: function() {
            return this._url
        }
    }),
    i.timeDimension.layer.wms = function(e, t) {
        return new i.TimeDimension.Layer.WMS(e,t)
    }
    ,
    i.TimeDimension.Layer.GeoJson = i.TimeDimension.Layer.extend({
        initialize: function(e, t) {
            i.TimeDimension.Layer.prototype.initialize.call(this, e, t),
            this._updateTimeDimension = this.options.updateTimeDimension || !1,
            this._updateTimeDimensionMode = this.options.updateTimeDimensionMode || "extremes",
            this._duration = this.options.duration || null,
            this._addlastPoint = this.options.addlastPoint || !1,
            this._waitForReady = this.options.waitForReady || !1,
            this._defaultTime = 0,
            this._availableTimes = [],
            this._loaded = !1,
            0 == this._baseLayer.getLayers().length ? this._waitForReady ? this._baseLayer.on("ready", this._onReadyBaseLayer, this) : this._loaded = !0 : (this._loaded = !0,
            this._setAvailableTimes()),
            this._baseLayer.on("layeradd", function() {
                this._loaded && this._setAvailableTimes()
            }
            .bind(this))
        },
        onAdd: function(e) {
            i.TimeDimension.Layer.prototype.onAdd.call(this, e),
            this._loaded && this._setAvailableTimes()
        },
        eachLayer: function(e, t) {
            return this._currentLayer && e.call(t, this._currentLayer),
            i.TimeDimension.Layer.prototype.eachLayer.call(this, e, t)
        },
        isReady: function(i) {
            return this._loaded
        },
        _update: function() {
            if (this._map && this._loaded) {
                this._timeDimension.getCurrentTime();
                var e = this._timeDimension.getCurrentTime()
                  , t = 0;
                if (this._duration) {
                    var s = new Date(e);
                    i.TimeDimension.Util.subtractTimeDuration(s, this._duration, !0),
                    t = s.getTime()
                }
                for (var n = i.geoJson(null, this._baseLayer.options), a = this._baseLayer.getLayers(), o = 0, r = a.length; o < r; o++) {
                    var h = this._getFeatureBetweenDates(a[o].feature, t, e);
                    if (h && (n.addData(h),
                    this._addlastPoint && "LineString" == h.geometry.type && h.geometry.coordinates.length > 0)) {
                        var l = h.properties;
                        l.last = !0,
                        n.addData({
                            type: "Feature",
                            properties: l,
                            geometry: {
                                type: "Point",
                                coordinates: h.geometry.coordinates[h.geometry.coordinates.length - 1]
                            }
                        })
                    }
                }
                this._currentLayer && this._map.removeLayer(this._currentLayer),
                n.getLayers().length && (n.addTo(this._map),
                this._currentLayer = n)
            }
        },
        _setAvailableTimes: function() {
            for (var e = [], t = this._baseLayer.getLayers(), s = 0, n = t.length; s < n; s++)
                if (t[s].feature)
                    for (var a = this._getFeatureTimes(t[s].feature), o = 0, r = a.length; o < r; o++)
                        e.push(a[o]);
            this._availableTimes = i.TimeDimension.Util.sort_and_deduplicate(e),
            this._timeDimension && (this._updateTimeDimension || 0 == this._timeDimension.getAvailableTimes().length) && this._timeDimension.setAvailableTimes(this._availableTimes, this._updateTimeDimensionMode)
        },
        _getFeatureTimes: function(i) {
            if (!i.featureTimes) {
                i.properties ? i.properties.hasOwnProperty("coordTimes") ? i.featureTimes = i.properties.coordTimes : i.properties.hasOwnProperty("times") ? i.featureTimes = i.properties.times : i.properties.hasOwnProperty("linestringTimestamps") ? i.featureTimes = i.properties.linestringTimestamps : i.properties.hasOwnProperty("time") ? i.featureTimes = [i.properties.time] : i.featureTimes = [] : i.featureTimes = [];
                for (var e = 0, t = i.featureTimes.length; e < t; e++) {
                    var s = i.featureTimes[e];
                    ("string" == typeof s || s instanceof String) && (s = Date.parse(s.trim()),
                    i.featureTimes[e] = s)
                }
            }
            return i.featureTimes
        },
        _getFeatureBetweenDates: function(i, e, t) {
            var s = this._getFeatureTimes(i);
            if (0 == s.length)
                return i;
            var n = null
              , a = null
              , o = s.length;
            if (s[0] > t || s[o - 1] < e)
                return null;
            if (s[o - 1] > e)
                for (var r = 0; r < o; r++)
                    if (null === n && s[r] > e && (n = r),
                    s[r] > t) {
                        a = r;
                        break
                    }
            null === n && (n = 0),
            null === a && (a = o);
            var h = [];
            return h = i.geometry.coordinates[0].length ? i.geometry.coordinates.slice(n, a) : i.geometry.coordinates,
            {
                type: "Feature",
                properties: i.properties,
                geometry: {
                    type: i.geometry.type,
                    coordinates: h
                }
            }
        },
        _onReadyBaseLayer: function() {
            this._loaded = !0,
            this._setAvailableTimes(),
            this._update()
        }
    }),
    i.timeDimension.layer.geoJson = function(e, t) {
        return new i.TimeDimension.Layer.GeoJson(e,t)
    }
    ,
    i.TimeDimension.Player = (i.Layer || i.Class).extend({
        includes: i.Evented || i.Mixin.Events,
        initialize: function(e, t) {
            i.setOptions(this, e),
            this._timeDimension = t,
            this._paused = !1,
            this._buffer = this.options.buffer || 5,
            this._minBufferReady = this.options.minBufferReady || 1,
            this._waitingForBuffer = !1,
            this._loop = this.options.loop || !1,
            this._steps = 1,
            this._timeDimension.on("timeload", function(i) {
                this.release(),
                this._waitingForBuffer = !1
            }
            .bind(this)),
            this.setTransitionTime(this.options.transitionTime || 1e3),
            this._timeDimension.on("limitschanged availabletimeschanged timeload", function(i) {
                this._timeDimension.prepareNextTimes(this._steps, this._minBufferReady, this._loop)
            }
            .bind(this))
        },
        _tick: function() {
            var i = this._getMaxIndex()
              , e = this._timeDimension.getCurrentTimeIndex() >= i && this._steps > 0
              , t = 0 == this._timeDimension.getCurrentTimeIndex() && this._steps < 0;
            if ((e || t) && !this._loop)
                return this.pause(),
                this.stop(),
                void this.fire("animationfinished");
            if (!this._paused) {
                var s = 0
                  , n = this._bufferSize;
                if (this._minBufferReady > 0)
                    if (s = this._timeDimension.getNumberNextTimesReady(this._steps, n, this._loop),
                    this._waitingForBuffer) {
                        if (s < n)
                            return void this.fire("waiting", {
                                buffer: n,
                                available: s
                            });
                        this.fire("running"),
                        this._waitingForBuffer = !1
                    } else if (s < this._minBufferReady)
                        return this._waitingForBuffer = !0,
                        this._timeDimension.prepareNextTimes(this._steps, n, this._loop),
                        void this.fire("waiting", {
                            buffer: n,
                            available: s
                        });
                this.pause(),
                this._timeDimension.nextTime(this._steps, this._loop),
                n > 0 && this._timeDimension.prepareNextTimes(this._steps, n, this._loop)
            }
        },
        _getMaxIndex: function() {
            return Math.min(this._timeDimension.getAvailableTimes().length - 1, this._timeDimension.getUpperLimitIndex() || 1 / 0)
        },
        start: function(e) {
            this._intervalID || (this._steps = e || 1,
            this._waitingForBuffer = !1,
            this.options.startOver && this._timeDimension.getCurrentTimeIndex() === this._getMaxIndex() && this._timeDimension.setCurrentTimeIndex(this._timeDimension.getLowerLimitIndex() || 0),
            this.release(),
            this._intervalID = window.setInterval(i.bind(this._tick, this), this._transitionTime),
            this._tick(),
            this.fire("play"),
            this.fire("running"))
        },
        stop: function() {
            this._intervalID && (clearInterval(this._intervalID),
            this._intervalID = null,
            this._waitingForBuffer = !1,
            this.fire("stop"))
        },
        pause: function() {
            this._paused = !0
        },
        release: function() {
            this._paused = !1
        },
        getTransitionTime: function() {
            return this._transitionTime
        },
        isPlaying: function() {
            return !!this._intervalID
        },
        isWaiting: function() {
            return this._waitingForBuffer
        },
        isLooped: function() {
            return this._loop
        },
        setLooped: function(i) {
            this._loop = i,
            this.fire("loopchange", {
                loop: i
            })
        },
        setTransitionTime: function(i) {
            this._transitionTime = i,
            "function" == typeof this._buffer ? this._bufferSize = this._buffer.call(this, this._transitionTime, this._minBufferReady, this._loop) : this._bufferSize = this._buffer,
            this._intervalID && (this.stop(),
            this.start(this._steps)),
            this.fire("speedchange", {
                transitionTime: i,
                buffer: this._bufferSize
            })
        },
        getSteps: function() {
            return this._steps
        }
    }),
    i.UI = i.ui = i.UI || {},
    i.UI.Knob = i.Draggable.extend({
        options: {
            className: "knob",
            step: 1,
            rangeMin: 0,
            rangeMax: 10
        },
        initialize: function(e, t) {
            i.setOptions(this, t),
            this._element = i.DomUtil.create("div", this.options.className || "knob", e),
            i.Draggable.prototype.initialize.call(this, this._element, this._element),
            this._container = e,
            this.on("predrag", function() {
                this._newPos.y = 0,
                this._newPos.x = this._adjustX(this._newPos.x)
            }, this),
            this.on("dragstart", function() {
                i.DomUtil.addClass(e, "dragging")
            }),
            this.on("dragend", function() {
                i.DomUtil.removeClass(e, "dragging")
            }),
            i.DomEvent.on(this._element, "dblclick", function(i) {
                this.fire("dblclick", i)
            }, this),
            i.DomEvent.disableClickPropagation(this._element),
            this.enable()
        },
        _getProjectionCoef: function() {
            return (this.options.rangeMax - this.options.rangeMin) / (this._container.offsetWidth || this._container.style.width)
        },
        _update: function() {
            this.setPosition(i.DomUtil.getPosition(this._element).x)
        },
        _adjustX: function(i) {
            var e = this._toValue(i) || this.getMinValue();
            return this._toX(this._adjustValue(e))
        },
        _adjustValue: function(i) {
            return i = Math.max(this.getMinValue(), Math.min(this.getMaxValue(), i)),
            i -= this.options.rangeMin,
            i = Math.round(i / this.options.step) * this.options.step,
            i += this.options.rangeMin,
            i = Math.round(100 * i) / 100
        },
        _toX: function(i) {
            return (i - this.options.rangeMin) / this._getProjectionCoef()
        },
        _toValue: function(i) {
            return i * this._getProjectionCoef() + this.options.rangeMin
        },
        getMinValue: function() {
            return this.options.minValue || this.options.rangeMin
        },
        getMaxValue: function() {
            return this.options.maxValue || this.options.rangeMax
        },
        setStep: function(i) {
            this.options.step = i,
            this._update()
        },
        setPosition: function(e) {
            i.DomUtil.setPosition(this._element, i.point(this._adjustX(e), 0)),
            this.fire("positionchanged")
        },
        getPosition: function() {
            return i.DomUtil.getPosition(this._element).x
        },
        setValue: function(i) {
            this.setPosition(this._toX(i))
        },
        getValue: function() {
            return this._adjustValue(this._toValue(this.getPosition()))
        }
    }),
    i.Control.TimeDimension = i.Control.extend({
        options: {
            styleNS: "leaflet-control-timecontrol",
            position: "bottomleft",
            title: "Time Control",
            backwardButton: !0,
            forwardButton: !0,
            playButton: !0,
            playReverseButton: !1,
            loopButton: !1,
            displayDate: !0,
            timeSlider: !0,
            timeSliderDragUpdate: !1,
            limitSliders: !1,
            limitMinimumRange: 5,
            speedSlider: !0,
            minSpeed: .1,
            maxSpeed: 10,
            speedStep: .1,
            timeSteps: 1,
            autoPlay: !1,
            playerOptions: {
                transitionTime: 1e3
            },
            timeZones: ["UTC", "Local"]
        },
        initialize: function(e) {
            i.setOptions(e),
            i.Control.prototype.initialize.call(this, e),
            this._timeZoneIndex = 0,
            this._timeDimension = this.options.timeDimension || null
        },
        onAdd: function(e) {
            var t;
            return this._map = e,
            !this._timeDimension && e.timeDimension && (this._timeDimension = e.timeDimension),
            this._initPlayer(),
            t = i.DomUtil.create("div", "leaflet-bar leaflet-bar-horizontal leaflet-bar-timecontrol"),
            this.options.backwardButton && (this._buttonBackward = this._createButton("Backward", t)),
            this.options.playReverseButton && (this._buttonPlayReversePause = this._createButton("Play Reverse", t)),
            this.options.playButton && (this._buttonPlayPause = this._createButton("Play", t)),
            this.options.forwardButton && (this._buttonForward = this._createButton("Forward", t)),
            this.options.loopButton && (this._buttonLoop = this._createButton("Loop", t)),
            this.options.displayDate && (this._displayDate = this._createButton("Date", t)),
            this.options.timeSlider && (this._sliderTime = this._createSliderTime(this.options.styleNS + " timecontrol-slider timecontrol-dateslider", t)),
            this.options.speedSlider && (this._sliderSpeed = this._createSliderSpeed(this.options.styleNS + " timecontrol-slider timecontrol-speed", t)),
            this._steps = this.options.timeSteps || 1,
            this._timeDimension.on("timeload", this._update, this),
            this._timeDimension.on("timeload", this._onPlayerStateChange, this),
            this._timeDimension.on("timeloading", this._onTimeLoading, this),
            this._timeDimension.on("limitschanged availabletimeschanged", this._onTimeLimitsChanged, this),
            i.DomEvent.disableClickPropagation(t),
            t
        },
        addTo: function() {
            return i.Control.prototype.addTo.apply(this, arguments),
            this._onPlayerStateChange(),
            this._onTimeLimitsChanged(),
            this._update(),
            this
        },
        onRemove: function() {
            this._player.off("play stop running loopchange speedchange", this._onPlayerStateChange, this),
            this._player.off("waiting", this._onPlayerWaiting, this),
            this._timeDimension.off("timeload", this._update, this),
            this._timeDimension.off("timeload", this._onPlayerStateChange, this),
            this._timeDimension.off("timeloading", this._onTimeLoading, this),
            this._timeDimension.off("limitschanged availabletimeschanged", this._onTimeLimitsChanged, this)
        },
        _initPlayer: function() {
            this._player || (this.options.player ? this._player = this.options.player : this._player = new i.TimeDimension.Player(this.options.playerOptions,this._timeDimension)),
            this.options.autoPlay && this._player.start(this._steps),
            this._player.on("play stop running loopchange speedchange", this._onPlayerStateChange, this),
            this._player.on("waiting", this._onPlayerWaiting, this),
            this._onPlayerStateChange()
        },
        _onTimeLoading: function(e) {
            e.time == this._timeDimension.getCurrentTime() && this._displayDate && i.DomUtil.addClass(this._displayDate, "loading")
        },
        _onTimeLimitsChanged: function() {
            var i = this._timeDimension.getLowerLimitIndex()
              , e = this._timeDimension.getUpperLimitIndex()
              , t = this._timeDimension.getAvailableTimes().length - 1;
            this._limitKnobs && (this._limitKnobs[0].options.rangeMax = t,
            this._limitKnobs[1].options.rangeMax = t,
            this._limitKnobs[0].setValue(i || 0),
            this._limitKnobs[1].setValue(e || t)),
            this._sliderTime && (this._sliderTime.options.rangeMax = t,
            this._sliderTime._update())
        },
        _onPlayerWaiting: function(e) {
            this._buttonPlayPause && this._player.getSteps() > 0 && (i.DomUtil.addClass(this._buttonPlayPause, "loading"),
            this._buttonPlayPause.innerHTML = this._getDisplayLoadingText(e.available, e.buffer)),
            this._buttonPlayReversePause && this._player.getSteps() < 0 && (i.DomUtil.addClass(this._buttonPlayReversePause, "loading"),
            this._buttonPlayReversePause.innerHTML = this._getDisplayLoadingText(e.available, e.buffer))
        },
        _onPlayerStateChange: function() {
            if (this._buttonPlayPause && (this._player.isPlaying() && this._player.getSteps() > 0 ? (i.DomUtil.addClass(this._buttonPlayPause, "pause"),
            i.DomUtil.removeClass(this._buttonPlayPause, "play")) : (i.DomUtil.removeClass(this._buttonPlayPause, "pause"),
            i.DomUtil.addClass(this._buttonPlayPause, "play")),
            this._player.isWaiting() && this._player.getSteps() > 0 ? i.DomUtil.addClass(this._buttonPlayPause, "loading") : (this._buttonPlayPause.innerHTML = "",
            i.DomUtil.removeClass(this._buttonPlayPause, "loading"))),
            this._buttonPlayReversePause && (this._player.isPlaying() && this._player.getSteps() < 0 ? i.DomUtil.addClass(this._buttonPlayReversePause, "pause") : i.DomUtil.removeClass(this._buttonPlayReversePause, "pause"),
            this._player.isWaiting() && this._player.getSteps() < 0 ? i.DomUtil.addClass(this._buttonPlayReversePause, "loading") : (this._buttonPlayReversePause.innerHTML = "",
            i.DomUtil.removeClass(this._buttonPlayReversePause, "loading"))),
            this._buttonLoop && (this._player.isLooped() ? i.DomUtil.addClass(this._buttonLoop, "looped") : i.DomUtil.removeClass(this._buttonLoop, "looped")),
            this._sliderSpeed && !this._draggingSpeed) {
                var e = this._player.getTransitionTime() || 1e3;
                e = Math.round(1e4 / e) / 10,
                this._sliderSpeed.setValue(e)
            }
        },
        _update: function() {
            if (this._timeDimension)
                if (this._timeDimension.getCurrentTimeIndex() >= 0) {
                    var e = new Date(this._timeDimension.getCurrentTime());
                    this._displayDate && (i.DomUtil.removeClass(this._displayDate, "loading"),
                    this._displayDate.innerHTML = this._getDisplayDateFormat(e)),
                    this._sliderTime && !this._slidingTimeSlider && this._sliderTime.setValue(this._timeDimension.getCurrentTimeIndex())
                } else
                    this._displayDate && (this._displayDate.innerHTML = this._getDisplayNoTimeError())
        },
        _createButton: function(e, t) {
            var s = i.DomUtil.create("a", this.options.styleNS + " timecontrol-" + e.toLowerCase(), t);
            return s.href = "#",
            s.title = e,
            i.DomEvent.addListener(s, "click", i.DomEvent.stopPropagation).addListener(s, "click", i.DomEvent.preventDefault).addListener(s, "click", this["_button" + e.replace(/ /i, "") + "Clicked"], this),
            s
        },
        _createSliderTime: function(e, t) {
            var s, n, a, o, r;
            return s = i.DomUtil.create("div", e, t),
            n = i.DomUtil.create("div", "slider", s),
            a = this._timeDimension.getAvailableTimes().length - 1,
            this.options.limitSliders && (r = this._limitKnobs = this._createLimitKnobs(n)),
            (o = new i.UI.Knob(n,{
                className: "knob main",
                rangeMin: 0,
                rangeMax: a
            })).on("dragend", function(i) {
                var e = i.target.getValue();
                this._sliderTimeValueChanged(e),
                this._slidingTimeSlider = !1
            }, this),
            o.on("drag", function(i) {
                this._slidingTimeSlider = !0;
                var e = this._timeDimension.getAvailableTimes()[i.target.getValue()];
                if (e) {
                    var t = new Date(e);
                    this._displayDate && (this._displayDate.innerHTML = this._getDisplayDateFormat(t)),
                    this.options.timeSliderDragUpdate && this._sliderTimeValueChanged(i.target.getValue())
                }
            }, this),
            o.on("predrag", function() {
                var i, e;
                r && (i = r[0].getPosition(),
                e = r[1].getPosition(),
                this._newPos.x < i && (this._newPos.x = i),
                this._newPos.x > e && (this._newPos.x = e))
            }, o),
            i.DomEvent.on(n, "click", function(e) {
                if (!i.DomUtil.hasClass(e.target, "knob")) {
                    var t = e.touches && 1 === e.touches.length ? e.touches[0] : e
                      , s = i.DomEvent.getMousePosition(t, n).x;
                    r ? r[0].getPosition() <= s && s <= r[1].getPosition() && (o.setPosition(s),
                    this._sliderTimeValueChanged(o.getValue())) : (o.setPosition(s),
                    this._sliderTimeValueChanged(o.getValue()))
                }
            }, this),
            o.setPosition(0),
            o
        },
        _createLimitKnobs: function(e) {
            i.DomUtil.addClass(e, "has-limits");
            var t = this._timeDimension.getAvailableTimes().length - 1
              , s = i.DomUtil.create("div", "range", e)
              , n = new i.UI.Knob(e,{
                className: "knob lower",
                rangeMin: 0,
                rangeMax: t
            })
              , a = new i.UI.Knob(e,{
                className: "knob upper",
                rangeMin: 0,
                rangeMax: t
            });
            return i.DomUtil.setPosition(s, 0),
            n.setPosition(0),
            a.setPosition(t),
            n.on("dragend", function(i) {
                var e = i.target.getValue();
                this._sliderLimitsValueChanged(e, a.getValue())
            }, this),
            a.on("dragend", function(i) {
                var e = i.target.getValue();
                this._sliderLimitsValueChanged(n.getValue(), e)
            }, this),
            n.on("drag positionchanged", function() {
                i.DomUtil.setPosition(s, i.point(n.getPosition(), 0)),
                s.style.width = a.getPosition() - n.getPosition() + "px"
            }, this),
            a.on("drag positionchanged", function() {
                s.style.width = a.getPosition() - n.getPosition() + "px"
            }, this),
            a.on("predrag", function() {
                var i = n._toX(n.getValue() + this.options.limitMinimumRange);
                a._newPos.x <= i && (a._newPos.x = i)
            }, this),
            n.on("predrag", function() {
                var i = a._toX(a.getValue() - this.options.limitMinimumRange);
                n._newPos.x >= i && (n._newPos.x = i)
            }, this),
            n.on("dblclick", function() {
                this._timeDimension.setLowerLimitIndex(0)
            }, this),
            a.on("dblclick", function() {
                this._timeDimension.setUpperLimitIndex(this._timeDimension.getAvailableTimes().length - 1)
            }, this),
            [n, a]
        },
        _createSliderSpeed: function(e, t) {
            var s = i.DomUtil.create("div", e, t)
              , n = i.DomUtil.create("span", "speed", s)
              , a = i.DomUtil.create("div", "slider", s)
              , o = Math.round(1e4 / (this._player.getTransitionTime() || 1e3)) / 10;
            n.innerHTML = this._getDisplaySpeed(o);
            var r = new i.UI.Knob(a,{
                step: this.options.speedStep,
                rangeMin: this.options.minSpeed,
                rangeMax: this.options.maxSpeed
            });
            return r.on("dragend", function(i) {
                var e = i.target.getValue();
                this._draggingSpeed = !1,
                n.innerHTML = this._getDisplaySpeed(e),
                this._sliderSpeedValueChanged(e)
            }, this),
            r.on("drag", function(i) {
                this._draggingSpeed = !0,
                n.innerHTML = this._getDisplaySpeed(i.target.getValue())
            }, this),
            r.on("positionchanged", function(i) {
                n.innerHTML = this._getDisplaySpeed(i.target.getValue())
            }, this),
            i.DomEvent.on(a, "click", function(e) {
                if (e.target !== r._element) {
                    var t = e.touches && 1 === e.touches.length ? e.touches[0] : e
                      , s = i.DomEvent.getMousePosition(t, a).x;
                    r.setPosition(s),
                    n.innerHTML = this._getDisplaySpeed(r.getValue()),
                    this._sliderSpeedValueChanged(r.getValue())
                }
            }, this),
            r
        },
        _buttonBackwardClicked: function() {
            this._timeDimension.previousTime(this._steps)
        },
        _buttonForwardClicked: function() {
            this._timeDimension.nextTime(this._steps)
        },
        _buttonLoopClicked: function() {
            this._player.setLooped(!this._player.isLooped())
        },
        _buttonPlayClicked: function() {
            this._player.isPlaying() ? this._player.stop() : this._player.start(this._steps)
        },
        _buttonPlayReverseClicked: function() {
            this._player.isPlaying() ? this._player.stop() : this._player.start(-1 * this._steps)
        },
        _buttonDateClicked: function() {
            this._switchTimeZone()
        },
        _sliderTimeValueChanged: function(i) {
            this._timeDimension.setCurrentTimeIndex(i)
        },
        _sliderLimitsValueChanged: function(i, e) {
            this._timeDimension.setLowerLimitIndex(i),
            this._timeDimension.setUpperLimitIndex(e)
        },
        _sliderSpeedValueChanged: function(i) {
            this._player.setTransitionTime(1e3 / i)
        },
        _getCurrentTimeZone: function() {
            return this.options.timeZones[this._timeZoneIndex]
        },
        _switchTimeZone: function() {
            "utc" == this._getCurrentTimeZone().toLowerCase() && i.DomUtil.removeClass(this._displayDate, "utc"),
            this._timeZoneIndex = (this._timeZoneIndex + 1) % this.options.timeZones.length;
            var e = this._getCurrentTimeZone();
            "utc" == e.toLowerCase() ? (i.DomUtil.addClass(this._displayDate, "utc"),
            this._displayDate.title = "UTC Time") : "local" == e.toLowerCase() ? this._displayDate.title = "Local Time" : this._displayDate.title = e,
            this._update()
        },
        _getDisplayDateFormat: function(i) {
            var e = this._getCurrentTimeZone();
            return "utc" == e.toLowerCase() ? i.toISOString() : "local" == e.toLowerCase() ? i.toLocaleString() : i.toLocaleString([], {
                timeZone: e,
                timeZoneName: "short"
            })
        },
        _getDisplaySpeed: function(i) {
            return i + "fps"
        },
        _getDisplayLoadingText: function(i, e) {
            return "<span>" + Math.floor(i / e * 100) + "%</span>"
        },
        _getDisplayNoTimeError: function() {
            return "Time not available"
        }
    }),
    i.Map.addInitHook(function() {
        this.options.timeDimensionControl && (this.timeDimensionControl = i.control.timeDimension(this.options.timeDimensionControlOptions || {}),
        this.addControl(this.timeDimensionControl))
    }),
    i.control.timeDimension = function(e) {
        return new i.Control.TimeDimension(e)
    }
    ,
    i.TimeDimension
}, window);
