import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <main className="issa-not-found flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <section className="issa-not-found__panel w-full max-w-md p-6 text-center sm:p-8">
        <p className="issa-not-found__kicker">404</p>
        <h1 className="page-title mt-2">Halaman tidak ditemukan</h1>
        <p className="page-supporting-text mt-3">Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.</p>
        <Link to="/" className="primary-button mt-6 inline-flex">Kembali ke Ringkasan</Link>
      </section>
    </main>
  );
}
