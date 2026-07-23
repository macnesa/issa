const assignmentRepository = require('./assignment.repository');

function getAssignmentList() {
  return assignmentRepository.findAllAssignments();
}

module.exports = {
  getAssignmentList,
};
