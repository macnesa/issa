const { Assignment } = require('../../models');

function findAllAssignments() {
  return Assignment.findAll();
}

module.exports = {
  findAllAssignments,
};
