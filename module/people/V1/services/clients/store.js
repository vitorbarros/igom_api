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

            //enviando os dados para a RdStation
            var objRdStation = {
                identificador: "cadastro-usuario",
                email: client.email,
                celular: client.tel,
                name: client.name
            };

            var RdStarion = require('./../../../../rdStation/V1/services/store');
            var rdObject = new RdStarion(objRdStation);
            rdObject.dispatch();

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

                        //enviando notificação do código de acesso por SMS
                        var sms = require('./../../../../sms/V1/services/dispatch/dispatchInternal');
                        var send = new sms();
                        send.prepare(body.tel, "Seja bem-vindo a Dot Pet, Esse e seu codigo de ativacao: " + client.activationCode);
                        send.dispatch(function (success, error) {

                            client.password = '';

                            if (error) {
                                reject(error);
                            } else {

                                var name = client.name.toString().split(" ");

                                Service.prototype.sendEmail({
                                    mail: {
                                        to: client.email, // list of receivers
                                        subject: 'Código de ativação',
                                        text: '',
                                        html: '',
                                        fromName: "Dot Pet"
                                    },
                                    userData: {
                                        name: name[0],
                                        activationCode: client.activationCode
                                    }
                                }, function (successSent, err) {
                                    if (successSent) {
                                        resolve(client);
                                    } else {
                                        reject(err);
                                    }
                                });
                            }
                        });
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

    var template = folder + '/../../../../mail/V1/templates/activationCode.html';
    var file = fs.createReadStream(template, 'utf8');
    var templateParsed = '';

    file.on('data', function (chunk) {

        templateParsed += chunk.toString().replace('[name]', data.userData.name).replace('[activationCode]', data.userData.activationCode);

        data.mail.html = templateParsed;
        data.mail.text = templateParsed;

        mail.setMailOptions(data.mail);
        mail.send();

        __callback(true, null);
    });
};

module.exports = Service;