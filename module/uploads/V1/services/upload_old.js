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


        /**
         * Inicio do envio do arquivo para a amazon
         */
            //criando o client
        var s3 = require('s3');
        var credentials = require('./../../../../config/s3');

        var client = s3.createClient({
            s3Options: credentials
        });

        //criando os parametros
        var params = {
            localFile: name,
            s3Params: {
                Bucket: "dotpet",
                Key: "imgs/" + newName + '.' + oldName[1]
            }
        };

        var upload = client.uploadFile(params);
        upload.on('error', function (err) {
            return res.status(400).json({
                success: false,
                data: err
            });
        });

        upload.on('end', function () {

            //removendo o arquivo do cache
            fs.unlink(name, function (err) {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        data: err
                    });
                }

                return res.status(200).json({
                    success: true,
                    data: {path: "https://s3-us-west-2.amazonaws.com/dotpet/imgs/" + newName + '.' + oldName[1]}
                });
            });
        });
    });
};

module.exports = Service;