/**
 * @desc Credenciais da CIELO
 * @constructor
 */
var Cielo = function () {
};

//for development
// Cielo.prototype.credentials = function () {
//     return {
//         baseUrl: 'apisandbox.cieloecommerce.cielo.com.br',
//         MerchantId: '5a618946-48e9-49a9-bd6d-f5eb9ada6a0f',
//         MerchantKey: 'HMFNWITCXXYWYOTQAVCEDSRPFGKBNOUVXNMUQHBB',
//         ssl: true
//     }
// };

//for production
// Cielo.prototype.credentials = function () {
//     return {
//         baseUrl: 'api.cieloecommerce.cielo.com.br',
//         MerchantId: '6279d808-3349-4722-b076-8932bf7d9b3c',
//         MerchantKey: '9wTrIWH0hwHsjTdY7QOUIfpTPeYPK2kHQVlfnDF2',
//         ssl: true
//     }
// };

module.exports = Cielo;

