var util = require('util');
var request = require('request');

function WeiboProvider(client_id, client_secret, redirect_uri) {
    this.client_id = client_id;
    this.client_secret = client_secret;
    this.redirect_uri = redirect_uri;
}

WeiboProvider.prototype.getAuthenticateURL = function(options) {
    return util.format('https://api.weibo.com/oauth2/authorize?client_id=%s&response_type=%s&redirect_uri=%s',
        options && options.client_id || this.client_id,
        'code',
        encodeURIComponent(options && options.redirect_uri || this.redirect_uri));
};

WeiboProvider.prototype.getAuthentication = function(options, callback) {
    var qs = {
        client_id: this.client_id,
        client_secret: this.client_secret,
        grant_type: 'authorization_code',
        redirect_uri: options.redirect_uri || this.redirect_uri,
        code: options.code
    };
    var that = this;
    request({
        method: 'POST',
        uri: 'https://api.weibo.com/oauth2/access_token',
        qs: qs,
        timeout: 5000 // 5 seconds
    }, function(err, res, body) {
        if (err) {
            console.log(err);
            return callback(err);
        }
        if (res.statusCode !== 200) {
            console.log(res.statusCode);
            return callback(new Error('Bad response code: ' + res.statusCode));
        }
        console.log('>>> ' + body);
        var r = JSON.parse(body);

        that.requestAPI('GET', 'users/show', r.access_token, { uid: r.uid }, function(err, p) {
            if (err) {
                return callback(err);
            }
            return callback(null, {
                access_token: r.access_token,
                refresh_token: '',
                expires_in: r.expires_in,
                auth_id: r.uid,
                name: p.screen_name,
                url: 'http://weibo.com/' + (p.domain ? p.domain : p.idstr),
                image_url: p.profile_image_url
            });
        });
    });
};

WeiboProvider.prototype.requestAPI = function(method, apiName, access_token, options, callback) {
    var opts = {
        method: method,
        uri: 'https://api.weibo.com/2/' + apiName + '.json',
        headers: {
            Authorization: 'OAuth2 ' + access_token
        },
        timeout: 5000
    };
    if (options && method==='GET') {
        opts.qs = options;
    }
    if (options && method==='POST') {
        opts.form = options;
    }
    request(opts, function(err, res, body) {
        if (err) {
            return callback(err);
        }
        if (res.statusCode !== 200) {
            return callback(new Error('Bad response code: ' + res.statusCode));
        }
        var j = null;
        try {
            j = JSON.parse(body);
        }
        catch (e) {
            return callback(e);
        }
        callback(null, j);
    });
};

function lenb(s) {
    var i, len = 0;
    for (i = 0; i < s.length; i++) {
        len ++;
        if (s.charCodeAt(i) > 127) {
            len ++;
        }
    }
    return len;
}

function leftb(s, max) {
    var i, ch, pos = 0, left = max;
    for (i = 0; i < s.length; i++) {
        ch = s.charCodeAt(i);
        if (ch <= 127) {
            if (left >= 1) {
                pos = i + 1;
                left --;
            } else {
                break;
            }
        } else { // ch >= 128
            if (left >= 2) {
                pos = i + 1;
                left = left - 2;
            } else {
                break;
            }
        }
    }
    return s.substring(0, pos);
}

WeiboProvider.prototype.share = function (access_token, text, link, callback) {
    var that = this;
    async.waterfall([
        function (callback) {
            if (!link) {
                return callback(null, null);
            }
            that.requestAPI('GET', 'short_url/shorten', access_token, {
                url_long: link
            }, callback);
        },
        function (r, callback) {
            var
                s,
                url = '',
                left = 280;
            if (r !== null) {
                try {
                    url = ' ' + r.urls[0].url_short;
                    left = left - url.length;
                } catch (e) {
                    return callback(e);
                }
            }
            if (lenb(text) <= left) {
                s = text + url;
            } else {
                s = leftb(text, left - 3) + '...' + url;
            }
            that.requestAPI('POST', 'statuses/update', access_token, {
                status: s
            }, callback);
        }
    ], function (err, r) {
        return callback(err || null);
    });
};

exports = module.exports = WeiboProvider;
