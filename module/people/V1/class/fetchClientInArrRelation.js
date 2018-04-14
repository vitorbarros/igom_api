/**
 * @desc Classe que busca todas as relações de um cliente
 * @constructor
 */
var FetchClientInArrRelation = function () {

};

/**
 * @desc Método que faz a junção das informações
 * @param client
 * @returns {*}
 */
FetchClientInArrRelation.prototype.fetchClient = function (client) {

    return new Promise(function (resolve, reject) {

        var petsPromise = FetchClientInArrRelation.prototype.fetchPet(client);

        var promises = [petsPromise];

        Promise.all(promises)
            .then(function (promisesResponse) {
                resolve(promisesResponse[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

/**
 * @desc Método que insere as informações do pet no objeto do client
 * @param client
 * @returns {*}
 */
FetchClientInArrRelation.prototype.fetchPet = function (client) {

    return new Promise(function (resolve, reject) {

        var Pets = require('./../../../pets/V1/repository/petRepository');
        var petsRepository = new Pets();
        var petsPromise = petsRepository.findAll();

        petsPromise
            .then(function (petsResponse) {

                if (client instanceof Array) {

                    for (var i = 0; i < client.length; i++) {

                        if (client[i].pets && client[i].pets.length > 0) {
                            for (var c = 0; c < client[i].pets.length; c++) {
                                for (var b = 0; b < petsResponse.length; b++) {

                                    if (client[i].pets[c] !== null) {
                                        if (client[i].pets[c].toString() === petsResponse[b]._id.toString()) {
                                            client[i].pets[c] = petsResponse[b].type;
                                        }
                                    } else {
                                        client[i].pets[c] = 'pet removido';
                                    }
                                }
                            }
                        } else {
                            client[i].pets = [];
                        }
                    }

                    resolve(client);

                } else {

                    if (client.pets && client.pets.length > 0) {
                        for (var c = 0; c < client.pets.length; c++) {
                            for (var b = 0; b < petsResponse.length; b++) {

                                if (client.pets[c] !== null) {
                                    if (client.pets[c].toString() === petsResponse[b]._id.toString()) {
                                        client.pets[c] = petsResponse[b].type;
                                    }
                                } else {
                                    client.pets[c] = 'pet removido';
                                }
                            }
                        }
                    } else {
                        client.pets = [];
                    }

                    resolve(client)
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

module.exports = FetchClientInArrRelation;