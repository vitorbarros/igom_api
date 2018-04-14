/**
 * @desc Calsse de reset de senha
 * @param req
 * @param res
 * @returns {*}
 * @constructor
 */
var ServiceLoginResetPassword = function (req, res) {

    var bcrypt = require('bcrypt-nodejs');

    //verificando os parametros
    if (!req.body.type || !req.body.username) {
        return res.status(400).json({
            success: false,
            data: "'username' and 'type' are required"
        });
    }

    //verificando o tipo de login
    if (req.body.type !== 'providers' && req.body.type !== 'companies' && req.body.type !== 'administrators' && req.body.type !== 'clients') {
        return res.status(400).json({
            success: false,
            data: "Supported types 'providers', 'companies', 'clients', and 'administrators'"
        });
    }

    var username = req.body.username;
    req.body.username = username.trim();

    //chamando o repository
    var entity = require('./../../../people/V1/repository/' + req.body.type + 'Repository');
    var repo = new entity();
    repo.setEntity(req.body.type);

    var refresh = repo.findOneByField({
        username: req.body.username
    });

    refresh
        .then(function (success) {

            //verificando se foi encontrado algum registro
            if (!success) {
                return res.status(400).json({
                    success: false,
                    data: {
                        message: "Não encontramos nenhum cadastro no nosso sitema com o e-mail informado."
                    }
                });
            }

            var password = '';
            var possible = '0123456789';

            for (var i = 0; i < 6; i++) {
                password += possible.charAt(Math.floor(Math.random() * possible.length));
            }

            //gerando o salt
            bcrypt.genSalt(5, function (err, salt) {

                if (err) {
                    return res.status(400).json({
                        success: false,
                        data: err
                    });
                }

                //encryptando a senha
                bcrypt.hash(password, salt, null, function (err, hash) {

                    if (err) {
                        return res.status(400).json({
                            success: false,
                            data: err
                        });
                    }

                    var obj = {
                        _id: success._id,
                        password: hash
                    };

                    var update = repo.update(success._id, obj);

                    update
                        .then(function (updateSuccess) {

                            //enviando SMS com a nova senha
                            if (req.body.type === 'clients') {

                                var sms = require('./../../../sms/V1/services/dispatch/dispatchInternal');
                                var send = new sms();
                                send.prepare(success.tel, "Sua senha foi redefinida com sucesso. Sua nova senha de acesso é " + password + " Acesse sua conta e troque a senha!");
                                send.dispatch(function (successSms, err) {
                                    if (err) {
                                        return res.status(400).json({
                                            success: false,
                                            data: "Erro ao enviar a mensagem de recuperação de senha"
                                        });
                                    } else {

                                        var name = success.name.split(' ');
                                        ServiceLoginResetPassword.prototype.sendEmail({
                                            mail: {
                                                to: req.body.username, // list of receivers
                                                subject: 'Nova Senha',
                                                text: '',
                                                html: '',
                                                fromName: "Dot Pet"
                                            },
                                            userData: {
                                                firstName: name[0],
                                                password: password
                                            },
                                            template: "resetPasswordClient.html"
                                        }, function (successSent, err) {

                                            if (successSent) {
                                                return res.status(200).json({
                                                    success: true,
                                                    data: updateSuccess
                                                });
                                            }

                                            if (err) {
                                                return res.status(400).json({
                                                    success: false,
                                                    data: err
                                                });
                                            }
                                        });
                                    }
                                });
                            } else {

                                var name = success.name.split(' ');
                                ServiceLoginResetPassword.prototype.sendEmail({
                                    mail: {
                                        to: req.body.username, // list of receivers
                                        subject: 'Nova Senha',
                                        text: '',
                                        html: '',
                                        fromName: "Dot Pet"
                                    },
                                    userData: {
                                        firstName: name[0],
                                        password: password
                                    },
                                    template: "resetPasswordProvider.html"
                                }, function (successSent, err) {

                                    if (successSent) {
                                        return res.status(200).json({
                                            success: true,
                                            data: updateSuccess
                                        });
                                    }

                                    if (err) {
                                        return res.status(400).json({
                                            success: false,
                                            data: err
                                        });
                                    }
                                });
                            }
                        })
                        .catch(function (err) {
                            return res.status(400).json({
                                success: false,
                                data: err
                            });
                        });
                });
            });
        })
        .catch(function (err) {
            return res.status(400).json({
                success: false,
                data: err
            });
        });
};

/**
 * @desc Função que faz o envio de e-mail
 * @param data
 * @param __callback
 */
ServiceLoginResetPassword.prototype.sendEmail = function (data, __callback) {

    var fs = require('fs');
    var path = require('path');
    var folder = path.resolve(__dirname);

    var Mail = require('./../../../mail/V1/services/send');
    var mail = new Mail();

    var template = folder + '/../../../mail/V1/templates/' + data.template;
    var file = fs.createReadStream(template, 'utf8');
    var templateParsed = '';

    file.on('data', function (chunk) {

        templateParsed += chunk.toString().replace('[firstName]', data.userData.firstName).replace('[password]', data.userData.password);

        data.mail.html = templateParsed;
        data.mail.text = templateParsed;

        mail.setMailOptions(data.mail);
        mail.send();

        __callback(true, null);
    });
};

module.exports = ServiceLoginResetPassword;