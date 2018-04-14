/**
 * @desc Classe responsavel pelo clients habilitados para consumir a API
 * @author Vitor Barros
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var OauthClients = mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    secret:{
        type: String,
        required: true
    },
    appId:{
        type: String,
        required: true,
        unique: true
    },
    grantType:{
        type: String,
        default: 'password'
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'oauthUsers',
        required: true,
        unique: true
    }
});

/**
 * @desc Criptografando o secret do client
 * @author Vitor Barros
 */
OauthClients.pre('save', function (callback) {
    var client = this;

    //verificando se a senha foi modificada
    if(!client.isModified('secret')) return callback();

    //quando o secret é modificado

    //gerando o salt
    bcrypt.genSalt(5, function (err, salt) {

        if(err) return callback(err);

        //encryptando a senha
        bcrypt.hash(client.secret, salt, null, function (err, hash) {

            if(err) return callback(err);
            client.secret = hash;
            callback();

        });

    })

});

/**
 * @desc Método responsável por verificar o secret
 * @param secret
 * @param callback
 * @author Vitor Barros
 */
OauthClients.methods.verifySecret = function (secret, callback) {

    bcrypt.compare(secret, this.secret, function (err, isMatch) {
        if(err) return callback(err);
        callback(null, isMatch);
    })

};

module.exports = mongoose.model('oauthClients', OauthClients);