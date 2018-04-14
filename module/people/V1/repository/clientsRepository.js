/**
 * Classe responsável pelo CRUD do client
 * @author Vitor Barros
 * @constructor
 */
var Repository = require('./repository');

var ClientsRepository = function () {
};

ClientsRepository.prototype = new Repository();
ClientsRepository.prototype.setEntity('clients');

module.exports = ClientsRepository;