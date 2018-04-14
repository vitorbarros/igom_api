/**
 * @desc Classe que retorna os fornecedores para o client de acordo com  a geo location
 * @param req
 * @param res
 * @constructor
 */
var Service = function (req, res) {

    if (!req.query.lat || !req.query.lng || !req.query.distance) {

        return res.status(400).json({
            success: false,
            data: "'distance', 'lat', and 'lng' are required in query string"
        });

    }

    //chamando o repository do provider
    var providersRepository = require('./../../../../people/V1/repository/providersRepository');
    var provider = new providersRepository();
    provider.setEntity('providers');

    var lat = req.query.lat;
    var lng = req.query.lng;
    var distance = req.query.distance;

    distance *= 0.621371;
    var maxDistance = distance / 3963.2;

    var coords = [];
    coords.push(lng);
    coords.push(lat);

    var queryProviders = provider.query();

    var promiseProviders = queryProviders
        .where('loc')
        .near({
            center: coords,
            maxDistance: maxDistance,
            spherical: true
        })
        .find({status: 1});

    promiseProviders
        .then(function (providers) {

            //fazendo a chamada das companies
            var companiesRepository = require('./../../../../people/V1/repository/companiesRepository');
            var company = new companiesRepository();
            company.setEntity('companies');

            var queryCompanies = company.query();

            var promiseCompanies = queryCompanies
                .where('loc')
                .near({
                    center: coords,
                    maxDistance: maxDistance,
                    spherical: true
                })
                .find({status: 1});

            promiseCompanies
                .then(function (companies) {

                    var underscore = require('underscore');

                    var dataParsed = {};
                    dataParsed.providers = [];
                    dataParsed.companies = [];

                    dataParsed.companies = underscore.uniq(companies, '_id');
                    dataParsed.providers = underscore.uniq(providers, '_id');

                    //removendo informações confidenciais
                    for (var i = 0; i < dataParsed.providers; i++) {
                        dataParsed.providers[i].password = "";
                    }
                    for (var b = 0; b < dataParsed.companies; b++) {
                        dataParsed.companies[i].companies = "";
                    }

                    return res.status(200).json({
                        success: true,
                        data: dataParsed
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


module.exports = Service;