var express = require('express');
var router = express.Router();

//orders routes (REST)
router.get('/client/:id', require('./services/orders/clients/fetchByClient'));
router.get('/provider/:id', require('./services/orders/provider/fetchByProvider'));

//orders services routes (REST)
router.post('/services', require('./services/orders/services/store'));
router.get('/services/:id', require('./services/orders/services/fetch'));
router.post('/services/cancel/:id', require('./services/orders/services/cancel'));

//orders routes (REST)
router.get('/', require('./services/orders/fetchAll'));

module.exports = router;