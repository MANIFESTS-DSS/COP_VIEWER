var playerHandler = {
    player: null,
    timeDimension: null,
    timeDimensionControl: null,
    layers: null,
    time: null,
    range: null,
    steps: null,
    times: [],
    initialized: false,
    _init_: function (map, time, range, steps) {
        if (map) {
            this.player = map.timeDimensionControl._container;
            this.timeDimension = map.timeDimension;
            this.timeDimensionControl = map.timeDimensionControl;

            this.time = time;
            this.range = range;
            this.steps = steps;

            this.timeDimensionControl._sliderSpeed.options.rangeMin = 0.1;
            this.timeDimensionControl._sliderSpeed.options.rangeMax = 1;
            this.timeDimensionControl._sliderSpeed.options.step = 0.1;
            this.timeDimensionControl._player.setTransitionTime(1000);
        }
        /*
            this.timeDimension.addEventListener('timeloading', function(time) {
                this._syncedLayers.map(_layer => {
                    Object.values(_layer._layers).map(layer => {
                        if (layer.options.uppercase!=_layer.options.uppercase) {
                            layer.options.uppercase = true;
                        }
                    });
                })
            })
        */
        this.timeDimension.addEventListener('timeload', (event) => {
            event.target._syncedLayers.map(_layer => {
                if (_layer._baseLayer && _layer._baseLayer._div) {
                    _layer._baseLayer._div.hidden = true;
                }
            })
        })
    },
    update: function (time, from) {
        this.time = time;
        if (from) {
            this.calculaterange(time, from, this.steps)
        } else {
            this.calculatetimes(time, this.range, this.steps);
        }
        this.applyTimes();
    },
    setLayers: function (layers) {
        this.layers = layers;
    },
    getTimes: function () {
        return this.times;
    },
    calculaterange: function (time, from, steps) {
        var t = new Date(time);
        var h = t.getHours();
        var m = t.getMinutes();

        var ft = new Date(from);

        if (m > 0) {
            m = 0;
            if (h - 1 < 0) {
                h = 23;
            } else {
                h -= 1;
            }
            t.setHours(h);
            t.setMinutes(0);
        }
        t.setSeconds(0);
        t.setMilliseconds(0);

        var times = [t.toISOString()];
        var step = steps.split('.');

        var uh = 0;
        var um = 0;
        if (step.length > 1) {
            uh = parseInt(step[0]);
            um = parseInt(step[1]);
            step[1] = (parseInt(step[1]) * 100) / 60;
            step = parseFloat(step.join('.'));
        } else {
            step = parseInt(steps);
            uh = step;
        }

        for (var i = 0; true; i += step) {
            t.setHours(t.getHours() - uh);
            t.setMinutes(t.getMinutes() - um);
            if (t.getTime() > ft.getTime()) {
                times.push(t.toISOString());
            } else {
                times.push(ft.toISOString());
                break;
            }
        }

        this.times = times.reverse();
    },
    calculatetimes: function (time, range, steps) {
        var t = new Date(time);
        var h = t.getHours();
        var m = t.getMinutes();

        if (m > 0) {
            m = 0;
            if (h - 1 < 0) {
                h = 23;
            } else {
                h -= 1;
            }
            t.setHours(h);
            t.setMinutes(0);
        }
        t.setSeconds(0);
        t.setMilliseconds(0);

        var times = [t.toISOString()];
        var step = steps.split('.');

        var uh = 0;
        var um = 0;
        if (step.length > 1) {
            uh = parseInt(step[0]);
            um = parseInt(step[1]);
            step[1] = (parseInt(step[1]) * 100) / 60;
            step = parseFloat(step.join('.'));
        } else {
            step = parseInt(steps);
            uh = step;
        }

        for (var i = 0; i < range; i += step) {
            t.setHours(t.getHours() - uh);
            t.setMinutes(t.getMinutes() - um);
            times.push(t.toISOString());
        }

        this.times = times.reverse();
    },
    hide: function () {
        if (this.player.parentNode.classList.contains('show')) {
            this.player.parentNode.classList.remove('show');
        }
    },
    applyTimes: function () {
        this.timeDimension.setLowerLimit(this.times[0]);
        this.timeDimension.setUpperLimit(this.times[this.times.length - 1]);

        this.timeDimension.setAvailableTimes(this.times, 'replace');

        Object.values(this.layers).map(_layer => {
            if (_layer.animate && _layer.html.getAttribute('data-active') == '1') {
                _layer.layer.setAvailableTimes(this.times, 'replace');
            }
        })

        let time = new Date();
        let closest = 0;
        for (let i = 0; i < this.timeDimension._availableTimes.length; i++) {
            if (new Date(this.timeDimension._availableTimes[i]) < time) {
                closest = i;
            } else {
                break
            }
        }
        this.timeDimension.setCurrentTimeIndex(closest);

        if (!this.timeDimensionControl._container.querySelector('.leaflet-control-timecontrol.timecontrol-date.utc')) {
            this.timeDimensionControl._container.querySelector('.leaflet-control-timecontrol.timecontrol-date').click();
        }

        /*
            if (this.timeDimension._currentTimeIndex == -1) {
                this.timeDimension.setCurrentTimeIndex(this.times.length - 1);
            }
        */
    },
    applyTimesToLayer: function (_layer) {
        this.timeDimension.setLowerLimit(this.times[0]);
        this.timeDimension.setUpperLimit(this.times[this.times.length - 1]);

        this.timeDimension.setAvailableTimes(this.times, 'replace');

        _layer.layer.setAvailableTimes(this.times, 'replace');

        if (Object.values(layerHandler.objectLayers).filter(_l => { return _l.html.getAttribute('data-active') == '1' && _l.layer._timeDimension }).length == 1) {
            let time = new Date();
            let closest = 0;
            for (let i = 0; i < this.timeDimension._availableTimes.length; i++) {
                if (new Date(this.timeDimension._availableTimes[i]) < time) {
                    closest = i;
                } else {
                    break
                }
            }

            this.timeDimension.setCurrentTimeIndex(closest);
        }
        /*
            else {
                this.timeDimension.setCurrentTimeIndex(this.timeDimension.getCurrentTimeIndex());
            }
        */

        if (!this.player.parentNode.classList.contains('show')) {
            this.player.parentNode.classList.add('show');
        }

        this.timeDimensionControl._player.setTransitionTime(this.timeDimensionControl._player._transitionTime);
    },
    configureTimes: function () {
        if (!this.initialized) {
            this.initialized = true;
            this.applyTimes();
        }
    },
    appendTo: function (element) {
        if (element && this.player) {
            element.appendChild(this.player);
        }
    }
}