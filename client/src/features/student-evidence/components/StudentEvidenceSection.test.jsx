import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
});
