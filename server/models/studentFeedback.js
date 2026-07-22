'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StudentFeedback extends Model {
    static associate(models) {
      StudentFeedback.belongsTo(models.Student);
      StudentFeedback.belongsTo(models.Teacher);
    }
  }

  StudentFeedback.init({
    StudentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    TeacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    observedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'StudentFeedback',
  });

  return StudentFeedback;
};
