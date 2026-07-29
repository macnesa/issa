import { render, screen, within } from '@testing-library/react';
import { fetchStudentLearningJournal } from '../../student-learning-journal/studentLearningJournalApi';
import StudentLearningJournalSection from '../../student-learning-journal/components/StudentLearningJournalSection';
import { fetchStudentEvidences } from '../studentEvidenceApi';
import StudentEvidenceSection from './StudentEvidenceSection';

vi.mock('../studentEvidenceApi', () => ({
  fetchStudentEvidences: vi.fn(),
}));

vi.mock('../../student-learning-journal/studentLearningJournalApi', () => ({
  fetchStudentLearningJournal: vi.fn(),
}));

const evidence = {
  id: 7,
  title: 'Diagram pecahan Ari',
  category: 'work',
  description: 'Dokumentasi proses belajar.',
  observedAt: '2026-07-25',
  teacher: { id: 2, name: 'Guru Rina' },
  file: { url: 'https://example.test/evidence.jpg' },
};

const journalEntry = {
  id: 21,
  studentId: 1,
  type: 'observation',
  content: 'Ari menggunakan diagram untuk memeriksa jawaban pecahan.',
  voiceCaptureType: null,
  observedAt: '2026-07-26',
  teacher: { id: 2, name: 'Guru Rina' },
  evidence: null,
  wasEdited: false,
};

describe('Parent Evidence dan Journal error isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mempertahankan Journal ketika Evidence gagal dimuat', async () => {
    fetchStudentEvidences.mockRejectedValue({
      response: { status: 500, data: {} },
    });
    fetchStudentLearningJournal.mockResolvedValue([journalEntry]);

    render(
      <>
        <StudentLearningJournalSection studentId="1" />
        <StudentEvidenceSection studentId="1" />
      </>
    );

    await screen.findByText(journalEntry.content);
    const journal = screen.getByRole('region', {
      name: 'Perjalanan belajar terbaru',
    });
    const evidenceSection = screen.getByRole('region', {
      name: 'Dokumentasi belajar terbaru',
    });

    expect(within(journal).getByText(journalEntry.content)).toBeInTheDocument();
    expect(within(evidenceSection).getByText(
      'Dokumentasi belum dapat dimuat.'
    )).toBeInTheDocument();
    expect(within(evidenceSection).getByRole('button', {
      name: 'Coba lagi',
    })).toBeInTheDocument();
  });

  it('mempertahankan Evidence ketika Journal gagal dimuat', async () => {
    fetchStudentEvidences.mockResolvedValue([evidence]);
    fetchStudentLearningJournal.mockRejectedValue({
      response: { status: 500, data: {} },
    });

    render(
      <>
        <StudentLearningJournalSection studentId="1" />
        <StudentEvidenceSection studentId="1" />
      </>
    );

    await screen.findByText('Jurnal belajar belum dapat dimuat.');
    const journal = screen.getByRole('region', {
      name: 'Perjalanan belajar terbaru',
    });
    const evidenceSection = screen.getByRole('region', {
      name: 'Dokumentasi belajar terbaru',
    });

    expect(within(journal).getByText(
      'Jurnal belajar belum dapat dimuat.'
    )).toBeInTheDocument();
    expect(within(journal).getByRole('button', {
      name: 'Coba lagi',
    })).toBeInTheDocument();
    expect(within(evidenceSection).getByText(evidence.title)).toBeInTheDocument();
  });
});
