'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Attendance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Attendance.belongsTo(models.Student);
    }
  }
  Attendance.init(
    {
      StudentId: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: `StudentId is required` },
          notEmpty: { msg: `StudentId is required` },
        },
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: `status is required` },
          notEmpty: { msg: `status is required` },
        },
      },
    },
    {
      sequelize,
      modelName: 'Attendance',
    }
  );
  return Attendance;
};
