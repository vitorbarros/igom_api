/**
 * @desc Arquivo de rotas do módulo OAuth2
 */
var passport = require('./../../../config/passport');
var express = require('express');
var router = express.Router();

//oauth users routes (RPC)
router.post('/oauth-users',
    passport.authenticate('bearer', {session: false}),
    require('./services/oauthUsers/store'));

//oauth clients routes (RPC)
router.post('/oauth-clients',
    passport.authenticate('bearer', {session: false}),
    require('./services/oauthClients/store'));

//authenticate route
router.post('/oauth/access_token', require('./services/authenticate/oauth'));
router.post('/oauth/refresh_token', require('./services/authenticate/refreshToken'));

module.exports = router;