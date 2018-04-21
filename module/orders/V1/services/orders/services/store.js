/**
 * @desc Classe responsável por salvar os dados na base
 * @author Vitor Barros
 */
var ServiceStoreOrder = function (req, res) {

    /**
     * Inicio das validações
     */

    //verificando se o tipo de pagamento foi informado
    if (!req.body.paymentType) {
        return res.status(422).json({success: false, data: "paymentType is required"});
    }

    //verificando se o tipo informado é válido
    if (req.body.paymentType !== 'creditCard' && req.body.paymentType !== 'debitCard') {
        return res.status(400).json({success: false, data: "Supported payment types 'creditCard', and 'debitCard'"});
    }

    //validando se o tipo de pagamento foi informado
    if (!req.body.savedCardInformation && !req.body.cardInformation) {
        return res.status(422).json({success: false, data: "savedCardInformation or cardInformation are required"});
    }

    //validando xse foi informado o tipo de pagamento (cartão com token salva, ou novo cartão)
    if (req.body.savedCardInformation && req.body.cardInformation) {
        return res.status(400).json({
            success: false,
            data: "savedCardInformation or cardInformation are required, not both"
        });
    }

    //validando as informações obrigatórias quando for informado o cartão de crédito e débito
    if (req.body.cardInformation && !req.body.savedCardInformation) {
        if (!req.body.cardInformation.CardNumber || !req.body.cardInformation.Holder || !req.body.cardInformation.ExpirationDate || !req.body.cardInformation.SecurityCode || !req.body.cardInformation.Brand
        ) {
            return res.status(422).json({
                success: false,
                data: "CardNumber, Holder, ExpirationDate, SecurityCode, and Brand are required"
            });
        }
    }

    //validando quando o pagamento for realizado com a token salva
    if (!req.body.cardInformation && req.body.savedCardInformation) {
        if (!req.body.savedCardInformation.CardNumber || !req.body.savedCardInformation.Brand) {
            return res.status(422).json({
                success: false,
                data: "CardNumber and Brand are required"
            });
        }
    }

    //validando informações sobre o serviço (itens do pedido)
    if (!req.body.items) {
        return res.status(422).json({success: false, data: "items is required"});
    }

    //verificando se o items é uma instancia de array
    if (!req.body.items instanceof Array) {
        return res.status(422).json({success: false, data: "items must be instanceof Array"});
    }

    //verificando se o array de items está vazio
    if (req.body.items.length <= 0) {
        return res.status(422).json({success: false, data: "items is required"});
    }

    //validando o array de items
    for (var z = 0; z < req.body.items.length; z++) {
        if (!req.body.items[z].duration || !req.body.items[z].pet || !req.body.items[z].date || !req.body.items[z]._id) {
            return res.status(422).json({
                success: false,
                data: '{"duration" : "string","pet" : "ObjectId","date" : "Date","_id" : "ObjectId"}'
            });
        }
    }

    if (req.body.address && !req.body.address instanceof Array) {
        return res.status(400).json({
            success: false,
            data: 'address must be array'
        });
    }

    if (req.body.hasLeadsAndBrings && !req.body.address) {
        return res.status(400).json({
            success: false,
            data: 'address is require for leadsAndBrings'
        });
    }

    //verificando o endereço quando for delivery
    for (var t = 0; t < req.body.items.length; t++) {
        if (req.body.items[t].delivery && !req.body.address) {
            return res.status(400).json({
                success: false,
                data: 'address is require for delivery'
            });
        }
    }

    //verificando o endereço
    if (req.body.address) {
        if (!req.body.address[0] || !req.body.address[0].street || !req.body.address[0].number || !req.body.address[0].neighborhood || !req.body.address[0].city || !req.body.address[0].state || !req.body.address[0].zipCode) {
            return res.status(422).json({
                success: false,
                data: "street, number, neighborhood, city, state, zipCode is required"
            });
        }
    }

    //validando o tipo de pedido
    if (req.body.type !== 'service') {
        return res.status(400).json({
            success: false,
            data: 'type must be service'
        });
    }

    //verificando o id do usuário
    if (!req.body.client) {
        return res.status(422).json({success: false, data: "client is required"});
    }

    var timezone = require('moment-timezone');
    var formatted = timezone.tz("America/Sao_Paulo").format();
    var today = new Date(formatted.substr(0, formatted.length - 6));

    req.body.createdAt = new Date(today);

    /**
     * Inicio da validação da confiabilidade dos dados e criação do pedido
     */

    var servicesPromise = ServiceStoreOrder.prototype.storeOrderGetServiceInformation(req.body.items);

    servicesPromise
        .then(function (servicesPromiseResponse) {

            var serviceCategoriesPromise = ServiceStoreOrder.prototype.storeOderGetServiceCategoryInformation(servicesPromiseResponse);
            var clientSchedulePromise = ServiceStoreOrder.prototype.verifyClientSchedule(req.body);
            var providerSchedulePromise = ServiceStoreOrder.prototype.verifyProviderSchedule(req.body);
            var petsPromise = ServiceStoreOrder.prototype.storeOrderGetPetsInformation(req.body.items);
            var clientsPromise = ServiceStoreOrder.prototype.storeOderGetClientInformation(req.body.client);

            var promises = [
                serviceCategoriesPromise,
                clientSchedulePromise,
                providerSchedulePromise,
                petsPromise,
                clientsPromise
            ];

            Promise.all(promises)
                .then(function (firstPromiseBlockResponse) {

                    var totalValuePromise = ServiceStoreOrder.prototype.storeOrderValueCalculation(firstPromiseBlockResponse[3], servicesPromiseResponse, firstPromiseBlockResponse[0], req.body, firstPromiseBlockResponse[4]);

                    totalValuePromise
                        .then(function (totalPrice) {

                            var captureValuePromise = ServiceStoreOrder.prototype.storeOrderCaptureValue(req.body, totalPrice, firstPromiseBlockResponse[4]);

                            captureValuePromise
                                .then(function (successCaptureValue) {

                                    var updateClientCardPromise = ServiceStoreOrder.prototype.storeOderUpdateClientCard(firstPromiseBlockResponse[4], successCaptureValue, req.body);
                                    var storeOrderPromise = ServiceStoreOrder.prototype.storeOrderService(req.body, successCaptureValue, totalPrice, firstPromiseBlockResponse[4]);

                                    var promisesArr = [updateClientCardPromise, storeOrderPromise];

                                    Promise.all(promisesArr)
                                        .then(function (secondPromisesBlockResponse) {

                                            var storeSchedulesPromise = ServiceStoreOrder.prototype.storeOrderSchedule(req.body, secondPromisesBlockResponse[1], servicesPromiseResponse);

                                            storeSchedulesPromise
                                                .then(function (schedulesResponse) {

                                                    var notificationPromise = ServiceStoreOrder.prototype.dispatchServiceNotification(schedulesResponse);
                                                    notificationPromise
                                                        .then(function (responseSchedule) {

                                                            //enviando os dados da contratação para a RdStation
                                                            var objRdStation = {
                                                                identificador: "serviço-contratado",
                                                                email: firstPromiseBlockResponse[4].email,
                                                                celular: firstPromiseBlockResponse[4].tel,
                                                                name: firstPromiseBlockResponse[4].name,
                                                                total_value: totalPrice.totalPrice,
                                                                service_name: firstPromiseBlockResponse[0][0].name,
                                                                pet: firstPromiseBlockResponse[3][0].name
                                                            };

                                                            //verifando os agendamentos
                                                            for (var i = 0; i < secondPromisesBlockResponse[1].items.length; i++) {
                                                                var scheduleNumber = i + 1;
                                                                objRdStation["agendamento_" + scheduleNumber] = secondPromisesBlockResponse[1].items[i].date;
                                                            }

                                                            var RdStarion = require('./../../../../../rdStation/V1/services/store');
                                                            var rdObject = new RdStarion(objRdStation);
                                                            rdObject.dispatch();

                                                            return res.status(200).json({
                                                                success: true,
                                                                data: secondPromisesBlockResponse[1]
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
 * @desc Método que faz a busca das categorias dos serviços na base de dados
 * @param services
 * @returns {Promise}
 */
ServiceStoreOrder.prototype.storeOderGetServiceCategoryInformation = function (services) {

    return new Promise(function (resolve, reject) {

        var ServiceCategory = require('./../../../../../service/V1/repository/serviceCategoriesRepository');
        var serviceCategoryRepository = new ServiceCategory();
        serviceCategoryRepository.setEntity('serviceCategories');

        var serviceCategoriesId = [];
        for (var i = 0; i < services.length; i++) {
            serviceCategoriesId.push(services[i].serviceCategory);
        }

        var query = serviceCategoryRepository.query();

        query
            .where('_id')
            .in(serviceCategoriesId)
            .then(function (serviceCategoryResponse) {
                resolve(serviceCategoryResponse);
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

/**
 * @desc Método que faz a busca dos serviços na base
 * @param items
 * @returns {Promise}
 */
ServiceStoreOrder.prototype.storeOrderGetServiceInformation = function (items) {

    return new Promise(function (resolve, reject) {

        var services = [];
        for (var b = 0; b < items.length; b++) {
            services.push(items[b]._id);
        }

        var Service = require('./../../../../../service/V1/repository/servicesRepository');
        var serviceRepository = new Service();
        serviceRepository.setEntity('services');

        var query = serviceRepository.query();

        query
            .where('_id')
            .in(services)
            .then(function (servicesResponse) {
                if (!serviceRepository || servicesResponse.length <= 0) {
                    reject("Service not found");
                } else {
                    resolve(servicesResponse);
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

/**
 * @desc Método responsável pela verificação da agenda do cliente
 * @param body
 * @returns {Promise}
 */
ServiceStoreOrder.prototype.verifyClientSchedule = function (body) {

    return new Promise(function (resolve, reject) {

        var Schedule = require('./../../../../../people/V1/repository/scheduleRepository');
        var scheduleRepository = new Schedule();
        scheduleRepository.setEntity('schedule');

        var query = scheduleRepository.query();

        var timezone = require('moment-timezone');

        var objSearch = [];

        for (var i = 0; i < body.items.length; i++) {

            var formatted = timezone.tz("America/Sao_Paulo").format(body.items[i].date);
            var date = new Date(formatted.replace(" ", "T"));

            objSearch.push(date);
        }

        query
            .where('schedule')
            .in(objSearch)
            .then(function (response) {

                var resArr = [];
                for (var c = 0; c < response.length; c++) {
                    if (response[c].client.toString() === body.client.toString()) {
                        resArr.push(response[c]);
                    }
                }
                if (resArr.length === 0) {
                    resolve(true);
                }

                if (resArr.length > 0) {
                    reject({message: "Já existe um agendamento na data e horário selecionado."});
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

/**
 * @desc Método que verifica a agenda do fornecedor
 * @param body
 * @returns {Promise}
 */
ServiceStoreOrder.prototype.verifyProviderSchedule = function (body) {

    return new Promise(function (resolve, reject) {

        //TODO VERIFICAR A QUANTIDADE DE PROFISSIONAIS PELA CATEGORIA DO SERVIÇO, E NÃO POR SERVIÇO ADICIONAL

        var timezone = require('moment-timezone');

        //fazendo a query para o serviço selecionado
        var Service = require('./../../../../../service/V1/repository/servicesRepository');
        var serviceRepository = new Service();
        serviceRepository.setEntity('services');

        var serviceArr = [];
        for (var i = 0; i < body.items.length; i++) {
            serviceArr.push(body.items[i]._id);
        }

        var query = serviceRepository.query();
        var services = query.find()
            .where('_id')
            .in(serviceArr);

        services
            .then(function (service) {

                var objSearch = [];
                var quantity = [];

                for (var a = 0; a < service.length; a++) {

                    //verificando a quantidade que o fornecedor atende para o serviço selecionado
                    quantity.push({
                        service: service[a]._id,
                        quantity: service.quantity
                    });

                    for (var b = 0; b < body.items.length; b++) {

                        var formatted = timezone.tz("America/Sao_Paulo").format(body.items[b].date);
                        var date = new Date(formatted.replace(" ", "T"));

                        //montando o ojbeto da query de acordo com o tipo de fornecedor (company, provider)
                        if (service[a].provider) {
                            objSearch.push(date);
                        }

                        if (service[a].company) {
                            objSearch.push(date);
                        }
                    }
                }

                //executando a query
                var Schedule = require('./../../../../../people/V1/repository/scheduleRepository');
                var scheduleRepository = new Schedule();
                scheduleRepository.setEntity('schedule');

                var query = scheduleRepository.query();

                query
                    .where('schedule')
                    .in(objSearch)
                    .then(function (response) {

                        var resArr = [];
                        for (var a = 0; a < service.length; a++) {
                            for (var c = 0; c < response.length; c++) {
                                if (service.company) {
                                    if (response[c].company.toString() === service[a].company.toString() && response[c].service.toString() === service[a]._id.toString()) {

                                        //validando a quantidade de serviços executados ao mesmo tempo pelo fornecedor
                                        for (var e = 0; e < quantity.length; e++) {
                                            if (response[c].service.toString() === quantity[e].service.toString() && response.length >= quantity[e].quantity) {
                                                resArr.push(response[c]);
                                            }
                                        }

                                    }
                                }
                                if (service.provider) {
                                    if (response[c].provider.toString() === service[a].provider.toString() && response[c].service.toString() === service[a]._id.toString()) {

                                        //validando a quantidade de serviços executados ao mesmo tempo pelo fornecedor
                                        for (var f = 0; f < quantity.length; f++) {
                                            if (response[c].service.toString() === quantity[f].service.toString() && response.length >= quantity[f].quantity) {
                                                resArr.push(response[c]);
                                            }
                                        }

                                    }
                                }
                            }
                        }

                        if (resArr.length === 0) {
                            resolve(true);
                        }

                        if (resArr.length > 0) {
                            reject({message: "Já existe agendamentos para esse fornecedor na data e horário selecionado. Selecione outro horário ou outra data."});
                        }
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
 * @desc Método que faz a busca dos pets na base de dados
 * @param items
 * @returns {Promise}
 */
ServiceStoreOrder.prototype.storeOrderGetPetsInformation = function (items) {

    return new Promise(function (resolve, reject) {

        var petArr = [];
        for (var i = 0; i < items.length; i++) {
            petArr.push(items[i].pet);
        }

        var Pets = require('./../../../../../pets/V1/repository/petRepository');
        var petsRepository = new Pets();
        petsRepository.setEntity('pets');

        var query = petsRepository.query();

        query
            .where('_id')
            .in(petArr)
            .then(function (petsResponse) {
                if (!petsResponse && petsResponse.length <= 0) {
                    reject("Pets not found");
                } else {
                    resolve(petsResponse);
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

/**
 * @desc Método que faz o calculo do valor total do pedido
 * @param pets
 * @param services
 * @param serviceCategory
 * @param obj
 * @param client
 * @returns {Promise}
 */
ServiceStoreOrder.prototype.storeOrderValueCalculation = function (pets, services, serviceCategory, obj, client) {

    return new Promise(function (resolve, reject) {

        var filtered = [];
        var totalPrice = 0;

        for (var z = 0; z < pets.length; z++) {
            for (var w = 0; w < services.length; w++) {
                for (var x = 0; x < services[w].values.length; x++) {

                    //verificando a espécie do animal
                    if (pets[z].type === services[w].values[x].type) {

                        //verificando as configurações do serviço
                        for (var m = 0; m < serviceCategory.length; m++) {

                            if (pets[z].type === 'dog') {

                                //serviços que necessitan de pelo e porte
                                if (serviceCategory[m].showDogHair === 1 && serviceCategory[m].showDogWeight === 1) {

                                    //verificando a combinação do pelo e do porte para cobrar o valor correspondente
                                    if (pets[z].hair.toString() === services[w].values[x].hair.toString() &&
                                        pets[z].weight.toString() === services[w].values[x].weight.toString()) {

                                        filtered.push({
                                            pet: pets[z]._id,
                                            value: services[w].values[x].value,
                                            valueDelivery: services[w].values[x].valueDelivery
                                        });

                                    }

                                }

                                //serviços que necessitan apenas do pelo
                                if (serviceCategory[m].showDogHair === 1 && serviceCategory[m].showDogWeight === 0) {

                                    //verificando a combinação do pelo para cobrar o valor correspondente
                                    if (pets[z].hair.toString() === services[w].values[x].hair.toString()) {

                                        filtered.push({
                                            pet: pets[z]._id,
                                            value: services[w].values[x].value,
                                            valueDelivery: services[w].values[x].valueDelivery
                                        });

                                    }

                                }

                                //serviços que necessitan apenas do peso
                                if (serviceCategory[m].showDogHair === 0 && serviceCategory[m].showDogWeight === 1) {

                                    //verificando a combinação do porte para cobrar o valor correspondente
                                    if (pets[z].weight.toString() === services[w].values[x].weight.toString()) {

                                        filtered.push({
                                            pet: pets[z]._id,
                                            value: services[w].values[x].value,
                                            valueDelivery: services[w].values[x].valueDelivery
                                        });

                                    }

                                }

                                //serviços que não dependem de peso e pelo
                                if (serviceCategory[m].showDogHair === 0 && serviceCategory[m].showDogWeight === 0) {

                                    filtered.push({
                                        pet: pets[z]._id,
                                        value: services[w].values[x].value,
                                        valueDelivery: services[w].values[x].valueDelivery
                                    });

                                }

                            }

                            if (pets[z].type === 'cat') {

                                //serviços que necessitan de pelo e porte
                                if (serviceCategory[m].showCatHair === 1 && serviceCategory[m].showCatWeight === 1) {

                                    //TODO ATENÇÃO, PARA O GATO É SOMENTE USADO O PELO PARA CALCULO DO VALOR

                                    //verificando a combinação do pelo e do porte para cobrar o valor correspondente
                                    if (pets[z].hair.toString() === services[w].values[x].hair.toString()) {

                                        filtered.push({
                                            pet: pets[z]._id,
                                            value: services[w].values[x].value,
                                            valueDelivery: services[w].values[x].valueDelivery
                                        });

                                    }

                                }

                                //serviços que necessitan apenas do pelo
                                if (serviceCategory[m].showCatHair === 1 && serviceCategory[m].showCatWeight === 0) {

                                    //verificando a combinação do pelo para cobrar o valor correspondente
                                    if (pets[z].hair.toString() === services[w].values[x].hair.toString()) {

                                        filtered.push({
                                            pet: pets[z]._id,
                                            value: services[w].values[x].value,
                                            valueDelivery: services[w].values[x].valueDelivery
                                        });

                                    }

                                }

                                //serviços que necessitan apenas do peso
                                if (serviceCategory[m].showCatHair === 0 && serviceCategory[m].showCatWeight === 1) {

                                    //verificando a combinação do porte para cobrar o valor correspondente
                                    if (pets[z].weight.toString() === services[w].values[x].weight.toString()) {

                                        filtered.push({
                                            pet: pets[z]._id,
                                            value: services[w].values[x].value,
                                            valueDelivery: services[w].values[x].valueDelivery
                                        });

                                    }

                                }

                                //serviços que não dependem de peso e pelo
                                if (serviceCategory[m].showCatHair === 0 && serviceCategory[m].showCatWeight === 0) {

                                    filtered.push({
                                        pet: pets[z]._id,
                                        value: services[w].values[x].value,
                                        valueDelivery: services[w].values[x].valueDelivery
                                    });

                                }
                            }
                        }
                    }
                }
                //verificando se tem leva e traz e fazendo a cobrança
                if (obj.hasLeadsAndBrings && services[w].hasLeadsAndBrings) {

                    //multiplicando pelo o numero de serviços contratados com o leva e traz
                    totalPrice += parseInt(services[w].leadsAndBringsPrice) * obj.items.length;

                    //multiplicando pelo o numero de serviços contratados com o leva e traz
                    //salvando o valor do leva e traz no objeto order
                    obj.leadsAndBringsPrice = services[w].leadsAndBringsPrice * obj.items.length;
                }
            }
        }

        //somando os valores dos itens para o valor total da cobranca
        for (var v = 0; v < obj.items.length; v++) {
            for (var a = 0; a < filtered.length; a++) {

                if (obj.items[v].pet.toString() === filtered[a].pet.toString()) {

                    //verificando se o valor é delivery ou normal
                    if (obj.items[v].delivery) {

                        obj.items[v].value = parseInt(filtered[a].valueDelivery);
                        totalPrice += parseInt(filtered[a].valueDelivery);

                    } else {

                        obj.items[v].value = parseInt(filtered[a].value);
                        totalPrice += parseInt(filtered[a].value);

                    }
                }
            }
        }

        //quando for cupom e não for creditos
        if (obj.discountCoupon && !obj.dotCredit) {
            ServiceStoreOrder.prototype.storeOrderDiscountCoupon(obj)
                .then(function (discount) {

                    var objReturn = {};

                    //preço original, quando for disconto pela dotpet
                    objReturn.providerPrice = totalPrice;

                    //debitando o valor do desconto
                    if (discount.price) {
                        totalPrice -= discount.price;
                    }

                    //debitando o valor do desconto com base na procentagem
                    if (discount.percent) {
                        var centPart = totalPrice / 100;
                        var price = centPart * discount.percent;
                        totalPrice = totalPrice - price;
                    }

                    objReturn.totalPrice = totalPrice;

                    //preço com disconto, quando for disconto pelo fornecedor
                    if (discount.whoPays !== "dotpet") {
                        objReturn.providerPrice = totalPrice;
                    }

                    resolve(objReturn);
                })
                .catch(function (err) {
                    reject(err);
                });

            // quando for creditos e nao for cupom
        } else if (!obj.discountCoupon && obj.dotCredit) {

            ServiceStoreOrder.prototype.dotCredits(client, totalPrice)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                });

        } else {
            if (!totalPrice) {
                reject("Failed to calculate order value");
            } else {
                resolve({
                    providerPrice: totalPrice,
                    totalPrice: totalPrice
                });
            }
        }
    });
};

ServiceStoreOrder.prototype.dotCredits = function (client, totalPrice) {

    return new Promise(function (resolve, reject) {

        if (client.dotCredit && parseInt(client.dotCredit) > 0) {

            if (parseInt(client.dotCredit) > totalPrice) {
                client.dotCredit -= totalPrice;
                totalPrice = 0;
            } else {
                client.dotCredit = 0;
                totalPrice -= client.dotCredit;
            }

            //fazendo update nos dados do cliente
            var Client = require('./../../../../../people/V1/repository/clientsRepository');
            var clientRepository = new Client();
            clientRepository.setEntity('clients');

            var clientPromise = clientRepository.update(client._id, {
                _id: client._id,
                dotCredit: client.dotCredit
            }).exec();

            clientPromise
                .then(function (success) {
                    resolve({
                        providerPrice: totalPrice,
                        totalPrice: totalPrice
                    });
                })
                .catch(function (err) {
                    reject(err);
                });
        } else {
            resolve({
                providerPrice: totalPrice,
                totalPrice: totalPrice
            });
        }
    });
};

/**
 * @desc Método que verifica o cupom de desconto
 * @param body
 */
ServiceStoreOrder.prototype.storeOrderDiscountCoupon = function (body) {

    return new Promise(function (resolve, reject) {

        var discountCoupon = require('./../../../repository/discountCouponsRepository');
        var discountCouponRepository = new discountCoupon();
        discountCouponRepository.setEntity('discountCoupons');

        discountCouponRepository
            .findOneByField({
                _id: body.discountCoupon,
                status: 1
            })
            .then(function (coupon) {

                if (!coupon) {
                    reject("Ops! Esse cupom não é válido");
                }

                //veirificando se esse cupom tem validação por tipo
                if (coupon.type) {
                    if (coupon.type !== 'service') {
                        reject("Ops! Esse cupom não é válido para a contratação de serviços");
                    }
                }

                var order = require('./../../../repository/ordersRepository');
                var orderRepository = new order();
                orderRepository.setEntity('orders');

                var orderQuery = orderRepository.query();

                orderQuery
                    .find({
                        discountCoupon: coupon._id
                    })
                    .then(function (orders) {

                        //verificando se o cliente já usou esse cupom,
                        var used = false;

                        if (orders.length > 0) {
                            for (var i = 0; i < orders.length; i++) {
                                if (orders[i].client.toString() === body.client.toString()) {
                                    used = true;
                                }
                            }
                        }

                        if (used) {
                            reject("Que pena, infelizmente esse cupom só pode ser usado uma vez =/");
                        }

                        if (parseInt(orders.length) >= parseInt(coupon.quantity)) {
                            reject("Que pena, infelizmente esse cupom está esgotado =/");
                        } else {
                            resolve(coupon);
                        }

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
 * @desc Método que busca as informações do client na base
 * @param id
 * @returns {Promise}
 */
ServiceStoreOrder.prototype.storeOderGetClientInformation = function (id) {

    return new Promise(function (resolve, reject) {

        var Clients = require('./../../../../../people/V1/repository/clientsRepository');
        var clientRepository = new Clients();
        clientRepository.setEntity('clients');

        var client = clientRepository.findOneByField({
            _id: id
        });

        client
            .then(function (clientResponse) {
                if (!clientResponse) {
                    reject("Client not fount");
                } else {
                    resolve(clientResponse);
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

/**
 * @desc Método que faz a contagem do número do pedido
 * @returns {Promise}
 */
ServiceStoreOrder.prototype.storeOrderGetOrderNumber = function () {

    return new Promise(function (resolve, reject) {

        var Orders = require('./../../../repository/ordersRepository');
        var orderRepository = new Orders();
        orderRepository.setEntity('orders');

        var query = orderRepository.query();

        query
            .count()
            .then(function (res) {
                resolve((res + 1));
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

/**
 * @desc Método que faz a captura do valor
 * @param postData
 * @param totalValue
 * @param client
 */
ServiceStoreOrder.prototype.storeOrderCaptureValue = function (postData, totalValue, client) {

    return new Promise(function (resolve, reject) {

        if (parseInt(totalValue.totalPrice) <= 0) {

            var objReturn = {};
            objReturn.Payment = {};

            objReturn.Payment.Tid = "dotpet";
            objReturn.Payment.PaymentId = "dotpet";

            resolve(objReturn);

        } else {

            var cielo = require('nodejs-cielo');
            var request = new cielo();

            var config = require('./../../../../../../config/cielo');
            var cred = new config();

            request.setCredentials(cred.credentials());

            //captura do valor com o card token apenas cartão de crédito
            if (postData.savedCardInformation && postData.paymentType === 'creditCard') {

                //verificando os dados do cartão do cliente

                var creditCard = {};

                for (var i = 0; i < client.creditCard.length; i++) {
                    if (postData.savedCardInformation.CardNumber.toString() === client.creditCard[i].CardNumber.toString() &&
                        postData.savedCardInformation.Brand.toString() === client.creditCard[i].Brand.toString()) {

                        creditCard.CardToken = client.creditCard[i].CardToken;
                        creditCard.SecurityCode = client.creditCard[i].SecurityCode;
                        creditCard.Brand = client.creditCard[i].Brand;
                    }
                }

                if (!creditCard.CardToken || !creditCard.SecurityCode && !creditCard.Brand) {
                    reject({message: "Cartão de crédito não encontrado. Verifique as informações e tente novamente"});
                }

                postData.paymentType = "CreditCard";

                //capturando o número do pedido
                ServiceStoreOrder.prototype.storeOrderGetOrderNumber()
                    .then(function (orderNumber) {
                        var paymentObject = {
                            MerchantOrderId: orderNumber,
                            Customer: {
                                Name: client.name
                            },
                            Payment: {
                                Type: "CreditCard",
                                Amount: totalValue.totalPrice,
                                Installments: 1,
                                SoftDescriptor: "Dot Pet",
                                Capture: true,
                                CreditCard: creditCard
                            }
                        };

                        request.prepare('creditCardSimplePaymentWithCardToken', paymentObject);
                        request.request(function (success, err) {

                            if (err) {
                                reject(err);
                            } else {
                                resolve(success);
                            }
                        });
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

            //captura o valor com cartão de crédito novo
            if (!postData.savedCardInformation && postData.paymentType === 'creditCard') {

                postData.paymentType = "CreditCard";

                //capturando o número do pedido
                ServiceStoreOrder.prototype.storeOrderGetOrderNumber()
                    .then(function (orderNumber) {
                        var paymentObject = {
                            MerchantOrderId: orderNumber,
                            Customer: {
                                Name: client.name
                            },
                            Payment: {
                                Type: "CreditCard",
                                Amount: totalValue.totalPrice,
                                Installments: 1,
                                SoftDescriptor: "Dot Pet",
                                Capture: true,
                                CreditCard: {
                                    CardNumber: postData.cardInformation.CardNumber,
                                    Holder: postData.cardInformation.Holder,
                                    ExpirationDate: postData.cardInformation.ExpirationDate,
                                    SecurityCode: postData.cardInformation.SecurityCode,
                                    Brand: postData.cardInformation.Brand,
                                    SaveCard: postData.cardInformation.SaveCard
                                }
                            }
                        };

                        request.prepare('creditCardSimplePayment', paymentObject);
                        request.request(function (success, err) {

                            if (err) {
                                reject(err);
                            } else {
                                resolve(success);
                            }
                        });
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }

            if (postData.paymentType === 'debitCard') {

                postData.paymentType = "DebitCard";

                ServiceStoreOrder.prototype.storeOrderGetOrderNumber()
                    .then(function (orderNumber) {
                        var paymentObject = {
                            MerchantOrderId: orderNumber,
                            Customer: {
                                Name: client.name
                            },
                            Payment: {
                                Type: "DebitCard",
                                Amount: totalValue.totalPrice,
                                Installments: 1,
                                SoftDescriptor: "Dot Pet",
                                ReturnUrl: "dotpet.com.br",
                                Capture: true,
                                DebitCard: {
                                    CardNumber: postData.cardInformation.CardNumber,
                                    Holder: postData.cardInformation.Holder,
                                    ExpirationDate: postData.cardInformation.ExpirationDate,
                                    SecurityCode: postData.cardInformation.SecurityCode,
                                    Brand: postData.cardInformation.Brand,
                                    SaveCard: false
                                }
                            }
                        };

                        request.prepare('debitCardSimplePayment', paymentObject);
                        request.request(function (success, err) {

                            if (err) {
                                reject(err);
                            } else {
                                resolve(success);
                            }
                        });
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
        }
    });
};

/**
 * @desc Método que atualiza as informações de pagamento do cliente
 * @param _client
 * @param _successTransaction
 * @param _postData
 * @returns {Promise}
 */
ServiceStoreOrder.prototype.storeOderUpdateClientCard = function (_client, _successTransaction, _postData) {

    return new Promise(function (resolve, reject) {

        if (_postData.cardInformation && _postData.cardInformation.SaveCard) {

            var Client = require('./../../../../../people/V1/repository/clientsRepository');
            var clientRepository = new Client();
            clientRepository.setEntity('clients');

            var creditCard = _successTransaction.Payment.CreditCard;
            creditCard.SecurityCode = _postData.cardInformation.SecurityCode;
            creditCard.Brand = _postData.cardInformation.Brand.toLocaleLowerCase();

            if (_client.creditCard instanceof Array) {
                _client.creditCard.push(creditCard);
            } else {
                _client.creditCard = creditCard;
            }

            var update = clientRepository.update(_client._id, {
                _id: _client._id,
                creditCard: _client.creditCard
            });

            update
                .exec()
                .then(function (success) {
                    resolve(success)
                })
                .catch(function (err) {
                    reject(err);
                });

        } else {
            resolve([]);
        }
    });
};

/**
 * @desc Método que salva o pedido na base de dados
 * @param postData
 * @param _successTransaction
 * @param totalValue
 * @param client
 * @returns {Promise}
 */
ServiceStoreOrder.prototype.storeOrderService = function (postData, _successTransaction, totalValue, client) {

    return new Promise(function (resolve, reject) {

        var orderNumber = ServiceStoreOrder.prototype.storeOrderGetOrderNumber();

        orderNumber
            .then(function (number) {

                var Orders = require('./../../../repository/ordersRepository');
                var orderRepository = new Orders();
                orderRepository.setEntity('orders');

                postData.tid = _successTransaction.Payment.Tid;
                postData.paymentId = _successTransaction.Payment.PaymentId;
                postData.number = number;
                postData.totalPrice = totalValue.totalPrice;
                postData.providerPrice = totalValue.providerPrice;

                postData.usedCard = {};

                if (postData.savedCardInformation) {
                    postData.usedCard.number = postData.savedCardInformation.CardNumber;
                    postData.usedCard.brand = postData.savedCardInformation.Brand.toLocaleLowerCase();
                    postData.usedCard.type = 'creditCard';
                } else {
                    //verificando se o cartão é de débito ou crédito
                    if (_successTransaction.Payment.CreditCard) {
                        postData.usedCard.number = _successTransaction.Payment.CreditCard.CardNumber;
                        postData.usedCard.brand = _successTransaction.Payment.CreditCard.Brand.toLocaleLowerCase();
                        postData.usedCard.type = 'creditCard';
                    }
                }

                //verificando se o cartão é de débito
                if (_successTransaction.Payment.DebitCard) {
                    postData.usedCard.number = _successTransaction.Payment.DebitCard.CardNumber;
                    postData.usedCard.brand = _successTransaction.Payment.DebitCard.Brand.toLocaleLowerCase();
                    postData.usedCard.type = 'debitCard';
                }

                if (client.campaign) {
                    postData.campaign = client.campaign;
                }

                var store = orderRepository.create(postData);

                store
                    .then(function (orderStored) {
                        resolve(orderStored);
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
 * @desc Método que cria o registro na agenda do cliente e do fornecedor
 * @param body
 * @param order
 * @param service
 * @returns {Promise}
 */
ServiceStoreOrder.prototype.storeOrderSchedule = function (body, order, service) {

    return new Promise(function (resolve, reject) {

        var timezone = require('moment-timezone');
        var formatted = timezone.tz("America/Sao_Paulo").format();
        var today = new Date(formatted.substr(0, formatted.length - 6));
        var date = new Date(today);

        //montando o intervalo de datas
        var schedule = null;
        var preparedObjectArray = [];

        for (var a = 0; a < service.length; a++) {
            for (var b = 0; b < body.items.length; b++) {

                var prepareObject = {};

                formatted = timezone.tz("America/Sao_Paulo").format(body.items[b].date);
                schedule = new Date(formatted.replace(" ", "T"));

                //verificando o tipo de fornecedor
                if (service[a].provider) {
                    prepareObject.provider = service[a].provider;
                }
                if (service[a].company) {
                    prepareObject.company = service[a].company;
                }

                //populando o objeto
                prepareObject.client = body.client;
                prepareObject.order = order._id;
                prepareObject.service = service[a]._id;
                prepareObject.pet = body.items[b].pet;
                prepareObject.schedule = schedule;
                prepareObject.createdAt = date;
                prepareObject.updatedAt = date;
                prepareObject.status = 1;

                if (body.hasLeadsAndBrings) {
                    prepareObject.price = parseInt(body.leadsAndBringsPrice) + parseInt(body.items[b].value);
                } else {
                    prepareObject.price = parseInt(body.items[b].value);
                }

                //verificando se o agendamento é delivery
                if (body.items[b].delivery) {
                    prepareObject.delivery = 1;
                }

                var finishingCode = '';
                var possibleFinishingCode = '0123456789';

                for (var c = 0; c < 4; c++) {
                    finishingCode += possibleFinishingCode.charAt(Math.floor(Math.random() * possibleFinishingCode.length));
                }

                prepareObject.code = finishingCode;

                preparedObjectArray.push(prepareObject);
            }
        }

        var Schedule = require('./../../../../../people/V1/repository/scheduleRepository');
        var scheduleRepository = new Schedule();
        scheduleRepository.setEntity('schedule');

        var query = scheduleRepository.query();
        var store = query.insertMany(preparedObjectArray);

        store
            .then(function (response) {
                resolve(response)
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

/**
 * @desc Método que faz o disparo da notificação
 * @param schedule
 * @returns {Promise}
 */
ServiceStoreOrder.prototype.dispatchServiceNotification = function (schedule) {

    return new Promise(function (resolve, reject) {

        var timezone = require('moment-timezone');
        var formatted = timezone.tz("America/Sao_Paulo").format();
        var today = new Date(formatted.substr(0, formatted.length - 6));
        var date = new Date(today);

        //disparando a notificação e SMS de sucesso da compra
        var UrbanAirshipPush = require('urban-airship-push');
        var config = require('./../../../../../../config/urbanairship');
        var urbanAirshipPush = new UrbanAirshipPush(config);

        var FetchSchedule = require('./../../../../../people/V1/class/fetchScheduleInArrRelation');
        FetchSchedule.prototype.fetchSchedule(schedule)
            .then(function (scheduleRelation) {

                var scheduleObj = null;
                if (scheduleRelation instanceof Array) {
                    scheduleObj = scheduleRelation[0];
                } else {
                    scheduleObj = scheduleRelation;
                }

                if (scheduleObj.schedule && scheduleObj.client.notificationOrder) {

                    var message = ServiceStoreOrder.prototype.formatServiceNotifyAndSMSMessage(scheduleObj, 'push');

                    urbanAirshipPush.push.send({
                        device_types: [
                            "ios",
                            "android"
                        ],
                        audience: {
                            named_user: scheduleObj.client._id
                        },
                        notification: {
                            alert: message.clientMessage,
                            actions: {
                                open: {
                                    type: 'deep_link',
                                    content: JSON.stringify(scheduleObj.order)
                                }
                            }
                        }
                    }, function (err, data) {

                        if (err) {
                            reject(err);
                        }

                        //enviando o SMS
                        var cleanMessage = ServiceStoreOrder.prototype.formatServiceNotifyAndSMSMessage(scheduleObj, 'sms');

                        ServiceStoreOrder.prototype.dispatchServiceSMS(scheduleObj.client.tel, cleanMessage.clientMessage, function (successSMS, errorSMS) {

                            if (errorSMS) {
                                reject(err);
                            }

                            var notificationObj = {};

                            //salvando a notificação
                            var notification = require('./../../../../../notifications/V1/repository/notificationsRepository');
                            var notRepository = new notification();
                            notRepository.setEntity('notifications');

                            if (err) {
                                notificationObj.response = err;
                                notificationObj.status = 0;
                            } else {
                                notificationObj.response = data;
                                notificationObj.status = 1;
                            }

                            notificationObj.sentAt = date;
                            notificationObj.order = scheduleObj.order._id;
                            notificationObj.type = 'storeService';
                            notificationObj.schedule = scheduleObj.schedule._id;
                            notificationObj.clientMessage = message.clientMessage;
                            notificationObj.providerOrCompanyMessage = message.providerMessage;

                            notificationObj.client = scheduleObj.client._id;
                            notificationObj.clientPhoto = scheduleObj.client.photo;

                            if (scheduleObj.company) {
                                notificationObj.company = scheduleObj.company._id;
                                notificationObj.companyPhoto = scheduleObj.company.profile;
                            }

                            if (scheduleObj.provider) {
                                notificationObj.provider = scheduleObj.provider._id;
                                notificationObj.providerPhoto = scheduleObj.provider.profile;
                            }

                            var notStore = notRepository.create(notificationObj);

                            notStore
                                .then(function (notificationStore) {
                                    resolve(notificationStore);
                                })
                                .catch(function (err) {
                                    reject(err);
                                });
                        });
                    });
                } else {
                    resolve([]);
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

/**
 * @desc Método que faz o disparo do SMS
 * @param tel
 * @param message
 * @param __callback
 */
ServiceStoreOrder.prototype.dispatchServiceSMS = function (tel, message, __callback) {

    var SMS = require('./../../../../../sms/V1/services/dispatch/dispatchInternal');
    var send = new SMS();

    send.prepare(tel, message);
    send.dispatch(function (success, error) {

        if (error) {
            __callback(null, error);
        } else {
            __callback(success, null);
        }
    });
};

/**
 * @desc Método que retorna a mensagem formatada
 * @param data
 * @param type
 * @returns {*}
 */
ServiceStoreOrder.prototype.formatServiceNotifyAndSMSMessage = function (data, type) {

    var response = data;

    if (response.schedule) {

        var messageClient = "Seu agendamento foi realizado com sucesso! O número do seu pedido é " + response.order.number + ". Apresente esse código para o estabelecimento após a finalização do serviço. " + response.schedule.code;

        var providerName = null;

        if (response.provider) {
            providerName = response.provider.name;
        }

        if (response.company) {
            providerName = response.company.name;
        }

        var providerMessage = "Olá " + providerName + " você acabou de receber um novo agendamento de. Para mais detalhes verifique a sua agenda.";

        if (type === 'push') {
            return {
                clientMessage: messageClient,
                providerMessage: providerMessage
            };
        } else {

            var cleanMessage = messageClient;
            var providerCleanMessage = providerMessage;

            cleanMessage = cleanMessage.replace(/[ÀÁÂÃÄÅ]/g, "A");
            cleanMessage = cleanMessage.replace(/[àáâãäå]/g, "a");
            cleanMessage = cleanMessage.replace(/[ÈÉÊË]/g, "E");
            cleanMessage = cleanMessage.replace(/[èéê]/g, "e");
            cleanMessage = cleanMessage.replace(/[íìî]/g, "i");
            cleanMessage = cleanMessage.replace(/[ÍÌÎ]/g, "I");
            cleanMessage = cleanMessage.replace(/[óôõ]/g, "o");
            cleanMessage = cleanMessage.replace(/[ÔÓÒÕ]/g, "O");
            cleanMessage = cleanMessage.replace(/[ÛÚÙÛ]/g, "U");
            cleanMessage = cleanMessage.replace(/[ûúù]/g, "u");
            cleanMessage = cleanMessage.replace(/[ç]/g, "c");
            cleanMessage = cleanMessage.replace(/[Ç]/g, "C");

            providerCleanMessage = providerCleanMessage.replace(/[ÀÁÂÃÄÅ]/g, "A");
            providerCleanMessage = providerCleanMessage.replace(/[àáâãäå]/g, "a");
            providerCleanMessage = providerCleanMessage.replace(/[ÈÉÊË]/g, "E");
            providerCleanMessage = providerCleanMessage.replace(/[èéê]/g, "e");
            providerCleanMessage = providerCleanMessage.replace(/[íìî]/g, "i");
            providerCleanMessage = providerCleanMessage.replace(/[ÍÌÎ]/g, "I");
            providerCleanMessage = providerCleanMessage.replace(/[óôõ]/g, "o");
            providerCleanMessage = providerCleanMessage.replace(/[ÔÓÒÕ]/g, "O");
            providerCleanMessage = providerCleanMessage.replace(/[ÛÚÙÛ]/g, "U");
            providerCleanMessage = providerCleanMessage.replace(/[ûúù]/g, "u");
            providerCleanMessage = providerCleanMessage.replace(/[ç]/g, "c");
            providerCleanMessage = providerCleanMessage.replace(/[Ç]/g, "C");

            return {
                clientMessage: cleanMessage,
                providerMessage: providerCleanMessage
            };
        }

    } else {
        return "";
    }
};

module.exports = ServiceStoreOrder;