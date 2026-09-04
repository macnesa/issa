jest.mock('../modules/feedback/feedback.service', () => ({ getStudentFeedbackHistory: jest.fn(), updateStudentFeedback: jest.fn() }));
jest.mock('../middlewares/authentication', () => ({ authenticateActorRequest: jest.fn(), authenticateTeacherRequest: jest.fn() }));
jest.mock('../middlewares/public-demo-access', () => ({ requireWritableAccount: jest.fn() }));
const service = require('../modules/feedback/feedback.service');
const { getStudentFeedbackHistory } = require('../modules/feedback/feedback.controller');
const auth = require('../middlewares/authentication');
const router = require('../modules/feedback/feedback.route');

describe('Parent feedback read boundary', () => {
  beforeEach(() => { jest.clearAllMocks(); service.getStudentFeedbackHistory.mockResolvedValue([{ id: 1, content: 'History' }]); });
  async function request(user, id = '1') {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await getStudentFeedbackHistory({ user, params: { id } }, res, next);
    return { res, next };
  }
  test('allows the authenticated parent to read their own child history', async () => {
    const { res, next } = await request({ role: 'parent', studentId: 1, classId: 3 });
    expect(res.status).toHaveBeenCalledWith(200); expect(next).not.toHaveBeenCalled();
    expect(service.getStudentFeedbackHistory).toHaveBeenCalledWith({ studentId: '1', classId: 3 });
  });
  test('rejects another child even inside the same class', async () => {
    const { next } = await request({ role: 'parent', studentId: 2, classId: 3 });
    expect(next).toHaveBeenCalledWith({ name: 'notFound' }); expect(service.getStudentFeedbackHistory).not.toHaveBeenCalled();
  });
  test('preserves teacher class-scoped history access', async () => {
    const { res } = await request({ role: 'teacher', classId: 3 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(service.getStudentFeedbackHistory).toHaveBeenCalledWith({ studentId: '1', classId: 3 });
  });
  test('propagates unavailable history instead of manufacturing an empty list', async () => {
    service.getStudentFeedbackHistory.mockRejectedValue(new Error('unavailable'));
    const { next, res } = await request({ role: 'parent', studentId: 1, classId: 3 });
    expect(next).toHaveBeenCalledWith(expect.any(Error)); expect(res.json).not.toHaveBeenCalled();
  });
  test('authenticates all readers and keeps write access teacher-only', () => {
    const read = router.stack.find((layer) => layer.route?.methods.get).route;
    const write = router.stack.find((layer) => layer.route?.methods.put).route;
    expect(read.stack[0].handle).toBe(auth.authenticateActorRequest);
    expect(write.stack[0].handle).toBe(auth.authenticateTeacherRequest);
  });
});
