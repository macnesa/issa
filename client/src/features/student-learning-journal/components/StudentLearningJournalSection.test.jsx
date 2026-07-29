import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { fetchStudentLearningJournal } from '../studentLearningJournalApi';
import StudentLearningJournalSection from './StudentLearningJournalSection';

vi.mock('../studentLearningJournalApi', () => ({
  fetchStudentLearningJournal: vi.fn(),
}));

const evidence = {
  id: 7,
  title: 'Hasil latihan Matematika',
  category: 'assignment',
  observedAt: '2026-07-25',
  file: { url: 'https://example.test/evidence.jpg' },
};

const observationEntry = {
  id: 21,
  studentId: 1,
  type: 'observation',
  content: 'Ari menggunakan diagram untuk memeriksa jawaban pecahan.',
  voiceCaptureType: null,
  observedAt: '2026-07-26',
  teacher: { id: 2, name: 'Guru Rina' },
  evidence,
  createdAt: '2026-07-26T08:00:00.000Z',
  updatedAt: '2026-07-26T09:00:00.000Z',
  wasEdited: true,
};

const directReflectionEntry = {
  ...observationEntry,
  id: 22,
  type: 'student_reflection',
  content: 'Aku lebih mudah memahami pecahan ketika digambar.',
  voiceCaptureType: 'direct_quote',
  evidence: null,
  wasEdited: false,
};

const paraphrasedReflectionEntry = {
  ...observationEntry,
  id: 23,
  type: 'student_reflection',
  content: 'Ari menyampaikan bahwa diagram membantunya memahami pecahan.',
  voiceCaptureType: 'paraphrased',
  evidence: null,
  wasEdited: false,
};

function deferredPromise() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

