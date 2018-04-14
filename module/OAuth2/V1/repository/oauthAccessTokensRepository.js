/**
 * @desc Classe responsável pelo CRUD do oauthAccessTokens
 * @author Vitor Barros
 * @constructor
 */
var Repository = require('./repository');

var OauthAccessTokensRepository = function () {
};

OauthAccessTokensRepository.prototype = new Repository();
OauthAccessTokensRepository.prototype.setEntity('oauthAccessTokens');

module.exports = OauthAccessTokensRepository;