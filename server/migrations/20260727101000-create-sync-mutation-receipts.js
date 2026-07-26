'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SyncMutationReceipts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      TeacherId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: { tableName: 'Teachers' },
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      clientMutationId: {
        allowNull: false,
        type: Sequelize.STRING(128),
      },
      mutationType: {
        allowNull: false,
        type: Sequelize.STRING(40),
      },
      requestHash: {
        allowNull: false,
        type: Sequelize.STRING(64),
      },
      status: {
        allowNull: false,
        type: Sequelize.STRING(16),
      },
      result: {
        allowNull: false,
        type: Sequelize.JSONB,
      },
      processedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addConstraint('SyncMutationReceipts', {
      fields: ['TeacherId', 'clientMutationId'],
      type: 'unique',
      name: 'sync_mutation_receipts_teacher_client_mutation_unique',
    });
    await queryInterface.addConstraint('SyncMutationReceipts', {
      fields: ['status'],
      type: 'check',
      name: 'sync_mutation_receipts_status_allowed',
      where: {
        status: 'applied',
      },
    });
    await queryInterface.addIndex(
      'SyncMutationReceipts',
      ['TeacherId', 'processedAt'],
      { name: 'sync_mutation_receipts_teacher_processed_index' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('SyncMutationReceipts');
  },
};
