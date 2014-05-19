var
    util = require('util'),
    querystring = require('querystring'),
    request = require('request');

function FacebookProvider(client_id, client_secret, redirect_uri) {
    this.client_id = client_id;
    this.client_secret = client_secret;
    this.redirect_uri = redirect_uri;
}

FacebookProvider.prototype.getAuthenticateURL = function (options) {
    return util.format('https://www.facebook.com/dialog/oauth?client_id=%s&response_type=%s&state=%s&redirect_uri=%s',
        (options && options.client_id) || this.client_id,
        'code',
        String(Math.random() * 100000000),
        encodeURIComponent((options && options.redirect_uri) || this.redirect_uri));
};

FacebookProvider.prototype.getAuthentication = function (options, callback) {
    var
        that = this,
        qs = {
            client_id: this.client_id,
            client_secret: this.client_secret,
            grant_type: 'authorization_code',
            redirect_uri: options.redirect_uri || this.redirect_uri,
            code: options.code
        };
    request({
        method: 'GET',
        uri: 'https://graph.facebook.com/oauth/access_token',
        qs: qs,
        timeout: 5000 // 5 seconds
    }, function (err, res, body) {
        if (err) {
            return callback(err);
        }
        if (res.statusCode !== 200) {
            return callback(new Error('Bad response code: ' + res.statusCode));
        }
        console.log('>>> ' + body);
        var r = querystring.parse(body);
        // get id & profile:
        that.requestAPI('GET', 'me', r.access_token, null, function (err, p) {
            if (err) {
                return callback(err);
            }
            callback(null, {
                access_token: r.access_token,
                refresh_token: '',
                expires_in: parseInt(r.expires, 10),
                auth_id: p.id,
                name: p.name,
                url: p.link,
                image_url: ''
            });
        });
    });
};

FacebookProvider.prototype.requestAPI = function (method, apiName, access_token, options, callback) {
    options = options || {};
    options.access_token = access_token;
    var opts = {
        method: method,
        uri: 'https://graph.facebook.com/' + apiName,
        timeout: 5000
    };
    if (method === 'GET') {
        opts.qs = options;
    }
    if (method === 'POST') {
        opts.form = options;
    }
    request(opts, function (err, res, body) {
        if (err) {
            return callback(err);
        }
        if (res.statusCode !== 200) {
            return callback(new Error('Bad response code: ' + res.statusCode));
        }
        var r;
        try {
            r = JSON.parse(body);
        } catch (e) {
            return callback(e);
        }
        if (r.error) {
            return callback(new Error(r.error.message));
        }
        callback(null, r);
    });
};

module.exports = FacebookProvider;
