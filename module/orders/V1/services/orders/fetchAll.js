/**
 * @desc Calsse que retorna todos os serviços e detalhes do mesmo
 * @param req
 * @param res
 * @constructor
 */
var OrderFetchAll = function (req, res) {

    //verificando se os parametros foram informados
    if (!req.query.page || !req.query.total) {
        return res.status(400).json({
            success: false,
            data: "page and total is required in query string"
        });
    }

    //verificando se o tipo dos parametros está correto
    var page = parseInt(req.query.page);
    var perPage = parseInt(req.query.total);

    if (isNaN(page) || isNaN(perPage)) {
        return res.status(400).json({
            success: false,
            data: "page and total must be integer"
        });
    }

    OrderFetchAll.prototype.getOrderTotal()
        .then(function (total) {

            OrderFetchAll.prototype.pagination(total, perPage, page)
                .then(function (result) {
                    return res.status(200).json({
                        success: true,
                        data: result
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

/**
 * @desc Método que faz a contagem do número de pedidos realizados
 * @returns {Promise}
 */
OrderFetchAll.prototype.getOrderTotal = function () {

    return new Promise(function (resolve, reject) {

        var Order = require('./../../repository/ordersRepository');
        var orderRepo = new Order();
        orderRepo.setEntity('orders');

        var orderQuery = orderRepo.query();
        orderQuery
            .find({})
            .count()
            .then(function (count) {
                resolve(count);
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

/**
 * @desc Método que faz a paginacao
 * @param total
 * @param perPage
 * @param offset
 * @returns {Promise}
 */
OrderFetchAll.prototype.pagination = function (total, perPage, offset) {

    return new Promise(function (resolve, reject) {

        var skip = 0;
        var limit = perPage;

        //tratando os números para a paginação correta
        if (offset > 1) {
            offset--;
            skip = offset * perPage;
        }

        var obj = {};

        var Order = require('./../../repository/ordersRepository');
        var orderRepo = new Order();
        orderRepo.setEntity('orders');

        var orderQuery = orderRepo.query();
        orderQuery
            .find()
            .skip(skip)
            .limit(limit)
            .sort({
                number: -1
            })
            .then(function (result) {

                var OrderRelation = require('./../../class/fetchOrderDetails');
                OrderRelation.prototype.fetchOrder(result)
                    .then(function (orderRelation) {

                        obj.currentPage = offset;
                        obj.nextPage = offset + 1;
                        obj.previosPage = offset - 1;
                        obj.perPage = perPage;
                        obj.result = orderRelation;
                        obj.total = total;

                        resolve(obj);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

module.exports = OrderFetchAll;