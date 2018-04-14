/**
 * @desc Classse responsável por enviar os dados de busca para o client
 * @author Vitor Barros
 * @param req
 * @param res
 * @constructor
 */
var ServiceFetchOauthUsers = function (req, res) {

    var Users = require('./../../repository/oauthUsersRepository');
    var userRepository = new Users();
    userRepository.setEntity('oauthUsers');

    var id = req.params.id;
    var users = userRepository.findAll();

    //verificando se existe o parametro id para retornar apenas 1 registro
    if (id) {
        users = userRepository.findOneByField({_id: id})
    }

    users
        .then(function (userResponse) {
            return res.status(200).json({
                success: true,
                data: userResponse
            });
        })
        .catch(function (err) {
            return res.status(400).json({
                success: false,
                data: err
            });
        });
};

module.exports = ServiceFetchOauthUsers;