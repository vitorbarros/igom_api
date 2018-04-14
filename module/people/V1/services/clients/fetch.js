/**
 * @desc Classse responsável por enviar os dados de busca para o client
 * @author Vitor Barros
 * @param req
 * @param res
 * @constructor
 */
var Service = function (req, res) {

    var Client = require('./../../repository/clientsRepository');
    var clientRepository = new Client();
    clientRepository.setEntity('clients');

    var id = req.params.id;
    var client = clientRepository.findAll();

    //verificando se existe o parametro id para retornar apenas 1 registro
    if (id) {
        client = clientRepository.findOneByField({_id: id})
    }

    client
        .then(function (client) {

            if (client) {
                //removendo informações que não podem ser disponibilizadas para o client que está consumindo a API
                if (client instanceof Array) {
                    if (client.length > 0) {
                        for (var i = 0; i < client.length; i++) {

                            client[i].password = '';

                            if (client[i].creditCard) {
                                for (var c = 0; c < client[i].creditCard.length; c++) {
                                    client[i].creditCard[c].CardToken = "";
                                    client[i].creditCard[c].SecurityCode = "";
                                }
                            }
                        }
                    }
                } else {
                    for (var b = 0; b < client.creditCard.length; b++) {

                        client.password = '';

                        if (client.creditCard) {
                            client.creditCard[b].CardToken = "";
                            client.creditCard[b].SecurityCode = "";
                        }
                    }
                }
            }

            return res.status(200).json({
                success: true,
                data: client
            });
        })
        .catch(function (err) {
            console.log(err);
            return res.status(400).json({
                success: false,
                data: err
            });
        });
};

module.exports = Service;