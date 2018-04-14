/**
 * Classe responsável pelo CRUD do provider
 * @author Vitor Barros
 * @constructor
 */
var Repository = require('./repository');

var ProvidersRepository = function () {
};

ProvidersRepository.prototype = new Repository();
ProvidersRepository.prototype.setEntity('providers');

module.exports = ProvidersRepository;