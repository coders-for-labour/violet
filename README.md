# violet
Social tools for grassroots movements.
## Prerequisites ##
Assuming you've installed Node 4.x.x and npm 2.15.x

###Bower###
`npm install -g bower && npm install bower`

###Gulp###

`npm install -g gulp && npm install gulp`

###Nodemon###
`npm install -g nodemon`

### Canvas ###
Violet currently depends on [Node Canvas](https://github.com/Automattic/node-canvas). It may be that we break this functionality into a separate process in the near future but for now it means you need to carry out the following steps on an ubuntu-based distro:
`sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++`
If you're running a different distro or Windows then visit the github site where there are more instructions.

Then you'll need to grab the latest modules:
`npm install && bower install`
note: currently NPM is throwing some peer dependency errors, these need fixing but don't prevent the packages from installing correctly. See the [issue](https://github.com/coders-for-corbyn/violet/issues/5)

###Webserver###
Violet is designed to run behind a webserver and we include some nginx config files that setup the reverse proxy. This makes it a bit easier to do the OAuth flow.

## Configuring ##
You need to setup the following environment variables: `VIOLET_SERVER_ID`, `VIOLET_TW_CONSUMER_KEY`, `VIOLET_TW_CONSUMER_SECRET`, `VIOLET_TW_ACCESS_TOKEN`, `VIOLET_TW_ACCESS_TOKEN_SECRET`, `VIOLET_BLOCKLIST_URL`: 
Add `export VIOLET_XXX = yyy` to your .profile or .bashrc

`VIOLET_SERVER_ID`: This is used to specify different settings for different server environments and should map to a section in the `config.json` file.
`VIOLET_TW_CONSUMER_KEY`, `VIOLET_TW_CONSUMER_SECRET`: Twitter API Keys : [Twitter App](https://apps.twitter.com)
`VIOLET_TW_ACCESS_TOKEN`, `VIOLET_TW_ACCESS_TOKEN_SECRET`: Twitter Static OAuth credentials that can be used to authenticated server-specific twitter API calls. Currently used to pre-load the block list account details.
`VIOLET_BLOCKLIST_URL`: URL of an API returning a json array of strings representing twitter usernames that are to be blocked ie `["xxx", "yyy", "zzz"]

Then add to config.coffee.
## Building ##
`npm run build`
`npm start`; or
`npm run dev`
