import { act, render, waitFor } from '@testing-library/react';
import ParentLayout from './ParentLayout';

const testState = vi.hoisted(() => ({
  dispatch: vi.fn(),
  outletContext: null,
  recordHandler: null,
}));

vi.mock('react-redux', () => ({
  useDispatch: () => testState.dispatch,
  useSelector: (selector) => selector({
    student: {
      studentDetail: {
        data: { profile: { id: 1 } },
        error: null,
        loaded: true,
        loading: false,
      },
    },
  }),
}));

vi.mock('react-router', () => ({
  Outlet: ({ context }) => {
    testState.outletContext = context;
    return null;
  },
}));

vi.mock('../navigation/Header', () => ({ default: () => null }));
vi.mock('../navigation/BottomNav', () => ({ default: () => null }));
vi.mock('../utils/session', () => ({
  hasParentSession: () => true,
}));
vi.mock('../store/actions/actionCreator', () => ({
  fetchStudentOverview: () => ({ type: 'FETCH_STUDENT_OVERVIEW' }),
}));
vi.mock('../realtime/parentSocket', () => ({
  connectParentSocket: vi.fn(({ onStudentRecordUpdated }) => {
    testState.recordHandler = onStudentRecordUpdated;
    return vi.fn();
  }),
  isStudentRecordEventForActiveStudent: (event, studentId) => (
    Boolean(studentId) && String(event?.studentId) === String(studentId)
  ),
  isEvidenceRecordEventForActiveStudent: (event, studentId) => (
    Boolean(studentId)
    && String(event?.studentId) === String(studentId)
    && event?.recordType === 'evidence'
  ),
}));

describe('ParentLayout evidence realtime invalidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.setItem('access_token', 'parent-test-token');
    testState.dispatch.mockReset();
    testState.dispatch.mockResolvedValue(true);
    testState.outletContext = null;
    testState.recordHandler = null;
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  async function flushRealtimeDebounce() {
    await act(async () => {
      vi.advanceTimersByTime(150);
      await Promise.resolve();
    });
  }

  it('menaikkan evidence refresh key satu kali untuk event evidence siswa aktif', async () => {
    render(<ParentLayout />);

    act(() => {
      testState.recordHandler({
        studentId: 1,
        recordType: 'evidence',
        occurredAt: '2026-07-26T08:00:00.000Z',
      });
    });
    await flushRealtimeDebounce();

    await waitFor(() => {
      expect(testState.outletContext.studentEvidenceRefreshKey).toBe(1);
    });
    expect(testState.dispatch).toHaveBeenCalledTimes(1);
  });

  it('mengabaikan event evidence siswa lain', async () => {
    render(<ParentLayout />);

    act(() => {
      testState.recordHandler({ studentId: 2, recordType: 'evidence' });
    });
    await flushRealtimeDebounce();

    expect(testState.outletContext.studentEvidenceRefreshKey).toBe(0);
    expect(testState.dispatch).not.toHaveBeenCalled();
  });

  it('tidak menaikkan evidence refresh key untuk record type lain', async () => {
    render(<ParentLayout />);

    act(() => {
      testState.recordHandler({ studentId: 1, recordType: 'score' });
    });
    await flushRealtimeDebounce();

    expect(testState.outletContext.studentEvidenceRefreshKey).toBe(0);
    expect(testState.dispatch).toHaveBeenCalledTimes(1);
  });
});
