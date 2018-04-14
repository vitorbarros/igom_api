/**
 * @desc Classe responsável pelo registro dos modulos da aplicação
 * @author Vitor Barros
 * @param app
 */

var passport = require('./passport');

module.exports = function (app) {

    app.use('/api/V1/people',
        passport.authenticate('bearer', {session: false}),
        require('./../module/people/V1/routes'));

    //service module
    app.use('/api/V1/services',
        passport.authenticate('bearer', {session: false}),
        require('./../module/service/V1/routes'));

    //Login module
    app.use('/api/V1/login',
        passport.authenticate('bearer', {session: false}),
        require('./../module/login/V1/routes'));

    //Order module
    app.use('/api/V1/orders',
        passport.authenticate('bearer', {session: false}),
        require('./../module/orders/V1/routes'));

    //upload module
    app.use('/api/V1/uploads',
        passport.authenticate('bearer', {session: false}),
        require('./../module/uploads/V1/routes'));

    //OAuth2 module
    //esse módulo está apenas com algumas rotas restritas.
    //Para checar, acessar o arquivo de rota interno do módulo
    app.use('/api/V1/oauth2', require('./../module/OAuth2/V1/routes'));

    //Logmoto module
    //Esse modulo esta aberto devido a limitacoes da api da logmoto
    app.use('/api/V1/logmoto', require('./../module/logmoto/V1/routes'));


};