var
    _ = require('lodash'),
    fs = require('fs');

function getProviders() {
    var files = fs.readdirSync(__dirname + '/providers');
    var re = /^[A-Za-z][A-Za-z0-9\_]*\.js$/;
    var jss = _.filter(files, function(f) {
        return re.test(f);
    });
    var names = _.map(jss, function(f) {
        return f.substring(0, f.length - 3);
    });
    var ps = {};
    _.each(names, function(name) {
        ps[name] = require('./providers/' + name);
    });
    return ps;
}

var oauth2 = {

    providers: getProviders(),

    createProvider: function(name, options) {
        var Provider = this.providers[name];
        if (! Provider) {
            throw new Error('No provider \'' + name + '\' found.');
        }
        if (typeof(options)!=='object') {
            throw new Error('Invalid argument \'options\'.');
        }
        return new Provider(options);
    }
};




exports = module.exports = oauth2;
