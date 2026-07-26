'use strict';

const { Model } = require('sequelize');

const journalEntryTypes = [
  'observation',
  'strength',
  'challenge',
  'milestone',
  'student_reflection',
  'support_note',
];
const voiceCaptureTypes = [
  'direct_quote',
  'paraphrased',
];

module.exports = (sequelize, DataTypes) => {
  class StudentLearningJournal extends Model {
    static associate(models) {
      StudentLearningJournal.belongsTo(models.Student);
      StudentLearningJournal.belongsTo(models.Teacher);
      StudentLearningJournal.belongsTo(models.StudentEvidence, {
        foreignKey: 'EvidenceId',
      });
    }
  }

  StudentLearningJournal.init({
    StudentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    TeacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    EvidenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(...journalEntryTypes),
      allowNull: false,
    },
    content: {
      type: DataTypes.STRING(1500),
      allowNull: false,
    },
    voiceCaptureType: {
      type: DataTypes.ENUM(...voiceCaptureTypes),
      allowNull: true,
    },
    observedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'StudentLearningJournal',
    paranoid: true,
  });

  return StudentLearningJournal;
};
