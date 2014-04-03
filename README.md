oauth2-warp
===========

oauth2-warp is a simple oauth2 framework that supports popular oauth2 providers.

### Install

You can install by npm:

    npm install oauth2-warp

### Usage

Import `oauth2-warp`:

    var oauth2 = require('oauth2-warp');

Create the oauth2 provider with name, client_id, client_secret and redirect_uri:

    var provider = oauth2.createProvider('facebook', {
        client_id: 'your-app-key',
        client_secret: 'your-app-secret',
        redirect_uri: 'http://www.example.com/callback'
    });

You can find name list under directory `providers`.

### Test in command line

Copy the authenticate URL and view in browser:

    console.log(provider.getAuthenticateURL());

You should loggin in browser and be redirect to your `http://www.example.com/callback`. You should get a 404 error but there is `code` parameter you can copy from the address bar:

    var code = 'copy code parameter from browser to here';
    
    provider.getAuthentication({
        code: code
    }, function(err, r) {
        if (err) {
            console.log(err);
        }
        else {
            console.log('Authentication >>> ' + JSON.stringify(r));
        };
    });

You should get authentication information as an object:

    {
        name: 'user name',
        auth_id: 'unique-id', // unique id from oauth provider
        url: 'http://user/home/page', // or empty
        image_url: 'http://image-url/', // or empty
        access_token: 'abc123xyz',
        refresh_token: 'xyz123abc', // or empty
        expires_in: 36000 // access token will expire in seconds
    }

### Integration with Express

TODO:

### Extension

You can add your own oauth2 provider:

TODO:
