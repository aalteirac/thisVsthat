"use strict";
var express = require('express');
var settings_1 = require('./settings');
var api = require('./projectApi');
var router = express.Router();
function answer(res, err, content) {
    // Avoid caching.
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    if (settings_1.default().cors) {
        res.setHeader('Access-Control-Allow-Origin', settings_1.default().cors.origin);
    }
    if (err) {
        res.writeHead(err.code, err.message, { 'content-type': 'text/plain' });
        res.end(err.message);
    }
    else if (content) {
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.json(content);
    }
    else {
        res.sendStatus(204);
    }
}


function fixBody(body) {
    return (typeof body === 'string') ? JSON.parse(body) : body;
}

router.get('/test', function (req, res) {
        //api.ProjectApi.
        answer(res, null, {name:"ok it works"});
});
router.post('/create/:id', function (req, res) {
    api.ProjectApi.create(req.params.id, req.body, function (err) {
        answer(res, err);
    });
});


exports.default = router;