import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";
import TableScores from "../components/TableScores";
import baseUrl from "../config/api";
import { studentById } from "../store/action/ActionCreator";

function CreateScoreForm({ studentId, onCreated }) {
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState({ LessonId: "", AssignmentId: "", value: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const headers = { access_token: localStorage.access_token };
    Promise.all([fetch(`${baseUrl}/lessons`, { headers }), fetch(`${baseUrl}/assignments`, { headers })])
      .then(async ([lessonResponse, assignmentResponse]) => {
        if (!lessonResponse.ok || !assignmentResponse.ok) throw new Error("Pilihan lesson atau assignment tidak dapat dimuat.");
        return Promise.all([lessonResponse.json(), assignmentResponse.json()]);
      })
      .then(([lessonData, assignmentData]) => {
        setLessons(lessonData);
        setAssignments(assignmentData);
      })
      .catch((error) => setMessage(error.message));
  }, []);

  const submit = (event) => {
    event.preventDefault();
    const value = Number(form.value);
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      setMessage("Nilai harus berupa angka bulat 0–100.");
      return;
    }

    setMessage("");
    fetch(`${baseUrl}/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: localStorage.access_token },
      body: JSON.stringify({ StudentId: Number(studentId), LessonId: Number(form.LessonId), AssignmentId: Number(form.AssignmentId), value }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || "Score gagal dibuat.");
        return data;
      })
      .then(() => {
        setForm({ LessonId: "", AssignmentId: "", value: "" });
        setMessage("Score berhasil dibuat.");
        onCreated();
      })
      .catch((error) => setMessage(error.message));
  };

  return (
    <form onSubmit={submit} className="mb-8 p-4 border rounded-lg dark:text-white">
      <p className="font-semibold mb-3">Add Score</p>
      <div className="grid grid-cols-3 gap-3">
        <select required value={form.LessonId} onChange={(event) => setForm({ ...form, LessonId: event.target.value })} className="text-gray-900 p-2 border rounded">
          <option value="">Choose Lesson</option>
          {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.name}</option>)}
        </select>
        <select required value={form.AssignmentId} onChange={(event) => setForm({ ...form, AssignmentId: event.target.value })} className="text-gray-900 p-2 border rounded">
          <option value="">Choose Assignment</option>
          {assignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.name}</option>)}
        </select>
        <input required min="0" max="100" step="1" type="number" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} placeholder="Value" className="text-gray-900 p-2 border rounded" />
      </div>
      <button type="submit" className="mt-3 bg-gray-900 text-white rounded-lg text-sm px-3 py-2">Create Score</button>
      {message && <p role="status" className="mt-2">{message}</p>}
    </form>
  );
}

export default function Scores() {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { studentId } = useParams();
  const student = useSelector((state) => state.students.student);

  const refreshStudent = () => dispatch(studentById(studentId));

  useEffect(() => {
    setLoading(true);
    refreshStudent().finally(() => setLoading(false));
  }, [dispatch, studentId]);

  if (loading) {
    return <div className="relative overflow-x-auto shadow-md sm:rounded-lg ml-6 mr-6 mt-[18rem] w-full md:w-full sm:[50%]"><div className="flex content-center justify-center my-auto"><ClipLoader color="gray-900" loading={loading} size={100} aria-label="Loading Spinner" data-testid="loader" /></div></div>;
  }

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg ml-6 mr-6 mt-[4rem] w-full md:w-full sm:[50%]">
      <div className="flex items-center justify-between pb-4 bg-white dark:bg-gray-900 mb-[2rem] ml-6 mr-6">
        <div className="flex items-center px-6 py-4 text-gray-900 dark:text-white">
          <img className="w-10 h-10 rounded-full" src={student?.imgUrl} alt={student?.name || "Student"} />
          <div className="pl-3"><div className="text-base font-semibold">{student?.name}</div></div>
        </div>
      </div>

      {student?.id && <CreateScoreForm studentId={student.id} onCreated={refreshStudent} />}

      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 text-center">
          <tr><th scope="col" className="px-6 py-3">Type</th><th scope="col" className="px-6 py-3">Lessons</th><th scope="col" className="px-6 py-3">KKM</th><th scope="col" className="px-6 py-3">Score</th><th scope="col" className="px-6 py-3">Grade</th><th scope="col" className="px-6 py-3">Report</th></tr>
        </thead>
        <tbody className="mb-[2rem] text-center">{student?.Scores?.map((score) => <TableScores key={score.id} data={score} student={student} />)}</tbody>
      </table>
    </div>
  );
}
