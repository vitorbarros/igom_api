/**
 * @desc Calsse responsável pela liberação do CORS para consumo da API via browser
 * @param app
 */

//TODO Habilitar o cors somente se necessário

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Authorization, X-Request, CustomHeader, Content-Type');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

        if (req.method === 'OPTIONS') {
            return res.send(200);
        } else {
            next();
        }
    });
};

