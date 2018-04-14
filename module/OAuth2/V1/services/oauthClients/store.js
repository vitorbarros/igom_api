/**
 * @desc Classe responsável pela criação dos usuários que consumirão a API
 * @author Vitor Barros
 * @param req
 * @param res
 * @constructor
 */
var ServiceStoreOauthClients = function (req, res) {

    ServiceStoreOauthClients.prototype.createOauthClient(req.body)
        .then(function (admin) {
            return res.status(200).json({
                success: true,
                data: admin
            });
        })
        .catch(function (err) {
            return res.status(400).json({
                success: false,
                data: err
            });
        });
};

/**
 * @desc Método responsável por fazr a criação do oauth user
 * @param body
 * @returns {Promise}
 */
ServiceStoreOauthClients.prototype.createOauthClient = function (body) {

    return new Promise(function (resolve, reject) {

        var OauthClients = require('./../../repository/oauthClientsRepository');
        var oauthClientsRepository = new OauthClients();
        oauthClientsRepository.setEntity('oauthClients');

        oauthClientsRepository.create(body)
            .then(function (admin) {
                resolve(admin)
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

module.exports = ServiceStoreOauthClients;