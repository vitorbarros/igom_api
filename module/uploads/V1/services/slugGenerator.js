var SlugGenerator = function () {
};

/**
 * @desc Método responsável pela criação do slug
 * @author Vitor Barros
 * @param _value
 * @returns {*}
 */
SlugGenerator.prototype.generate = function (_value) {
    var slug = require('slug');
    return slug(_value.toLowerCase());
};

module.exports = SlugGenerator;
