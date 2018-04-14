/**
 * @desc Classe responsável pela criação dos usuários que consumirão a API
 * @author Vitor Barros
 * @param req
 * @param res
 * @constructor
 */
var ServiceStoreOauthUsers = function (req, res) {

    ServiceStoreOauthUsers.prototype.createOauthUser(req.body)
        .then(function (oauthUsers) {
            return res.status(200).json({
                success: true,
                data: oauthUsers
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
ServiceStoreOauthUsers.prototype.createOauthUser = function (body) {

    return new Promise(function (resolve, reject) {

        var OauthUsers = require('./../../repository/oauthUsersRepository');
        var oauthUsersRepository = new OauthUsers();
        oauthUsersRepository.setEntity('oauthUsers');

        oauthUsersRepository.create(body)
            .then(function (oauthUsers) {
                resolve(oauthUsers);
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

module.exports = ServiceStoreOauthUsers;