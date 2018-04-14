/**
 * @desc Classe responsável pela execução do CRUD
 * @author Vitor Barros
 * @constructor
 */
var Repository = function () {
    var Entity = '';
};

/**
 * @desc Método para definir qual entidade a classe está trabalhando
 * @author Vitor Barros
 * @param _entity
 */
Repository.prototype.setEntity = function (_entity) {
    Entity = require('./../entity/' + _entity);
};

/**
 * @desc Método responsável pelo retorno de um único registro através de um campo
 * @author Vitor Barros
 * @param _objectQuery
 */
Repository.prototype.findOneByField = function (_objectQuery) {
    return Entity.findOne(_objectQuery);
};

/**
 * @desc Método que retorna uma query de acordo com os campos
 * @author Vitor Barros
 * @param _objectQuery
 * @returns {Query|*}
 */
Repository.prototype.findByField = function (_objectQuery) {
    return Entity.find(_objectQuery);
};

/**
 * @desc Método que retorna uma coleção de dados de uma determinada entidade
 * @author Vitor Barros
 * @returns {*|Query}
 */
Repository.prototype.findAll = function () {
    return Entity.find({});
};

/**
 * @desc Método responsável pela criação de um novo registro de uma entidade na base de dados
 * @author Vitor Barros
 * @param _data
 * @returns {Promise|*}
 */
Repository.prototype.create = function (_data) {
    var entity = new Entity(_data);
    return entity.save();
};

/**
 * @desc Método reposável por fazer o update de um registro na base de dados
 * @author Vitor Barros
 * @param _objectId
 * @param _data
 */
Repository.prototype.update = function (_objectId, _data) {

    if (!_data._id) {
        throw 'data object must have _id property';
    }

    try {
        return Entity.update({
            _id: _objectId
        }, {
            $set: _data
        });
    } catch (e) {
        throw e;
    }
};
/**
 * Função responsável por returnar uma query
 * @author Vitor Barros
 * @returns {*|Query}
 */
Repository.prototype.query = function () {
    return Entity;
};

module.exports = Repository;