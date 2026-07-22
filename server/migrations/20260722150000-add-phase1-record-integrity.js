'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Attendances', 'attendanceDate', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    await queryInterface.addConstraint('Attendances', {
      fields: ['StudentId', 'attendanceDate'],
      type: 'unique',
      name: 'attendances_student_attendance_date_unique',
    });

    await queryInterface.addConstraint('Attendances', {
      fields: ['status'],
      type: 'check',
      where: {
        status: ['Hadir', 'Sakit', 'Izin', 'Alfa'],
      },
      name: 'attendances_status_allowed',
    });

    await queryInterface.addColumn('Scores', 'recordedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addConstraint('Scores', {
      fields: ['StudentId', 'LessonId', 'AssignmentId'],
      type: 'unique',
      name: 'scores_student_lesson_assignment_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('Scores', 'scores_student_lesson_assignment_unique');
    await queryInterface.removeColumn('Scores', 'recordedAt');
    await queryInterface.removeConstraint('Attendances', 'attendances_status_allowed');
    await queryInterface.removeConstraint('Attendances', 'attendances_student_attendance_date_unique');
    await queryInterface.removeColumn('Attendances', 'attendanceDate');
  },
};
