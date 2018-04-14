var SaveCreditCardClient = function (req, res) {

    var Client = require('./../../repository/clientsRepository');
    var clientRepository = new Client();
    clientRepository.setEntity('clients');

    var id = req.params.id;

    var client = clientRepository.findOneByField({
        _id: id
    });

    client
        .then(function (clientResponse) {

            if (!clientResponse) {
                return res.status(404).json({
                    success: false,
                    data: "Client not found"
                });
            }

            SaveCreditCardClient.prototype.cardToken(req.body)
                .then(function (token) {

                    if (token.error) {

                        return res.status(400).json({
                            success: false,
                            data: "Cartão de crédito inválido"
                        });

                    } else {

                        //card truncate
                        var firstPart = req.body.CardNumber.substr(0, 6);
                        var secondPart = req.body.CardNumber.substr(12, 16);
                        var truncate = firstPart + "******" + secondPart;

                        //verificando se o cliente já possuí o cartão informado tokenrizado

                        //verificando se o client já possui algum cartão de crédito tokenrizado na base de dados
                        if (clientResponse.creditCard.length > 0) {

                            if (clientResponse.creditCard && clientResponse.creditCard instanceof Array) {

                                for (var i = 0; i < clientResponse.creditCard.length; i++) {
                                    if (clientResponse.creditCard[i].CardNumber === truncate &&
                                        clientResponse.creditCard[i].Brand.toLowerCase() === req.body.Brand.toLowerCase()
                                    ) {
                                        return res.status(400).json({
                                            success: false,
                                            data: "Credit Card is already saved"
                                        });
                                    }
                                }
                            }
                        }

                        clientResponse.creditCard.push({
                            CardNumber: truncate,
                            Holder: req.body.Holder,
                            ExpirationDate: req.body.ExpirationDate,
                            SaveCard: true,
                            CardToken: token.CardToken,
                            Brand: req.body.Brand.toLowerCase(),
                            SecurityCode: req.body.SecurityCode
                        });

                        var Client = require('./../../repository/clientsRepository');
                        var clientRepository = new Client();
                        clientRepository.setEntity('clients');

                        //atualizando so cartões de crédito do cliente
                        clientRepository.update(clientResponse._id, clientResponse)
                            .then(function (cardUpdate) {
                                return res.status(200).json({
                                    success: true,
                                    data: cardUpdate
                                });
                            })
                            .catch(function (err) {
                                return res.status(400).json({
                                    success: false,
                                    data: err
                                });
                            });
                    }
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

SaveCreditCardClient.prototype.cardToken = function (body) {

    return new Promise(function (resolve, reject) {

        var cielo = require('./../../../../cielo');
        var request = new cielo();

        var config = require('./../../../../../config/cielo');
        var cred = new config();

        request.setCredentials(cred.credentials());

        request.prepare('generateCardToken', body);
        request.request(function (success, err) {

            if (err) {
                reject(err);
            } else {
                resolve(success);
            }
        });
    });
};

module.exports = SaveCreditCardClient;