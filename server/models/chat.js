'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Chat extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Chat.init(
    {
      fromUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: 'From User is required' },
          notEmpty: { msg: 'From User is required' },
        },
      },
      roomId: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'Room Id is required' },
          notEmpty: { msg: 'Room Id is required' },
        },
      },
      toUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: 'To User is required' },
          notEmpty: { msg: 'To User is required' },
        },
      },
      message: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'Message is required' },
          notEmpty: { msg: 'Message is required' },
        },
      },
    },
    {
      sequelize,
      modelName: 'Chat',
    }
  );
  return Chat;
};
