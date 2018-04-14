/**
 * @desc Classe responsável pelo CRUD da Order
 * @author Vitor Barros
 * @constructor
 */
var Repository = require('./repository');

var OrdersRepository = function () {
};

OrdersRepository.prototype = new Repository();
OrdersRepository.prototype.setEntity('orders');

module.exports = OrdersRepository;