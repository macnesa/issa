import { buildJourneyEvents, getLatestScore } from './parentJourney';

describe('Parent journey projection', () => {
  it('keeps routine Hadir out of the narrative but keeps meaningful attendance', () => {
    const events = buildJourneyEvents({
      attendance: [
        { id: 1, status: 'Hadir', createdAt: '2026-09-04T08:00:00.000Z' },
        { id: 2, status: 'Izin', createdAt: '2026-09-03T08:00:00.000Z' },
      ],
    });

    expect(events.map((event) => event.title)).toEqual(['Kehadiran · Izin']);
  });

  it('does not duplicate evidence already attached to a journal entry', () => {
    const events = buildJourneyEvents({
      journal: [{
        id: 10,
        type: 'observation',
        observedAt: '2026-09-03',
        content: 'Menyelesaikan tugas mandiri.',
        evidence: { id: 20, title: 'Lembar kerja' },
      }],
      evidences: [{ id: 20, observedAt: '2026-09-03', title: 'Lembar kerja' }],
    });

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('journal');
  });

  it('sorts the mixed journey by event time instead of record family', () => {
    const events = buildJourneyEvents({
      scores: [{ id: 1, value: 80, recordedAt: '2026-09-01', lesson: { name: 'Matematika' } }],
      journal: [{ id: 2, observedAt: '2026-09-03', content: 'Catatan', type: 'observation' }],
      evidences: [{ id: 3, observedAt: '2026-09-02', title: 'Karya' }],
    });

    expect(events.map((event) => event.type)).toEqual(['journal', 'evidence', 'assessment']);
  });

  it('returns only the latest contextual assessment for the home pulse', () => {
    const latest = getLatestScore([
      { id: 1, value: 74, recordedAt: '2026-08-20' },
      { id: 2, value: 88, recordedAt: '2026-09-02' },
    ]);

    expect(latest.id).toBe(2);
    expect(latest.value).toBe(88);
  });
});
