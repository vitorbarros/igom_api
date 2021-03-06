/**
 * @desc Providers entity class
 * @author Vitor Barros
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var Providers = mongoose.Schema({
    //required fields
    name: {
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
    cpf: {
        type: String,
        required: false
    },
    address: {
        type: Array,
        required: false
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
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    updatedAt: {
        type: Date,
        required: true
    },
    role: {
        type: String,
        required: true,
        default: 'providers'
    },
    //no required fields
    tel: {
        type: String,
        required: false
    },
    cel: {
        type: String,
        required: false,
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
    bankAccount: {
        type: Object,
        required: false
    },
    status: {
        type: Number,
        required: true,
        index: 1
    },
    //imgs fields
    profile: {
        type: String,
        required: false
    },
    activationAt: {
        type: Date,
        required: false
    }
});

Providers.pre('save', function (callback) {
    var Providers = this;

    //verificando se a senha foi modificada
    if (!Providers.isModified('password')) return callback();

    //quando o secret é modificado

    //gerando o salt
    bcrypt.genSalt(5, function (err, salt) {

        if (err) return callback(err);

        //encryptando a senha
        bcrypt.hash(Providers.password, salt, null, function (err, hash) {

            if (err) return callback(err);
            Providers.password = hash;
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
Providers.methods.verifyPassword = function (password, callback) {

    bcrypt.compare(password, this.password, function (err, isMatch) {
        if (err) return callback(err);
        callback(null, isMatch);
    })

};

module.exports = mongoose.model('providers', Providers);