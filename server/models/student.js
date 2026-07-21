'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Student extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Student.belongsTo(models.Class);
      Student.hasMany(models.Attendance);
      Student.hasMany(models.Score);
      Student.hasOne(models.User);
      Student.hasMany(models.Transaction);
    }
  }
  Student.init(
    {
      NIM: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: `NIM must be unique` },
        validate: {
          notNull: { msg: `NIM is required` },
          notEmpty: { msg: `NIM is required` },
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: `name is required` },
          notEmpty: { msg: `name is required` },
        },
      },
      age: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: `age is required` },
          notEmpty: { msg: `age is required` },
        },
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: `gender is required` },
          notEmpty: { msg: `gender is required` },
        },
      },
      birthDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notNull: { msg: `birthDate is required` },
          notEmpty: { msg: `birthDate is required` },
        },
      },
      feedback: {
        type: DataTypes.STRING,
      },
      ClassId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: `ClassId is required` },
          notEmpty: { msg: `ClassId is required` },
        },
      },
      imgUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: `imgUrl is required` },
          notEmpty: { msg: `imgUrl is required` },
        },
      },
    },
    {
      sequelize,
      modelName: 'Student',
    }
  );
  return Student;
};
