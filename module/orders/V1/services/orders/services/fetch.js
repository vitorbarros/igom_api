/**
 * @desc Classse responsável por enviar os dados de busca para o client
 * @author Vitor Barros
 * @param req
 * @param res
 * @constructor
 */
var OrderServiceFetch = function (req, res) {

    var Orders = require('./../../../repository/ordersRepository');
    var orderRepository = new Orders();
    orderRepository.setEntity('orders');

    var order = orderRepository.findOneByField({
        _id: req.params.id
    });

    order
        .then(function (orderResponse) {

            if (orderResponse) {

                var discountCoupon = {};

                //fazendo a chamada da schedule
                var Schedule = require('./../../../../../people/V1/repository/scheduleRepository');
                var scheduleRepository = new Schedule();
                scheduleRepository.setEntity('schedule');

                //verificando o tipo do pedido
                if (orderResponse.type !== 'service') {
                    return res.status(400).json({
                        success: false,
                        data: {
                            message: "Order type must be service"
                        }
                    });
                }

                var query = scheduleRepository.query();

                query
                    .find({
                        order: orderResponse._id
                    })
                    .sort({
                        schedule: -1
                    })
                    .then(function (schedules) {

                        var FetchScheduleInArrRelation = require('./../../../../../people/V1/class/fetchScheduleInArrRelation');
                        var fetchScheduleInArrRelation = new FetchScheduleInArrRelation();

                        var schedulePromise = fetchScheduleInArrRelation.fetchSchedule(schedules);
                        schedulePromise
                            .then(function (response) {
                                return res.status(200).json({
                                    success: true,
                                    data: response
                                });
                            })
                            .catch(function (err) {
                                return res.status(400).json({
                                    success: false,
                                    data: err
                                });
                            });
                    })
                    .catch(function (err) {
                        return res.status(400).json({
                            success: false,
                            data: err
                        });
                    });
            } else {
                return res.status(200).json({
                    success: true,
                    data: {}
                });
            }
        })
        .catch(function (err) {
            return res.status(400).json({
                success: false,
                data: err
            });
        });
};

module.exports = OrderServiceFetch;