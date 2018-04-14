/**
 * @desc Classe responsável pela configuração das connections com a base de dados
 * @author Vitor Barros
 */

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

//for local development
var mongoDB = mongoose.connect('mongodb://localhost/igom_db', {
    useMongoClient: true
});

mongoDB
    .then(function (db) {
        console.log('mongodb has been connected');
    })
    .catch(function (err) {
        console.log('error while trying to connect with mongodb');
    });

module.exports = mongoDB;
