/**
 * @desc Classe responsável pela configuração das connections com a base de dados
 * @author Vitor Barros
 */

let mongoose = require('mongoose');
mongoose.Promise = global.Promise;

//for local development
// var mongoDB = mongoose.connect('mongodb://localhost/igom_db', {
//     useMongoClient: true
// });

let mongoDB = mongoose.connect('mongodb://appAndroid:N&{<>0JhT3*W@igomappcluster-shard-00-00-pwhah.mongodb.net:27017,igomappcluster-shard-00-01-pwhah.mongodb.net:27017,igomappcluster-shard-00-02-pwhah.mongodb.net:27017/igom_db_production?ssl=true&replicaSet=igomAppCluster-shard-0&authSource=admin', {
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
