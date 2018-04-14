/**
 * @desc Rota que faz a deleção do cartão de crédito do usuário
 * @param req
 * @param res
 */
var deleteCreditCard = function (req, res) {

    if (!req.body.number || !req.body.brand) {
        return res.status(422).json({
            success: false,
            data: "'number' and 'brand' are required"
        });
    }

    var id = req.params.id;

    var Client = require('./../../repository/clientsRepository');
    var clientRepo = new Client();
    clientRepo.setEntity('clients');

    var clientPromise = clientRepo.findOneByField({
        _id: id
    });

    clientPromise
        .then(function (client) {

            if (!client) {
                return res.status(400).json({
                    success: false,
                    data: "client not found"
                });
            }

            var savedCreditCards = client.creditCard;

            for (var i = 0; i < savedCreditCards.length; i++) {
                if (req.body.number === savedCreditCards[i].CardNumber &&
                    req.body.brand.toLocaleLowerCase() === savedCreditCards[i].Brand.toLocaleLowerCase()
                ) {
                    savedCreditCards.splice(i, 1);
                }
            }

            var clientUpdate = clientRepo.update(client._id, {
                _id: client._id,
                creditCard: savedCreditCards
            });

            clientUpdate
                .then(function (updateOk) {

                    var clientUpdated = clientRepo.findOneByField({
                        _id: client._id
                    });

                    clientUpdated
                        .then(function (clientResponse) {

                            for (var b = 0; b < clientResponse.creditCard.length; b++) {
                                clientResponse.password = '';
                                clientResponse.creditCard[b].CardToken = "";
                                clientResponse.creditCard[b].SecurityCode = "";
                            }

                            return res.status(200).json({
                                success: true,
                                data: clientResponse
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
        })
        .catch(function (err) {
            return res.status(400).json({
                success: false,
                data: err
            });
        });
};

module.exports = deleteCreditCard;