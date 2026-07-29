'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('StudentEvidences', 'retractedAt', {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.addColumn('StudentEvidences', 'retractionReason', {
      allowNull: true,
      type: Sequelize.STRING(300),
    });
    await queryInterface.addColumn(
      'StudentEvidences',
      'RetractedByTeacherId',
      {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: { tableName: 'Teachers' },
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }
    );
    await queryInterface.addColumn('StudentEvidences', 'deletedAt', {
      allowNull: true,
      type: Sequelize.DATE,
    });

    await queryInterface.addIndex(
      'StudentEvidences',
      ['RetractedByTeacherId'],
      { name: 'student_evidences_retracted_by_teacher_index' }
    );
    await queryInterface.addIndex(
      'StudentEvidences',
      ['deletedAt'],
      { name: 'student_evidences_deleted_index' }
    );
    await queryInterface.addIndex(
      'StudentEvidences',
      ['StudentId', 'deletedAt', 'observedAt', 'createdAt'],
      { name: 'student_evidences_student_active_order_index' }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'StudentEvidences',
      'student_evidences_student_active_order_index'
    );
    await queryInterface.removeIndex(
      'StudentEvidences',
      'student_evidences_deleted_index'
    );
    await queryInterface.removeIndex(
      'StudentEvidences',
      'student_evidences_retracted_by_teacher_index'
    );
    await queryInterface.removeColumn(
      'StudentEvidences',
      'RetractedByTeacherId'
    );
    await queryInterface.removeColumn('StudentEvidences', 'retractionReason');
    await queryInterface.removeColumn('StudentEvidences', 'retractedAt');
    await queryInterface.removeColumn('StudentEvidences', 'deletedAt');
  },
};
