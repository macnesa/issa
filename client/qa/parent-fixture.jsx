// Development-only visual fixture. No authentication, requests, or persistence.
// This is not a production entry point and is excluded from Vite's main build.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import Journey from '../src/pages/Journey';
import Header from '../src/navigation/Header';
import BottomNav from '../src/navigation/BottomNav';
import apiClient from '../src/config/apiClient';
import '../src/shared/ui/shared-ui.css';
import '../src/index.css';
import '../src/parent-experience.css';

if (!import.meta.env.DEV) throw new Error('The Parent fixture is development-only.');
const artwork = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#fffaf0"/><path d="M90 450 L310 160 L550 450Z" fill="#77bdb2" stroke="#203d38" stroke-width="8"/><circle cx="620" cy="140" r="70" fill="#f5df78"/><path d="M110 480 Q310 530 690 470" fill="none" stroke="#8c67ad" stroke-width="14"/><text x="75" y="565" font-family="sans-serif" font-size="26" fill="#203d38">Karya latihan — data sintetis QA</text></svg>');
const media = { id: 7, title: 'Gambar gunung dan matahari', category: 'work', observedAt: '2026-09-03', description: 'Ari memilih warna dan menjelaskan gambar buatannya. '.repeat(8), file: { url: artwork }, availability: 'available' };
let mode = 'normal';
apiClient.get = async (url) => {
  if (mode === 'error') throw new Error('Synthetic unavailable source');
  if (mode === 'empty') return { data: [] };
  if (url.endsWith('/evidences')) return { data: mode === 'retracted' ? [] : [{ ...media, title: mode === 'updated' ? 'Karya Ari diperbarui' : media.title }] };
  if (url.endsWith('/journal')) return { data: [
    { id: 1, observedAt: '2026-09-03', type: 'student_reflection', voiceCaptureType: 'direct_quote', content: 'Aku mencoba lagi sampai bisa menggambar gunung.', teacher: { name: 'Bu Rani' }, wasEdited: true, evidence: mode === 'retracted' ? { ...media, availability: 'retracted', file: null } : media },
    { id: 2, observedAt: '2026-09-02', type: 'support_note', content: 'Memberi waktu untuk bercerita sebelum mulai menggambar.', teacher: { name: 'Bu Rani' } },
  ] };
  if (url.endsWith('/feedbacks')) return { data: Array.from({ length: 27 }, (_, id) => ({ id, observedAt: '2026-09-01', content: `Catatan belajar ${id + 1}: senang mencoba hal baru.`, Teacher: { name: 'Bu Rani' } })) };
  throw new Error('No network is allowed from this fixture.');
};
const resource = (data) => ({ data, loaded: true, loading: false, error: null });
const store = createStore(() => ({ student: { studentDetail: resource({ profile: { id: 1, name: 'Ari Wibowo Prameswara Kusumaatmaja', className: '1A', teacherName: 'Bu Rani' }, attendance: [], scores: [] }) } }));
function Fixture() {
  const [version, setVersion] = useState(0);
  return <Provider store={store}><MemoryRouter initialEntries={['/journey']}>
    <aside aria-label="Kontrol QA sintetis" style={{ padding: '8px', background: '#fffaf0' }}>
      <strong>QA — sintetis, tidak disimpan. </strong>
      {['normal', 'updated', 'retracted', 'empty', 'error'].map((next) => <button key={next} style={{ margin: '4px', border: '1px solid', padding: '6px' }} onClick={() => { mode = next; setVersion((value) => value + 1); }}>{next}</button>)}
    </aside>
    <Header /><Routes><Route element={<Outlet context={{ studentEvidenceRefreshKey: version }} />}><Route path="*" element={<Journey />} /></Route></Routes><BottomNav />
  </MemoryRouter></Provider>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
