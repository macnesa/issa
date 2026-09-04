import apiClient from '../../config/apiClient';
import { fetchStudentOverview, fetchClassSchedule, fetchSchoolActivities } from './actionCreator';
import { STUDENT_DETAIL_FAILURE, STUDENT_DETAIL_SUCCESS, CLASS_SCHEDULE_FAILURE, CLASS_SCHEDULE_SUCCESS, ACTIVITY_FAILURE, ACTIVITY_SUCCESS } from './actionTypes';

vi.mock('../../config/apiClient', () => ({ default: { get: vi.fn() } }));

describe('Parent resource truth', () => {
  it.each([
    [fetchStudentOverview, STUDENT_DETAIL_FAILURE, STUDENT_DETAIL_SUCCESS],
    [fetchClassSchedule, CLASS_SCHEDULE_FAILURE, CLASS_SCHEDULE_SUCCESS],
    [fetchSchoolActivities, ACTIVITY_FAILURE, ACTIVITY_SUCCESS],
  ])('rejects malformed data instead of publishing a successful empty resource', async (action, failure, success) => {
    apiClient.get.mockResolvedValue({ data: {} });
    const dispatch = vi.fn();
    await action()(dispatch);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: failure }));
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: success }));
  });
  it('accepts a genuinely empty child history', async () => {
    apiClient.get.mockResolvedValue({ data: { id: 1, Attendances: [], Scores: [] } });
    const dispatch = vi.fn();
    await fetchStudentOverview()(dispatch);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: STUDENT_DETAIL_SUCCESS, payload: expect.objectContaining({ attendance: [], scores: [] }) }));
  });
});
