/**
 * @desc Clients entity class
 * @author Vitor Barros
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var Clients = mongoose.Schema({
    //required fields
    name: {
        type: String,
        required: true
    },
    nickName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (v) {
                var re = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/g;
                return re.test(v.toLocaleString());
            },
            message: '{VALUE} is not a valid email address'
        }
    },
    emailActive: {
        type: Number,
        required: true,
        default: 0
    },
    tel: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (v) {

                var re = /\(|\)|\-|\ |\+/g;
                var test = re.test(v);
                var valid = true;

                //Verificando se existe caracteres especiais
                if (test) {
                    valid = false;
                }

                //vertificando a quantidade de numeros
                if (v.toString().length !== 13) {
                    valid = false;
                }

                return valid;
            },
            message: '{VALUE} is not a valid cel number'
        }
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (v) {
                var re = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/g;
                return re.test(v.toLocaleString());
            },
            message: '{VALUE} is not a valid email address'
        }
    },
    createdAt: {
        type: Date,
        required: true
    },
    updatedAt: {
        type: Date,
        required: true
    },
    expireFB: {
        type: Date,
        required: false
    },
    pinCode: {
        type: String,
        required: true,
        unique: true
    },
    activationCode: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        default: 'clients'
    },
    //no required fields
    cpf: {
        type: String,
        required: false
    },
    address: {
        type: Array,
        required: false
    },
    creditCard: {
        type: Array,
        required: false
    },
    pets: {
        type: Array,
        required: false
    },
    status: {
        type: Number,
        required: true,
        index: 1
    },
    multiplus: {
        type: Number,
        required: false,
        index: 1
    },
    isFB: {
        type: Number,
        required: false
    },
    isGPlus: {
        type: Number,
        required: false
    },
    devices: {
        type: Array,
        required: false
    },
    photo: {
        type: String,
        required: false
    },
    favorites: {
        type: Array,
        required: false
    },
    notificationEstablishments: {
        type: Number,
        required: true,
        default: 1
    },
    notificationOrder: {
        type: Number,
        required: true,
        default: 1
    },
    notificationPromotions: {
        type: Number,
        required: true,
        default: 1
    },
    notificationGeneral: {
        type: Number,
        required: true,
        default: 1
    },
    notificationNews: {
        type: Number,
        required: true,
        default: 1
    },
    productsToAlert: {
        type: Array,
        required: false
    },
    dotCredit: {
        type: Number,
        required: false
    },
    activationAt: {
        type: Date,
        required: false
    },
    origin: {
        type: String,
        required: false
    },
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaigns',
        required: false,
        index: 1
    }
});

Clients.pre('save', function (callback) {
    var Clients = this;

    //verificando se a senha foi modificada
    if (!Clients.isModified('password')) return callback();

    //quando o secret é modificado

    //gerando o salt
    bcrypt.genSalt(5, function (err, salt) {

        if (err) return callback(err);

        //encryptando a senha
        bcrypt.hash(Clients.password, salt, null, function (err, hash) {

            if (err) return callback(err);
            Clients.password = hash;
            callback();

        });

    });

});

/**
 * Método que faz a verificação da senha
 * @param password
 * @param callback
 * @author Vitor Barros
 */
Clients.methods.verifyPassword = function (password, callback) {

    bcrypt.compare(password, this.password, function (err, isMatch) {
        if (err) return callback(err);
        callback(null, isMatch);
    })

};

module.exports = mongoose.model('clients', Clients);