var Utils = {
    measure: function() {
        var self= {};
        var app, prop, callback, build, sock, layout, qId;
        return self.app = function(e) {
            return arguments.length ? (app = e, self) : app
        }, self.prop = function(t) {
            return arguments.length ? (prop = t, self) : prop
        }, self.callback = function(t) {
            return arguments.length ? (callback = t, self) : callback
        }, self.build = function(t) {
            return arguments.length ? (build = t, self) : build
        }, self.sock = function() {
            return sock
        }, self.layout = function() {
            return layout
        }, self.qId = function() {
            return qId
        }, self.create = function() {
            return app.createMeasure(prop).then(function(e) {
                app.getMeasure(e.qInfo.qId).then(function(t) {
                    sock = t, sock.getLayout().then(function(t) {
                        qId = t.qInfo.qId, layout = t, callback(self)
                    })
                })
            }), self
        }, self.destroy = function() {
            app.destroyMeasure(qId)
        }, self.update = function() {
            sock.getLayout().then(function(t) {
                layout = t, build(self)
            })
        }, self
    },
    object: function() {
        var self={};
        var app;
        var prop;
        var callback;
        var build;
        var sock;
        var layout;
        var qId;
        return self.app = function(a) {
            return arguments.length ? (app = a, self) : app
        }, self.prop = function(p) {
            return arguments.length ? (prop = p, self) : prop
        }, self.callback = function(c) {
            return arguments.length ? (callback = c, self) : callback
        }, self.build = function(b) {
            return arguments.length ? (build = b, self) : build
        }, self.sock = function() {
            return sock
        }, self.qId = function() {
            return qId
        }, self.layout = function(l) {
            return arguments.length ? (layout = l, self) : layout
        }, self.create = function() {
            if(app.session.rpc.socket.readyState!=3)
            return app.createSessionObject(prop).then(function(s) {
                sock = s, sock.getLayout().then(function(lay) {
                    qId = lay.qInfo.qId;
                    layout = lay;
                    callback(self);
                })
            }), self
        }, self.destroy = function() {
            if(app.session.rpc.socket.readyState!=3)
            app.destroySessionObject(qId)
        }, self.update = function() {
            sock.getLayout().then(function(t) {
                layout = t, build(self)
            })
        }, self.buildObj = function() {
            build(self)
        }, self
    }
};