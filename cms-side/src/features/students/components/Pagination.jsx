import { tw } from "../../../shared/ui/tw";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { fetchStudentList } from "../../../store/action/ActionCreator";
import { SecondaryButton } from "../../../shared/ui/ui";

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
    <nav className={tw("student-pagination flex items-center justify-between gap-2")} aria-label="Paginasi siswa">
      <p className={tw("text-issa-muted text-body")}>Halaman {currentPage} dari {totalPages}</p>
      <div className={tw("flex items-center gap-2")}>
        <SecondaryButton compact type="button" onClick={() => handleStudentPageChange(currentPage - 1)} disabled={currentPage === 1}>Sebelumnya</SecondaryButton>
        <SecondaryButton compact type="button" onClick={() => handleStudentPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Berikutnya</SecondaryButton>
      </div>
    </nav>
  );
}
