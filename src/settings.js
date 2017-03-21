"use strict";
var path = require('path');
var fs = require('fs');
var os = require('os');
function resolve(folder) {
    if (folder[0] === '~') {
        return os.homedir() + folder.substr(1);
    }
    if (folder[0] === '.') {
        return path.resolve(path.join(__dirname, folder));
    }
    return folder;
}
var Settings = (function () {
    function Settings() {
    }
    return Settings;
}());
exports.Settings = Settings;
var cached = null;
function settings() {
    if (cached == null) {
        cached = new Settings();
        var config = JSON.parse(fs.readFileSync(path.join(__dirname, 'settings.json'), 'utf8'));
        cached.client = resolve(config.client || '../public');
        cached.content = resolve(config.content || '../content');
        cached.logs = resolve(config.logs || '../logs');
        if (config.cors && config.cors.origin)
            cached.cors = { origin: config.cors.origin };
        if (!fs.existsSync(cached.logs)) {
            fs.mkdirSync(cached.logs);
        }
        if (!fs.existsSync(cached.content)) {
            fs.mkdirSync(cached.content);
        }
    }
    return cached;
}
exports.default = settings;
