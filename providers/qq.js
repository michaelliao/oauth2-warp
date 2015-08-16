var
    util = require('util'),
    querystring = require('querystring'),
    request = require('request');

function QQProvider(client_id, client_secret, redirect_uri) {
    this.client_id = client_id;
    this.client_secret = client_secret;
    this.redirect_uri = redirect_uri;
}

QQProvider.prototype.getAuthenticateURL = function (options) {
    return util.format('https://graph.qq.com/oauth2.0/authorize?client_id=%s&response_type=%s&state=%s&redirect_uri=%s',
        (options && options.client_id) || this.client_id,
        'code',
        String(Math.random() * 100000000),
        encodeURIComponent((options && options.redirect_uri) || this.redirect_uri));
};

QQProvider.prototype.getAuthentication = function (options, callback) {
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
        uri: 'https://graph.qq.com/oauth2.0/token',
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
        console.log(r);
        // get openid:
        request({
            method: 'GET',
            uri: 'https://graph.qq.com/oauth2.0/me',
            timeout: 5000,
            qs: {
                access_token: r.access_token
            }
        }, function (err, res, body) {
            if (err) {
                return callback(err);
            }
            if (res.statusCode !== 200) {
                return callback(new Error('Bad response code: ' + res.statusCode));
            }
            console.log('https://graph.qq.com/oauth2.0/me >> ' + body);
            if (body.startsWith('callback(')) {
                body = body.substring(9, body.lastIndexOf(')'));
            }
            var p = JSON.parse(body);
            that.requestAPI('GET', 'user/get_user_info', r.access_token, { openid: p.openid }, function (err, info) {
                if (err) {
                    return callback(err);
                }
                return callback(null, {
                    access_token: r.access_token,
                    refresh_token: r.refresh_token,
                    expires_in: parseInt(r.expires_in, 10),
                    auth_id: p.openid,
                    name: info.nickname,
                    url: '',
                    image_url: info.figureurl_qq_2 || info.figureurl_qq_1
                });
            });
        });
    });
};

QQProvider.prototype.requestAPI = function (method, apiName, access_token, options, callback) {
    options = options || {};
    options.access_token = access_token;
    options.oauth_comsumer_key = this.client_id;
    options.appid = this.client_id;
    options.format = 'json';
    var opts = {
        method: method,
        uri: 'https://graph.qq.com/' + apiName,
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
        if (r.ret !== 0) {
            return callback(new Error(r.msg));
        }
        callback(null, r);
    });
};

QQProvider.prototype.getProfile = function (access_token, auth_id, callback) {
    this.requestAPI('GET', 'user/get_user_info', access_token, { openid: auth_id }, function (err, r) {
        if (err) {
            return callback(err);
        }
        return callback(null, {
            name: r.nickname,
            url: '',
            image_url: r.figureurl_qq_2 || r.figureurl_qq_1
        });
    });
};

module.exports = QQProvider;
