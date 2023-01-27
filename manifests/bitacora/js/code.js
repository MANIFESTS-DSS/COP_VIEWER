/*
Basic structure of notifications
    user: identifier of loged user
    title: notification title message
    date: creation date
    body: message
*/
var notifications = {
    _container: null,
    _preview: null,
    _showNew: null,
    _user: null,
    _token: null,
    filters: {
        year: /\d{4}/,
        month: /(?<=[.\-/ ])\d{2}/,
        day: /(?<=[.\-/ ])\d{2}(?=T)/,
        hours: /(?<=T)\d{2}(?=:)/,
        minutes: /(?<=:)\d{2}(?=:)/
    },
    allowScroll: true,
    scrollTolerance: 130,
    downloadUrl: 'http://coptool.plancamgal.gal/api/logbookrecords/',
    lastId: null,
    tags: [],
    tagColors: [],
    filterSelect: null,
    filterTags: null,
    activeTags: [],
    allowedImg: ['png', 'jpg', 'jpeg', 'tif', 'gif', 'bmp'],
    allowedDoc: ['docx', 'doc', 'odt'],
    allowedPdf: ['pdf'],
    allowedExcel: ['xls', 'xlsx', 'ods'],
    allowedMp3: ['mp3'],
    allowedMp4: ['mp4'],
    allowedZip: ['zip', 'rar', '7zip'],
    _init_: function (container, user, token) {
        this._container = container;
        this._container.textContent = '';
        this._user = user;
        this._token = token;

        this._preview = document.createElement('div');
        this._preview.className = 'preview-container';

        const closePreview = document.createElement('span');
        closePreview.className = 'close-preview material-symbols-outlined';
        closePreview.textContent = 'close';
        closePreview.addEventListener('click', (e) => {
            const element = this._preview.querySelector('.preview-element');
            if (element) {
                element.remove();
            }
            e.target.parentNode.classList.remove('show');

            if (this.blob_url) {
                URL.revokeObjectURL(this.blob_url);
            }
        });

        this._preview.appendChild(closePreview);
        document.body.appendChild(this._preview);

        this._showNew = document.createElement('div');
        this._showNew.className = 'show-new';
        this._showNew.innerHTML = '<span class="material-symbols-outlined">keyboard_double_arrow_down</span>';
        this._showNew.addEventListener('click', (e) => {
            if (this._showNew.classList.contains('new-alert')) {
                this._showNew.classList.remove('new-alert');
            }

            let scrollBottom = true;
            let _new = document.querySelectorAll('.new-notification');
            if (_new.length > 0) {
                if (_new.length > 1) {
                    _new[0].scrollIntoView(false);
                    scrollBottom = false;
                }

                Array.from(_new).map(el => {
                    el.classList.remove('new-notification');
                })
            }

            if (scrollBottom) {
                this.allowScroll = true;

                if (this._showNew.classList.contains('current')) {
                    this._showNew.classList.remove('current');
                }

                this.updateScroll();
            }
        })

        this._container.parentNode.appendChild(this._showNew);

        this.filterSelect = this._container.parentNode.querySelector('.filter-select');
        this.filterTags = this._container.parentNode.querySelector('.filter-tags');

        var option = document.createElement('option');
        option.innerHTML = i18n_locale.defaultOption;
        option.hidden = true;
        this.filterSelect.appendChild(option);

        this.filterSelect.addEventListener('change', (e) => {
            if (!this.activeTags.includes(e.target.value)) {
                this.updateSelectedTags(e.target.value);
                this.activeTags.push(e.target.value);
                this.filterSelect.value = i18n_locale.defaultOption;
                this.filterNotifications();
            }
        })

        this.filterTags.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-tag')) {
                e.target.remove();
                //this.activeTags.push(e.target.value);

                var index = this.activeTags.indexOf(e.target.getAttribute('data-tag'));
                if (index > -1) {
                    this.activeTags.splice(index, 1);
                }

                this.filterNotifications();
            }
        })

        this._container.addEventListener('click', (e) => {
            if (e.target.classList.contains('item-with-preview')) {
                const element = this._preview.querySelector('.preview-element');
                if (element) {
                    element.remove();
                }
                fetch(e.target.getAttribute('data-download'), {
                    headers: new Headers({
                        "Authorization": "Bearer " + this._token
                    })
                })
                    .then(response => response.blob())
                    .then(blob => {
                        this.blob_url = URL.createObjectURL(blob);

                        const img = document.createElement('div');
                        img.className = 'preview-element';
                        img.style.backgroundImage = 'url(' + this.blob_url + ')';

                        this._preview.appendChild(img);

                        if (!this._preview.classList.contains('show')) {
                            this._preview.classList.add('show');
                        }
                    })

            } else if (e.target.classList.contains('download')) {
                fetch(e.target.getAttribute('data-download'), {
                    headers: new Headers({
                        "Authorization": "Bearer " + this._token
                    })
                })
                    .then(response => response.blob())
                    .then(blob => {
                        var url = window.URL.createObjectURL(blob);

                        var a = document.createElement("a");
                        a.href = url;
                        a.download = e.target.getAttribute('data-filename');
                        a.click();

                        window.URL.revokeObjectURL(url);
                        delete a;
                    })
            }
        })

        this._container.addEventListener('scroll', (e) => {
            Array.from(this._container.querySelectorAll('.new-notification')).map(el => {
                if (el.getBoundingClientRect().bottom + 20 < el.offsetParent.getBoundingClientRect().bottom) {
                    el.classList.remove('new-notification');
                }
            })

            if (!this.ignoreScroll) {
                if (this._container.classList.contains('scroll')) {
                    if (this._container.scrollTop + this._container.getBoundingClientRect().height > this._container.scrollHeight - this.scrollTolerance) {
                        this.allowScroll = true;

                        if (this._showNew.classList.contains('current')) {
                            this._showNew.classList.remove('current');
                        }
                        if (this._showNew.classList.contains('new-alert')) {
                            this._showNew.classList.remove('new-alert');
                        }
                    } else {
                        this.allowScroll = false;

                        if (!this._showNew.classList.contains('current')) {
                            this._showNew.classList.add('current');
                        }
                    }
                }
            }
            this.ignoreScroll = false;
        })

        this.loadAll();
    },
    createHeader: function (data) {
        var table = document.createElement('table');
        table.className = 'notification-header';

        var row = table.insertRow();
        var cell = row.insertCell();

        var spanDate = document.createElement('span');
        spanDate.className = 'date';
        spanDate.textContent = this.transformDate(data.createdTime);
        cell.appendChild(spanDate);

        row = table.insertRow();

        var spanTitle = document.createElement('span');
        spanTitle.className = 'title';
        spanTitle.textContent = data.title;
        row.insertCell().appendChild(spanTitle);

        row = table.insertRow();

        var spanUser = document.createElement('span');
        spanUser.className = 'user';
        spanUser.textContent = data.createdBy.fullName;
        row.insertCell().appendChild(spanUser);

        return table;
    },
    createBody: function (data) {
        var table = document.createElement('table');
        table.className = 'notification-body';

        var row = table.insertRow();

        var spanMessage = document.createElement('span');
        spanMessage.textContent = data.message;
        row.insertCell().appendChild(spanMessage);

        return table;
    },
    createFooter: function () {
        var table = document.createElement('table');
        table.className = 'notification-footer';

        table.insertRow();

        return table;
    },
    createNotification: function (data, isNew) {
        var update = false;
        var notification = this._container.querySelector('#n_' + data.id);
        if (notification) {
            notification.querySelector('.date').textContent = this.transformDate(data.createdTime);
            notification.querySelector('.title').textContent = data.title;
            notification.querySelector('.user').textContent = data.createdBy.fullName;
            notification.querySelector('.notification-body span').textContent = data.message;

            if (this.lastId && this.lastId == data.id) {
                update = true;
            } else {
                notification.remove();
            }
        } else {
            notification = document.createElement('div');
            notification.id = 'n_' + data.id;
            notification.className = 'notification';
            notification.setAttribute('data-status', 'show');

            notification.appendChild(this.createHeader(data));
            notification.appendChild(this.createBody(data));
            notification.appendChild(this.createFooter());
        }
        if (data.fileName) {
            let span = notification.querySelector('span.download');
            if (span) {
                span.remove();
            }
            let preview = notification.querySelector('span.item-with-preview');
            if (preview) {
                preview.remove();
            }

            let _class = null;
            let _icon = null;
            let ext = data.fileName.split('.')[1];

            switch (true) {
                case (this.allowedImg.includes(ext)):
                    _class = 'item-image';
                    _icon = 'image';
                    break;
                case (this.allowedPdf.includes(ext)):
                    _class = 'item-pdf';
                    _icon = 'picture_as_pdf';
                    break;
                case (this.allowedDoc.includes(ext)):
                    _class = 'item-doc';
                    _icon = 'description';
                    break;
                case (this.allowedExcel.includes(ext)):
                    _class = 'item-excel';
                    _icon = 'table_view';
                    break;
                case (this.allowedMp3.includes(ext)):
                    _class = 'item-mp3';
                    _icon = 'library_music';
                    break;
                case (this.allowedMp4.includes(ext)):
                    _class = 'item-mp4';
                    _icon = 'video_library';
                    break;
                case (this.allowedZip.includes(ext)):
                    _class = 'item-zip';
                    _icon = 'file_present';
                    break;
                default:
                    _class = 'item-other';
                    _icon = 'file_download';
                    break;
            }
            /*
                if (this.allowedImg.includes(ext)) {
                    _class = 'item-image';
                    _icon = 'image';
                } else if (this.allowedPdf.includes(ext)) {
                    _class = 'item-pdf';
                    _icon = 'picture_as_pdf';
                } else if (this.allowedDoc.includes(ext)) {
                    _class = 'item-doc';
                    _icon = 'description';
                } else if (this.allowedExcel.includes(ext)) {
                    _class = 'item-excel';
                    _icon = 'table_view';
                } else if (this.allowedMp3.includes(ext)) {
                    _class = 'item-mp3';
                    _icon = 'library_music';
                } else if (this.allowedMp4.includes(ext)) {
                    _class = 'item-mp4';
                    _icon = 'video_library';
                } else if (this.allowedZip.includes(ext)) {
                    _class = 'item-zip';
                    _icon = 'file_present';
                }
            */

            if (_class) {
                if (_icon == 'image') {
                    preview = document.createElement('span');
                    preview.className = 'item-with-preview';
                    preview.setAttribute('data-download', this.downloadUrl + data.id + '/download')

                    let prev = document.createElement('span');
                    prev.className = 'material-symbols-outlined';
                    prev.textContent = 'open_in_full';

                    preview.appendChild(prev);
                    notification.insertBefore(preview, notification.querySelector('table'));
                }

                span = document.createElement('span');
                span.className = 'download ' + _class;
                span.setAttribute('data-download', this.downloadUrl + data.id + '/download')
                span.setAttribute('data-filename', data.fileName);

                let download = document.createElement('span');
                download.className = 'material-symbols-outlined';
                download.textContent = _icon; //'file_download';

                //var text = document.createElement('span');
                //text.className = 'text-download';
                //text.textContent = i18n_locale.download;

                span.appendChild(download);
                //span.appendChild(text);

                notification.insertBefore(span, notification.querySelector('table'));
            }
        }
        /*
            if (data.tags) {
                data.tags.map(tag=>{
                    if (!this.tags.includes(tag)) {
                        this.tags.push(tag);
                        if (data.style) {
                            this.tagColors.push(data.style);
                        } else {
                            this.tagColors.push(null);
                        }
                        this.addTagToFilter(tag);
                    }                
                    this.addTagToNotification(notification, tag, data.style);
                })
            }
        */
        if (!this.tags.includes(data.type)) {
            this.tags.push(data.type);
            if (data.style) {
                this.tagColors.push(data.style);
            } else {
                this.tagColors.push(null);
            }
            this.addTagToFilter(data.type, data.style);
        }
        this.addTagToNotification(notification, data.type, data.style);

        this.lastId = data.id;

        if (isNew) {
            notification.classList.add('new-notification');
        }

        return update ? null : notification;
    },
    addNotification: function (notification) {
        if (notification) {
            if (this.getScrollPercent() == 100) {
                this.allowScroll = true;
            } else {
                if (!this._showNew.classList.contains('new-alert')) {
                    this._showNew.classList.add('new-alert');
                }
            }
            this.ignoreScroll = true;
            this._container.appendChild(notification);

            this.updateScroll();
        }
    },
    addTagToNotification: function (notification, tag, style) {
        if (notification && tag) {
            var added = notification.querySelector('.notification-footer .tag[data-tag="' + tag + '"]');
            if (!added) {
                var span = document.createElement('span');
                span.className = 'tag';
                span.setAttribute('data-tag', tag);
                span.textContent = tag;

                if (style) {
                    span.style = style;
                }

                notification.querySelector('.notification-footer tr').insertCell().appendChild(span);

                if (this.activeTags.length == 0) {
                    notification.setAttribute('data-status', 'show');
                } else {
                    if (this.activeTags.includes(tag)) {
                        notification.setAttribute('data-status', 'show')
                    } else {
                        notification.setAttribute('data-status', 'hide');
                    }
                }
            }
        }
    },
    addTagToFilter: function (tag, style) {
        var option = document.createElement('option');
        option.value = tag;
        option.innerHTML = tag;
        option.style = style;

        this.filterSelect.appendChild(option);
    },
    updateSelectedTags: function (tag) {
        var span = document.createElement('span');
        span.className = 'filter-tag';
        span.setAttribute('data-tag', tag);
        span.textContent = tag;
        let index = this.tags.indexOf(tag);
        if (index != -1) {
            if (this.tagColors[index]) {
                span.style = this.tagColors[index];
            }
        }

        this.filterTags.appendChild(span);
    },
    filterNotifications: function () {
        Array.from(this._container.children).map(notification => {
            if (this.activeTags.length == 0) {
                notification.setAttribute('data-status', 'show');
            } else {
                var ntags = notification.querySelectorAll('.notification-footer span[data-tag]');
                if (ntags) {
                    ntags = Array.from(ntags);
                    var filtered = false;
                    for (i = 0; i < ntags.length; i++) {
                        if (this.activeTags.includes(ntags[i].getAttribute('data-tag'))) {
                            notification.setAttribute('data-status', 'show')
                            filtered = true;
                            break;
                        }
                    }
                    if (!filtered) {
                        notification.setAttribute('data-status', 'hide');
                    }
                }
            }
        })
    },
    updateScroll: function () {
        if (this._container.classList.contains('scroll')) {
            if (this.allowScroll) {
                this._container.scrollTop = this._container.scrollHeight;
                //this.allowScroll = false;
            }
        } else {
            var mainHeight = this._container.parentNode.getBoundingClientRect().height;
            var containerHeight = this._container.getBoundingClientRect().height;

            if (containerHeight > mainHeight - this.scrollTolerance && !this._container.classList.contains('scroll')) {
                this._container.classList.add('scroll');
                this._container.scrollTop = this._container.scrollHeight;
            }
        }
    },
    getScrollPercent: function () {
        var main = this._container.parentNode;
        var container = this._container;

        return Math.abs((container['scrollTop'] / (main['scrollHeight'] - container['scrollHeight'])) * 100);
    },
    transformDate: function (date) {
        /*
            var iso = new Date(date).toISOString();
            var result = {
                date: [
                    iso.match(this.filters.day)[0],
                    iso.match(this.filters.month)[0],
                    iso.match(this.filters.year)[0]
                ],
                time: [
                    iso.match(this.filters.hours)[0],
                    iso.match(this.filters.minutes)[0]
                ]
            }
            return result.date.join('-') + ' ' + result.time.join(':')}
        */
        var d = new Date(date);
        var h = d.getHours();
        var m = d.getMinutes();
        var result = {
            date: [
                d.getDate(),
                i18n_locale.months[d.getMonth()],
                d.getFullYear()
            ],
            time: [
                h > 9 ? h : '0' + h,
                m > 9 ? m : '0' + m
            ]
        }

        return result.date.join(' ') + ' - ' + result.time.join(':') + 'h';
    },
    loadAll: function () {
        fetch(this.downloadUrl + '?sort=createdTime,asc&episode=' + this._user, {
            headers: new Headers({ "Authorization": "Bearer " + this._token })
        })
            .then((response) => response.json())
            .then((data) => {
                Promise.all(new Array(data.page.totalPages).fill(undefined).map((value, index) => {
                    if (index == 0) {
                        return data;
                    } else {
                        return fetch(this.downloadUrl + '?sort=createdTime,asc&episode=' + this._user + '&page=' + index, {
                            headers: new Headers({ "Authorization": "Bearer " + this._token })
                        }).then((response) => {
                            return response.json();
                        }).then((result) => {
                            return result;
                        });
                    }
                })).then((values) => {
                    var records = [];

                    values.map(value => {
                        records = records.concat(value._embedded.logbookrecords);
                    })
                    var logs = records.map(log => {
                        return this.createNotification(log);
                    })
                    this._container.prepend(...logs);

                    this.updateScroll()
                });

            })
    }
}