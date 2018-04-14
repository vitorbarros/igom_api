var express = require('express');
var router = express.Router();

//providers routes (REST)
router.post('/providers', require('./services/providers/store'));
router.get('/providers/:id?', require('./services/providers/fetch'));
router.put('/providers/:id', require('./services/providers/update'));

//clients routes (REST)
router.post('/clients', require('./services/clients/store'));
router.get('/clients/:id?', require('./services/clients/fetch'));
router.put('/clients/:id', require('./services/clients/update'));

//clients routes (RPC)
router.get('/clients/email/:email', require('./services/clients/fetchByEmail'));
router.post('/clients/credit-card-delete/:id', require('./services/clients/deleteCreditCard'));
router.post('/clients/new-credit-card/:id', require('./services/clients/saveCreditCard'));

//near routs
router.get('/near', require('./services/near/fetch'));

//CEP RPC API
router.get('/cep/:cep', require('./services/cep/fetch'));

module.exports = router;