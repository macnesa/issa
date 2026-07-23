const scoreService = require('./score.service');

async function createStudentScore(req, res, next) {
  try {
    const { data, history } = await scoreService.createStudentScore({
      classId: req.user.classId,
      scorePayload: { ...req.body },
    });

    res.status(201).json({ data, history });
  } catch (error) {
    next(error);
  }
}

async function updateStudentScore(req, res, next) {
  try {
    const { data, history } = await scoreService.updateStudentScore({
      classId: req.user.classId,
      scorePayload: { ...req.body },
    });

    res.status(200).json({ data, history });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createStudentScore,
  updateStudentScore,
};
