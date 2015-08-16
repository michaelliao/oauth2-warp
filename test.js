
var oauth2 = require('./oauth2');
var readline = require('readline');

var
    providerName = 'weibo',
    client_id = 'your-client-id',
    client_secret = 'your-client-secret',
    redirect_uri = 'http://redirect/uri';


var provider = oauth2.createProvider(providerName, {
    client_id: client_id,
    client_secret: client_secret,
    redirect_uri: redirect_uri
});

console.log('Authenticate URL:\n\n' + provider.getAuthenticateURL() + '\n');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function processCode(code) {
    provider.getAuthentication({
        code: code
    }, function (err, r) {
        if (err) {
            console.log(err);
        } else {
            console.log('Authentication >>> ' + JSON.stringify(r));
        }
    });
}

rl.question('Paste the code from browser: ', function (answer) {
    rl.close();
    processCode(answer);
});
