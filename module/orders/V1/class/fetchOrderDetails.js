/**
 * @desc Classe responsável por fazer a busca de todos os relacionamentos de uma order
 * @constructor
 */
var FetchOrderInArrRelation = function () {

};

/**
 * @desc Método que faz o merge das informações da order
 * @param orders
 * @returns {Promise}
 */
FetchOrderInArrRelation.prototype.fetchOrder = function (orders) {

    var clientsPromise = FetchOrderInArrRelation
        .prototype
        .fetchOrderInArrRelationClient(orders);

    var providersOrCompaniesPromise = FetchOrderInArrRelation
        .prototype
        .fetchOrderInArrRelationProviderServicesProductsServiceCategory(orders);

    var deliveryPromise = FetchOrderInArrRelation
        .prototype
        .getDelivery(orders);

    var promises = [clientsPromise, providersOrCompaniesPromise, deliveryPromise];

    return new Promise(function (resolve, reject) {

        Promise.all(promises)
            .then(function (promisesResponse) {

                var client = promisesResponse[0];
                var relation = promisesResponse[1];
                var delivery = promisesResponse[2];

                //client merge order relation
                if (relation instanceof Array) {

                    for (var i = 0; i < client.length; i++) {
                        for (var o = 0; o < relation.length; o++) {
                            if (relation[o].order.client.toString() === client[i]._id.toString()) {
                                relation[o].client = client[i];
                            }
                        }
                    }

                    for (i = 0; i < delivery.length; i++) {
                        for (o = 0; o < relation.length; o++) {
                            if (relation[o].order._id.toString() === delivery[i].order.toString()) {
                                relation[o].delivery = delivery[i];
                            }
                        }
                    }

                } else {
                    relation.client = client;
                    relation.delivery = delivery;
                }

                resolve(relation);
            })
            .catch(function (promisesError) {
                reject(promisesError);
            });
    });
};

/**
 * @desc Método que busca os dados do cliente
 * @param order
 * @returns {Promise}
 */
