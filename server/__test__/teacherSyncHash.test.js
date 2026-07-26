const {
  hashMutationRequest,
} = require('../modules/teacher-sync/teacher-sync.hash');

describe('Teacher sync request hashing', () => {
  test('key order and optional null values produce a stable hash', () => {
    const firstHash = hashMutationRequest({
      type: 'journal.create',
      payload: {
        studentId: 7,
        type: 'observation',
        content: '  Catatan faktual.  ',
        observedAt: '2026-07-26',
      },
    });
    const secondHash = hashMutationRequest({
      payload: {
        observedAt: '2026-07-26T00:00:00.000Z',
        content: 'Catatan faktual.',
        voiceCaptureType: null,
        type: 'observation',
        studentId: '7',
      },
      type: 'journal.create',
      createdAt: '2026-07-27T01:00:00.000Z',
    });

    expect(firstHash).toBe(secondHash);
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('attendance baseVersion and payload changes alter the hash', () => {
    const mutation = {
      type: 'attendance.update',
      baseVersion: 2,
      payload: {
        studentId: 7,
        attendanceDate: '2026-07-26',
        status: 'Hadir',
      },
    };

    expect(hashMutationRequest(mutation)).not.toBe(hashMutationRequest({
      ...mutation,
      baseVersion: 3,
    }));
    expect(hashMutationRequest(mutation)).not.toBe(hashMutationRequest({
      ...mutation,
      payload: { ...mutation.payload, status: 'Izin' },
    }));
  });
});
