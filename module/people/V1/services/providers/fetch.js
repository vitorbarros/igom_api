/**
 * @desc Classse responsável por enviar os dados de busca para o client
 * @author Vitor Barros
 * @param req
 * @param res
 * @constructor
 */
var Service = function (req, res) {

    var Provider = require('./../../repository/providersRepository');
    var providerRepository = new Provider();
    providerRepository.setEntity('providers');

    var id = req.params.id;
    var provider = providerRepository.findAll();

    //verificando se existe o parametro id para retornar apenas 1 registro
    if (id) {
        provider = providerRepository.findOneByField({_id: id})
    }

    provider
        .then(function (provider) {

            if (provider instanceof Array) {
                if (provider.length > 0) {
                    for (var i = 0; i < provider.length; i++) {
                        provider[i].password = '';
                    }
                }
            } else {
                provider.password = '';
            }

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

};

module.exports = Service;