/**
 * @desc Classse responsável por update nos dados do cliente
 * @author Vitor Barros
 * @param req
 * @param res
 * @constructor
 */
var Service = function (req, res) {

    //verificando alguns campos fora da validação padrão para não dar erro no script
    if (!req.body.email) {
        return res.status(422).json({success: false, data: "Email is required"});
    }

    var timezone = require('moment-timezone');
    var formatted = timezone.tz("America/Sao_Paulo").format();
    var today = new Date(formatted.substr(0, formatted.length - 6));

    //data de ativação do cadastro
    if (req.body.status && parseInt(req.body.status) === 1) {
        req.body.activationAt = new Date(today);
    }

    var email = req.body.email;
    req.body.email = email.trim();
    req.body.email = email.toLowerCase();

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

    req.body.updatedAt = new Date(today);

    //defininfo o email como nome de usuário
    req.body.username = req.body.email;

    Service.prototype.updateClient(req.params.id, req.body)
        .then(function (client) {

            if (req.body.status && parseInt(req.body.status) === 1) {

                Service.prototype.sendEmail({
                    mail: {
                        to: client.email, // list of receivers
                        subject: 'Seja bem-vindo',
                        text: '',
                        html: '',
                        fromName: "Dot Pet"
                    },
                    userData: {}
                }, function (successSent, err) {
                    if (successSent) {
                        return res.status(200).json({
                            success: true,
                            data: client
                        });
                    } else {
                        return res.status(400).json({
                            success: false,
                            data: err
                        });
                    }
                });
            } else {

                return res.status(200).json({
                    success: true,
                    data: client
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

/**
 * @desc Método responsável por fazr o update do client e seus relacionamentos
 * @param id
 * @param body
 * @returns {Promise}
 */
Service.prototype.updateClient = function (id, body) {

    return new Promise(function (resolve, reject) {

        var bcrypt = require('bcrypt-nodejs');

        var Client = require('./../../repository/clientsRepository');
        var clientRepository = new Client();
        clientRepository.setEntity('clients');

        var clientPromise = clientRepository.findOneByField({_id: id});
        clientPromise
            .then(function (clientResponse) {

                //validação dos campos unicos
                //validando os dados do client para evitar duplicidade
                var fieldsValidation = require('./../../validation/clientUniqueFields');
                var validation = new fieldsValidation();

                var promiseArr = [];

                if (body.tel && body.tel !== clientResponse.tel) {
                    promiseArr.push(validation.verify('tel', body.tel));
                }

                if (body.email && body.email !== clientResponse.email) {
                    promiseArr.push(validation.verify('email', body.email));
                }

                if (body.cpf && body.cpf !== clientResponse.cpf) {
                    promiseArr.push(validation.verify('cpf', body.cpf));
                }

                var AllPromises = Promise.all(promiseArr);

                AllPromises
                    .then(function (validated) {

                        if (body.password) {

                            //gerando o salt
                            bcrypt.genSalt(5, function (err, salt) {

                                if (err) reject(err);

                                //encryptando a senha
                                bcrypt.hash(body.password, salt, null, function (err, hash) {

                                    if (err) {
                                        reject(err);
                                    } else {
                                        body.password = hash;

                                        clientRepository.update(id, body)
                                            .then(function (client) {
                                                resolve(client);
                                            })
                                            .catch(function (err) {
                                                reject(err);
                                            });
                                    }
                                });
                            });
                        } else {
                            clientRepository.update(id, body)
                                .then(function (client) {
                                    resolve(client);
                                })
                                .catch(function (err) {
                                    reject(err);
                                });
                        }
                    })
                    .catch(function (duplicated) {
                        reject({
                            type: 'duplicated',
                            entity: duplicated
                        });
                    });
            })
            .catch(function (err) {

            });
    });
};

/**
 * @desc Função que faz o envio de e-mail
 * @param data
 * @param __callback
 */
Service.prototype.sendEmail = function (data, __callback) {

    var fs = require('fs');
    var path = require('path');
    var folder = path.resolve(__dirname);

    var Mail = require('./../../../../mail/V1/services/send');
    var mail = new Mail();

    var template = folder + '/../../../../mail/V1/templates/welcomeClient.html';
    var file = fs.createReadStream(template, 'utf8');
    var templateParsed = '';

    file.on('data', function (chunk) {

        templateParsed += chunk.toString();

        data.mail.html = templateParsed;
        data.mail.text = templateParsed;

        mail.setMailOptions(data.mail);
        mail.send();

        __callback(true, null);
    });
};

module.exports = Service;