/**
 * @desc Classe responsavel pelo model de autenticação na API
 * @author Vitor Barros
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var OauthUsers = mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    }
});

/**
 * @desc Método que cria a criptografia da senha
 * @author Vitor Barros
 */
OauthUsers.pre('save', function (callback) {
    var user = this;

    //verificando se a senha foi modificada
    if(!user.isModified('password')) return callback();

    //quando o password é modificado

    //gerando o salt
    bcrypt.genSalt(5, function (err, salt) {

        if(err) return callback(err);

        //encryptando a senha
        bcrypt.hash(user.password, salt, null, function (err, hash) {

            if(err) return callback(err);
            user.password = hash;
            callback();

        });
        
    })

});

/**
 * Método que faz a verificação da senha
 * @param password
 * @param callback
 * @author Vitor Barros
 */
OauthUsers.methods.verifyPassword = function (password, callback) {

    bcrypt.compare(password, this.password, function (err, isMatch) {
        if(err) return callback(err);
        callback(null, isMatch);
    })

};

module.exports = mongoose.model('oauthUsers', OauthUsers);