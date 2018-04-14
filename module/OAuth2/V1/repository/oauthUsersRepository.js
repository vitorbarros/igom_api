/**
 * Classe responsável pelo CRUD do oauthUsers
 * @author Vitor Barros
 * @constructor
 */
var Repository = require('./repository');

var OauthUsersRepository = function () {
};

OauthUsersRepository.prototype = new Repository();
OauthUsersRepository.prototype.setEntity('oauthUsers');

module.exports = OauthUsersRepository;