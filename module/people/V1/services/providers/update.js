/**
 * @desc Classe responsável por dar update dos dados na base
 * @author Vitor Barros
 */
var Service = function (req, res) {

    //verificando alguns campos fora da validação padrão para não dar erro no script
    if (!req.body.email) {
        return res.status(422).json({success: false, data: "Email is required"});
    }


    var timezone = require('moment-timezone');
    var formatted = timezone.tz("America/Sao_Paulo").format();
    var today = new Date(formatted.substr(0, formatted.length - 6));

    //data de finalização do agendamento
    if (req.body.status && parseInt(req.body.status) === 1) {
        req.body.activationAt = new Date(today);
    }

    var email = req.body.email;
    req.body.email = email.trim();
    req.body.email = email.toLowerCase();

    var timezone = require('moment-timezone');
    var formatted = timezone.tz("America/Sao_Paulo").format();
    var today = new Date(formatted.substr(0, formatted.length - 6));

    req.body.updatedAt = new Date(today);

    //validando o horário de funcionamento
    var validated = true;

    if (req.body.businessHours && req.body.businessHours.length > 0) {
        for (var i = 0; i < req.body.businessHours.length; i++) {

            if (!req.body.businessHours[i].day ||
                req.body.businessHours[i].day === null ||
                !req.body.businessHours[i].fullTime ||
                req.body.businessHours[i].fullTime === null) {
                validated = false;
            }
        }

        if (!validated) {
            return res.status(422).json({
                success: false,
                data: "day and fullTime are required in businessHours array"
            });
        }

        validated = true;

        //validando os horários de abertura e de fechamento da loja
        for (i = 0; i < req.body.businessHours.length; i++) {
            if (req.body.businessHours[i].close && req.body.businessHours[i].open) {

                var open = req.body.businessHours[i].open.split(":");
                var close = req.body.businessHours[i].close.split(":");

                if (parseInt(close[0]) < parseInt(open[0])) {
                    validated = false;
                }

                if (parseInt(close[0]) === parseInt(open[0])) {
                    if (parseInt(close[1]) < parseInt(open[1])) {
                        validated = false;
                    }
                }
            }
        }


        if (!validated) {
            return res.status(422).json({
                success: false,
                data: "open can not be grater than close"
            });
        }
    }

    //defininfo o email como nome de usuário
    req.body.username = req.body.email;

    if (req.body.address) {

        //validando os dados do endereço
        if (!req.body.address[0].street || !req.body.address[0].number || !req.body.address[0].neighborhood || !req.body.address[0].city || !req.body.address[0].state || !req.body.address[0].zipCode) {
            return res.status(422).json({
                success: false,
                data: "street, number, neighborhood, city, state, zipCode is required"
            });

        }
        var addressString = req.body.address[0].street + ", "
            + req.body.address[0].number + " - "
            + req.body.address[0].neighborhood + ", "
            + req.body.address[0].city + " - "
            + req.body.address[0].state;

        Service.prototype.geoLocation(addressString, function (loc) {

            req.body.loc = loc;

            Service.prototype.updateProvider(req.params.id, req.body)
                .then(function (provider) {
                    return res.status(200).json({
                        success: true,
                        data: provider
                    });
                })
                .catch(function (err) {
                    return res.status(400).json({
                        success: false,
                        data: err
                    });
                });
        });

    } else {
        Service.prototype.updateProvider(req.params.id, req.body)
            .then(function (provider) {
                return res.status(200).json({
                    success: true,
                    data: provider
                });
            })
            .catch(function (err) {
                return res.status(400).json({
                    success: false,
                    data: err
                });
            });
    }
};

/**
 * @desc Método responsável por fazr o update do provider
 * @param id
 * @param body
 * @returns {Promise}
 */
Service.prototype.updateProvider = function (id, body) {

    return new Promise(function (resolve, reject) {

        var bcrypt = require('bcrypt-nodejs');

        var Provider = require('./../../repository/providersRepository');
        var providerRepository = new Provider();
        providerRepository.setEntity('providers');

        providerRepository
            .findOneByField({_id: id})
            .then(function (providerResponse) {

                //inicio das validações
                var fieldsValidation = require('./../../validation/providerAndCompanyUniqueFields');
                var validation = new fieldsValidation();

                //validação dos campos unicos
                var promiseArr = [];

                if (body.cel && body.cel !== providerResponse.cel) {
                    promiseArr.push(validation.verify('cel', body.cel));
                }

                if (body.email && body.email !== providerResponse.email) {
                    promiseArr.push(validation.verify('email', body.email));
                }

                if (body.cnpj && !providerResponse.cnpj) {
                    promiseArr.push(validation.verify('cnpj', body.cnpj));
                }

                if (body.cnpj && providerResponse.cnpj && body.cnpj !== providerResponse.cnpj) {
                    promiseArr.push(validation.verify('cnpj', body.cnpj));
                }

                if (body.cpf && !providerResponse.cpf) {
                    promiseArr.push(validation.verify('cpf', body.cpf));
                }

                if (body.cpf && providerResponse.cpf && body.cpf !== providerResponse.cpf) {
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

                                    if (err) reject(err);

                                    body.password = hash;

                                    var Provider = require('./../../repository/providersRepository');
                                    var providerRepository = new Provider();
                                    providerRepository.setEntity('providers');

                                    providerRepository.update(id, body)
                                        .then(function (provider) {
                                            resolve(provider);
                                        })
                                        .catch(function (err) {
                                            reject(err);
                                        });
                                });
                            });
                        } else {

                            var Provider = require('./../../repository/providersRepository');
                            var providerRepository = new Provider();
                            providerRepository.setEntity('providers');

                            providerRepository.update(id, body)
                                .then(function (provider) {
                                    resolve(provider);
                                })
                                .catch(function (err) {
                                    reject(err);
                                });
                        }
                    })
                    .catch(function (err) {
                        reject({
                            messages: "Duplicated entity",
                            information: err
                        });
                    });
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

/**
 * @desc Método que faz a busca de geo localização na API do google
 * @param address
 * @param _callback
 */
Service.prototype.geoLocation = function (address, _callback) {

    var request = require('request');
    var key = require('./../../../../../config/google');

    //fazendo a chamada do google
    request('https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURI(address) + '&key=' + key.key, function (error, response, body) {

        var res = JSON.parse(body);
        var location = null;
        var loc = [];

        if (res.results[0]) {

            location = res.results[0].geometry.location;
            if (location !== null) {
                loc.push(location.lng);
                loc.push(location.lat);
            }

            _callback(loc);
        } else {
            _callback([]);
        }
    });

};

module.exports = Service;