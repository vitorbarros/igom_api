/**
 * @desc EndPoint para consulta de cep
 * @param req
 * @param res
 * @constructor
 */
var FetchCep = function (req, res) {

    var request = require('request-promise');
    var cep = req.params.cep.toString().replace("-", "");

    var options = {
        uri: "https://viacep.com.br/ws/" + cep + "/json",
        method: 'POST',
        form: {
            zipCode: cep,
            address: "",
            streetNumber: ""
        },
        json: true
    };

    request(options)
        .then(function (response) {
            return res.status(200).json({
                success: true,
                data: response
            });
        })
        .catch(function (err) {
            return res.status(400).json({
                success: false,
                data: err
            });
        });
};

module.exports = FetchCep;