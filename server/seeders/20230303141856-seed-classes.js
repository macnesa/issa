'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    let data = require('../data-seeding/classes.json').map((x) => {
      x.createdAt = new Date();
      x.updatedAt = new Date();
      return x;
    });
    await queryInterface.bulkInsert('Classes', data, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Classes', null, {});
  },
};
