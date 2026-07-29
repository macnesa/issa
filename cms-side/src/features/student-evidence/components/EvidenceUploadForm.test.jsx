import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import EvidenceUploadForm from './EvidenceUploadForm';

function imageFile({
  name = 'record.png',
  size = 1_024,
  type = 'image/png',
} = {}) {
  const file = new File(['record'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

async function selectCategory(label = 'Karya') {
  fireEvent.click(screen.getByRole('button', { name: /Kategori/i }));
  fireEvent.click(await screen.findByRole('option', { name: label }));
}

async function fillValidForm(file = imageFile()) {
  fireEvent.change(screen.getByLabelText('Foto evidence'), {
    target: { files: [file] },
  });
  fireEvent.change(screen.getByLabelText('Judul'), {
    target: { value: 'Eksperimen warna' },
  });
  await selectCategory();
  fireEvent.change(screen.getByLabelText(/Deskripsi/), {
    target: { value: 'Mencampur warna primer.' },
  });
}

describe('EvidenceUploadForm', () => {
  beforeEach(() => {
    URL.createObjectURL.mockReset();
    URL.createObjectURL.mockReturnValue('blob:evidence-preview');
    URL.revokeObjectURL.mockReset();
  });

  it('menampilkan preview file beserta nama dan ukuran, lalu membersihkannya', async () => {
    const { unmount } = render(<EvidenceUploadForm onUpload={vi.fn()} />);
    const file = imageFile({ name: 'karya-siswa.png', size: 2_048 });

    fireEvent.change(screen.getByLabelText('Foto evidence'), {
      target: { files: [file] },
    });

    expect(await screen.findByAltText('Preview karya-siswa.png')).toHaveAttribute(
      'src',
      'blob:evidence-preview'
    );
    expect(screen.getByText('karya-siswa.png')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hapus file' }));
    await waitFor(() => {
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:evidence-preview');
    });
    unmount();
  });

  it('menolak MIME selain JPEG, PNG, dan WEBP', () => {
    render(<EvidenceUploadForm onUpload={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Foto evidence'), {
      target: { files: [imageFile({ name: 'record.gif', type: 'image/gif' })] },
    });

    expect(screen.getByText('Gunakan file JPEG, PNG, atau WEBP.')).toBeInTheDocument();
    expect(screen.queryByAltText(/Preview/)).not.toBeInTheDocument();
  });

  it('menolak file di atas 5 MB', () => {
    render(<EvidenceUploadForm onUpload={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Foto evidence'), {
      target: { files: [imageFile({ size: 5 * 1_024 * 1_024 + 1 })] },
    });

    expect(screen.getByText('Ukuran file maksimal 5 MB.')).toBeInTheDocument();
  });

  it('mengirim multipart dengan seluruh field contract', async () => {
    let resolveUpload;
    const onUpload = vi.fn(() => new Promise((resolve) => {
      resolveUpload = resolve;
    }));
    render(<EvidenceUploadForm onUpload={onUpload} />);
    await fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: 'Simpan evidence' }));

    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    const submittedData = onUpload.mock.calls[0][0];
    expect(submittedData).toBeInstanceOf(FormData);
    expect(submittedData.get('file')).toBeInstanceOf(File);
    expect(submittedData.get('title')).toBe('Eksperimen warna');
    expect(submittedData.get('category')).toBe('work');
    expect(submittedData.get('description')).toBe('Mencampur warna primer.');
    expect(submittedData.get('observedAt')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await act(async () => {
      resolveUpload();
      await Promise.resolve();
    });
    expect(await screen.findByText('Bukti perkembangan berhasil disimpan.')).toBeInTheDocument();
  });

  it('menampilkan pesan ramah ketika penyimpanan gambar belum dikonfigurasi', async () => {
    const onUpload = vi.fn().mockRejectedValue({ status: 503 });
    render(<EvidenceUploadForm onUpload={onUpload} />);
    await fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: 'Simpan evidence' }));

    expect(await screen.findByText(
      'Penyimpanan gambar belum dikonfigurasi pada server.'
    )).toBeInTheDocument();
  });

  it('mencegah double submit selama request berjalan', async () => {
    let resolveUpload;
    const onUpload = vi.fn(() => new Promise((resolve) => {
      resolveUpload = resolve;
    }));
    const { container } = render(<EvidenceUploadForm onUpload={onUpload} />);
    await fillValidForm();

    const form = container.querySelector('form');
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(onUpload).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Mengunggah...' })).toBeDisabled();
    resolveUpload();
    expect(await screen.findByText('Bukti perkembangan berhasil disimpan.')).toBeInTheDocument();
  });

  it('mode demo memblokir file dan submit sebelum FormData atau upload dibuat', () => {
    const onUpload = vi.fn();
    const { container } = render(
      <EvidenceUploadForm demoReadOnly onUpload={onUpload} />
    );

    expect(screen.getByLabelText('Foto evidence')).toBeDisabled();
    expect(screen.getByRole('button', {
      name: 'Simpan evidence',
    })).toBeDisabled();
    expect(screen.getByText(
      'Tidak tersedia dalam mode demo.'
    )).toBeInTheDocument();

    fireEvent.submit(container.querySelector('form'));

    expect(onUpload).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Perubahan data tidak tersedia dalam mode demo.'
    );
  });
});
