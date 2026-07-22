'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StudentFeedbacks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      StudentId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: { tableName: 'Students' },
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      TeacherId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: { tableName: 'Teachers' },
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      content: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      observedAt: {
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

    await queryInterface.addIndex('StudentFeedbacks', ['StudentId', 'observedAt'], {
      name: 'student_feedbacks_student_observed_at_index',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('StudentFeedbacks', 'student_feedbacks_student_observed_at_index');
    await queryInterface.dropTable('StudentFeedbacks');
  },
};
