'use strict';

const { Model } = require('sequelize');

const evidenceCategories = [
  'work',
  'assignment',
  'assessment',
  'activity',
  'documentation',
];

module.exports = (sequelize, DataTypes) => {
  class StudentEvidence extends Model {
    static associate(models) {
      StudentEvidence.belongsTo(models.Student);
      StudentEvidence.belongsTo(models.Teacher);
      StudentEvidence.hasMany(models.StudentLearningJournal, {
        foreignKey: 'EvidenceId',
      });
    }
  }

  StudentEvidence.init({
    StudentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    TeacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(...evidenceCategories),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    observedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fileUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    cloudinaryPublicId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    format: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'StudentEvidence',
  });

  return StudentEvidence;
};