FetchOrderInArrRelation.prototype.fetchOrderInArrRelationClient = function (order) {

    return new Promise(function (resolve, reject) {

        //buscando o client
        var Client = require('./../../../people/V1/repository/clientsRepository');
        var clientRepository = new Client();
        clientRepository.setEntity('clients');

        var clientArr = [];
        var query = null;
        var client = null;

        if (order instanceof Array) {

            for (var i = 0; i < order.length; i++) {
                clientArr.push(order[i].client);
            }

            query = clientRepository.query();
            client = query.find()
                .where('_id')
                .in(clientArr);


        } else {

            client = clientRepository.findOneByField({
                _id: order.client
            });

        }

        client
            .then(function (client) {

                //removendo informações que não podem ser enviadas para o client side
                for (var i = 0; i < client.length; i++) {
                    for (var b = 0; b < client[i].creditCard.length; b++) {
                        client[i].password = '';
                        client[i].creditCard[b].CardToken = "";
                        client[i].creditCard[b].SecurityCode = "";
                    }
                }

                resolve(client)
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

/**
 * @desc Método que busca os dados dos fornecedores, produtos, servicos e categorias
 * @param order
 * @returns {Promise}
 */
FetchOrderInArrRelation.prototype.fetchOrderInArrRelationProviderServicesProductsServiceCategory = function (order) {

    return new Promise(function (resolve, reject) {

        var productsArr = [];
        var servicesArr = [];

        if (order instanceof Array) {

            for (var i = 0; i < order.length; i++) {
                for (var b = 0; b < order[i].items.length; b++) {

                    //products
                    if (order[i].type === 'product') {
                        productsArr.push(order[i].items[b]._id);
                    }

                    //services
                    if (order[i].type === 'service') {
                        servicesArr.push(order[i].items[b]._id);
                    }
                }
            }

        } else {

            for (var c = 0; c < order.items.length; c++) {

                //products
                if (order.type === 'product') {
                    productsArr.push(order.items[c]._id);
                }

                //services
                if (order.type === 'service') {
                    servicesArr.push(order.items[c]._id);
                }
            }
        }

        //buscando os serviços
        var Services = require('./../../../service/V1/repository/servicesRepository');
        var serviceRepo = new Services();
        serviceRepo.setEntity('services');

        var servicesQuery = serviceRepo.query();
        servicesQuery
            .where('_id')
            .in(servicesArr)
            .then(function (servicesResponse) {

                //buscando os produtos
                var Products = require('./../../../products/V1/repository/productsRepository');
                var productRepo = new Products();
                productRepo.setEntity('products');

                var productsQuery = productRepo.query();
                productsQuery
                    .where('_id')
                    .in(productsArr)
                    .then(function (productsResponse) {

                        var providersArr = [];
                        var companiesArr = [];
                        var serviceCategoriesArr = [];
                        var productCategoriesArr = [];

                        //buscando os fornecedores
                        for (var a = 0; a < productsResponse.length; a++) {

                            if (productsResponse[a].provider) {
                                providersArr.push(productsResponse[a].provider);
                            }

                            if (productsResponse[a].company) {
                                companiesArr.push(productsResponse[a].company);
                            }

                            productCategoriesArr.push(productsResponse[a].productCategory);
                        }

                        for (var b = 0; b < servicesResponse.length; b++) {

                            if (servicesResponse[b].provider) {
                                providersArr.push(servicesResponse[b].provider);
                            }

                            if (servicesResponse[b].company) {
                                companiesArr.push(servicesResponse[b].company);
                            }

                            serviceCategoriesArr.push(servicesResponse[b].serviceCategory);
                        }

                        var Provider = require('./../../../people/V1/repository/providersRepository');
                        var providerRepo = new Provider();
                        providerRepo.setEntity('providers');

                        var providerQuery = providerRepo.query();
                        providerQuery
                            .where('_id')
                            .in(providersArr)
                            .then(function (providersResponse) {

                                var Company = require('./../../../people/V1/repository/companiesRepository');
                                var companyRepo = new Company();
                                companyRepo.setEntity('companies');

                                var companiesQuery = companyRepo.query();
                                companiesQuery
                                    .where('_id')
                                    .in(companiesArr)
                                    .then(function (companiesResponse) {

                                        //buscando as categorias dos produtos e serviços
                                        var ServiceCategory = require('./../../../service/V1/repository/serviceCategoriesRepository');
                                        var serviceCategoryRepo = new ServiceCategory();
                                        serviceCategoryRepo.setEntity('serviceCategories');

                                        var serviceCategoryQuery = serviceCategoryRepo.query();
                                        serviceCategoryQuery
                                            .where('_id')
                                            .in(serviceCategoriesArr)
                                            .then(function (serviceCategoryResponse) {

                                                var ProductCategory = require('./../../../products/V1/repository/productCategoriesRepository');
                                                var productCategoryRepo = new ProductCategory();
                                                productCategoryRepo.setEntity('productCategories');

                                                var productCategoryQuery = productCategoryRepo.query();
                                                productCategoryQuery
                                                    .where('_id')
                                                    .in(productCategoriesArr)
                                                    .then(function (productCategoryResponse) {

                                                        //formatando a resposta da promise
                                                        var obj = {};
                                                        if (order instanceof Array) {

                                                            var arr = [];

                                                            for (var i = 0; i < order.length; i++) {

                                                                obj = {};
                                                                productsArr = [];
                                                                servicesArr = [];

                                                                productCategoriesArr = [];
                                                                serviceCategoriesArr = [];

                                                                obj.order = order[i];

                                                                for (var d = 0; d < order[i].items.length; d++) {

                                                                    for (var e = 0; e < productsResponse.length; e++) {

                                                                        //verificando os produtos
                                                                        if (order[i].items[d]._id.toString() === productsResponse[e]._id.toString()) {

                                                                            productsArr.push(productsResponse[e]);

                                                                            //verificando as categorias dos produtos
                                                                            for (var x = 0; x < productCategoryResponse.length; x++) {
                                                                                if (productsResponse[e].productCategory.toString() === productCategoryResponse[x]._id.toString()) {
                                                                                    productCategoriesArr.push(productCategoryResponse[x]);
                                                                                }
                                                                            }

                                                                            //verificando o fornecedor
                                                                            if (productsResponse[e].provider) {
                                                                                for (var h = 0; h < providersResponse.length; h++) {
                                                                                    if (productsResponse[e].provider.toString() === providersResponse[h]._id.toString()) {
                                                                                        providersResponse[h].password = "";
                                                                                        obj.provider = providersResponse[h];
                                                                                    }
                                                                                }
                                                                            }

                                                                            if (productsResponse[e].company) {
                                                                                for (var j = 0; j < companiesResponse.length; j++) {
                                                                                    if (productsResponse[e].company.toString() === companiesResponse[j]._id.toString()) {
                                                                                        companiesResponse[j].password = "";
                                                                                        obj.company = companiesResponse[j];
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }

                                                                    for (var f = 0; f < servicesResponse.length; f++) {

                                                                        //verificando os serviços
                                                                        if (order[i].items[d]._id.toString() === servicesResponse[f]._id.toString()) {

                                                                            servicesArr.push(servicesResponse[f]);

                                                                            //verificando as categorias dos serviços
                                                                            for (var w = 0; w < serviceCategoryResponse.length; w++) {
                                                                                if (servicesResponse[f].serviceCategory.toString() === serviceCategoryResponse[w]._id.toString()) {
                                                                                    serviceCategoriesArr.push(serviceCategoryResponse[w]);
                                                                                }
                                                                            }

                                                                            //verificando o fornecedor
                                                                            if (servicesResponse[f].provider) {
                                                                                for (var k = 0; k < providersResponse.length; k++) {
                                                                                    if (servicesResponse[f].provider.toString() === providersResponse[k]._id.toString()) {
                                                                                        providersResponse[k].password = "";
                                                                                        obj.provider = providersResponse[k];
                                                                                    }
                                                                                }
                                                                            }

                                                                            if (servicesResponse[f].company) {
                                                                                for (var l = 0; l < companiesResponse.length; l++) {
                                                                                    if (servicesResponse[f].company.toString() === companiesResponse[l]._id.toString()) {
                                                                                        companiesResponse[l].password = "";
                                                                                        obj.company = companiesResponse[l];
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }

                                                                obj.products = productsArr;
                                                                obj.services = servicesArr;
                                                                obj.serviceCategories = serviceCategoriesArr;
                                                                obj.productCategories = productCategoriesArr;

                                                                arr.push(obj);
                                                            }

                                                            resolve(arr);

                                                        } else {

                                                            obj = {};
                                                            productsArr = [];
                                                            servicesArr = [];

                                                            productCategoriesArr = [];
                                                            serviceCategoriesArr = [];

                                                            obj.order = order;

                                                            for (d = 0; d < order.items.length; d++) {

                                                                for (e = 0; e < productsResponse.length; e++) {

                                                                    //verificando os produtos
                                                                    if (order.items[d]._id.toString() === productsResponse[e]._id.toString()) {
                                                                        productsArr.push(productsResponse[e]);
                                                                    }

                                                                    //verificando as categorias dos produtos
                                                                    for (x = 0; x < productCategoryResponse.length; x++) {
                                                                        if (productsResponse[e].productCategory.toString() === productCategoryResponse[x]._id.toString()) {
                                                                            productCategoriesArr.push(productCategoryResponse[x]);
                                                                        }
                                                                    }

                                                                    //verificando o fornecedor
                                                                    if (productsResponse[e].provider) {
                                                                        for (h = 0; h < providersResponse.length; h++) {
                                                                            if (productsResponse[e].provider.toString() === providersResponse[h]._id.toString()) {
                                                                                providersResponse[h].password = "";
                                                                                obj.provider = providersResponse[h];
                                                                            }
                                                                        }
                                                                    }

                                                                    if (productsResponse[e].company) {
                                                                        for (j = 0; j < companiesResponse.length; j++) {
                                                                            if (productsResponse[e].company.toString() === companiesResponse[j]._id.toString()) {
                                                                                companiesResponse[j].password = "";
                                                                                obj.company = companiesResponse[h];
                                                                            }
                                                                        }
                                                                    }
                                                                }

                                                                for (f = 0; f < servicesResponse.length; f++) {

                                                                    //verificando os serviços
                                                                    if (order.items[d]._id.toString() === servicesResponse[f]._id.toString()) {
                                                                        servicesArr.push(servicesResponse[f]);
                                                                    }

                                                                    //verificando as categorias dos serviços
                                                                    for (w = 0; w < serviceCategoryResponse.length; w++) {
                                                                        if (servicesResponse[e].serviceCategory.toString() === serviceCategoryResponse[w]._id.toString()) {
                                                                            serviceCategoriesArr.push(productCategoryResponse[w]);
                                                                        }
                                                                    }

                                                                    //verificando o fornecedor
                                                                    if (servicesResponse[f].provider) {
                                                                        for (k = 0; k < providersResponse.length; k++) {
                                                                            if (servicesResponse[f].provider.toString() === providersResponse[k]._id.toString()) {
                                                                                providersResponse[k].password = "";
                                                                                obj.provider = providersResponse[k];
                                                                            }
                                                                        }
                                                                    }

                                                                    if (servicesResponse[f].company) {
                                                                        for (l = 0; l < companiesResponse.length; l++) {
                                                                            if (servicesResponse[f].company.toString() === companiesResponse[l]._id.toString()) {
                                                                                companiesResponse[l].password = "";
                                                                                obj.company = companiesResponse[l];
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }

                                                            obj.products = productsArr;
                                                            obj.services = servicesArr;
                                                            obj.serviceCategories = serviceCategoriesArr;
                                                            obj.productCategories = productCategoriesArr;

                                                            resolve(obj);
                                                        }
                                                    })
                                                    .catch(function (err) {
                                                        reject(err);
                                                    });
                                            })
                                            .catch(function (err) {
                                                reject(err);
                                            });
                                    })
                                    .catch(function (err) {
                                        reject(err);
                                    });
                            })
                            .catch(function (err) {
                                reject(err);
                            });
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

FetchOrderInArrRelation.prototype.getDelivery = function (orders) {

    return new Promise(function (resolve, reject) {

        var ordersArr = [];
        for (var i = 0; i < orders.length; i++) {
            ordersArr.push(orders[i]._id);
        }

        var delivery = require('./../../../people/V1/repository/deliveryRepository');
        var deliveryRepository = new delivery();
        var query = deliveryRepository.query();

        query
            .where('order')
            .in(ordersArr)
            .then(function (deliveries) {
                resolve(deliveries);
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

module.exports = FetchOrderInArrRelation;