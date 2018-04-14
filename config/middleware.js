/**
 * @desc Middleware que verifica os módulos habilitados de um client de API
 * @param app
 */

module.exports = function (app) {
    app.use(function (req, res, next) {

        //TODO criar lógica para restringir módulos de acordo com a role dos clientes de API

        // console.log(req.url);
        // console.log(req.header('Authorization'));
        //
        // return res.status(401)
        //     .json({
        //        data:"Unnautorized"
        //     });

        next();
    });
};