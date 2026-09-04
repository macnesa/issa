import { useEffect, useState } from "react";
import { tw } from "../../../shared/ui/tw";
import { Pagination as FlowbitePagination } from "flowbite-react/components/Pagination";

function numericPage(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : null;
}

export default function Pagination({
  data,
  onPageChange,
  ariaLabel = "Paginasi siswa",
}) {
  const totalPages = Math.max(Number(data?.totalPages) || 1, 1);
  const serverPage = numericPage(
    data?.page ?? data?.currentPage ?? data?.pageIndex
  );
  const [fallbackPage, setFallbackPage] = useState(1);
  const currentPage = Math.min(serverPage ?? fallbackPage, totalPages);

  useEffect(() => {
    if (serverPage === null && fallbackPage > totalPages) {
      setFallbackPage(totalPages);
    }
  }, [fallbackPage, serverPage, totalPages]);

  const handlePageChange = (nextPage) => {
    if (
      nextPage < 1
      || nextPage > totalPages
      || nextPage === currentPage
      || typeof onPageChange !== "function"
    ) return;

    if (serverPage === null) setFallbackPage(nextPage);
    onPageChange(nextPage);
  };

  if (totalPages <= 1) return null;

  return (
    <div className={tw("student-pagination flex items-center justify-between gap-3 max-sm:items-stretch max-sm:flex-col")}>
      <p className={tw("text-issa-muted text-body")}>Halaman {currentPage} dari {totalPages}</p>
      <FlowbitePagination
        aria-label={ariaLabel}
        currentPage={currentPage}
        layout="navigation"
        nextLabel="Berikutnya"
        onPageChange={handlePageChange}
        previousLabel="Sebelumnya"
        totalPages={totalPages}
      />
    </div>
  );
}
