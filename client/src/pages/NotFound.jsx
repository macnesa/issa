import { ButtonLink, PageContainer, Surface } from '../shared/ui/ui';

export default function PageNotFound() {
  return (
    <PageContainer className="not-found">
      <Surface className="not-found__panel" offset>
        <p className="section-kicker">404</p>
        <h1 className="page-title">Halaman tidak ditemukan</h1>
        <p className="page-supporting-text">
          Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
        </p>
        <ButtonLink to="/">Kembali ke Hari ini</ButtonLink>
      </Surface>
    </PageContainer>
  );
}
