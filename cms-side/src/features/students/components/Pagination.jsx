import { useState } from "react";
import { useDispatch } from "react-redux";
import { fetchStudentList } from "../../../store/action/ActionCreator";

export default function Pagination({ data }) {
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Number(data?.totalPages) || 1;

  const handleStudentPageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;
    setCurrentPage(nextPage);
    dispatch(fetchStudentList({}, nextPage));
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Paginasi siswa">
      <p className="text-sm text-[var(--muted)]">Halaman {currentPage} dari {totalPages}</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => handleStudentPageChange(currentPage - 1)} disabled={currentPage === 1} className="min-h-10 rounded-lg border border-[var(--border-strong)] bg-white px-3 py-2 text-sm font-semibold text-[var(--text)] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Sebelumnya</button>
        <button type="button" onClick={() => handleStudentPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="min-h-10 rounded-lg border border-[var(--border-strong)] bg-white px-3 py-2 text-sm font-semibold text-[var(--text)] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Berikutnya</button>
      </div>
    </nav>
  );
}
