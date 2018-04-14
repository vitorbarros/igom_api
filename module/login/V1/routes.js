/**
 * @desc Arquivo de rotas do módulo OAuth2
 */
var express = require('express');
var router = express.Router();

//authenticate route (RPC)
router.post('/authenticate', require('./services/authenticate'));

//activate register (RPC)
router.post('/activate', require('./services/activate'));

//reset password (RPC)
router.post('/reset-password', require('./services/resetPassword'));

module.exports = router;