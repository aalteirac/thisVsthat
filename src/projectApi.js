"use strict";
var fs = require('fs');
var path = require('path');
var settings_1 = require('./settings');
var util_1 = require('./util');

var ProjectApi = (function () {
    function ProjectApi() {
    }
    ProjectApi.create = function (id, body, callback) {
        var folder = settings_1.default().content;
        fs.exists(folder, function (exists) {
            //if (exists) {
            //    callback(util_1.SysErrors.AlreadExists());
            //}
            //else {

                //fs.mkdir(folder, function (err) {
                //    if (err) {
                //        callback(util_1.SysErrors.Unexpected(err));
                //    }
                //    else {
                        fs.writeFile(path.join(folder,id+'.xlsx'), body, function (err) {
                            if (err) {
                                callback(util_1.SysErrors.SaveError(err));
                            }
                            else {
                                callback({ code: 200, message: 'All Good', details: {} });
                            }
                        });
                    //}
                //});
            //}
        });
    };
    ProjectApi.remove = function ( id, callback) {
        var folder = path.join(settings_1.default().content, id);
        util_1.Util.removeFolder(folder, callback);
    };
    return ProjectApi;
}());
exports.ProjectApi = ProjectApi;
