'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Uniform extends Model {

    static associate(models) {
    }
  }
  Uniform.init({
    name: DataTypes.STRING,
    addtional1: DataTypes.STRING,
    additional2: DataTypes.STRING,
    additional3: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Uniform',
  });
  return Uniform;
};