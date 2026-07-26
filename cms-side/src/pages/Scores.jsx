import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import CreateScoreForm from "../features/scores/components/CreateScoreForm";
import ScoreHistory from "../features/scores/components/ScoreHistory";
import { fetchStudentDetail } from "../store/action/ActionCreator";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
} from "../shared/ui/ui";
import "../features/scores/score-workspace.css";

export default function Scores() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const { studentId } = useParams();
  const student = useSelector((state) => state.students.student);

  const fetchStudentScores = useCallback(() => {
    setError("");
    setLoading(true);
    return dispatch(fetchStudentDetail(studentId))
      .catch((requestError) => setError(requestError?.message || "Data siswa tidak dapat dimuat."))
      .finally(() => setLoading(false));
  }, [dispatch, studentId]);

  useEffect(() => { fetchStudentScores(); }, [fetchStudentScores]);

  if (loading) return <PageContainer><LoadingState label="Memuat record score..." /></PageContainer>;
  if (error) return <PageContainer><ErrorState message={error} onRetry={fetchStudentScores} /></PageContainer>;

  return (
    <PageContainer className="score-workspace">
      <div><PageHeader eyebrow="Academic record" title="Nilai siswa" description={student?.name ? `Kelola record akademik ${student.name}.` : "Kelola record akademik siswa."} actions={<Link to={`/students/${studentId}`} className="inline-flex min-h-10 items-center rounded-lg border border-[var(--border-strong)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text)] hover:bg-slate-50">Kembali ke detail</Link>} /></div>
      {!student?.id ? <EmptyState title="Siswa tidak ditemukan" description="Siswa ini tidak tersedia pada kelas Anda." /> : <div className="space-y-5"><CreateScoreForm studentId={student.id} onCreated={fetchStudentScores} /><ScoreHistory scores={student.Scores} student={student} /></div>}
    </PageContainer>
  );
}
