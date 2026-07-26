import { act, render, screen, waitFor } from '@testing-library/react';
import { connectParentSocket } from '../realtime/parentSocket';
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
  isJournalRecordEventForActiveStudent: (event, studentId) => (
    Boolean(studentId)
    && String(event?.studentId) === String(studentId)
    && event?.recordType === 'journal'
  ),
}));

describe('ParentLayout journal realtime invalidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.setItem('access_token', 'parent-test-token');
    testState.dispatch.mockReset();
    testState.dispatch.mockResolvedValue(true);
    testState.outletContext = null;
    testState.recordHandler = null;
    connectParentSocket.mockClear();
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

  it('menaikkan journal refresh key satu kali dan mempertahankan notice', async () => {
    render(<ParentLayout />);

    act(() => {
      testState.recordHandler({
        studentId: 1,
        recordType: 'journal',
        occurredAt: '2026-07-26T08:00:00.000Z',
      });
    });
    await flushRealtimeDebounce();

    await waitFor(() => {
      expect(testState.outletContext.studentJournalRefreshKey).toBe(1);
    });
    expect(testState.dispatch).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Catatan siswa diperbarui')).toBeInTheDocument();
  });

  it('mengabaikan journal event siswa lain', async () => {
    render(<ParentLayout />);

    act(() => {
      testState.recordHandler({ studentId: 2, recordType: 'journal' });
    });
    await flushRealtimeDebounce();

    expect(testState.outletContext.studentJournalRefreshKey).toBe(0);
    expect(testState.dispatch).not.toHaveBeenCalled();
  });

  it('tidak memicu journal refetch untuk record type lain', async () => {
    render(<ParentLayout />);

    act(() => {
      testState.recordHandler({ studentId: 1, recordType: 'score' });
    });
    await flushRealtimeDebounce();

    expect(testState.outletContext.studentJournalRefreshKey).toBe(0);
    expect(testState.dispatch).toHaveBeenCalledTimes(1);
  });

  it('mendedupe burst event journal menjadi satu invalidation', async () => {
    render(<ParentLayout />);

    act(() => {
      testState.recordHandler({ studentId: 1, recordType: 'journal' });
      testState.recordHandler({ studentId: 1, recordType: 'journal' });
      testState.recordHandler({ studentId: 1, recordType: 'journal' });
    });
    await flushRealtimeDebounce();

    expect(testState.outletContext.studentJournalRefreshKey).toBe(1);
    expect(testState.dispatch).toHaveBeenCalledTimes(1);
  });

  it('tidak memasang koneksi atau listener baru setelah rerender', async () => {
    const { rerender } = render(<ParentLayout />);
    expect(connectParentSocket).toHaveBeenCalledTimes(1);

    rerender(<ParentLayout />);
    expect(connectParentSocket).toHaveBeenCalledTimes(1);

    act(() => {
      testState.recordHandler({ studentId: 1, recordType: 'journal' });
    });
    await flushRealtimeDebounce();

    expect(connectParentSocket).toHaveBeenCalledTimes(1);
    expect(testState.outletContext.studentJournalRefreshKey).toBe(1);
  });
});
