/**
 * @desc Classe responsavel por registrar o tipo de autenticação da API
 * @author Vitor Barros
 * @type {Passport}
 */

var passport = require('passport');
var BearerStrategy = require('passport-http-bearer').Strategy;
var User = require('./../module/OAuth2/V1/entity/oauthAccessTokens');
var timezone = require('moment-timezone');

passport.use(new BearerStrategy(
    function (token, done) {

        var userQuery = User.findOne({
            accessToken: token
        });

        userQuery
            .then(function (user) {
                if (!user) {

                    return done(null, false);

                } else {

                    //verificando se a token está válida

                    var formatted = timezone.tz("America/Sao_Paulo").format();
                    var now = new Date(formatted.substr(0, formatted.length - 6));

                    var tokenExpireIn = new Date(user.accessTokenExpireAt);

                    //caso a token tenha expirado
                    if (now > tokenExpireIn) {
                        return done(null, false);
                    } else {
                        return done(null, user);
                    }
                }
            })
            .catch(function (err) {
                return done(null, err);
            });
    }
));

module.exports = passport;