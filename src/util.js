"use strict";
var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var settings_1 = require('./settings');
function logError(tool, args, err, strerr) {
    var sett = settings_1.default();
    var logfile = path.join(settings_1.default().logs, 'error.log');
    try {
        var text = tool;
        if (args) {
            var atxt = JSON.stringify(args);
            text += ' ' + atxt.substr(1, atxt.length - 2) + '\n';
        }
        text += '\t' + JSON.stringify(err).replace(/\s/, ' ') + '\n';
        var lines = strerr.toString().split(/[\r\n]+/);
        text += '\t' + lines.join('\n\t') + '\n';
        fs.appendFileSync(logfile, text);
    }
    catch (e) {
        console.log('Logging problems: [' + logfile + ']: ' + JSON.stringify(e));
    }
}
var SysErrors = (function () {
    function SysErrors() {
    }
    SysErrors.Unexpected = function (details) { return { code: 500, message: 'Unxpected error', details: details }; };
    SysErrors.NotFound = function (details) { return { code: 404, message: 'Not found', details: details }; };
    SysErrors.AlreadExists = function (details) { return { code: 406, message: 'Already Exists', details: details }; };
    SysErrors.SaveError = function (details) { return { code: 500, message: 'Error saving', details: details }; }; // ToDo: is there something better than 500
    SysErrors.DeleteError = function (details) { return { code: 500, message: 'Error deleting', details: details }; }; // ToDo: is there something better than 500
    SysErrors.ExternalError = function (details) { return { code: 500, message: 'Request failed', details: details }; }; // ToDo: is there something better than 500
    SysErrors.BadParameters = function (details) { return { code: 400, message: 'Bad parameters', details: details }; };
    SysErrors.NotImplemented = function (details) { return { code: 501, message: 'Not implemented', details: details }; };
    return SysErrors;
}());
exports.SysErrors = SysErrors;
function removeRecursive(folder) {
    var names = fs.readdirSync(folder);
    names.forEach(function (file, index) {
        var curPath = path.join(folder, file);
        if (fs.lstatSync(curPath).isDirectory()) {
            removeRecursive(curPath);
        }
        else {
            fs.unlinkSync(curPath);
        }
    });
    fs.rmdirSync(folder);
}
var Util = (function () {
    function Util() {
    }
    Util.readJson = function (filename) {
        var text = fs.readFileSync(filename, 'utf8');
        var offset = 0;
        while (offset < text.length && text[offset] !== '{' && text[offset] !== '[')
            ++offset;
        return JSON.parse(text.substr(offset));
    };
    Util.removeFolder = function (folder, callback) {
        fs.exists(folder, function (exists) {
            if (!exists) {
                callback(SysErrors.NotFound());
            }
            else {
                try {
                    removeRecursive(folder);
                    callback();
                }
                catch (ex) {
                    callback(SysErrors.DeleteError(ex));
                }
            }
        });
    };
    ;
    Util.run = function (cmd, args, callback) {
        var ext = path.extname(cmd).toLowerCase();
        if (ext === '.exe') {
            child_process.execFile(cmd, args, {}, function (err, stdout, stderr) {
                if (err) {
                    logError(cmd, args, err, stderr);
                }
                callback(err ? SysErrors.ExternalError(err) : null);
            });
        }
        else {
            var allargs = [cmd].concat(args);
            child_process.execFile(settings_1.default().tools.node, allargs, {}, function (err, stdout, stderr) {
                if (err) {
                    logError(settings_1.default().tools.node, allargs, err, stderr);
                }
                callback(err ? SysErrors.ExternalError(err) : null);
            });
        }
    };
    Util.getDate = function (folder, file) {
        var filename = path.join(folder, file);
        return fs.existsSync(filename) ? fs.lstatSync(filename).ctime : null;
    };
    return Util;
}());
exports.Util = Util;
//# sourceMappingURL=util.js.map