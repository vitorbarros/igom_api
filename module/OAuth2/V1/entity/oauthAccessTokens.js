/**
 * @desc Classe responsavel pelo model de Access Tokens da API
 * @author Vitor Barros
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var timezone = require('moment-timezone');
var formated = timezone.tz("America/Sao_Paulo").format();
var today = new Date(formated.substr(0, formated.length - 6));

var date = new Date(today);

var OauthAccessTokens = mongoose.Schema({
    accessToken: {
        type: String,
        required: true,
        unique: true
    },
    refreshToken: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: date
    },
    updatedAt: {
        type: Date,
        required: true,
        default: date
    },
    accessTokenExpireAt: {
        type: Date,
        required: true
    },
    refreshTokenExpireAt:{
        type: Date,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'oauthUsers',
        required: true
    }
});

/**
 * @desc Método que cuida da criação da token
 */
OauthAccessTokens.pre('save', function (callback) {

    var oauthAccessToken = this;

    //gerando o access_token
    bcrypt.genSalt(5, function (err, salt) {

        if (err) return callback(err);

        bcrypt.hash(oauthAccessToken.accessToken, salt, null, function (err, hash) {

            if (err) return callback(err);
            oauthAccessToken.accessToken = hash;
            callback();

        });

    });

});

/**
 * @desc Método que cuida da criação da refresh token
 */
OauthAccessTokens.pre('save', function (callback) {

    var oauthAccessToken = this;

    //gerando o remember token
    bcrypt.genSalt(5, function (err, salt) {

        if (err) return callback(err);

        //encryptando a senha
        bcrypt.hash(oauthAccessToken.refreshToken, salt, null, function (err, hash) {

            if (err) return callback(err);
            oauthAccessToken.refreshToken = hash;
            callback();

        });

    });

});

module.exports = mongoose.model('oauthAccessTokens', OauthAccessTokens);