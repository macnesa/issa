import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import apiClient from '../config/apiClient';
import Home from './Home';
import Journey from './Journey';
import LessonsList from './LessonsList';
import LessonDetail from './LessonDetail';
import Header from '../navigation/Header';
import BottomNav from '../navigation/BottomNav';
import { mapStudentResponseToOverview } from '../mappers/studentDetail';

vi.mock('../config/apiClient', () => ({ default: { get: vi.fn() } }));
vi.mock('../utils/session', () => ({ isParentDemoSession: () => false, endParentSession: vi.fn() }));

const profile = { id: 1, name: 'Ari Wibowo', nim: '2026071001', imageUrl: '/issa-logo.png', className: '1A', teacherName: 'Bu Rani', feedback: 'Ari berani berdiskusi.' };
const ready = (data) => ({ data, loaded: true, loading: false, error: null });
const score = { id: 1, lessonId: 6, lesson: { id: 6, name: 'Agama', kkm: 76 }, value: 90, recordedAt: '2026-07-13T09:00:00Z', assignment: { description: 'Praktik harian' } };
const photo = { id: 7, title: 'Karya Ari', description: 'Sebuah karya', observedAt: '2026-07-20', availability: 'available', file: { url: '/issa-logo.png' } };
let responses;

function mount(element, { path = '/journey', overview = { profile, attendance: [], scores: [score] }, activities = [], context = {} } = {}) {
  const store = createStore(() => ({ student: { studentDetail: ready(overview), classSchedule: ready([]), activity: ready(activities) } }));
  const tree = (nextContext) => <Provider store={store}><MemoryRouter initialEntries={[path]}><Routes>
    <Route element={<Outlet context={nextContext} />}><Route path="/progress/:lessonId" element={element} /><Route path="*" element={element} /></Route>
  </Routes></MemoryRouter></Provider>;
  const result = render(tree(context));
  return { ...result, refresh: (next) => result.rerender(tree(next)) };
}

beforeEach(() => {
  responses = { journal: [], evidences: [], feedbacks: [] };
  apiClient.get.mockReset().mockImplementation((url) => {
    const data = responses[url.split('/').at(-1)];
    return data instanceof Error ? Promise.reject(data) : Promise.resolve({ data });
  });
  Element.prototype.scrollIntoView = vi.fn();
});

