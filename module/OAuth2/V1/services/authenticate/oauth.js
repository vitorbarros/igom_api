/**
 * @desc Classe responsável pela autenticação na API
 * @author Vitor Barros
 * @param req
 * @param res
 * @constructor
 */
var ServiceOAuth2 = function (req, res) {

    //validation
    if (!req.body.username || !req.body.password || !req.body.grantType || !req.body.appId || !req.body.secret) {
        return res.status(401).json({
            success: false,
            data: "Missing params, please check the doc with API owner"
        });
    }

    //verificando os dados de autenticação
    var OauthUser = require('./../../repository/oauthUsersRepository');
    var OauthUserRepository = new OauthUser();
    OauthUserRepository.setEntity('oauthUsers');

    var query = OauthUserRepository.findOneByField({
        username: req.body.username
    });

    query
        .then(function (user) {
            if (user) {
                user.verifyPassword(req.body.password, function (err, isMatch) {

                    if (err) {
                        return res.status(400).json({
                            success: false,
                            data: err
                        });
                    }

                    if (isMatch) {

                        //verificando as credencias
                        var OauthClient = require('./../../repository/oauthClientsRepository');
                        var OauthClientRepository = new OauthClient();

                        OauthClientRepository.setEntity('oauthClients');
                        var clientQuery = OauthClientRepository.findOneByField({
                            userId: user._id
                        });

                        clientQuery
                            .then(function (client) {

                                if (client) {

                                    //verificando o secret
                                    client.verifySecret(req.body.secret, function (err, isMatch) {

                                        if (err) {
                                            return res.status(400).json({
                                                success: false,
                                                data: err
                                            });
                                        }

                                        if (isMatch) {

                                            //verificando o appid e o grant type
                                            if (req.body.appId !== client.appId || req.body.grantType !== client.grantType) {
                                                return res.status(401).json({
                                                    success: false,
                                                    data: "Incorrect user credentials, please check the doc with API owner"
                                                });
                                            } else {
                                                //gerando o access token
                                                var generate = require('./generateAccessToken');
                                                generate.prototype.generateAccessToken(user._id)
                                                    .then(function (accessToken) {
                                                        return res.status(200).json({
                                                            success: true,
                                                            data: accessToken
                                                        });
                                                    })
                                                    .catch(function (err) {
                                                        return res.status(401).json({
                                                            success: false,
                                                            data: "Incorrect user credentials, please check the doc with API owner"
                                                        });
                                                    });
                                            }

                                            //caso o secret esteja incorreto
                                        } else {
                                            return res.status(401).json({
                                                success: false,
                                                data: "Incorrect user credentials, please check the doc with API owner"
                                            });
                                        }

                                    });

                                    //caso não exista o client
                                } else {
                                    return res.status(401).json({
                                        success: false,
                                        data: "Incorrect user credentials, please check the doc with API owner"
                                    });
                                }
                            })
                            .catch(function (err) {
                                return res.status(400).json({
                                    success: false,
                                    data: err
                                });
                            });

                        //case a senha esteja incorreta
                    } else {
                        return res.status(401).json({
                            success: false,
                            data: "Incorrect user credentials, please check the doc with API owner"
                        });
                    }

                });
                //caso o nome do usuário esteja incorreto
            } else {
                return res.status(401).json({
                    success: false,
                    data: "Incorrect user credentials, please check the doc with API owner"
                });
            }
        })
        .catch(function (err) {
            return res.status(400).json({
                success: false,
                data: err
            });
        });
};

module.exports = ServiceOAuth2;