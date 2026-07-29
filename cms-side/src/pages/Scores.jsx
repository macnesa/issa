import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import CreateScoreForm from "../features/scores/components/CreateScoreForm";
import ScoreHistory from "../features/scores/components/ScoreHistory";
import {
  fetchStudentDetail,
  fetchStudentList,
} from "../store/action/ActionCreator";
import { getAuthorizedClassName } from "../features/students/authorizedClass";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  ButtonLink,
  PageContainer,
  PageHeader,
  StudentContextHeader,
} from "../shared/ui/ui";
import "../features/scores/score-workspace.css";

export default function Scores() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const { studentId } = useParams();
  const student = useSelector((state) => state.students.student);
  const studentList = useSelector((state) => state.students.students);
  const [classLookupAttemptedFor, setClassLookupAttemptedFor] = useState(null);
  const authorizedClassName = getAuthorizedClassName(student, studentList);

  const fetchStudentScores = useCallback(() => {
    setError("");
    setLoading(true);
    return dispatch(fetchStudentDetail(studentId))
      .catch((requestError) => setError(requestError?.message || "Data siswa tidak dapat dimuat."))
      .finally(() => setLoading(false));
  }, [dispatch, studentId]);

  useEffect(() => { fetchStudentScores(); }, [fetchStudentScores]);
  useEffect(() => {
    setClassLookupAttemptedFor(null);
  }, [studentId]);
  useEffect(() => {
    if (
      !student?.id
      || authorizedClassName
      || Number(classLookupAttemptedFor) === Number(student.id)
    ) return;
    setClassLookupAttemptedFor(student.id);
    dispatch(fetchStudentList({}, 1)).catch(() => {});
  }, [
    authorizedClassName,
    classLookupAttemptedFor,
    dispatch,
    student?.id,
  ]);

  if (loading) return <PageContainer><LoadingState label="Memuat rekam nilai..." /></PageContainer>;
  if (error) return <PageContainer><ErrorState message={error} onRetry={fetchStudentScores} /></PageContainer>;

  return (
    <PageContainer className="score-workspace">
      <PageHeader
        eyebrow="Rekam akademik"
        title="Nilai siswa"
        description="Catat dan tinjau hasil penilaian siswa dalam satu ruang kerja."
      />
      {!student?.id ? (
        <EmptyState
          title="Siswa tidak ditemukan"
          description="Siswa ini tidak tersedia pada kelas Anda."
        />
      ) : (
        <div className="score-workspace__stack">
          <StudentContextHeader
            student={student}
            classLabel={authorizedClassName}
            eyebrow="Rekam akademik siswa"
            actions={(
              <ButtonLink to={`/students/${studentId}`}>
                Kembali ke detail
              </ButtonLink>
            )}
          />
          <CreateScoreForm studentId={student.id} onCreated={fetchStudentScores} />
          <ScoreHistory scores={student.Scores} student={student} />
        </div>
      )}
    </PageContainer>
  );
}
