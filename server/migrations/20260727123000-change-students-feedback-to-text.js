'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Students', 'feedback', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback can fail when existing feedback exceeds VARCHAR(255).
    await queryInterface.changeColumn('Students', 'feedback', {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
    });
  },
};
