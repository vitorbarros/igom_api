var nodemailer = require('nodemailer');
var fs = require('fs');

var Mail = function () {

    //verificando se o arquivo de configuração do e-mail existe
    fs.access('config/mail.js', function (err) {
        if (err) {
            throw "File config/mail.js dos not exists"
        }
    });

    var MailOptions = '';
};

/**
 * @desc Método para setar as configurações do email
 * @param _mailOptions
 */
Mail.prototype.setMailOptions = function (_mailOptions) {
    MailOptions = _mailOptions;
};

/**
 * @desc Método que retorna as configurações do email
 * @returns {*}
 */
Mail.prototype.getMailOptions = function () {
    return MailOptions;
};

Mail.prototype.send = function () {

    var config = require('./../../../../config/mail');
    var options = Mail.prototype.getMailOptions();

    //validando o objeto de envio
    if (!options.to || !options.subject || !options.text || !options.html || !options.fromName) {
        throw "MailOptions is invalid"
    }

    //ajustando o objeto de envio
    options.from = options.fromName + ' <' + config.mail.auth.user + '>';

    //criando o transporter
    var transporter = nodemailer.createTransport(config.mail);

    transporter.sendMail(options, function (error, info) {
        if (error) return error;
        if (info) return info;
    });

};

module.exports = Mail;








