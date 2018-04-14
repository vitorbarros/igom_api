/**
 * @desc Classe responsável por evitar registros duplicados na base de dados
 * @constructor
 */
var ClientUniqueFields = function () {

};

/**
 * @desc Verificando os campos para não haver duplicadade na base de dados
 * @returns {*}
 * @param field
 * @param value
 */
ClientUniqueFields.prototype.verify = function (field, value) {

    return new Promise(function (resolve, reject) {

        var queryObj = {};
        queryObj[field] = value;

        var Client = require('./../repository/clientsRepository');
        var clientRepository = new Client();
        clientRepository.setEntity('clients');

        clientRepository.findOneByField(queryObj)
            .then(function (resultClient) {

                if (resultClient) {
                    reject(queryObj);
                } else {
                    resolve(null);
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

module.exports = ClientUniqueFields;