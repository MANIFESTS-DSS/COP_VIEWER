var i18n = {
    locale: null,
    path: './locale/',
    filter: /(?<=(["']))(?:(?=(\\?))\2.)*?(?=\1)/,
    filterKeys: /\_\((.*?)\)/g,
    filterClear: [[/['"] \+ /g, ''], [/('\+| \+|\+) ['"]/g, ''], [/['"]\+ ['"]/g, ' '], [/^['"]|['"]$/g, '']],
    _init_: function (callback) {
        var query = window.location.search;
        var params = new URLSearchParams(query);

        var temp = params.get('locale');
        var browsertemp = navigator.language || navigator.userLanguage || navigator.browserLanguage;
        browsertemp = browsertemp.split('-')[0];

        if (temp && cfg && cfg.availableLocales && cfg.availableLocales.includes(temp)) {
            this.locale = temp;
            delete temp;
        } else if (browsertemp && cfg.availableLocales && cfg.availableLocales.includes(browsertemp)) {
            this.locale = browsertemp;
            delete browsertemp;
        } else {
            this.locale = cfg.defaultLocale;
        }

        var script = document.createElement('script');
        script.onload = function () {
            if (callback) {
                callback();
            }
        }
        script.src = this.path + this.locale + '.js';
        document.documentElement.appendChild(script);
        //document.write('<script language="javascript" src="'+ this.path + this.locale+'.js"></script>');
    },
    _filter: function (key) {
        /*
            return the key filtered to remove unnecessary elements
        */

        var match = key.match(this.filter);

        if (!match) {
            return key;
        }
        if (match.length > 0) {
            return match[0];
        }
        return key;
    },
    _extractKeys: function (key) {
        var keys = key.match(this.filterKeys);
        if (keys) {
            return keys;
        }
        return [key];
    },
    _clear: function (key) {
        this.filterClear.map(_filter => {
            key = key.replaceAll(_filter[0], _filter[1]);
        })
        return key;
    },
    _translate: function (key) {
        /*
            returns key or translated value if exists in translations file
        */
        if (key) {
            keys = this._extractKeys(key);
            if (keys) {
                keys.map(_key => {
                    var _f = this._filter(_key);
                    if (i18n_locale && i18n_locale[_f]) {
                        key = key.replace(_key, i18n_locale[_f]);
                    } else {
                        key = _f;
                    }
                })
            }
            /*
                else {
                    key = this._filter(key);
                    if (i18n_locale && i18n_locale[key]) {
                        return i18n_locale[key];
                    }
                }
            */
        }
        return this._clear(key);
    }
}

String.prototype.format = function () {
    var args = arguments;
    return this.replace(/{([0-9]+)}/g, function (match, index) {
        return typeof args[index] == 'undefined' ? match : args[index];
    });
};