/**
 * @desc Calsse responsável pela ativação do cadastro
 * @param req
 * @param res
 * @returns {*}
 * @constructor
 */
var ServiceActivateLogin = function (req, res) {

    //verificando os parametros
    if (!req.body.activationCode || !req.body._id || !req.body.type || !req.body.username) {
        return res.status(400).json({
            success: false,
            data: "'activationCode', '_id', 'username' and 'type' are required"
        });
    }

    //verificando o tipo de login
    if (req.body.type !== 'providers' && req.body.type !== 'companies' && req.body.type !== 'administrators' && req.body.type !== 'clients') {
        return res.status(400).json({
            success: false,
            data: "Supported types 'providers', 'companies', 'clients', and 'administrators'"
        });
    }

    var username = req.body.username;
    req.body.username = username.trim();

    //chamando o repository
    var entity = require('./../../../people/V1/repository/' + req.body.type + 'Repository');
    var repo = new entity();
    repo.setEntity(req.body.type);

    var activate = repo.findOneByField({
        _id: req.body._id,
        username: req.body.username,
        activationCode: req.body.activationCode
    });

    activate
        .then(function (success) {

            //verificando se foi encontrado algum registro
            if (!success) {
                return res.status(400).json({
                    success: false,
                    data: "Incorrect username or activation code"
                });
            }

            //verificando se o registro já foi ativado
            if (success.status === 1) {
                return res.status(400).json({
                    success: false,
                    data: {
                        message: "Esse cadastro já foi ativado"
                    }
                });
            }

            //ativando o registro do usuário
            var obj = {
                _id: success._id,
                status: 1
            };

            var update = repo.update(success._id, obj);

            update
                .then(function (user) {
                    return res.status(200).json({
                        success: true,
                        data: user
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

module.exports = ServiceActivateLogin;