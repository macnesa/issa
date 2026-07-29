import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { fetchStudentEvidences } from '../studentEvidenceApi';
import StudentEvidenceSection from './StudentEvidenceSection';

vi.mock('../studentEvidenceApi', () => ({
  fetchStudentEvidences: vi.fn(),
}));

const evidence = {
  id: 1,
  title: 'Eksperimen sains',
  category: 'activity',
  description: 'Mengamati perubahan warna.',
  observedAt: '2026-07-25',
  teacher: { id: 1, name: 'Bu Rahma' },
  file: { url: 'https://example.test/evidence.jpg' },
};

describe('StudentEvidenceSection Parent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('menampilkan evidence list', async () => {
    fetchStudentEvidences.mockResolvedValue([evidence]);
    render(<StudentEvidenceSection studentId="1" />);

    expect(await screen.findByText('Eksperimen sains')).toBeInTheDocument();
    expect(screen.getByText('Aktivitas')).toBeInTheDocument();
    expect(screen.getByText('Guru: Bu Rahma')).toBeInTheDocument();
  });

  it('menampilkan empty state', async () => {
    fetchStudentEvidences.mockResolvedValue([]);
    render(<StudentEvidenceSection studentId="1" />);

    expect(await screen.findByText(
      'Belum ada dokumentasi perkembangan yang dibagikan.'
    )).toBeInTheDocument();
  });

  it('menampilkan error dan dapat retry', async () => {
    fetchStudentEvidences
      .mockRejectedValueOnce({ response: { status: 500, data: {} } })
      .mockResolvedValueOnce([evidence]);
    render(<StudentEvidenceSection studentId="1" />);

    expect(await screen.findByText('Dokumentasi belum dapat dimuat.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));

    expect(await screen.findByText('Eksperimen sains')).toBeInTheDocument();
    expect(fetchStudentEvidences).toHaveBeenCalledTimes(2);
  });

  it('membatasi daftar menjadi enam evidence', async () => {
    fetchStudentEvidences.mockResolvedValue(
      Array.from({ length: 8 }, (_, index) => ({
        ...evidence,
        id: index + 1,
        title: `Evidence ${index + 1}`,
      }))
    );
    render(<StudentEvidenceSection studentId="1" />);

    await screen.findByText('Evidence 1');
    expect(screen.getAllByRole('button', { name: /Buka gambar/ })).toHaveLength(6);
    expect(screen.queryByText('Evidence 7')).not.toBeInTheDocument();
  });

  it('membuka viewer dan dapat menutupnya', async () => {
    fetchStudentEvidences.mockResolvedValue([evidence]);
    render(<StudentEvidenceSection studentId="1" />);
    const openViewerButton = await screen.findByRole('button', {
      name: 'Buka gambar Eksperimen sains',
    });
    await act(async () => {
      fireEvent.click(openViewerButton);
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Eksperimen sains' })).toHaveAttribute(
      'src',
      evidence.file.url
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tutup gambar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 20));
    });
  });

  it('melakukan tepat satu refetch ketika refresh key evidence berubah', async () => {
    fetchStudentEvidences.mockResolvedValue([evidence]);
    const { rerender } = render(
      <StudentEvidenceSection studentId="1" refreshKey={0} />
    );
    await screen.findByText('Eksperimen sains');
    expect(fetchStudentEvidences).toHaveBeenCalledTimes(1);

    rerender(<StudentEvidenceSection studentId="1" refreshKey={1} />);
    await waitFor(() => expect(fetchStudentEvidences).toHaveBeenCalledTimes(2));
    rerender(<StudentEvidenceSection studentId="1" refreshKey={1} />);
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    expect(fetchStudentEvidences).toHaveBeenCalledTimes(2);
  });

  it('mempertahankan viewer dan memakai metadata terbaru setelah refetch', async () => {
    const correctedEvidence = {
      ...evidence,
      title: 'Eksperimen warna terkoreksi',
      category: 'assessment',
      description: 'Metadata terbaru dari guru.',
      observedAt: '2026-07-24',
    };
    fetchStudentEvidences
      .mockResolvedValueOnce([evidence])
      .mockResolvedValueOnce([correctedEvidence]);
    const { rerender } = render(
      <StudentEvidenceSection studentId="1" refreshKey={0} />
    );

    fireEvent.click(await screen.findByRole('button', {
      name: 'Buka gambar Eksperimen sains',
    }));
    const viewer = await screen.findByRole('dialog');

    rerender(<StudentEvidenceSection studentId="1" refreshKey={1} />);

    await waitFor(() => {
      expect(fetchStudentEvidences).toHaveBeenCalledTimes(2);
      expect(within(viewer).getByRole('heading', {
        name: 'Eksperimen warna terkoreksi',
      })).toBeInTheDocument();
    });
    expect(within(viewer).getByRole('img', {
      name: 'Eksperimen warna terkoreksi',
    })).toHaveAttribute('src', evidence.file.url);
    expect(within(viewer).getByText('Penilaian')).toBeInTheDocument();
    expect(within(viewer).getByText('24 Juli 2026')).toBeInTheDocument();
    expect(within(viewer).getByText(
      'Metadata terbaru dari guru.'
    )).toBeInTheDocument();
  });

  it('menghilangkan evidence, menutup viewer, dan memindahkan fokus setelah retraction', async () => {
    fetchStudentEvidences
      .mockResolvedValueOnce([evidence])
      .mockResolvedValueOnce([]);
    const { rerender } = render(
      <StudentEvidenceSection studentId="1" refreshKey={0} />
    );

    fireEvent.click(await screen.findByRole('button', {
      name: 'Buka gambar Eksperimen sains',
    }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    rerender(<StudentEvidenceSection studentId="1" refreshKey={1} />);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('Eksperimen sains')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', {
        name: 'Dokumentasi belajar terbaru',
      })).toHaveFocus();
    });
    expect(screen.getByText(
      'Belum ada dokumentasi perkembangan yang dibagikan.'
    )).toBeInTheDocument();
  });

  it('menutup viewer ketika active student berubah', async () => {
    fetchStudentEvidences.mockImplementation((studentId) => Promise.resolve(
      studentId === '1'
        ? [evidence]
        : [{ ...evidence, id: 2, title: 'Evidence siswa kedua' }]
    ));
    const { rerender } = render(
      <StudentEvidenceSection studentId="1" />
    );

    fireEvent.click(await screen.findByRole('button', {
      name: 'Buka gambar Eksperimen sains',
    }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    rerender(<StudentEvidenceSection studentId="2" />);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(await screen.findByText('Evidence siswa kedua')).toBeInTheDocument();
  });
});