describe('StudentLearningJournalSection Parent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('menampilkan loading lalu daftar journal sesuai urutan server', async () => {
    const request = deferredPromise();
    fetchStudentLearningJournal.mockReturnValue(request.promise);

    render(<StudentLearningJournalSection studentId="1" />);

    expect(screen.getByLabelText('Memuat jurnal belajar')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Catatan yang dibagikan guru mengenai proses, refleksi, dan perkembangan belajar.'
      )
    ).toBeInTheDocument();

    await act(async () => {
      request.resolve([directReflectionEntry, observationEntry]);
    });

    const entries = await screen.findAllByRole('listitem');
    expect(entries[0]).toHaveTextContent(directReflectionEntry.content);
    expect(entries[1]).toHaveTextContent(observationEntry.content);
  });

  it('menampilkan empty state', async () => {
    fetchStudentLearningJournal.mockResolvedValue([]);

    render(<StudentLearningJournalSection studentId="1" />);

    expect(
      await screen.findByText(
        'Belum ada catatan perjalanan belajar yang dibagikan.'
      )
    ).toBeInTheDocument();
  });

  it('menampilkan error, mempertahankan sibling, dan dapat retry', async () => {
    fetchStudentLearningJournal
      .mockRejectedValueOnce({ response: { status: 500, data: {} } })
      .mockResolvedValueOnce([observationEntry]);

    render(
      <>
        <p>Perubahan terbaru tetap tersedia.</p>
        <StudentLearningJournalSection studentId="1" />
        <p>Bukti perkembangan tetap tersedia.</p>
      </>
    );

    expect(
      await screen.findByText('Jurnal belajar belum dapat dimuat.')
    ).toBeInTheDocument();
    expect(screen.getByText('Perubahan terbaru tetap tersedia.')).toBeInTheDocument();
    expect(screen.getByText('Bukti perkembangan tetap tersedia.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
    expect(await screen.findByText(observationEntry.content)).toBeInTheDocument();
    expect(fetchStudentLearningJournal).toHaveBeenCalledTimes(2);
  });

  it('membatasi daftar menjadi enam entry dan memakai label manusiawi', async () => {
    const typedEntries = [
      ['observation', 'Observasi guru'],
      ['strength', 'Kekuatan yang terlihat'],
      ['challenge', 'Hal yang sedang membutuhkan dukungan'],
      ['milestone', 'Momen perkembangan'],
      ['student_reflection', 'Refleksi siswa'],
      ['support_note', 'Dukungan yang dicoba'],
      ['observation', 'Observasi guru'],
    ].map(([type], index) => ({
      ...observationEntry,
      id: index + 1,
      type,
      voiceCaptureType: type === 'student_reflection' ? 'direct_quote' : null,
      content: `Catatan ${index + 1}`,
      evidence: null,
    }));
    fetchStudentLearningJournal.mockResolvedValue(typedEntries);

    render(<StudentLearningJournalSection studentId="1" />);
    await screen.findByText('Catatan 1');

    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.queryByText('Catatan 7')).not.toBeInTheDocument();
    expect(screen.getByText('Observasi guru')).toBeInTheDocument();
    expect(screen.getByText('Kekuatan yang terlihat')).toBeInTheDocument();
    expect(screen.getByText('Hal yang sedang membutuhkan dukungan')).toBeInTheDocument();
    expect(screen.getByText('Momen perkembangan')).toBeInTheDocument();
    expect(screen.getByText('Refleksi siswa')).toBeInTheDocument();
    expect(screen.getByText('Dukungan yang dicoba')).toBeInTheDocument();
  });

  it('membedakan kutipan langsung dan rangkuman serta menyebut Teacher', async () => {
    fetchStudentLearningJournal.mockResolvedValue([
      directReflectionEntry,
      paraphrasedReflectionEntry,
    ]);

    render(<StudentLearningJournalSection studentId="1" />);
    const directContent = await screen.findByText(directReflectionEntry.content);
    const paraphrasedContent = screen.getByText(paraphrasedReflectionEntry.content);

    expect(directContent.tagName).toBe('BLOCKQUOTE');
    expect(paraphrasedContent.tagName).toBe('P');
    expect(screen.getByText(/Kutipan langsung/)).toBeInTheDocument();
    expect(screen.getByText(/Dirangkum oleh guru/)).toBeInTheDocument();
    expect(screen.getAllByText('Dicatat oleh Guru Rina')).toHaveLength(2);
  });

  it('menampilkan status Diedit dan linked evidence', async () => {
    fetchStudentLearningJournal.mockResolvedValue([observationEntry]);

    render(<StudentLearningJournalSection studentId="1" />);
    const entry = await screen.findByRole('listitem');

    expect(within(entry).getByText('Diedit')).toBeInTheDocument();
    expect(within(entry).getByText('Hasil latihan Matematika')).toBeInTheDocument();
    expect(within(entry).getByText(/Tugas · 25 Juli 2026/)).toBeInTheDocument();
    expect(
      within(entry).getByRole('img', { name: 'Hasil latihan Matematika' })
    ).toHaveAttribute('src', evidence.file.url);
  });

  it('membuka viewer evidence, Escape menutup, dan fokus kembali ke thumbnail', async () => {
    fetchStudentLearningJournal.mockResolvedValue([observationEntry]);
    render(<StudentLearningJournalSection studentId="1" />);
    const openViewer = await screen.findByRole('button', {
      name: 'Buka evidence Hasil latihan Matematika',
    });

    await act(async () => {
      fireEvent.click(openViewer);
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      await new Promise((resolve) => window.setTimeout(resolve, 20));
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(openViewer).toHaveFocus();
  });

  it('mengabaikan response lama ketika active student berubah', async () => {
    const firstStudentRequest = deferredPromise();
    const secondStudentRequest = deferredPromise();
    fetchStudentLearningJournal.mockImplementation((studentId) => (
      studentId === '1' ? firstStudentRequest.promise : secondStudentRequest.promise
    ));

    const { rerender } = render(
      <StudentLearningJournalSection studentId="1" />
    );
    rerender(<StudentLearningJournalSection studentId="2" />);

    await act(async () => {
      secondStudentRequest.resolve([
        { ...observationEntry, id: 30, studentId: 2, content: 'Catatan siswa kedua.' },
      ]);
    });
    expect(await screen.findByText('Catatan siswa kedua.')).toBeInTheDocument();

    await act(async () => {
      firstStudentRequest.resolve([
        { ...observationEntry, content: 'Response siswa pertama yang terlambat.' },
      ]);
    });
    expect(
      screen.queryByText('Response siswa pertama yang terlambat.')
    ).not.toBeInTheDocument();
  });

  it('melakukan tepat satu refetch ketika refresh key berubah', async () => {
    fetchStudentLearningJournal.mockResolvedValue([observationEntry]);
    const { rerender } = render(
      <StudentLearningJournalSection studentId="1" refreshKey={0} />
    );
    await screen.findByText(observationEntry.content);
    expect(fetchStudentLearningJournal).toHaveBeenCalledTimes(1);

    rerender(<StudentLearningJournalSection studentId="1" refreshKey={1} />);
    await waitFor(() => {
      expect(fetchStudentLearningJournal).toHaveBeenCalledTimes(2);
    });
    rerender(<StudentLearningJournalSection studentId="1" refreshKey={1} />);
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    expect(fetchStudentLearningJournal).toHaveBeenCalledTimes(2);
  });

  it('memperbarui linked evidence dan viewer tanpa menutupnya saat metadata berubah', async () => {
    const refreshedRequest = deferredPromise();
    const correctedEntry = {
      ...observationEntry,
      evidence: {
        ...evidence,
        title: 'Hasil latihan terkoreksi',
        category: 'assessment',
        observedAt: '2026-07-24',
        availability: 'available',
      },
    };
    fetchStudentLearningJournal
      .mockResolvedValueOnce([observationEntry])
      .mockReturnValueOnce(refreshedRequest.promise);
    const { rerender } = render(
      <StudentLearningJournalSection studentId="1" refreshKey={0} />
    );

    fireEvent.click(await screen.findByRole('button', {
      name: 'Buka evidence Hasil latihan Matematika',
    }));
    const viewer = await screen.findByRole('dialog');

    rerender(
      <StudentLearningJournalSection studentId="1" refreshKey={1} />
    );
    await waitFor(() => {
      expect(fetchStudentLearningJournal).toHaveBeenCalledTimes(2);
    });
    await act(async () => {
      refreshedRequest.resolve([correctedEntry]);
    });

    await waitFor(() => {
      expect(screen.getAllByText('Hasil latihan terkoreksi')).toHaveLength(2);
      expect(within(viewer).getByRole('heading', {
        name: 'Hasil latihan terkoreksi',
      })).toBeInTheDocument();
    });
    expect(screen.getByText(/Penilaian · 24 Juli 2026/)).toBeInTheDocument();
    expect(within(viewer).getByRole('img', {
      name: 'Hasil latihan terkoreksi',
    })).toHaveAttribute('src', evidence.file.url);
    expect(within(viewer).getByText('Penilaian')).toBeInTheDocument();
    expect(within(viewer).getByText('24 Juli 2026')).toBeInTheDocument();
  });

  it('mempertahankan journal sebagai tombstone aman dan menutup viewer setelah retraction', async () => {
    const retractedRequest = deferredPromise();
    const retractedEntry = {
      ...observationEntry,
      evidence: {
        ...evidence,
        availability: 'retracted',
        file: null,
        retractionReason: 'Alasan internal tidak boleh terlihat.',
        deletedAt: '2026-07-26T10:00:00.000Z',
      },
    };
    fetchStudentLearningJournal
      .mockResolvedValueOnce([observationEntry])
      .mockReturnValueOnce(retractedRequest.promise);
    const { rerender } = render(
      <StudentLearningJournalSection studentId="1" refreshKey={0} />
    );

    fireEvent.click(await screen.findByRole('button', {
      name: 'Buka evidence Hasil latihan Matematika',
    }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    rerender(
      <StudentLearningJournalSection studentId="1" refreshKey={1} />
    );
    await waitFor(() => {
      expect(fetchStudentLearningJournal).toHaveBeenCalledTimes(2);
    });
    await act(async () => {
      retractedRequest.resolve([retractedEntry]);
    });

    const entry = await screen.findByRole('listitem');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(within(entry).getByText(
        'Evidence terkait telah dicabut dan tidak lagi tersedia.'
      )).toBeInTheDocument();
      expect(screen.getByRole('heading', {
        name: 'Perjalanan belajar terbaru',
      })).toHaveFocus();
    });
    expect(within(entry).getByText(observationEntry.content)).toBeInTheDocument();
    expect(within(entry).getByText('Hasil latihan Matematika')).toBeInTheDocument();
    expect(within(entry).getByText(/Tugas · 25 Juli 2026/)).toBeInTheDocument();
    expect(within(entry).queryByRole('img')).not.toBeInTheDocument();
    expect(within(entry).queryByRole('link')).not.toBeInTheDocument();
    expect(within(entry).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Alasan internal tidak boleh terlihat.')).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('2026-07-26T10:00:00.000Z');
  });
});
