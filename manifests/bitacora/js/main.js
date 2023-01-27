var cfg = {
    availableLocales: ["gl"],
    defaultLocale: "gl"
}

var url = new URL(window.location);
var user = url.searchParams.get("id");
var token = url.searchParams.get("token");
var auth = "http://coptool.plancamgal.gal/api/auth/user";

i18n._init_(function () {
    if (user && token) {
        fetch(auth, {
            headers: new Headers({ "Authorization": "Bearer " + token })
        })
            .then((response) => response.json())
            .then((data) => {
                var initialize = false;
                if (data && !data.errorCode) {
                    data.authorities.map(auth => {
                        if (auth.authority == 'ROLE_BITACORE') {
                            initialize = true;
                        }
                    })
                }
                if (initialize) {
                    window.top.postMessage('auth', '*');
                    window.top.postMessage({ name: data.fullName }, '*');

                    var sock = new SockJS('http://coptool.plancamgal.gal/api-ext/ws/');
                    _stompClient = StompJs.Stomp.over(function () { return sock });
                    _stompClient.connect({}, function (frame) {
                        notifications._init_(document.querySelector('main .container'), user, token);

                        _stompClient.subscribe(
                            '/topic/logbookrecords/' + user,
                            message => {
                                if (message.body) {
                                    console.log(message.body);
                                    try {
                                        notifications.addNotification(notifications.createNotification(JSON.parse(message.body), 1));
                                    } catch (error) {
                                        console.log(error)
                                    }
                                    window.top.postMessage('new', '*');
                                }
                            }
                        )
                    })
                } else {
                    window.top.postMessage('no-auth', '*');
                }
            })
    }
})