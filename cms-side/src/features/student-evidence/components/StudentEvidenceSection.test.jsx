import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  createStudentEvidence,
  fetchStudentEvidences,
  retractStudentEvidence,
  updateStudentEvidenceMetadata,
} from '../studentEvidenceApi';
import StudentEvidenceSection from './StudentEvidenceSection';

vi.mock('../studentEvidenceApi', () => ({
  createStudentEvidence: vi.fn(),
  fetchStudentEvidences: vi.fn(),
  retractStudentEvidence: vi.fn(),
  updateStudentEvidenceMetadata: vi.fn(),
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

function deferredPromise() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

async function renderEvidenceSection(props = {}) {
  fetchStudentEvidences.mockResolvedValue([evidence]);
  render(<StudentEvidenceSection studentId="1" {...props} />);
  await screen.findByText(evidence.title);
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
    expect(screen.getByText('Memuat bukti siswa...')).toBeInTheDocument();
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

  it('membuka edit dengan metadata terisi dan tanpa file input', async () => {
    await renderEvidenceSection();

    fireEvent.click(screen.getByRole('button', { name: 'Edit detail' }));
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByText('Edit metadata bukti')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Judul')).toHaveValue('Kolase bentuk');
    expect(within(dialog).getByRole('button', { name: 'Kategori' }))
      .toHaveTextContent('Karya');
    expect(within(dialog).getByRole('button', { name: 'Tanggal observasi' }))
      .toHaveTextContent('25/07/2026');
    expect(within(dialog).getByLabelText(/Catatan/))
      .toHaveValue('Menyusun bentuk dengan rapi.');
    expect(within(dialog).queryByLabelText('Foto evidence')).not.toBeInTheDocument();
    expect(
      within(dialog).getByText('Gambar tidak dapat diganti dari form ini.')
    ).toBeInTheDocument();
  });

  it('PATCH hanya mengirim metadata, menutup dialog, dan refetch Evidence serta Journal', async () => {
    const onEvidenceChanged = vi.fn();
    fetchStudentEvidences
      .mockResolvedValueOnce([evidence])
      .mockResolvedValueOnce([{ ...evidence, title: 'Kolase geometri' }]);
    updateStudentEvidenceMetadata.mockResolvedValue({
      ...evidence,
      title: 'Kolase geometri',
    });
    render(
      <StudentEvidenceSection
        studentId="1"
        onEvidenceChanged={onEvidenceChanged}
      />
    );
    await screen.findByText(evidence.title);

    fireEvent.click(screen.getByRole('button', { name: 'Edit detail' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Judul'), {
      target: { value: '  Kolase geometri  ' },
    });
    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Simpan koreksi' })
      );
    });

    await waitFor(() => {
      expect(updateStudentEvidenceMetadata).toHaveBeenCalledWith('1', 7, {
        title: 'Kolase geometri',
        category: 'work',
        description: 'Menyusun bentuk dengan rapi.',
        observedAt: '2026-07-25',
      });
    });
    const submittedPayload = updateStudentEvidenceMetadata.mock.calls[0][2];
    expect(submittedPayload).toEqual({
      title: 'Kolase geometri',
      category: 'work',
      description: 'Menyusun bentuk dengan rapi.',
      observedAt: '2026-07-25',
    });
    expect(submittedPayload).not.toHaveProperty('file');
    expect(submittedPayload).not.toHaveProperty('TeacherId');
    expect(await screen.findByText('Kolase geometri')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetchStudentEvidences).toHaveBeenCalledTimes(2);
    expect(onEvidenceChanged).toHaveBeenCalledTimes(1);
  });

  it('mencegah double submit edit', async () => {
    const correctionRequest = deferredPromise();
    updateStudentEvidenceMetadata.mockReturnValue(correctionRequest.promise);
    await renderEvidenceSection();

    fireEvent.click(screen.getByRole('button', { name: 'Edit detail' }));
    const dialog = screen.getByRole('dialog');
    const saveButton = within(dialog).getByRole('button', {
      name: 'Simpan koreksi',
    });
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    expect(updateStudentEvidenceMetadata).toHaveBeenCalledTimes(1);
    expect(saveButton).toBeDisabled();

    await act(async () => {
      correctionRequest.resolve(evidence);
    });
  });

  it('cancel edit tidak mengubah evidence dan mengembalikan fokus', async () => {
    await renderEvidenceSection();
    const editButton = screen.getByRole('button', { name: 'Edit detail' });
    fireEvent.click(editButton);
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Judul'), {
      target: { value: 'Tidak disimpan' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Batal' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(updateStudentEvidenceMetadata).not.toHaveBeenCalled();
    expect(screen.getByText('Kolase bentuk')).toBeInTheDocument();
    await waitFor(() => expect(editButton).toHaveFocus());
  });

  it('memvalidasi reason lalu DELETE dengan payload trimmed dan refetch kedua section', async () => {
    const onEvidenceChanged = vi.fn();
    fetchStudentEvidences
      .mockResolvedValueOnce([evidence])
      .mockResolvedValueOnce([]);
    retractStudentEvidence.mockResolvedValue({
      id: 7,
      studentId: 1,
      retracted: true,
    });
    render(
      <StudentEvidenceSection
        studentId="1"
        onEvidenceChanged={onEvidenceChanged}
      />
    );
    await screen.findByText(evidence.title);

    fireEvent.click(screen.getByRole('button', { name: 'Cabut bukti' }));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText('Cabut bukti perkembangan ini?')
    ).toBeInTheDocument();
    expect(within(dialog).getByText(evidence.title)).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Gambar tidak lagi tersedia bagi guru maupun orang tua/)
    ).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText('Alasan pencabutan'), {
      target: { value: 'ab' },
    });
    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Cabut bukti' })
      );
    });
    expect(
      within(dialog).getByText('Alasan harus terdiri dari 3–300 karakter.')
    ).toBeInTheDocument();
    expect(retractStudentEvidence).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText('Alasan pencabutan'), {
      target: { value: '  Bukti terhubung ke record yang keliru.  ' },
    });
    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Cabut bukti' })
      );
    });

    await screen.findByText('Belum ada bukti perkembangan untuk siswa ini.');
    expect(retractStudentEvidence).toHaveBeenCalledWith(
      '1',
      7,
      'Bukti terhubung ke record yang keliru.'
    );
    expect(fetchStudentEvidences).toHaveBeenCalledTimes(2);
    expect(onEvidenceChanged).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('menampilkan error 502 yang ramah dan mempertahankan dialog', async () => {
    retractStudentEvidence.mockRejectedValue({ status: 502 });
    await renderEvidenceSection();
    fireEvent.click(screen.getByRole('button', { name: 'Cabut bukti' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Alasan pencabutan'), {
      target: { value: 'Evidence salah dibagikan.' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Cabut bukti' })
    );

    const alert = await within(dialog).findByRole('alert');
    expect(alert).toHaveTextContent(
      'Gambar belum berhasil dicabut dari penyimpanan. Silakan coba kembali.'
    );
    expect(alert).toHaveClass('issa-inline-notice--danger');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText(/Cloudinary/i)).not.toBeInTheDocument();
  });

  it('403 ditampilkan normal dan memicu refetch evidence', async () => {
    fetchStudentEvidences
      .mockResolvedValueOnce([evidence])
      .mockResolvedValueOnce([evidence]);
    updateStudentEvidenceMetadata.mockRejectedValue({ status: 403 });
    render(<StudentEvidenceSection studentId="1" />);
    await screen.findByText(evidence.title);
    fireEvent.click(screen.getByRole('button', { name: 'Edit detail' }));
    fireEvent.click(screen.getByRole('button', { name: 'Simpan koreksi' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Bukti tidak dapat dikoreksi. Bukti mungkin dibuat oleh guru lain.'
    );
    expect(alert).toHaveClass('issa-inline-notice--danger');
    expect(fetchStudentEvidences).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('Escape menutup retraction sebelum request dan fokus kembali', async () => {
    await renderEvidenceSection();
    const trigger = screen.getByRole('button', { name: 'Cabut bukti' });
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(retractStudentEvidence).not.toHaveBeenCalled();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('viewer ditutup ketika retraction dimulai dari evidence yang sedang dibuka', async () => {
    fetchStudentEvidences
      .mockResolvedValueOnce([evidence])
      .mockResolvedValueOnce([]);
    retractStudentEvidence.mockResolvedValue({
      id: 7,
      studentId: 1,
      retracted: true,
    });
    render(<StudentEvidenceSection studentId="1" />);
    await screen.findByText(evidence.title);
    fireEvent.click(screen.getByRole('button', {
      name: 'Buka bukti Kolase bentuk',
    }));

    const viewer = screen.getByRole('dialog');
    expect(within(viewer).getByAltText('Kolase bentuk')).toBeInTheDocument();
    fireEvent.click(
      within(viewer).getByRole('button', { name: 'Cabut bukti' })
    );

    const retractionDialog = screen.getByRole('dialog');
    expect(
      within(retractionDialog).queryByAltText('Kolase bentuk')
    ).not.toBeInTheDocument();
    fireEvent.change(
      within(retractionDialog).getByLabelText('Alasan pencabutan'),
      { target: { value: 'Evidence salah dibagikan.' } }
    );
    await act(async () => {
      fireEvent.click(
        within(retractionDialog).getByRole('button', { name: 'Cabut bukti' })
      );
    });

    await screen.findByText('Belum ada bukti perkembangan untuk siswa ini.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Kolase bentuk' }))
      .not.toBeInTheDocument();
  });
});
