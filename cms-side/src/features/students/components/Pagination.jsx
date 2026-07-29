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
    <nav className="student-pagination" aria-label="Paginasi siswa">
      <p>Halaman {currentPage} dari {totalPages}</p>
      <div>
        <SecondaryButton compact type="button" onClick={() => handleStudentPageChange(currentPage - 1)} disabled={currentPage === 1}>Sebelumnya</SecondaryButton>
        <SecondaryButton compact type="button" onClick={() => handleStudentPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Berikutnya</SecondaryButton>
      </div>
    </nav>
  );
}
