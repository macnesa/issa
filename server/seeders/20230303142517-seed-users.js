'use strict';
const { hashPassword } = require('../helpers');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    let data = require('../data-seeding/user.json').map((x) => {
      x.createdAt = new Date();
      x.updatedAt = new Date();
      x.password = hashPassword(x.password);
      return x;
    });
    await queryInterface.bulkInsert('Users', data, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  },
};
