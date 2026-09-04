import { fetchStudentList } from './ActionCreator';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function successfulResponse(payload) {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue(payload),
  };
}

describe('fetchStudentList request ordering', () => {
  beforeEach(() => {
    localStorage.access_token = 'teacher-token';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('does not let an older response overwrite a newer student list', async () => {
    const firstRequest = deferred();
    const secondRequest = deferred();
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise);
    vi.stubGlobal('fetch', fetchMock);
    const dispatch = vi.fn();

    const firstPromise = fetchStudentList({ name: 'Ari' }, 1, { requestKey: 'dashboard' })(dispatch);
    const secondPromise = fetchStudentList({ name: 'Bima' }, 1, { requestKey: 'dashboard' })(dispatch);

    secondRequest.resolve(successfulResponse({
      page: 1,
      rows: [{ id: 8, name: 'Bima' }],
    }));
    await expect(secondPromise).resolves.toEqual(expect.objectContaining({
      rows: [{ id: 8, name: 'Bima' }],
    }));

    firstRequest.resolve(successfulResponse({
      page: 1,
      rows: [{ id: 7, name: 'Ari' }],
    }));
    await expect(firstPromise).resolves.toEqual(expect.objectContaining({
      rows: [{ id: 7, name: 'Ari' }],
    }));

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({
        rows: [{ id: 8, name: 'Bima' }],
      }),
    }));
  });

  test('a superseded request resolves without dispatching stale data', async () => {
    const firstRequest = deferred();
    const secondRequest = deferred();
    vi.stubGlobal('fetch', vi.fn()
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise));
    const dispatch = vi.fn();

    const ignoredLegacyRefresh = fetchStudentList({}, 1, { requestKey: 'attendance' })(dispatch);
    const latestRequest = fetchStudentList({ name: 'Bima' }, 1, { requestKey: 'attendance' })(dispatch);

    secondRequest.resolve(successfulResponse({ rows: [{ id: 8, name: 'Bima' }] }));
    await latestRequest;
    firstRequest.resolve(successfulResponse({ rows: [{ id: 7, name: 'Ari' }] }));

    await expect(ignoredLegacyRefresh).resolves.toEqual({
      rows: [{ id: 7, name: 'Ari' }],
    });
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  test('passes an AbortSignal through to fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue(successfulResponse({ rows: [] }));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    await fetchStudentList({}, 1, { signal: controller.signal, requestKey: 'dashboard' })(vi.fn());

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/students?pageIndex=1'),
      expect.objectContaining({ signal: controller.signal })
    );
  });

  test('request ordering is isolated between independent consumers', async () => {
    const dashboardRequest = deferred();
    const attendanceRequest = deferred();
    vi.stubGlobal('fetch', vi.fn()
      .mockImplementationOnce(() => dashboardRequest.promise)
      .mockImplementationOnce(() => attendanceRequest.promise));
    const dispatch = vi.fn();

    const dashboardPromise = fetchStudentList({ name: 'Ari' }, 1, {
      requestKey: 'dashboard',
    })(dispatch);
    const attendancePromise = fetchStudentList({ name: 'Bima' }, 1, {
      requestKey: 'attendance',
    })(dispatch);

    attendanceRequest.resolve(successfulResponse({ rows: [{ id: 8, name: 'Bima' }] }));
    dashboardRequest.resolve(successfulResponse({ rows: [{ id: 7, name: 'Ari' }] }));
    await Promise.all([dashboardPromise, attendancePromise]);

    expect(dispatch).toHaveBeenCalledTimes(2);
  });

});
