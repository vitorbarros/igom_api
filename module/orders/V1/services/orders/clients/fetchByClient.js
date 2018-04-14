/**
 * @desc Classse responsável por enviar os dados de busca para o client
 * @author Vitor Barros
 * @param req
 * @param res
 * @constructor
 */
var OrderFetchByClient = function (req, res) {

    var Clients = require('./../../../../../people/V1/repository/clientsRepository');
    var clientRepository = new Clients();
    clientRepository.setEntity('clients');

    var id = req.params.id;

    var client = clientRepository.findOneByField({
        _id: id
    });

    client
        .then(function (cli) {

            if (!cli) {
                return res.status(404).json({
                    success: false,
                    data: "Client not found"
                });
            }

            var Orders = require('./../../../repository/ordersRepository');
            var orderRepository = new Orders();
            orderRepository.setEntity('orders');

            var order = orderRepository.findByField({
                client: cli._id
            });

            order
                .then(function (order) {
                    return res.status(200).json({
                        success: true,
                        data: order
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

module.exports = OrderFetchByClient;