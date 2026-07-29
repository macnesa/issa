'use strict';

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

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StudentLearningJournals', {
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
      EvidenceId: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: { tableName: 'StudentEvidences' },
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      type: {
        allowNull: false,
        type: Sequelize.ENUM(...journalEntryTypes),
      },
      content: {
        allowNull: false,
        type: Sequelize.STRING(1500),
      },
      voiceCaptureType: {
        allowNull: true,
        type: Sequelize.ENUM(...voiceCaptureTypes),
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
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addConstraint('StudentLearningJournals', {
      fields: ['type', 'voiceCaptureType'],
      type: 'check',
      name: 'student_learning_journals_voice_capture_semantics_check',
      where: {
        [Sequelize.Op.or]: [
          {
            type: 'student_reflection',
            voiceCaptureType: {
              [Sequelize.Op.in]: voiceCaptureTypes,
            },
          },
          {
            type: {
              [Sequelize.Op.ne]: 'student_reflection',
            },
            voiceCaptureType: null,
          },
        ],
      },
    });

    const indexes = [
      ['StudentId'],
      ['TeacherId'],
      ['EvidenceId'],
      ['observedAt'],
      ['createdAt'],
      ['deletedAt'],
      ['StudentId', 'deletedAt', 'observedAt', 'createdAt'],
    ];
    const indexNames = [
      'student_learning_journals_student_index',
      'student_learning_journals_teacher_index',
      'student_learning_journals_evidence_index',
      'student_learning_journals_observed_index',
      'student_learning_journals_created_index',
      'student_learning_journals_deleted_index',
      'student_learning_journals_student_active_order_index',
    ];
    for (let index = 0; index < indexes.length; index += 1) {
      await queryInterface.addIndex('StudentLearningJournals', indexes[index], {
        name: indexNames[index],
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('StudentLearningJournals');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_StudentLearningJournals_type";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_StudentLearningJournals_voiceCaptureType";'
    );
  },
};
