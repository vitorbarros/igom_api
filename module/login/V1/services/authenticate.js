/**
 * @desc Método de autenticação dos usuários
 * @author Vitor Barros
 * @param req
 * @param res
 * @constructor
 */
var ServiceLoginAuth = function (req, res) {

    //verificando os parametros
    if (!req.body.username || !req.body.password || !req.body.type) {
        return res.status(401).json({
            success: false,
            data: "Incorrect user credentials, please check the doc with API owner"
        });
    }

    var username = req.body.username;
    req.body.username = username.trim();

    //verificando o tipo de login
    if (req.body.type !== 'providers' && req.body.type !== 'companies' && req.body.type !== 'administrators' && req.body.type !== 'clients') {
        return res.status(401).json({
            success: false,
            data: "Incorrect user credentials, please check the doc with API owner"
        });
    }

    //chamando o repository
    var entity = require('./../../../people/V1/repository/' + req.body.type + 'Repository');
    var repo = new entity();
    repo.setEntity(req.body.type);

    var login = repo.findOneByField({
        username: req.body.username.toLowerCase()
    });

    login
        .then(function (success) {
            if (!success) {
                return res.status(401).json({
                    success: false,
                    data: "Incorrect user credentials, please check the doc with API owner"
                });
            }

            //verificando a senha
            success.verifyPassword(req.body.password, function (err, isMatch) {

                //caso retorne um erro
                if (err) {
                    return res.status(400).json({
                        success: false,
                        data: err
                    });
                }

                //caso a senha esteja correta
                if (isMatch) {

                    //removendo informações que não podem ser reveladas
                    success.password = '';
                    if (req.body.type === 'clients') {
                        if (success.creditCard.length > 0) {
                            for (var b = 0; b < success.creditCard.length; b++) {
                                if (success.creditCard[b].CardToken) {
                                    success.creditCard[b].CardToken = "";
                                }
                                if (success.creditCard[b].SecurityCode) {
                                    success.creditCard[b].SecurityCode = "";
                                }
                            }
                        }
                        // verificando o status do registro do usuário
                        if (success.status === 0) {
                            return res.status(401).json({
                                success: false,
                                data: {
                                    message: "This register is not activated yet",
                                    obj: success
                                }
                            });
                        }
                    }

                    if (req.body.type === 'administrators') {
                        if (success.status === 0) {
                            return res.status(401).json({
                                success: false,
                                data: "Incorrect user credentials, please check the doc with API owner"
                            });
                        }
                    }

                    //removendo o password do retorno
                    return res.status(200).json({
                        success: true,
                        data: success
                    });
                }

                //caso a senha esteja incorreta
                return res.status(401).json({
                    success: false,
                    data: "Incorrect user credentials, please check the doc with API owner"
                });
            });
        })
        .catch(function (err) {
            return res.status(401).json({
                success: false,
                data: err
            });
        });
};

module.exports = ServiceLoginAuth;