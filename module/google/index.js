/**
 * @desc Classe resonsável pelas configurações inciais do módulo de integração com o google
 * @author Vitor Barros
 * @constructor
 */
var OnBootstrap = function () {

    //verificando o arquivo de configuração
    if (!require('./../../config/google')) {
        throw "missing google config file in config folder";
    }
};

/**
 * @desc Método que faz o calculo da distância em trajeto entre 2 pontos
 * @param origin
 * @param destination
 * @param orientation
 */
OnBootstrap.prototype.getDirectionDistance = function (origin, destination, orientation) {

    return new Promise(function (resolve, reject) {

        if (origin && destination.length > 0) {

            this.url = "https://maps.googleapis.com/maps/api/distancematrix/json";
            this.config = require('./../../config/google');
            this.requestPromise = require('request-promise');

            if (!origin || !destination) {
                throw "Origin and destination can not be null";
            }

            var destinations = "";
            for (var i = 0; i < destination.length; i++) {
                destinations += destination[i].lat + "," + destination[i].lng + "|";
            }

            this.url += "?origins=" + origin + "&destinations=" + destinations + "&key=" + this.config.key;

            this.requestPromise(this.url)
                .then(function (googleResponse) {

                    //OBS a ordem que o google retorna tecnicamente e a mesma ordem em que a string foi montada

                    //trabalhando o retorno do google

                    var googleResponse = JSON.parse(googleResponse).rows[0].elements;

                    var arrFormatted = [];

                    for (var c = 0; c < googleResponse.length; c++) {
                        arrFormatted.push({
                            distance: googleResponse[c].distance.text,
                            orientation: destination[c].id
                        });
                    }

                    resolve(arrFormatted);
                })
                .catch(function (err) {
                    reject(err);
                });
        } else {
            resolve([]);
        }
    });
};


module.exports = OnBootstrap;