/**
 * @desc Calsse responsável pela criação da token
 * @author Vitor Barros
 */
var ServiceGenerateAccessToken = function () {
};

/**
 * @desc Método responsável pela criação do token
 * @param userId
 * @returns {Promise}
 */
ServiceGenerateAccessToken.prototype.generateAccessToken = function (userId) {

    return new Promise(function (resolve, reject) {

        var timezone = require('moment-timezone');

        var OauthUser = require('./../../repository/oauthAccessTokensRepository');
        var OauthUserRepository = new OauthUser();
        OauthUserRepository.setEntity('oauthAccessTokens');

        //gerando a data de expiração do access token e do remember token
        var formatted = timezone.tz("America/Sao_Paulo").format();
        var today = new Date(formatted.substr(0, formatted.length - 6));

        //access Token
        var expireAccessToken = new Date(today);
        expireAccessToken.setHours(today.getHours() + 1);

        //remember token
        var expireRememberToken = new Date(today);
        expireRememberToken.setDate(today.getDate() + 1);

        var create = OauthUserRepository.create({
            userId: userId,
            accessToken: Math.floor((Math.random() * 99999999999999) + 1),
            refreshToken: Math.floor((Math.random() * 99999999999999) + 1),
            accessTokenExpireAt: expireAccessToken,
            refreshTokenExpireAt: expireRememberToken
        });

        create
            .then(function (accessToken) {
                resolve(accessToken);
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

module.exports = ServiceGenerateAccessToken;