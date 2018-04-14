/**
 * @desc Classse responsável por enviar os dados de busca para o provider
 * @author Vitor Barros
 * @param req
 * @param res
 * @constructor
 */
var OrderFetchByProvider = function (req, res) {

    var servicesIdPromise = OrderFetchByProvider.prototype.getProviderServices(req.params.id);
    var productsIdPromise = OrderFetchByProvider.prototype.fetchProviderProducts(req.params.id);

    var promiseArr = [servicesIdPromise, productsIdPromise];

    Promise.all(promiseArr)
        .then(function (ids) {

            OrderFetchByProvider.prototype.getProviderOrders(ids[0].concat(ids[1]))
                .then(function (orders) {

                    var orderArr = [];
                    for (var i = 0; i < orders.length; i++) {
                        if (orders[i].order.type === 'product') {
                            orderArr.push(orders[i].order._id);
                        }
                    }

                    for (var i = 0; i < orders.length; i++) {
                        for (var c = 0; c < orderArr.length; c++) {
                            if (orders[i].order._id.toString() === orderArr[c].toString()) {
                                orders.splice(i, 1);
                            }
                        }
                    }

                    var Delivery = require('./../../../../../people/V1/repository/deliveryRepository');
                    var deliveryRepository = new Delivery();
                    deliveryRepository.setEntity('delivery');

                    var deliveryQuery = deliveryRepository.query();

                    var deliveryPromise = deliveryQuery
                        .where('order')
                        .in(orderArr)
                        .sort({
                            _id: -1
                        });

                    deliveryPromise
                        .then(function (deliveryResponse) {

                            //buscando o relacionamento dos pedidos
                            var DeliveryClass = require('./../../../../../people/V1/class/fetchDeliveryInArrRelation');
                            DeliveryClass.prototype.fetchDelivery(deliveryResponse)
                                .then(function (deliveryRelation) {

                                    var underscore = require('underscore');

                                    var obj = deliveryRelation.concat(orders);
                                    obj = underscore.sortBy(obj, 'createdAt');
                                    obj = obj.reverse();

                                    return res.status(200).json({
                                        success: true,
                                        data: obj
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
        })
        .catch(function (err) {
            return res.status(400).json({
                success: false,
                data: err
            });
        });
};

/**
 * @desc Método que retorna todos os serviços do fornecedor
 * @param _id
 * @returns {Promise}
 */
OrderFetchByProvider.prototype.getProviderServices = function (_id) {

    return new Promise(function (resolve, reject) {

        var Providers = require('./../../../../../people/V1/repository/providersRepository');
        var providerRepository = new Providers();
        providerRepository.setEntity('providers');

        var provider = providerRepository.findOneByField({
            _id: _id
        });

        provider
            .then(function (providerResponse) {

                if (!providerResponse) {
                    reject("Provider not found");
                }

                //buscando todos os serviços do fornecedor

                var Service = require('./../../../../../service/V1/repository/servicesRepository');
                var serviceCompanyRepository = new Service();
                serviceCompanyRepository.setEntity('services');

                var companyService = serviceCompanyRepository.findByField({
                    provider: providerResponse._id
                });

                companyService
                    .then(function (providerServiceResponse) {

                        var servicesId = [];
                        if (providerServiceResponse.length > 0) {
                            for (var i = 0; i < providerServiceResponse.length; i++) {
                                servicesId.push(providerServiceResponse[i]._id);
                            }
                        }

                        resolve(servicesId);
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

/**
 * @desc Método que busca os produtos dos fornecedores
 * @returns {Promise}
 */
OrderFetchByProvider.prototype.fetchProviderProducts = function (_id) {

    return new Promise(function (resolve, reject) {

        var Providers = require('./../../../../../people/V1/repository/providersRepository');
        var providerRepository = new Providers();
        providerRepository.setEntity('providers');

        var provider = providerRepository.findOneByField({
            _id: _id
        });

        provider
            .then(function (providerResponse) {

                if (!providerResponse) {
                    reject("Provider not found");
                }

                //buscando todos os serviços do fornecedor

                var Product = require('./../../../../../products/V1/repository/productsRepository');
                var productCompanyRepository = new Product();
                productCompanyRepository.setEntity('products');

                var providerProduct = productCompanyRepository.findByField({
                    provider: providerResponse._id
                });

                providerProduct
                    .then(function (providerProductResponse) {

                        var productsId = [];
                        if (providerProductResponse.length > 0) {
                            for (var i = 0; i < providerProductResponse.length; i++) {
                                productsId.push(providerProductResponse[i]._id);
                            }
                        }

                        resolve(productsId);
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

/**
 * @método que retorna todos os pedidos de um fornecedor
 * @param servicesArr
 * @returns {Promise}
 */
OrderFetchByProvider.prototype.getProviderOrders = function (servicesArr) {

    return new Promise(function (resolve, reject) {

        if (servicesArr.length > 0) {

            var Orders = require('./../../../repository/ordersRepository');
            var orderRepository = new Orders();
            orderRepository.setEntity('orders');

            var promiseAll = [];
            var query = orderRepository.query();

            for (var i = 0; i < servicesArr.length; i++) {
                var promise = query.find({
                    items: {
                        $elemMatch: {
                            _id: servicesArr[i].toString()
                        }
                    }
                }).exec();

                promiseAll.push(promise);
            }

            Promise.all(promiseAll)
                .then(function (ordersResponse) {

                    //ajustando o array para devolver a resposta
                    var response = [];
                    for (var i = 0; i < ordersResponse.length; i++) {
                        if (ordersResponse[i] instanceof Array && ordersResponse[i].length > 0) {
                            for (var b = 0; b < ordersResponse[i].length; b++) {
                                response.push({
                                    order: ordersResponse[i][b]
                                });
                            }
                        }
                    }
                    resolve(response);
                })
                .catch(function (err) {
                    reject(err);
                });
        } else {
            resolve([]);
        }
    });
};

module.exports = OrderFetchByProvider;