/**
 * Método que faz o cancelamento do pedido de contratação de serviço
 * @param req
 * @param res
 * @constructor
 */
var OrderServiceCancel = function (req, res) {

        if (!req.body.cancelObservation) {
            return res.status(422).json({
                success: false,
                data: "cancelObservation is required"
            });
        }

        var id = req.params.id;

        var Schedule = require('./../../../../../people/V1/repository/scheduleRepository');
        var scheduleRepository = new Schedule();
        scheduleRepository.setEntity('schedule');

        var schedulePromise = scheduleRepository.findOneByField({
            _id: id
        });

        schedulePromise
            .then(function (schedule) {

                if (schedule) {

                    //buscando os relacionamentos da schedule
                    var scheduleRelationClass = require('./../../../../../people/V1/class/fetchScheduleInArrRelation');
                    scheduleRelationClass.prototype.fetchSchedule(schedule)
                        .then(function (scheduleRelation) {

                                //agendamento finalizado
                                if (parseInt(scheduleRelation.schedule.status) === 2) {
                                    return res.status(400).json({
                                        success: false,
                                        data: {
                                            message: "Não é possível cancelar um agendamento finalizado"
                                        }
                                    });
                                }

                                //agendamento cancelado
                                if (parseInt(scheduleRelation.schedule.status) === 0) {
                                    return res.status(400).json({
                                        success: false,
                                        data: {
                                            message: "Não é possível cancelar um agendamento já cancelado"
                                        }
                                    });
                                }

                                //verificando o reembolso do cliente
                                var timezone = require('moment-timezone');
                                var formatted = timezone.tz("America/Sao_Paulo").format();
                                var today = new Date(formatted.substr(0, formatted.length - 6));
                                var date = new Date(today);

                                var dateValidate = new Date(today);
                                dateValidate.setUTCHours(date.getUTCHours() + 24);

                                var scheduleDate = new Date(scheduleRelation.schedule.schedule.toString().substr(0, formatted.length - 6));

                                var credit = false;
                                var creditQuantity = 0;
                                var cleanCredit = 0;

                                //verificando se o cliente pode receber o crédito de acordo com a política de privacidade
                                if (scheduleDate > dateValidate) {
                                    credit = true;
                                    cleanCredit = parseInt(scheduleRelation.schedule.price);
                                }

                                //verificando se o cliente receberá créditos
                                if (credit) {

                                    creditQuantity = ((cleanCredit / 100) * 90.01);

                                    if (scheduleRelation.client.dotCredit) {
                                        scheduleRelation.client.dotCredit = parseInt(scheduleRelation.client.dotCredit) + parseInt(creditQuantity);
                                    } else {
                                        scheduleRelation.client.dotCredit = parseInt(creditQuantity);
                                    }

                                    var Client = require('./../../../../../people/V1/repository/clientsRepository');
                                    var clientRepository = new Client();
                                    clientRepository.setEntity('clients');

                                    clientRepository.update(scheduleRelation.client._id, {
                                        _id: scheduleRelation.client._id,
                                        dotCredit: scheduleRelation.client.dotCredit
                                    }).exec();
                                }

                                var scheduleOBJUpdate = {};

                                scheduleOBJUpdate._id = scheduleRelation.schedule._id;
                                scheduleOBJUpdate.status = 0;
                                scheduleOBJUpdate.cancelObservation = req.body.cancelObservation;
                                scheduleOBJUpdate.canceledAt = date;

                                //verificando se o repasse será feito para o fornecedor
                                if (credit) {
                                    scheduleOBJUpdate.payProvider = 0;
                                } else {
                                    scheduleOBJUpdate.payProvider = 1;
                                }

                                //fazendo update no status do agendamento
                                var Schedule = require('./../../../../../people/V1/repository/scheduleRepository');
                                var scheduleRepository = new Schedule();
                                scheduleRepository.setEntity('schedule');

                                scheduleRepository.update(scheduleRelation.schedule._id, scheduleOBJUpdate).exec();

                                //enviando os dados para a RdStation
                                var objRdStation = {};

                                objRdStation.identificador = "cancelamento-servico";
                                objRdStation.email = scheduleRelation.client.name;
                                objRdStation.celular = scheduleRelation.client.tel;
                                objRdStation.name = scheduleRelation.client.name;
                                objRdStation.total_value = scheduleRelation.schedule.price;
                                objRdStation.service_name = scheduleRelation.serviceCategory.name;
                                objRdStation.pet = scheduleRelation.pet.name;

                                var RdStarion = require('./../../../../../rdStation/V1/services/store');
                                var rdObject = new RdStarion(objRdStation);
                                rdObject.dispatch();


                                //enviando SMS para o client
                                var message = OrderServiceCancel.prototype.formatMessageCancel(scheduleRelation.serviceCategory.name, scheduleRelation.client.name, 'PUSH');

                                if (credit) {

                                    //ajustando o valor para exibir para o cliente na mensagem

                                    var value = creditQuantity.toString();
                                    var valueArr = value.split("");
                                    valueArr.splice((valueArr.length - 2), 0, ",");
                                    value = valueArr.join("");
                                    creditQuantity = value;

                                    message += " Foi creditado em sua conta R$" + creditQuantity + " referente ao agendamento descontando apenas os nosso encargos financeiros.";

                                } else {
                                    //TODO AJUSTAR A MENSAGEM CORRETA DO SMS QUANDO O CLIENTE NAO RECEBE OS CREDITOS
                                }

                                OrderServiceCancel.prototype.dispatchCancelPush(message, scheduleRelation, function (successPush, errorPush) {
                                        if (errorPush) {
                                            return res.status(400).json({
                                                success: false,
                                                data: errorPush
                                            });
                                        } else {

                                            var message = OrderServiceCancel.prototype.formatMessageCancel(scheduleRelation.serviceCategory.name, scheduleRelation.client.name, "SMS");

                                            if (credit) {
                                                message += " Foi creditado em sua conta R$" + creditQuantity + " referente ao agendamento descontando apenas os nosso encargos financeiros.";
                                            } else {
                                                //TODO AJUSTAR A MENSAGEM CORRETA DO SMS QUANDO O CLIENTE NAO RECEBE OS CREDITOS
                                            }

                                            OrderServiceCancel.prototype.dispatchCancelSMS(scheduleRelation.client, message, 'client', function (successSMS, errorSMS) {


                                                    //disparando SMS para o fornecedor.
                                                    if (scheduleRelation.provider) {

                                                        if (scheduleRelation.provider.cel) {

                                                            OrderServiceCancel.prototype.dispatchCancelSMS(scheduleRelation.provider.cel, "Olá, " + scheduleRelation.provider.name + " informamos que um serviço agendado no pedido número " + scheduleRelation.order.number + " foi cancelados pelo cliente. Para mais informações verifique sua agenda", 'provider', function (successSMS, errorSMS) {

                                                                if (errorSMS) {
                                                                    return res.status(400).json({
                                                                        success: false,
                                                                        data: errorPush
                                                                    });
                                                                } else {

                                                                    //informando o cliente do recebimento dos créditos
                                                                    return res.status(200).json({
                                                                        success: true,
                                                                        data: scheduleRelation.schedule
                                                                    });
                                                                }
                                                            });
                                                        } else {

                                                            return res.status(200).json({
                                                                success: true,
                                                                data: scheduleRelation.schedule
                                                            });
                                                        }
                                                    } else if (scheduleRelation.company) {

                                                        if (scheduleRelation.company.cel) {

                                                            OrderServiceCancel.prototype.dispatchCancelSMS(scheduleRelation.company.cel, "Olá, " + scheduleRelation.company.name + " informamos que um serviço agendado no pedido número " + scheduleRelation.order.number + " foi cancelados pelo cliente. Para mais informações verifique sua agenda", 'company', function (successSMS, errorSMS) {

                                                                if (errorSMS) {

                                                                    return res.status(400).json({
                                                                        success: false,
                                                                        data: errorPush
                                                                    });
                                                                } else {

                                                                    return res.status(200).json({
                                                                        success: true,
                                                                        data: scheduleRelation.schedule
                                                                    });
                                                                }
                                                            });

                                                        } else {

                                                            return res.status(200).json({
                                                                success: true,
                                                                data: scheduleRelation.schedule
                                                            });
                                                        }
                                                    }
                                                }
                                            );
                                        }
                                    }
                                );
                            }
                        )
                        .catch(function (err) {
                            return res.status(400).json({
                                success: false,
                                data: err
                            });
                        });
                } else {
                    return res.status(400).json({
                        success: false,
                        data: {
                            message: "Schedule not found"
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
    }
;

OrderServiceCancel.prototype.dispatchCancelSMS = function (obj, message, type, __callback) {

    //disparando o SMS
    //enviando notificação do código de acesso por SMS
    var sms = require('./../../../../../sms/V1/services/dispatch/dispatchInternal');
    var send = new sms();

    if (type === 'client') {

        if (obj.notificationOrder) {
            send.prepare(obj.tel, message);
            send.dispatch(function (success, error) {

                if (error) {
                    __callback(null, error);
                } else {
                    __callback(success, null);
                }

            });
        } else {
            __callback('Client disable order sms', null);
        }
    }

    if (type === 'provider') {

        send.prepare(obj, message);
        send.dispatch(function (success, error) {

            if (error) {
                __callback(null, error);
            } else {
                __callback(success, null);
            }

        });

    }

    if (type === 'company') {

        send.prepare(obj, message);
        send.dispatch(function (success, error) {

            if (error) {
                __callback(null, error);
            } else {
                __callback(success, null);
            }
        });
    }
};

OrderServiceCancel.prototype.dispatchCancelPush = function (message, schedule, __callback) {

    var Notification = require('./../../../../../notifications/V1/repository/notificationsRepository');
    var notificationRepository = new Notification();
    notificationRepository.setEntity('notifications');

    var timezone = require('moment-timezone');
    var formatted = timezone.tz("America/Sao_Paulo").format();
    var now = new Date(formatted.substr(0, formatted.length - 6));

    var UrbanAirshipPush = require('urban-airship-push');
    var urbanAirshipPush = new UrbanAirshipPush(require('./../../../../../../config/urbanairship'));

    if (schedule.client.notificationOrder) {

        urbanAirshipPush.push.send({
            device_types: [
                "ios",
                "android"
            ],
            audience: {
                named_user: schedule.client._id
            },
            notification: {
                alert: message,
                actions: {
                    open: {
                        type: 'deep_link',
                        content: JSON.stringify(schedule.order)
                    }
                }
            }
        }, function (err, data) {

            var notificationObj = {};

            if (err) {
                notificationObj.response = err;
                notificationObj.status = 0;
            }

            if (data) {
                notificationObj.response = data;
                notificationObj.status = 1;
            }

            var providerName = null;

            if (schedule.company) {
                notificationObj.company = schedule.company._id;
                notificationObj.providerPhoto = schedule.company.profile;
                providerName = schedule.company.name;
            }

            if (schedule.provider) {
                notificationObj.provider = schedule.provider._id;
                notificationObj.providerPhoto = schedule.provider.profile;
                providerName = schedule.provider.name;
            }

            notificationObj.sentAt = now;
            notificationObj.order = schedule.order._id;
            notificationObj.schedule = schedule.schedule._id;
            notificationObj.type = 'storeService';
            notificationObj.client = schedule.client._id;
            notificationObj.clientPhoto = schedule.client.photo;
            notificationObj.clientMessage = message;
            notificationObj.providerOrCompanyMessage = "Olá, " + providerName + " informamos que um serviço agendado no pedido número " + schedule.order.number + " foi cancelados pelo cliente. Para mais informações verifique sua agenda";

            var create = notificationRepository
                .create(notificationObj);

            create
                .then(function (notification) {

                    __callback(notification, null);

                })
                .catch(function (err) {

                    __callback(null, err);

                });
        });
    } else {
        __callback('Client disabled order notification', null);
    }
};

OrderServiceCancel.prototype.formatMessageCancel = function (serviceName, clientName, type) {

    var messageSMS = "Agendamento cancelado com sucesso.";
    var message = "Agendamento cancelado com sucesso.";

    messageSMS = messageSMS.replace(/[ÀÁÂÃÄÅ]/g, "A");
    messageSMS = messageSMS.replace(/[àáâãäå]/g, "a");
    messageSMS = messageSMS.replace(/[ÈÉÊË]/g, "E");
    messageSMS = messageSMS.replace(/[èéê]/g, "e");
    messageSMS = messageSMS.replace(/[íìî]/g, "i");
    messageSMS = messageSMS.replace(/[ÍÌÎ]/g, "I");
    messageSMS = messageSMS.replace(/[óôõ]/g, "o");
    messageSMS = messageSMS.replace(/[ÔÓÒÕ]/g, "O");

    return type === "SMS" ?
        messageSMS :
        message;
};

module.exports = OrderServiceCancel;