describe('Active Parent reconciliation', () => {
  it('Home presents an editorial pulse without restoring the old dashboard', async () => {
    responses.journal = [{ id: 9, type: 'milestone', content: 'Ari menyelesaikan presentasi.', observedAt: '2026-07-21' }];
    mount(<Home />, { path: '/', activities: [{ id: 1, name: 'Pameran', createdAt: '2026-07-20' }] });
    expect(screen.getByRole('region', { name: 'Siswa Ari Wibowo' })).toHaveTextContent('1A');
    expect(screen.getByRole('img', { name: 'Ari Wibowo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Belum tercatat' })).toBeInTheDocument();
    expect(await screen.findByText('Ari menyelesaikan presentasi.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Penilaian terbaru.' })).toBeInTheDocument();
    expect(screen.getByText('Praktik harian')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lihat semua kabar' })).toHaveAttribute('href', '/schedule#school-news');
    expect(screen.getByText('Ari Wibowo').querySelector('br')).toBeNull();
  });
  it('uses full feedback history, not the recent-change aggregate', async () => {
    responses.feedbacks = [{ id: 4, content: 'Catatan lama tetap ada.', observedAt: '2026-07-01' }, { id: 5, content: 'Catatan lain.', observedAt: '2026-07-15' }];
    mount(<Journey />);
    expect(await screen.findByText('Catatan lama tetap ada.')).toBeInTheDocument();
    expect(screen.getByText('Catatan lain.')).toBeInTheDocument();
    expect(apiClient.get.mock.calls.map(([url]) => url)).toContain('/students/1/feedbacks');
    expect(apiClient.get.mock.calls.some(([url]) => url.includes('insights'))).toBe(false);
  });
  it('preserves voice, support meaning and edited context', async () => {
    responses.journal = [
      { id: 1, observedAt: '2026-07-20', type: 'student_reflection', voiceCaptureType: 'direct_quote', content: 'Aku bisa.', wasEdited: true },
      { id: 2, observedAt: '2026-07-19', type: 'student_reflection', voiceCaptureType: 'paraphrased', content: 'Ari merasa mampu.' },
      { id: 3, observedAt: '2026-07-18', type: 'challenge', content: 'Membutuhkan dukungan.' },
    ];
    mount(<Journey />);
    expect(await screen.findByText('“Aku bisa.”')).toBeInTheDocument();
    expect(screen.getByText('“Aku bisa.”').tagName).toBe('BLOCKQUOTE');
    expect(screen.getByText('Dirangkum oleh guru')).toBeInTheDocument();
    expect(screen.getByText('Hal yang sedang membutuhkan dukungan')).toBeInTheDocument();
    expect(screen.getByText('Catatan diperbarui')).toBeInTheDocument();
  });
  it('renders domain chronology and omits routine presence', async () => {
    const overview = mapStudentResponseToOverview({ id: 1, name: 'Ari', Attendances: [
      { id: 1, status: 'Izin', attendanceDate: '2026-07-15', createdAt: '2026-07-30' },
      { id: 2, status: 'Hadir', attendanceDate: '2026-07-16', createdAt: '2026-07-30' },
    ], Scores: [{ id: 3, value: 90, recordedAt: '2026-07-13', createdAt: '2026-07-30', Lesson: { id: 6, name: 'Agama' } }] });
    mount(<Journey />, { overview });
    await waitFor(() => expect(screen.queryByText('Menyusun perjalanan terbaru…')).not.toBeInTheDocument());
    expect(screen.getAllByRole('article').map((item) => within(item).getByRole('heading').textContent)).toEqual(['Kehadiran · Izin', 'Agama']);
    expect(screen.queryByText('30 Jul 2026')).not.toBeInTheDocument();
  });
  it('reveals every available event without a second stop or duplicates', async () => {
    responses.feedbacks = Array.from({ length: 28 }, (_, id) => ({ id, content: `Pesan ${id}`, observedAt: '2026-07-15' }));
    mount(<Journey />);
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(12));
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan perjalanan sebelumnya' }));
    expect(screen.getAllByRole('article')).toHaveLength(24);
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan perjalanan sebelumnya' }));
    expect(screen.getAllByRole('article')).toHaveLength(29);
    expect(screen.queryByRole('button', { name: 'Tampilkan perjalanan sebelumnya' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('article').filter((item) => item.textContent.includes('Pesan 27'))).toHaveLength(1);
  });
  it('shows partial failure rather than empty and retries the history', async () => {
    responses.feedbacks = new Error('offline');
    mount(<Journey />);
    expect(await screen.findByText('Sebagian perjalanan belum dapat dimuat.')).toBeInTheDocument();
    expect(screen.getByText('Praktik harian')).toBeInTheDocument();
    expect(screen.queryByText('Perjalanan belajar akan muncul di sini.')).not.toBeInTheDocument();
    responses.feedbacks = [{ id: 2, observedAt: '2026-07-20', content: 'Pulih' }];
    fireEvent.click(screen.getByRole('button', { name: 'Coba muat lagi' }));
    expect(await screen.findByText('Pulih')).toBeInTheDocument();
  });
  it('discloses the existing journal endpoint window instead of claiming complete history', async () => {
    responses.journal = Array.from({ length: 50 }, (_, id) => ({ id, type: 'observation', content: `Catatan ${id}`, observedAt: '2026-07-15' }));
    mount(<Journey />);
    expect(await screen.findByText('Catatan belajar mencakup 50 catatan terbaru.')).toBeInTheDocument();
    while (screen.queryByRole('button', { name: 'Tampilkan perjalanan sebelumnya' })) {
      fireEvent.click(screen.getByRole('button', { name: 'Tampilkan perjalanan sebelumnya' }));
    }
    expect(screen.getAllByRole('article')).toHaveLength(51);
  });
  it('does not treat a malformed history response as an empty history', async () => {
    responses.journal = {};
    mount(<Journey />);
    expect(await screen.findByText('Sebagian perjalanan belum dapat dimuat.')).toBeInTheDocument();
  });
  it('announces loading even when assessment data is already present', async () => {
    let finish;
    apiClient.get.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const view = mount(<Journey />);
    expect(screen.getByText('Menyusun perjalanan terbaru…')).toBeInTheDocument();
    expect(screen.getByText('Praktik harian')).toBeInTheDocument();
    view.unmount();
    await act(async () => finish({ data: [] }));
  });
  it('deduplicates linked evidence and updates an open viewer after refresh', async () => {
    responses.evidences = [photo];
    responses.journal = [{ id: 1, type: 'observation', content: 'Karya hari ini', observedAt: '2026-07-20', evidence: photo }];
    const view = mount(<Journey />);
    const trigger = await screen.findByRole('button', { name: 'Buka dokumentasi Karya Ari' });
    expect(screen.getAllByRole('button', { name: 'Buka dokumentasi Karya Ari' })).toHaveLength(1);
    fireEvent.click(trigger);
    responses.evidences = [{ ...photo, title: 'Karya diperbarui', file: { url: '/issa-logo-white.png' } }];
    view.refresh({ studentEvidenceRefreshKey: 1 });
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(within(dialog).getByRole('img')).toHaveAttribute('src', '/issa-logo-white.png'));
  });
  it('closes retracted media and restores focus to the journey heading', async () => {
    responses.evidences = [photo];
    const view = mount(<Journey />);
    fireEvent.click(await screen.findByRole('button', { name: 'Buka dokumentasi Karya Ari' }));
    await screen.findByRole('dialog');
    responses.evidences = [];
    view.refresh({ studentEvidenceRefreshKey: 1 });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Cerita belajar Ari.' })).toHaveFocus());
  });
  it('closes a viewer with Escape and restores the actual thumbnail', async () => {
    responses.evidences = [photo];
    mount(<Journey />);
    const trigger = await screen.findByRole('button', { name: 'Buka dokumentasi Karya Ari' });
    trigger.focus(); fireEvent.click(trigger);
    fireEvent.keyDown(await screen.findByRole('dialog'), { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
  it('shows tombstones without exposing retracted thumbnails', async () => {
    responses.journal = [{ id: 1, type: 'observation', content: 'Tetap ada', observedAt: '2026-07-20', evidence: { ...photo, availability: 'retracted', file: null } }];
    mount(<Journey />);
    expect(await screen.findByText('Dokumentasi terkait telah ditarik oleh sekolah.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Buka dokumentasi/ })).not.toBeInTheDocument();
  });
  it('keeps missing lesson metadata from producing a null detail URL', async () => {
    mount(<Journey />, { overview: { profile, attendance: [], scores: [{ ...score, lessonId: null, lesson: null }] } });
    await waitFor(() => expect(screen.queryByText('Menyusun perjalanan terbaru…')).not.toBeInTheDocument());
    expect(screen.queryByRole('link', { name: 'Lihat detail penilaian' })).not.toBeInTheDocument();
  });
  it('renders assessment context without methodology-explainer copy', () => {
    mount(<LessonDetail />, { path: '/progress/6' });
    expect(screen.getByText('13 Jul 2026')).toBeInTheDocument();
    expect(screen.getByText(/Batas ketuntasan yang ditetapkan sekolah/)).toHaveTextContent('76');
    expect(screen.queryByText(/ditampilkan apa adanya/)).not.toBeInTheDocument();
  });
  it('provides a focusable school-news destination and the full archive', async () => {
    mount(<LessonsList />, { path: '/schedule#school-news', activities: Array.from({ length: 18 }, (_, id) => ({ id, name: `Kabar ${id}`, createdAt: '2026-07-20' })) });
    const section = screen.getByRole('region', { name: 'Kabar sekolah' });
    expect(section).toHaveAttribute('id', 'school-news');
    await waitFor(() => expect(section).toHaveFocus());
    expect(within(section).getAllByText(/Dipublikasikan/)).toHaveLength(8);
    fireEvent.click(screen.getByRole('button', { name: 'Lihat kabar sebelumnya' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lihat kabar sebelumnya' }));
    expect(within(section).getAllByText(/Dipublikasikan/)).toHaveLength(18);
    expect(screen.queryByRole('button', { name: 'Lihat kabar sebelumnya' })).not.toBeInTheDocument();
  });
  it.each(['/journey', '/attendance', '/progress', '/progress/6'])('gives detail ownership to both navigations on %s', (path) => {
    mount(<><Header /><BottomNav /></>, { path });
    screen.getAllByRole('link', { name: 'Perjalanan', exact: true }).forEach((link) => expect(link).toHaveAttribute('aria-current', 'page'));
    screen.getAllByRole('link', { name: 'Hari ini', exact: true }).forEach((link) => expect(link).not.toHaveAttribute('aria-current'));
  });
  it('Escape only restores profile focus while its menu is open', () => {
    mount(<><Header /><button>Konten</button></>);
    const content = screen.getByRole('button', { name: 'Konten' });
    content.focus(); fireEvent.keyDown(content, { key: 'Escape' }); expect(content).toHaveFocus();
    const trigger = screen.getByRole('button', { name: /Buka menu profil/ });
    fireEvent.click(trigger);
    const exit = screen.getByRole('menuitem', { name: 'Keluar' });
    exit.focus(); fireEvent.keyDown(exit, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument(); expect(trigger).toHaveFocus();
  });
});
