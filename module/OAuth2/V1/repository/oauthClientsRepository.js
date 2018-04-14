/**
 * @desc Classe responsável pelo CRUD do oauthClients
 * @author Vitor Barros
 * @constructor
 */
var Repository = require('./repository');

var OauthClientsRepository = function () {
};

OauthClientsRepository.prototype = new Repository();
OauthClientsRepository.prototype.setEntity('oauthClients');

module.exports = OauthClientsRepository;