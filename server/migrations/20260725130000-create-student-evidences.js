'use strict';

const evidenceCategories = [
  'work',
  'assignment',
  'assessment',
  'activity',
  'documentation',
];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StudentEvidences', {
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
      title: {
        allowNull: false,
        type: Sequelize.STRING(120),
      },
      category: {
        allowNull: false,
        type: Sequelize.ENUM(...evidenceCategories),
      },
      description: {
        allowNull: true,
        type: Sequelize.STRING(500),
      },
      observedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      fileUrl: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      cloudinaryPublicId: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      format: {
        allowNull: false,
        type: Sequelize.STRING(16),
      },
      fileSize: {
        allowNull: false,
        type: Sequelize.INTEGER,
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

    await queryInterface.addIndex(
      'StudentEvidences',
      ['StudentId', 'observedAt', 'createdAt'],
      { name: 'student_evidences_student_observed_created_index' }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'StudentEvidences',
      'student_evidences_student_observed_created_index'
    );
    await queryInterface.dropTable('StudentEvidences');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_StudentEvidences_category";'
    );
  },
};
