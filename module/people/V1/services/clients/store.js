/**
 * @desc Classe responsável por salvar os dados na base
 * @author Vitor Barros
 */
var Service = function (req, res) {

    //verificando alguns campos fora da validação padrão para não dar erro no script
    if (!req.body.email) {
        return res.status(422).json({success: false, data: "Email is required"});
    }

    var email = req.body.email;
    req.body.email = email.trim();

    //validando o endereço caso for mencionado
    if (req.body.address) {
        if (!req.body.address instanceof Array) {
            return res.status(400).json({
                success: false,
                data: {
                    message: "Address must be instanceof array"
                }
            });
        } else {
            for (var i = 0; i < req.body.address.length; i++) {
                if (!req.body.address[i].street || !req.body.address[i].number || !req.body.address[i].neighborhood || !req.body.address[i].city || !req.body.address[i].state || !req.body.address[i].zipCode) {
                    return res.status(422).json({
                        success: false,
                        data: "street, number, neighborhood, city, state, zipCode is required"
                    });
                }
            }
        }
    }

    var timezone = require('moment-timezone');
    var formatted = timezone.tz("America/Sao_Paulo").format();
    var today = new Date(formatted.substr(0, formatted.length - 6));
    var date = new Date(today);

    req.body.createdAt = date;
    req.body.updatedAt = date;

    //defininfo o email como nome de usuário
    req.body.email = req.body.email.toLowerCase();
    req.body.username = req.body.email;
    req.body.status = 0;

    Service.prototype.createClient(req.body)
        .then(function (client) {

            return res.status(200).json({
                success: true,
                data: client
            });
        })
        .catch(function (err) {

            if (err.type) {

                return res.status(400).json({
                    success: false,
                    data: {
                        messages: "Duplicated entity",
                        information: err.entity
                    }
                });

            } else {
                return res.status(400).json({
                    success: false,
                    data: err
                });
            }
        });
};

/**
 * @desc Método responsável por fazr a criação do client e seus relacionamentos
 * @param body
 * @returns {Promise}
 */
Service.prototype.createClient = function (body) {

    return new Promise(function (resolve, reject) {

        var Client = require('./../../repository/clientsRepository');
        var clientRepository = new Client();
        clientRepository.setEntity('clients');

        var text = '';
        var possible = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        for (var i = 0; i < 8; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        var activationCode = '';
        var possibleActivationCode = '0123456789';

        for (var b = 0; b < 4; b++) {
            activationCode += possibleActivationCode.charAt(Math.floor(Math.random() * possibleActivationCode.length));
        }

        body.pinCode = text;
        body.activationCode = activationCode;

        //validando os dados do client para evitar duplicidade
        var fieldsValidation = require('./../../validation/clientUniqueFields');
        var validation = new fieldsValidation();

        //validação dos campos unicos
        var promiseArr = [];

        if (body.tel) {
            promiseArr.push(validation.verify('tel', body.tel));
        }

        if (body.email) {
            promiseArr.push(validation.verify('email', body.email));
        }

        if (body.cpf) {
            promiseArr.push(validation.verify('cpf', body.cpf));
        }

        var AllPromises = Promise.all(promiseArr);

        AllPromises
            .then(function (validated) {

                clientRepository.create(body)
                    .then(function (client) {
                        resolve(client);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            })
            .catch(function (duplicated) {
                reject({
                    type: 'duplicated',
                    entity: duplicated
                });
            });
    });
};

module.exports = Service;