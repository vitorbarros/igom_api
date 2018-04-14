/**
 * @desc Orders entity class
 * @author Vitor Barros
 */
var mongoose = require('mongoose');

var Orders = mongoose.Schema({
    paymentType: {
        type: String,
        required: true
    },
    number: {
        type: Number,
        required: true
    },
    items: {
        type: Array,
        required: true
    },
    additional: {
        type: Array,
        required: false
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Clients',
        index: 1
    },
    discountCoupon: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'DiscountCoupons',
        index: 1
    },
    totalPrice: {
        type: Number,
        required: true
    },
    providerPrice: {
        type: Number,
        required: false
    },
    createdAt: {
        type: Date,
        required: true
    },
    paymentId: {
        type: String,
        required: true
    },
    tid: {
        type: String,
        required: true
    },
    hasLeadsAndBrings: {
        type: Number,
        required: false
    },
    leadsAndBringsPrice: {
        type: Number,
        required: false
    },
    type: {
        type: String,
        required: true,
        index: 1
    },
    observation: {
        type: String,
        required: false
    },
    invoiceCPForCNPJ: {
        type: String,
        required: false
    },
    address: {
        type: Array,
        required: false
    },
    status: {
        type: Number,
        required: true,
        default: 1
    },
    usedCard: {
        type: Object,
        required: false
    },
    notified: {
        type: Number,
        required: false,
        index: 1
    },
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaigns',
        required: false,
        index: 1
    },
    dotCredit:{
        type: Number,
        required: false,
        index: 1
    }

});

module.exports = mongoose.model('orders', Orders);