/**
 * @desc Classe que faz o upload dos arquivos para a Amazon
 * @param req
 * @param res
 * @constructor
 */

var Service = function (req, res) {

    var path = require('path');
    var fs = require('fs');
    var folder = path.resolve(__dirname);

    if (!req.files) {
        return res.status(422).json({success: false, data: "file is required"});
    }

    var slugGen = require('./slugGenerator');
    var slugGenerator = new slugGen();

    var oldName = req.files.file.name.split(".");
    var newName = slugGenerator.generate(oldName[0]) + (Math.floor(Math.random() * 9999) + 1);

    var file = req.files.file;
    var name = folder + "/../../../../cache/" + newName + "." + oldName[1];

    file.mv(name, function (err) {

        if (err) {
            return res.status(400).json({
                success: false,
                data: err
            });
        }

        var request = require('request');

        var formData = {
            folder: 'imgs',
            file: fs.createReadStream(name)
        };

        request.post({
            url: 'https://cdn.dotpet.com.br',
            formData: formData,
            "rejectUnauthorized": false
        }, function (err, httpResponse, body) {

            var response = JSON.parse(body);

            return res.status(200).json({
                success: true,
                data: {path: "https://cdn.dotpet.com.br" + response.url}
            });
        });
    });
};

module.exports = Service;