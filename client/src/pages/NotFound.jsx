import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#edf7f7] px-4 py-8 sm:px-6">
      <section
        className="relative z-[1] w-full max-w-md overflow-hidden rounded-[1rem_1rem_2.6rem_1rem] border border-[#684087] bg-white/95 p-6 text-center sm:p-8"
        style={{ boxShadow: '0.8rem 0.85rem 0 rgba(38, 83, 103, 0.15)' }}
      >
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#684087]">404</p>
        <h1 className="page-title mt-2">Halaman tidak ditemukan</h1>
        <p className="page-supporting-text mt-3">Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.</p>
        <Link to="/" className="primary-button mt-6 inline-flex rounded-[0.75rem_0.4rem_0.75rem_0.4rem] !bg-[#245b70] hover:!bg-[#173e52]">Kembali ke Ringkasan</Link>
      </section>
    </main>
  );
}
