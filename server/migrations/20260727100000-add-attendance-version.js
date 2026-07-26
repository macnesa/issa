'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Attendances', 'version', {
      allowNull: false,
      defaultValue: 1,
      type: Sequelize.INTEGER,
    });

    await queryInterface.addConstraint('Attendances', {
      fields: ['version'],
      type: 'check',
      name: 'attendances_version_positive',
      where: {
        version: {
          [Sequelize.Op.gte]: 1,
        },
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      'Attendances',
      'attendances_version_positive'
    );
    await queryInterface.removeColumn('Attendances', 'version');
  },
};
