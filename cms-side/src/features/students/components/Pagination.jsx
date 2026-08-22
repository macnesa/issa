import { tw } from "../../../shared/ui/tw";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Pagination as FlowbitePagination } from "flowbite-react/components/Pagination";
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
    <div className={tw("student-pagination flex items-center justify-between gap-3 max-sm:items-stretch max-sm:flex-col")}>
      <p className={tw("text-issa-muted text-body")}>Halaman {currentPage} dari {totalPages}</p>
      <FlowbitePagination
        aria-label="Paginasi siswa"
        currentPage={currentPage}
        layout="navigation"
        nextLabel="Berikutnya"
        onPageChange={handleStudentPageChange}
        previousLabel="Sebelumnya"
        totalPages={totalPages}
      />
    </div>
  );
}
