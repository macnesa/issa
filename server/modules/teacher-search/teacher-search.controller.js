const teacherSearchService = require('./teacher-search.service');

async function searchTeacherRecords(req, res, next) {
  try {
    const searchResponse = await teacherSearchService.searchTeacherRecords({
      requester: req.user,
      queryParameters: req.query,
    });
    res.status(200).json(searchResponse);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  searchTeacherRecords,
};
