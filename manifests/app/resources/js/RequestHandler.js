var requestHandler = {
    proxy: false,
    proxyUrl: null,
    proxyParam: null,
    toggleProxy: function () {
        /* toggle proxy */
        this.proxy = this.proxy ? false : true;
    },
    setProxy: function (proxyUrl, proxyParam) {
        /* add a proxy url */
        this.proxyUrl = proxyUrl;
        this.proxyParam = proxyParam;
    },
    getProxy: function () {
        /* return if proxy is activated */
        return this.proxy;
    },
    validateResponse: function (response) {
        /* filter valid responses */
        if (response.status == 200) {
            return response;
        }
        return null;
        //throw (response);
    },
    request: function (obj, url, type, _callback, _error) {
        /* 
            handle request base on type
                obj: json to be send to _callback and _error functions
                url: url to be requested
                type: determine how to parse data
                _callback: success function, returns obj and the request data
                _error: error function, return obj and the error data
        */
        var proxy = obj.proxy ? obj.proxy : this.proxy;
        if (proxy && this.proxyUrl && this.proxyParam) {
            if (obj.data.method == 'POST') {
                url = this.proxyUrl;
                obj.data[this.proxyParam] = url;
            } else {
                url = this.proxyUrl + '?' + this.proxyParam + '=' + url;
            }
        }
        if (type == 'text') {
            fetch(url, obj.data).then(response => this.validateResponse(response).text()).then(data => {
                _callback(obj, data);
            }).catch(function (error) {
                if (_error) {
                    _error(obj, error);
                }
            })
        } else if (type == 'json') {
            fetch(url, obj.data).then(response => this.validateResponse(response).json()).then(data => {
                _callback(obj, data);
            }).catch(function (error) {
                if (_error) {
                    _error(obj, error);
                }
            })
        } else if (type == 'xml') {
            fetch(url, obj.data).then(response => this.validateResponse(response).text()).then(str => (new DOMParser()).parseFromString(str, "text/xml")).then(data => {
                _callback(obj, data);
            }).catch(function (error) {
                console.log(error)
                if (_error) {
                    _error(obj, error);
                }
            })
        } else if (type == 'blob') {
            fetch(url, obj.data).then(response => this.validateResponse(response).blob()).then(imageBlob => {
                _callback(obj, URL.createObjectURL(imageBlob));
            }).catch(function (error) {
                if (_error) {
                    _error(obj, error);
                }
            })
        } else if (type == 'promise') {
            return fetch(url, obj.data);
        } else {
            fetch(url, obj.data).then(data => {
                _callback(obj, data);
            }).catch(function (error) {
                if (_error) {
                    _error(obj, error);
                }
            })
        }
    },
    requestAll: function (obj, conf, _callback, _error) {
        /*
            handle multiple request base on type 
            obj: json to be send to _callback and _error functions
            conf: array of objects with urls to be requested and the type of each response to determine how to parse data
            _callback: success function, returns obj and the request data
            _error: error function, return obj and the error data
        */
        var proxy = obj.proxy ? obj.proxy : this.proxy;

        var promises = [];
        for (cf in conf) {
            if (proxy && this.proxyUrl && this.proxyParam) {
                if (conf[cf].data.method == 'POST') {
                    conf[cf].url = this.proxyUrl;
                    conf[cf].data[this.proxyParam] = url;
                } else {
                    conf[cf].url = this.proxyUrl + '?' + this.proxyParam + '=' + url;
                }
            }
            promises.push(fetch(conf[cf].url, conf[cf].data));
        }

        Promise.all(promises).then(responses => Promise.all(responses.map((response, i) => {
            var validatedResponse = this.validateResponse(response);
            if (validatedResponse) {
                if (conf[i].type == 'text') {
                    return validatedResponse.text();
                } else if (conf[i].type == 'json') {
                    return validatedResponse.json();
                } else if (conf[i].type == 'xml') {
                    return validatedResponse.text()
                    /*
                        .then(str =>{
                            var rexp = /(?<=encoding=")(.*?)(?=")/g;
                            var encoding = rexp.exec(str)[0];

                            if(encoding.toLowerCase() != 'utf-8'){
                                str = str.replace(encoding, 'UTF-8');
                                console.log(this)
                                return fetch('http://develop/plancamgal/encoder.php?url=').then(response => {return response.text()});
                            }
                            //return str;
                            // return (new DOMParser()).parseFromString(str, "text/xml")
                        })
                    */
                   .then(str => { return (new DOMParser()).parseFromString(str, "text/xml") });
                } else if (conf[i].type == 'blob') {
                    return validatedResponse.blob();
                } else {
                    return validatedResponse;
                }
            } else {
                return null;
            }
        }))).then(data => {
            _callback(obj, data);
        }).catch(error => {
            if (_error) {
                _error(error);
            }
        })
    }
}