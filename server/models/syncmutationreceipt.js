'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SyncMutationReceipt extends Model {
    static associate(models) {
      SyncMutationReceipt.belongsTo(models.Teacher);
    }
  }

  SyncMutationReceipt.init({
    TeacherId: {
      allowNull: false,
      type: DataTypes.INTEGER,
    },
    clientMutationId: {
      allowNull: false,
      type: DataTypes.STRING(128),
    },
    mutationType: {
      allowNull: false,
      type: DataTypes.STRING(40),
    },
    requestHash: {
      allowNull: false,
      type: DataTypes.STRING(64),
    },
    status: {
      allowNull: false,
      defaultValue: 'applied',
      type: DataTypes.STRING(16),
      validate: {
        isIn: [['applied']],
      },
    },
    result: {
      allowNull: false,
      type: DataTypes.JSONB,
    },
    processedAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
  }, {
    indexes: [
      {
        fields: ['TeacherId', 'clientMutationId'],
        name: 'sync_mutation_receipts_teacher_client_mutation_unique',
        unique: true,
      },
    ],
    sequelize,
    modelName: 'SyncMutationReceipt',
  });

  return SyncMutationReceipt;
};
