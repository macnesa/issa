const studentInsightService = require('./student-insight.service');

async function getStudentInsights(req, res, next) {
  try {
    const insights = await studentInsightService.getStudentInsights({
      studentId: req.params.studentId,
      requester: req.user,
      requestedAt: new Date(),
    });

    res.status(200).json(insights);
  } catch (error) {
    next(error);
  }
}

async function getTeacherAttention(req, res, next) {
  try {
    const attentionQueue = await studentInsightService.getTeacherAttention({
      classId: req.user.classId,
      requestedAt: new Date(),
    });

    res.status(200).json(attentionQueue);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStudentInsights,
  getTeacherAttention,
};
