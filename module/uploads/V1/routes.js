/**
 * @desc Arquivo de registro de rotas do módulo service
 * @author Vitor Barros
 */
var express = require('express');
var router = express.Router();

router.post('/', require('./services/upload'));

module.exports = router;