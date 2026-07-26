import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  createStudentEvidence,
  fetchStudentEvidences,
} from '../studentEvidenceApi';
import StudentEvidenceSection from './StudentEvidenceSection';

vi.mock('../studentEvidenceApi', () => ({
  createStudentEvidence: vi.fn(),
  fetchStudentEvidences: vi.fn(),
}));

const evidence = {
  id: 7,
  title: 'Kolase bentuk',
  category: 'work',
  description: 'Menyusun bentuk dengan rapi.',
  observedAt: '2026-07-25',
  teacher: { id: 1, name: 'Bu Rahma' },
  file: { url: 'https://example.test/evidence.jpg', format: 'jpg', size: 2_048 },
};

function imageFile() {
  return new File(['record'], 'record.png', { type: 'image/png' });
}

async function fillUploadForm() {
  fireEvent.change(screen.getByLabelText('Foto evidence'), {
    target: { files: [imageFile()] },
  });
  fireEvent.change(screen.getByLabelText('Judul'), {
    target: { value: 'Evidence baru' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Kategori/i }));
  fireEvent.click(await screen.findByRole('option', { name: 'Aktivitas' }));
}

describe('StudentEvidenceSection Teacher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL.mockReturnValue('blob:record');
  });

  it('menampilkan loading lalu evidence history', async () => {
    let resolveRequest;
    fetchStudentEvidences.mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve;
    }));

    render(<StudentEvidenceSection studentId="1" />);
    expect(screen.getByText('Memuat evidence siswa...')).toBeInTheDocument();
    resolveRequest([evidence]);

    expect(await screen.findByText('Kolase bentuk')).toBeInTheDocument();
    expect(screen.getByText('Karya')).toBeInTheDocument();
    expect(screen.getByText(/Guru: Bu Rahma/)).toBeInTheDocument();
  });

  it('menampilkan empty state', async () => {
    fetchStudentEvidences.mockResolvedValue([]);
    render(<StudentEvidenceSection studentId="1" />);

    expect(await screen.findByText(
      'Belum ada bukti perkembangan untuk siswa ini.'
    )).toBeInTheDocument();
  });

  it('mereset form dan memuat ulang history setelah upload berhasil', async () => {
    fetchStudentEvidences
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([evidence]);
    createStudentEvidence.mockResolvedValue(evidence);
    render(<StudentEvidenceSection studentId="1" />);
    await screen.findByText('Belum ada bukti perkembangan untuk siswa ini.');
    await fillUploadForm();

    fireEvent.click(screen.getByRole('button', { name: 'Simpan evidence' }));

    expect(await screen.findByText('Bukti perkembangan berhasil disimpan.')).toBeInTheDocument();
    expect(fetchStudentEvidences).toHaveBeenCalledTimes(2);
    expect(createStudentEvidence).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByLabelText('Judul')).toHaveValue(''));
    expect(screen.getByText('Kolase bentuk')).toBeInTheDocument();
  });
});
