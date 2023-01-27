var leaflet_export = {
    _layers: null,
    _svgs: null,
    _cursor: 0,
    _index: null,
    _canvas: null,
    _buffer: null,
    _ctx: null,
    _buffer_ctx: null,
    type: null,
    showGrid: false,
    _map: null,
    _proxy: null,
    _overlay: null,
    _filename: null,
    _init_: function(map, proxy){
        this._map = map;
        this._proxy = proxy;
        this.generateCanvas();
    },
    generateCanvas: function(){
        var styles = window.getComputedStyle(this._map._container);
        var canvas = document.createElement('canvas');
        canvas.className = 'leaflet-export';
        canvas.setAttribute('width', styles.getPropertyValue('width'));
        canvas.setAttribute('height', styles.getPropertyValue('height'));
        this._map._container.append(canvas);

        Array.from(styles).forEach(function (key) {
            return canvas.style.setProperty(key, styles.getPropertyValue(key), styles.getPropertyPriority(key));
        })

        canvas.style.display = 'none';
        this._canvas = canvas;

        var buffer = document.createElement('canvas');
        buffer.className = 'leaflet-export-buffer';
        buffer.setAttribute('width', 1);
        buffer.setAttribute('height', 1);
        this._buffer = buffer;
    },
    updateSize: function(){
        this._map._container.classList.toggle('print');
        this._map.invalidateSize();
        var bbox = this._map._container.getBoundingClientRect();
        this._canvas.setAttribute('width', (bbox.width) + 'px');
        this._canvas.setAttribute('height', (bbox.height) + 'px');
    },
    getLayers: function(){
        var tiles = {};
        var overlays = {};
        
        for(var layer in this._map._layers){
            if(this._map._layers[layer]._bufferCanvas){
                if(this._map._layers[layer]._loaded){
                    var i = this._map._layers[layer]._bufferCanvas.parentNode.style.zIndex;
                    overlays[(i==''?0:i)+'_'+layer] = this._map._layers[layer]._bufferCanvas._image;
                }
            }else if(this._map._layers[layer]._tiles){
                if(this._map._layers[layer]._path){
                    continue;
                }else if(this._map._layers[layer].options.zIndex != undefined){
                    tiles[this._map._layers[layer].options.zIndex+'_'+layer] = this._map._layers[layer]._tiles;
                }else{
                    tiles[0+'_'+layer] = this._map._layers[layer]._tiles;
                }
            }
        }

        return [tiles, overlays];
    },
    getSvgs(){
        var _svgs = [[], [], []]

        Array.from(document.querySelectorAll('.leaflet-overlay-pane svg')).map(svg => {
            var clone = svg.cloneNode(true)
            clone.removeAttribute('viewBox')
            clone.removeAttribute('style')
            
            _svgs[1].push(document.querySelector('.leaflet-pane.leaflet-map-pane').getBoundingClientRect().x)
            _svgs[2].push(document.querySelector('.leaflet-pane.leaflet-map-pane').getBoundingClientRect().y)

            _svgs[0].push('data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(clone)))            
        })
        return _svgs
    },
    renderLayers: function(layers){
        this._layers = layers;
        
        this._ctx = this._canvas.getContext('2d');
        this._buffer_ctx = this._buffer.getContext('2d');
        
        var tiles = [];
        var keys = Object.keys(this._layers[0]);
        if(keys.length > 0){
            for(var i = 0; i<keys.length; i++){
                tiles.push.apply(tiles, Object.values(this._layers[0][keys[i]]));
            }
        }
        keys = Object.keys(this._layers[1]);
        if(keys.length > 0){
            for(var i = 0; i<keys.length; i++){
                tiles.push(this._layers[1][keys[i]]);
            }
        }
        
        Promise.all(tiles.map(tile => {
            var tile = tile;
            if(tile.el){
                tile = tile.el;
            }
            return new Promise((resolve, reject)=>{
                
                /*if(tile.el.getAttribute('crossOrigin') != 'anonymous'){
                    tile.el.setAttribute('crossOrigin', 'anonymous')
                }
                
                Leaflet_export._ctx.drawImage(tile.el, tile.el.getBoundingClientRect().x, tile.el.getBoundingClientRect().y, tile.el.getBoundingClientRect().width, tile.el.getBoundingClientRect().height)
                if(Leaflet_export.showGrid){
                    Leaflet_export._ctx.beginPath();
                    Leaflet_export._ctx.rect(tile.el.getBoundingClientRect().x, tile.el.getBoundingClientRect().y, tile.el.getBoundingClientRect().width, tile.el.getBoundingClientRect().height)
                    Leaflet_export._ctx.stroke();                
                }*/
                
                this.getImage(tile).then(img =>{

    console.log(img)

                    this._ctx.drawImage(img, tile.getBoundingClientRect().x, tile.getBoundingClientRect().y, tile.getBoundingClientRect().width, tile.getBoundingClientRect().height)
                    resolve(1);
                })
            })
        })).then(()=>{
            /*Promise.all(this.renderOverlays(this.getOverlays())).then(()=>{
                */Promise.all(this.renderSvgs(this.getSvgs())).then(()=>{
                    if(this.type == 'png'){
                        var a = document.createElement('a')
                        a.setAttribute('href', this._canvas.toDataURL("image/png"))
                        a.setAttribute('download', this._filename+'.png')
                        a.setAttribute('display', 'none')
                        document.body.appendChild(a)
                        a.click()
                        a.remove()
                    }
                    if(this._overlay){
                        this._overlay.setAttribute('data-show', 0)
                    }
                    this.updateSize();
                    console.log('done')
                })/*
            })   **/         
        })
    },
    renderSvgs(_svgs){
        var promises = Array.from(_svgs[0]).map((svg, i) => {
            return new Promise((resolve, reject) => {
                var img = new Image;
        
                img.addEventListener('load', function () {
                    //this._ctx.drawImage(this, _svgs[1][i], _svgs[2][i]);
                    resolve(1)
                });

                img.addEventListener('error', (err) => reject(err));
        
                img.src = svg;
            })
        })

        return promises
    },
    getImage: function(image){
        'use strict';
        try{
            if(image.crossOrigin){
                return new Promise((resolve)=>resolve(image));
            }
            this._buffer_ctx.drawImage(image, 0, 0);
            this._buffer.toDataURL('image/png');
            
            return new Promise((resolve)=>{
                image.onload = function(){
                    resolve(this);
                }                
            });
        }catch(error){
            return new Promise((resolve) =>fetch(this._proxy, {
                method: 'POST',
                headers: new Headers({
                    "Content-type": "application/x-www-form-urlencoded"
                }),
                body: ['url=' + encodeURIComponent(image.src)]//encodeURIComponent(image.src)]
            })
            .then((response) => response.blob())
            .then(imageBlob => {
                var reader = new FileReader() ;
                reader.onload = function(){
                    var img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = function(){
                        resolve(this);
                    }
                    img.src = this.result;
                }
                reader.readAsDataURL(imageBlob);
            }))
            /*return fetch(this._proxy, {
                method: 'POST',
                headers: new Headers({
                    "Content-type": "application/x-www-form-urlencoded"
                }),
                body: ['url=' + encodeURIComponent(image.src)]//encodeURIComponent(image.src)]
            }).then((response) => response.blob())*/
        }
    },
    export(type){
        if(!this._overlay){
            this._overlay = document.createElement('div')
            this._overlay.className = 'leaflet-export-overlay'
            this._overlay.innerHTML = '<div class="leaflet-export-box"><div class="leaflet-export-loader"><div></div><div></div><div></div><div></div></div></div>'

            this._map._container.appendChild(this._overlay)
        }
        this._overlay.setAttribute('data-show', 1)
        this.type = type
        this.updateSize()        
        this.renderLayers(this.getLayers())        
    }




    /*getTiles(){
        var _layers = {}
        
        for(var layer in this.map._layers){
            if(this.map._layers[layer]._tiles){
                if(this.map._layers[layer]._path){
                    
                }else if(this.map._layers[layer].options.zIndex != undefined){
                    _layers[this.map._layers[layer].options.zIndex+'_'+layer] = this.map._layers[layer]._tiles
                }else{
                    _layers[0+'_'+layer] = this.map._layers[layer]._tiles
                }
            }
        }

        return _layers
    }
    generateCanvas(){
        var _styles = window.getComputedStyle(this.map._container)
        var _canvas = document.createElement('canvas')
        _canvas.className = 'leaflet-export'
        _canvas.setAttribute('width', _styles.getPropertyValue('width'))
        _canvas.setAttribute('height', _styles.getPropertyValue('height'))
        this.map._container.append(_canvas)

        Array.from(_styles).forEach(function (key) {
            return _canvas.style.setProperty(key, _styles.getPropertyValue(key), _styles.getPropertyPriority(key));
        })

        _canvas.style.display = 'none'
        Leaflet_export._canvas = _canvas        
    }
    updateSize(){
        Leaflet_export._canvas.setAttribute('width', this.map._container.offsetWidth + 'px')
        Leaflet_export._canvas.setAttribute('height',this.map._container.offsetHeight + 'px')
    }
    renderTiles(_layers){
        Leaflet_export._layers = _layers
        Leaflet_export._indexList = Object.keys(_layers).sort(function(x, y){
            var _x = x.split('_')
            var _y = y.split('_')

            if(parseInt(_x[0]) < parseInt(_y[0])){
                return -1
            }
            if(parseInt(_x[0]) > parseInt(_y[0])){
                return 1
            }

            if(_x.length > 1 && _y.length > 1){                
                if(parseInt(_x[1]) < parseInt(_y[1])){
                    return -1
                }
                if(parseInt(_x[1]) > parseInt(_y[1])){
                    return 1
                }
            }
            return 0
        })

        Leaflet_export._ctx = Leaflet_export._canvas.getContext('2d')
        
        var tiles = []
        var keys = Object.keys(Leaflet_export._layers)
        for(var i = 0; i<keys.length; i++){
            tiles.push.apply(tiles, Object.values(Leaflet_export._layers[keys[i]]))
        }
          
        Promise.all(tiles.map(tile => {
            return new Promise((resolve, reject)=>{
                if(tile.el.getAttribute('crossOrigin') != 'anonymous'){
                    tile.el.setAttribute('crossOrigin', 'anonymous')
                }
                Leaflet_export._ctx.drawImage(tile.el, tile.el.getBoundingClientRect().x, tile.el.getBoundingClientRect().y, tile.el.getBoundingClientRect().width, tile.el.getBoundingClientRect().height)
                if(Leaflet_export.showGrid){
                    Leaflet_export._ctx.beginPath();
                    Leaflet_export._ctx.rect(tile.el.getBoundingClientRect().x, tile.el.getBoundingClientRect().y, tile.el.getBoundingClientRect().width, tile.el.getBoundingClientRect().height)
                    Leaflet_export._ctx.stroke();                
                }
                resolve(1)
            })
        })).then(()=>{
            Promise.all(this.renderOverlays(this.getOverlays())).then(()=>{
                Promise.all(this.renderSvgs(this.getSvgs())).then(()=>{
                    if(Leaflet_export.type == 'png'){
                        var a = document.createElement('a')
                        a.setAttribute('href', Leaflet_export._canvas.toDataURL("image/png"))
                        a.setAttribute('download', Leaflet_export._filename+'.png')
                        a.setAttribute('display', 'none')
                        document.body.appendChild(a)
                        a.click()
                        a.remove()
                    }
                    if(Leaflet_export._overlay){
                        Leaflet_export._overlay.setAttribute('data-show', 0)
                    }
                    console.log('done')
                })
            })            
        })        
    }
    
    renderSvgs(_svgs){
        var promises = Array.from(_svgs[0]).map((svg, i) => {
            return new Promise((resolve, reject) => {
                var img = new Image;
        
                img.addEventListener('load', function () {
                    Leaflet_export._ctx.drawImage(this, _svgs[1][i], _svgs[2][i]);
                    resolve(1)
                });

                img.addEventListener('error', (err) => reject(err));
        
                img.src = svg;
            })
        })

        return promises
    }
    getSvgs(){
        var _svgs = [[], [], []]

        Array.from(document.querySelectorAll('.leaflet-overlay-pane svg')).map(svg => {
            var clone = svg.cloneNode(true)
            clone.removeAttribute('viewBox')
            clone.removeAttribute('style')
            
            _svgs[1].push(document.querySelector('.leaflet-pane.leaflet-map-pane').getBoundingClientRect().x)
            _svgs[2].push(document.querySelector('.leaflet-pane.leaflet-map-pane').getBoundingClientRect().y)

            _svgs[0].push('data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(clone)))            
        })
        return _svgs
    }
    renderOverlays(_overlays){
        /*var promises = Array.from(_overlays[0]).map((_overlay, i) => {
            return new Promise((resolve, reject) => {
                var img = new Image;
        
                img.addEventListener('load', function () {
                    Leaflet_export._ctx.drawImage(this, _overlays[1][i], _overlays[2][i]);
                    resolve(1)
                });

                img.addEventListener('error', (err) => reject(err));
                
                if(typeof _overlay == 'object' && typeof _overlay.then == 'function'){
                    console.log('a')
                    _overlay.then(response => response.blob())
                    .then(imageBlob => {
                        var reader = new FileReader() ;
                        reader.onload = function(){
                            console.log(this.result)
                            //img.src = this.result;
                        }
                        reader.readAsDataURL(imageBlob) ;
                    })
                }else{
                    console.log('b')
                    img.src = _overlay;
                }                
            })
        })*/
    /*    var promises = [];
        Promise.all(_overlays).then((data) => {
            Array.from(data).map((_overlay, i) => {
                promises.push(new Promise((resolve, reject) => {
                    var img = new Image;
            
                    img.addEventListener('load', function () {
                        Leaflet_export._ctx.drawImage(this, _overlay[0], _overlay[1]);
                        resolve(1)
                    });
    
                    img.addEventListener('error', (err) => reject(err));
                    
                    if(typeof _overlay[2] == 'object' && typeof _overlay[2].then == 'function'){
                        _overlay[2].then(response => response.blob())
                        .then(imageBlob => {
                            var reader = new FileReader() ;
                            reader.onload = function(){
                                img.src = this.result;
                                document.body.appendChild(img)
                            }
                            reader.readAsDataURL(imageBlob) ;
                        })
                    }else{
                        img.src = _overlay[2];
                    }                
                }))
            })
        })

        return promises
    }
    getOverlays(){
        var promises = [];
        Array.from(document.querySelectorAll('.leaflet-pane.leaflet-overlay-pane .leaflet-image-layer canvas')).map(overlay => {
            try{
                var src = overlay.toDataURL("image/png")
                promises.push(new Promise((resolve, reject)=>{
                    resolve([overlay.getBoundingClientRect().x, overlay.getBoundingClientRect().y, src])
                }))
            }catch(error){
                if(overlay.tagName == 'CANVAS'){
                    promises.push([overlay.getBoundingClientRect().x, overlay.getBoundingClientRect().y, fetch('proxy.php',{
                        method: 'POST',
                        headers: new Headers({
                            "Content-type": "application/x-www-form-urlencoded"
                        }),
                        body: ['url=' + encodeURIComponent(overlay._image.src)]
                    })])/*.then(response => response.blob())
                    .then(imageBlob => {
                        promises.push(new Promise((resolve, reject)=>{
                            resolve([overlay.getBoundingClientRect().x, overlay.getBoundingClientRect().y, URL.createObjectURL(imageBlob)])
                        }))
                    }))*/
   /*             }
            }
        })

        
        return promises
    }
    export(type){
        if(!Leaflet_export._overlay){
            Leaflet_export._overlay = document.createElement('div')
            Leaflet_export._overlay.className = 'leaflet-export-overlay'
            Leaflet_export._overlay.innerHTML = '<div class="leaflet-export-box"><div class="leaflet-export-loader"><div></div><div></div><div></div><div></div></div></div>'

            this.map._container.appendChild(Leaflet_export._overlay)
        }
        Leaflet_export._overlay.setAttribute('data-show', 1)
        Leaflet_export.type = type
        this.updateSize()        
        this.renderTiles(this.getTiles())        
    }
    toggleGrid(){
        Leaflet_export.showGrid = Leaflet_export.showGrid?false:true
    }    */
}