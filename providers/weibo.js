function initProvider() {
    return {
        //
    };
}

////////

var util = require('util');
var request = require('request');

function WeiboProvider(options) {
    this.options = options;
}

WeiboProvider.prototype = initProvider();

WeiboProvider.prototype.getAuthenticateURL = function(options) {
    return util.format('https://api.weibo.com/oauth2/authorize?client_id=%s&response_type=%s&redirect_uri=%s',
        options && options.client_id || this.options.client_id,
        options && options.response_type || 'code',
        encodeURIComponent(options && options.redirect_uri || this.options.redirect_uri));
};

WeiboProvider.prototype.getAccessToken = function(options, callback) {
    var qs = {
        client_id: this.options.client_id,
        client_secret: this.options.client_secret,
        grant_type: 'authorization_code',
        redirect_uri: options.redirect_uri || this.options.redirect_uri,
        code: options.code
    };
    console.log('get access token: ' + JSON.stringify(qs));
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
        callback(null, {
            access_token: r.access_token,
            expires_in: r.expires_in,
            user_id: r.uid
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
        try {
            callback(null, JSON.parse(body));
        }
        catch (e) {
            return callback(e);
        }
    });
};

WeiboProvider.prototype.getProfile = function(access_token, user_id, callback) {
    this.requestAPI('GET', 'users/show', access_token, { uid: user_id }, function(err, r) {
        console.log('PROFILE: ' + JSON.stringify(r));
        if (err) {
            return callback(err);
        }
        return callback(null, {
            name: r.screen_name,
            url: 'http://weibo.com/' + (r.domain ? r.domain : r.idstr),
            image_url: r.profile_image_url
        });
    });
};

WeiboProvider.prototype.constructor = WeiboProvider;

exports = module.exports = WeiboProvider;
