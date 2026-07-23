const assignmentService = require('./assignment.service');

async function getAssignmentList(req, res, next) {
  try {
    const assignments = await assignmentService.getAssignmentList();
    res.status(200).json(assignments);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAssignmentList,
};
