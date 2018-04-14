/**
 * @desc Calsse responsável pelo refresh da token
 * @author Vitor Barros
 * @param req
 * @param res
 * @constructor
 */
var ServiceRefreshToken = function (req, res) {

    var timezone = require('moment-timezone');

    if (!req.body.refreshToken) {
        return res.status(401).json({
            success: false,
            data: "Missing params, please check the doc with API owner"
        });
    }

    var OauthAccessToken = require('./../../repository/oauthAccessTokensRepository');
    var oauthAccessToken = new OauthAccessToken();
    oauthAccessToken.setEntity('oauthAccessTokens');

    //buscando o registro com o refresh token informado
    var query = oauthAccessToken.findOneByField({
        refreshToken: req.body.refreshToken
    });

    query
        .then(function (accessToken) {

            if (!accessToken) {
                return res.status(401).json({
                    success: false,
                    data: "Missing params, please check the doc with API owner"
                });
            }

            var formatted = timezone.tz("America/Sao_Paulo").format();
            var today = new Date(formatted.substr(0, formatted.length - 6));
            var refreshExpire = new Date(accessToken.refreshTokenExpireAt);

            //caso o refresh token esteja expirado
            if (today > refreshExpire) {
                return res.status(401).json({
                    success: false,
                    data: "Missing params, please check the doc with API owner"
                });
            }

            //gerando uma nova token
            var generate = require('./generateAccessToken');
            generate.prototype.generateAccessToken(accessToken.userId)
                .then(function (accessToken) {
                    return res.status(200).json({
                        success: true,
                        data: accessToken
                    });
                })
                .catch(function (err) {
                    return res.status(400).json({
                        success: false,
                        data: err
                    });
                });
        })
        .catch(function (err) {
            return res.status(400).json({
                success: false,
                data: err
            });
        });
};

module.exports = ServiceRefreshToken;
