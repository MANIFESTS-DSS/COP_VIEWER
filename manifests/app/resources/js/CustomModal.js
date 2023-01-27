var customModal = {
    modal: null,
    preview: null,
    unpin: false,
    minimize: false,
    offsetx: null,
    offsety: null,
    prevx: null,
    prevy: null,
    _callbacks: null,
    _init_: function () {
        if (!this.modal) {
            this.modal = document.createElement('div');
            this.modal.className = 'custom-modal';
            this.modal.setAttribute('unpin', this.unpin);
            this.modal.setAttribute('minimize', this.minimize);
            this.modal.draggable = false;
            this.modal.innerHTML = '<div class="custom-modal-header"><div class="custom-modal-title"></div><div class="custom-modal-buttons"><div class="custom-modal-minimize" data-bs-toggle="collapse" data-bs-target="#custom-modal-body" aria-expanded="false" aria-controls="custom-modal-body"></div><div class="custom-modal-pin"></div><div class="custom-modal-close"></div></div></div><div class="custom-modal-body collapse show" id="custom-modal-body" draggable="true"><div class="card card-body custom-modal-content"></div></div>';
            this.modal.addEventListener('click', () => this.handleEvents(event));
            this.modal.addEventListener('dragstart', () => this.handleEvents(event));
            this.modal.addEventListener('drag', () => this.handleEvents(event));
            this.modal.addEventListener('dragend', () => this.handleEvents(event));
            this.modal.addEventListener('shown.bs.collapse', () => this.handleAnimations(event));
        }
        if (!this.preview) {
            this.preview = document.createElement('div');
            this.preview.className = 'custom-modal preview';
            this.preview.setAttribute('unpin', true);
            this.preview.setAttribute('minimize', false);
            this.preview.draggable = true;
            this.preview.innerHTML = '<div class="custom-modal-header"><div class="custom-modal-title"></div><div class="custom-modal-buttons"><div class="custom-modal-close preview-close"></div></div></div><div class="custom-modal-body collapse show" id="custom-modal-body-preview" draggable="true"><div class="card card-body custom-modal-content"></div></div>';
            this.preview.addEventListener('click', () => this.handleEvents(event));
            this.preview.addEventListener('dragstart', () => this.handleEvents(event));
            this.preview.addEventListener('drag', () => this.handleEvents(event));
            this.preview.addEventListener('dragend', () => this.handleEvents(event));
        }
    },
    setCallbacks: function (_callbacks) {
        this._callbacks = _callbacks;
    },
    addTo: function (element) {
        if (this.modal && element) {
            element.append(this.modal);
        }
    },
    remove: function () {
        this.modal.remove();
    },
    setTitle: function (title) {
        if (this.modal) {
            this.modal.querySelector('.custom-modal-header .custom-modal-title').textContent = title;
        }
    },
    setContent: function (html) {
        if (this.modal) {
            var content = this.modal.querySelector('.custom-modal-body .custom-modal-content');
            content.innerHTML = '';
            content.append(html);
        }
    },
    toggleMinimize: function () {
        this.minimize = this.minimize ? false : true;
        if (this.modal) {
            this.modal.setAttribute('minimize', this.minimize);
            if (this._callbacks && this._callbacks.modal && this._callbacks.modal.minimize) {
                this._callbacks.modal.minimize(this.minimize);
            }
        }
    },
    togglePin: function () {
        this.unpin = this.unpin ? false : true;
        this.modal.draggable = this.unpin;

        if (this.modal) {
            this.modal.setAttribute('unpin', this.unpin);
            if (this._callbacks && this._callbacks.modal && this._callbacks.modal.unpin) {
                this._callbacks.modal.unpin(this.unpin);
            }
        }
    },
    close: function (_target) {
        if (_target) {
            _target.remove();
            var _t = null;
            if (_target == this.modal) {
                _t = 'modal';
            } else if (_target == this.preview) {
                _t = 'preview';
            }
            if (_t && this._callbacks && this._callbacks[_t] && this._callbacks[_t].close) {
                this._callbacks[_t].close();
            }
        }
    },
    handleEvents: function (event) {
        if (event.target.id == 'custom-modal-body') {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
        /*
            else if (event.target.classList.contains('resize-top')) {
                event.preventDefault();
                event.stopPropagation();
                console.log(event)
                var bbox = this.modal.getBoundingClientRect();
                console.log(bbox)
                return false;
            }
        */
        var _target = this.modal;
        var _allowMove = this.unpin;
        if (event.target.classList.contains('preview') || event.target.classList.contains('preview-close')) {
            _target = this.preview;
            var _allowMove = true;
        }
        if (event.type == 'click') {
            if (event.target.classList.contains('custom-modal-minimize')) {
                this.toggleMinimize();
            } else if (event.target.classList.contains('custom-modal-pin')) {
                this.togglePin();
            } else if (event.target.classList.contains('custom-modal-close')) {
                this.close(_target);
            }
        } else if (event.type == 'dragstart' && _allowMove) {
            var bbox = _target.getBoundingClientRect();
            this.offsetx = event.pageX - bbox.x;
            this.offsety = event.pageY - bbox.y;

            event.dataTransfer.effectAllowed = "move";
            _target.style.opacity = 0.3;
        } else if (event.type == 'drag' && _allowMove) {
            event.preventDefault();
            var maxWidth = window.outerWidth - document.querySelector('.right-sidebar').getBoundingClientRect().width;
            if ((event.pageX > 0 && event.pageY > 0) && (event.pageX < maxWidth && event.pageY < window.outerHeight)) {
                _target.style.left = (event.pageX - this.offsetx) + 'px';
                _target.style.top = (event.pageY - this.offsety) + 'px';
            }
        } else if (event.type == 'dragend' && _allowMove) {
            var maxWidth = window.outerWidth - document.querySelector('.right-sidebar').getBoundingClientRect().width;
            if ((event.pageX > 0 && event.pageY > 0) && (event.pageX < maxWidth && event.pageY < window.outerHeight)) {
                _target.style.left = (event.pageX - this.offsetx) + 'px';
                _target.style.top = (event.pageY - this.offsety) + 'px';
            }
            _target.style.opacity = 1;
        }
    },
    handleAnimations: function (event) {
        var bbox = this.modal.getBoundingClientRect();
        if (bbox.x + bbox.width > window.outerWidth) {
            this.modal.style.left = (window.outerWidth - bbox.width) - 10 + 'px';
        }
    },
    assignValues: function (template, data) {
        const pattern = /%.*\w%/g;

        let fields = [...template.matchAll(pattern)];

        fields.map(field => {
            let key = field[0].substring(1, field[0].length - 1);

            for (let i = 0; i < data.length; i++) {
                if (key == data[i][0]) {
                    template = template.replaceAll(field[0], data[i][1])
                    break
                }
            }
        })

        return template
    },
    applyTemplate: function (xml, template, titles, types, _new) {
        var _html = null;
        var menu = null;
        var selector = null;
        var content = null;
        var indexCount = 0;

        if (_new) {
            _html = document.createElement('div');
            _html.className = 'custom-modal-info';

            selector = document.createElement('select');
            selector.className = 'custom-modal-selector';
            selector.addEventListener('change', (event) => {
                this.modal.querySelector('.custom-modal-tabs button#' + event.target.value).click();
            })

            menu = document.createElement('ul');
            menu.className = 'custom-modal-tabs nav nav-tabs';
            menu.role = 'tablist';
            menu.hidden = true;

            var content = document.createElement('div');
            content.className = 'tab-content';

            _html.appendChild(selector);
            _html.appendChild(menu);
            _html.appendChild(content);
        } else {
            _html = this.modal.querySelector('.custom-modal-info');
            menu = this.modal.querySelector('.custom-modal-tabs');
            selector = this.modal.querySelector('.custom-modal-selector');
            content = this.modal.querySelector('.tab-content');
            indexCount = menu.querySelectorAll('li').length;
        }

        xml.map((_xml, index) => {
            if (!_xml) {
                return false;
            }
            var _index = (index + indexCount);
            var _tab = document.createElement('div');
            _tab.className = 'tab-pane fade';
            _tab.id = 'tab-' + _index;

            var li = document.createElement('li');
            li.className = 'custom-modal-tab nav-item';

            li.innerHTML = '<button id="button-tab-' + _index + '" class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-' + _index + '" type="button" role="tab" aria-selected="false">' + titles[index] + '</button>'
            if (_index == 0) {
                li.innerHTML = '<button id="button-tab-' + _index + '" class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-' + _index + '" type="button" role="tab" aria-selected="true">' + titles[index] + '</button>'
                _tab.className += 'show active';
            }

            var option = document.createElement('option');
            option.value = 'button-tab-' + _index;
            option.textContent = titles[index];

            selector.appendChild(option);
            menu.appendChild(li);
            content.appendChild(_tab);

            var exception = this.findException(_xml);
            if (exception) {
                _tab.appendChild(exception);
                return false;
            }

            const img_pattern = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpeg|jpg|gif|png|svg)/i;
            var _fields = {};
            if (types[index]) {
                var features = _xml.querySelectorAll('FeatureCollection member');
                if (!features || features.length == 0) {
                    features = _xml.querySelectorAll('FeatureCollection featureMembers');
                }
                Array.from(features).map(member => {
                    Array.from(member.children).map(feature => {
                        var cursor = feature.getAttributeNames().filter(attr => {
                            var _attr = attr.split(':');

                            return _attr.length > 1 && _attr[1] == 'id' ? attr : false;
                        })[0]
                        var id = feature.getAttribute(cursor);
                        _fields[id] = [];

                        Array.from(feature.children).map(field => {
                            var name = field.nodeName.split(':');
                            if (name.length > 1) {
                                name = name[1];
                            }
                            if (name != 'the_geom') {
                                _fields[id].push([name, field.textContent]);
                            }
                        })

                        _fields[id].map(_f => {
                            let result = _f;

                            let img = _f[1].match(img_pattern);
                            if (img) {
                                result[1] = result[1].replace(img[0], '<a href="' + img[0] + '" target="_blank"><img src="' + img[0] + '"></a>');
                            }

                            return result;
                        })
                    })
                })
            } else {
                var type = 'feature';
                var features = _xml.querySelectorAll('featureMember');
                var info = _xml.querySelectorAll('FeatureInfo');
                if (info.length > 0) {
                    type = 'thredds';
                    features = info;
                } else if (features.length == 0) {
                    type = 'field';
                    features = _xml.querySelectorAll('FIELDS');
                }
                Array.from(features).map((feature, i) => {
                    if (type == 'feature') {
                        _fields[i] = feature.querySelector('[fid]').childNodes;
                    } else if (type == 'field') {
                        var _list = [];
                        for (var attribute, e = 0, attributes = feature.attributes, count = attributes.length; e < count; e++) {
                            attribute = attributes[e];
                            _list.push([attribute.nodeName, attribute.nodeValue]);
                        }
                        _fields[i] = _list;
                    } else if (type == 'thredds') {
                        _fields[i] = [[feature.querySelector('time').tagName, feature.querySelector('time').textContent], [feature.querySelector('value').tagName, feature.querySelector('value').textContent]];
                        type = 'field';
                    }

                    _fields[i].map(_f => {
                        let result = _f;

                        let img = _f[1].match(img_pattern);
                        if (img) {
                            result[1] = result[1].replace(img[0], '<a href="' + img[0] + '" target="_blank"><img src="' + img[0] + '"></a>');
                        }

                        return result;
                    })
                })
            }

            if (template && template[index]) {
                Object.keys(_fields).map(key => {
                    _fields[key] = {
                        title: this.assignValues(template[index].title, _fields[key]),
                        body: this.assignValues(template[index].body, _fields[key])
                    }
                })
            }

            _tab.appendChild(this.createAccordion(_fields, index));
        });

        this.remove();
        this.setTitle(i18n_locale.customModalTitle);
        this.setContent(_html);
        this.addTo(document.querySelector('#app'));

        return false
        xml.map((_xml, index) => {
            if (!_xml) {
                return false;
            }
            var _index = (index + indexCount);
            var _tab = document.createElement('div');
            _tab.className = 'tab-pane fade';
            _tab.id = 'tab-' + _index;

            var li = document.createElement('li');
            li.className = 'custom-modal-tab nav-item';

            var _title = titles[index];
            if (template && template[index] && template[index].title) {

            }

            li.innerHTML = '<button id="button-tab-' + _index + '" class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-' + _index + '" type="button" role="tab" aria-selected="false">' + _title + '</button>'
            if (_index == 0) {
                li.innerHTML = '<button id="button-tab-' + _index + '" class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-' + _index + '" type="button" role="tab" aria-selected="true">' + _title + '</button>'
                _tab.className += 'show active';
            }

            var option = document.createElement('option');
            option.value = 'button-tab-' + _index;
            option.textContent = titles[index];

            selector.appendChild(option);
            menu.appendChild(li);
            content.appendChild(_tab);

            var exception = this.findException(_xml);
            if (exception) {
                _tab.appendChild(exception);
                return false;
            }
            if (!template) {
                var _fields = {};

                if (types[index]) {
                    var features = _xml.querySelectorAll('FeatureCollection member');
                    if (!features || features.length == 0) {
                        features = _xml.querySelectorAll('FeatureCollection featureMembers');
                    }

                    Array.from(features).map(member => {
                        Array.from(member.children).map(feature => {
                            var cursor = feature.getAttributeNames().filter(attr => {
                                var _attr = attr.split(':');

                                return _attr.length > 1 && _attr[1] == 'id' ? attr : false;
                            })[0]
                            var id = feature.getAttribute(cursor);
                            _fields[id] = [];

                            Array.from(feature.children).map(field => {
                                var name = field.nodeName.split(':');
                                if (name.length > 1) {
                                    name = name[1];
                                }
                                if (name != 'the_geom') {
                                    _fields[id].push([name, field.textContent]);
                                }
                            })
                        })
                    })
                } else {
                    var type = 'feature';
                    var features = _xml.querySelectorAll('featureMember');
                    var info = _xml.querySelectorAll('FeatureInfo');
                    if (info.length > 0) {
                        type = 'thredds';
                        features = info;
                    } else if (features.length == 0) {
                        type = 'field';
                        features = _xml.querySelectorAll('FIELDS');
                    }

                    Array.from(features).map((feature, i) => {
                        if (type == 'feature') {
                            _fields[i] = feature.querySelector('[fid]').childNodes;
                        } else if (type == 'field') {
                            var _list = [];
                            for (var attribute, e = 0, attributes = feature.attributes, count = attributes.length; e < count; e++) {
                                attribute = attributes[e];
                                _list.push([attribute.nodeName, attribute.nodeValue]);
                            }
                            _fields[i] = _list;
                        } else if (type == 'thredds') {
                            _fields[i] = [[feature.querySelector('time').tagName, feature.querySelector('time').textContent], [feature.querySelector('value').tagName, feature.querySelector('value').textContent]];
                            type = 'field';
                        }
                    })
                }
                _tab.appendChild(this.createAccordion(_fields, index));
            } else {
                console.log(template[index])
            }
        });
        this.remove();
        this.setTitle(i18n_locale.customModalTitle);
        this.setContent(_html);
        this.addTo(document.querySelector('#app'));
    },
    createAccordion: function (data, index) {
        var container = document.createElement('div');
        container.className = 'card-container';

        Object.keys(data).map((key, i) => {
            var card = document.createElement('div');
            card.className = 'card';

            var header = document.createElement('div');
            header.className = 'card-header';
            header.id = 'header_' + key;

            var button = document.createElement('button');
            button.className = 'btn btn-link collapsed';
            button.setAttribute('data-bs-toggle', 'collapse');
            button.setAttribute('data-bs-target', '#body-' + index + '-' + i);
            button.setAttribute('aria-expanded', false);
            if (data[key].title) {
                button.innerHTML = data[key].title;
            } else {
                button.textContent = key;
            }

            var body = document.createElement('div');
            body.className = 'collapse';
            body.id = 'body-' + index + '-' + i;

            var table = document.createElement('table');

            if (data[key].body) {
                table.innerHTML = data[key].body;
            } else {
                data[key].map(field => {
                    var tr = table.insertRow();
                    field.map(column => {
                        //tr.insertCell().textContent = column;
                        tr.insertCell().innerHTML = column;
                    })
                })
            }

            header.appendChild(button);
            card.appendChild(header);

            body.appendChild(table);
            card.appendChild(body);

            container.appendChild(card);
        })

        return container;
    },
    createTable: function (headers, rows) {
        var table = document.createElement('table');
        table.className = 'default-table';
        var thead = document.createElement('thead');
        var tbody = document.createElement('tbody');

        theadhtml = '<tr>';
        headers.map(header => {
            theadhtml += '<th>' + header + '</th>';
        });
        theadhtml += '</tr>';

        tbodyhtml = '';
        rows.map(row => {
            tbodyhtml += '<tr>';
            /*row.map((field, i) => {
                tbodyhtml += '<td>'+field.value+'</td>';
            })*/
            headers.map(header => {
                var filter = Array.from(row).filter(field => {
                    if (header == field.field) {
                        return true;
                    }
                });
                if (filter.length > 0) {
                    tbodyhtml += '<td>' + filter[0].value + '</td>'
                } else {
                    tbodyhtml += '<td>-</td>';
                }
            })
            tbodyhtml += '</tr>';
        })

        thead.innerHTML = theadhtml;
        tbody.innerHTML = tbodyhtml;

        table.appendChild(thead);
        table.appendChild(tbody);

        return table;
    },
    findException: function (xml) {
        var exception = xml.querySelector('ServiceException,[code="InvalidParameterValue"]');
        var html = null;
        if (exception) {
            html = document.createElement('div');
            html.className = 'custom-modal-alert';
            html.textContent = exception.textContent;
        }
        return html;
    },
    togglePreview: function (title, img) {
        img.width = img.getAttribute('data-width');
        img.height = img.getAttribute('data-height');
        this.preview.remove();
        this.preview.querySelector('.custom-modal-content').innerHTML = '';
        this.preview.querySelector('.custom-modal-header .custom-modal-title').textContent = title;

        var _container = this.preview.querySelector('.custom-modal-body .custom-modal-content');
        _container.appendChild(img);

        if (img.classList.contains('range')) {
            var min = document.createElement('span');
            min.textContent = img.getAttribute('data-min');

            var max = document.createElement('span');
            max.textContent = img.getAttribute('data-max');

            _container.append(min);
            _container.append(max);
        }
        document.body.appendChild(this.preview);
    }
}