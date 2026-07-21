import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { editStudent, studentById } from "../store/action/ActionCreator";

export default function AddStudent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { studentId } = useParams();
  const student = useSelector((state) => state.students.student);
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    dispatch(studentById(studentId)).catch(() => setMessage("Student tidak ditemukan."));
  }, [dispatch, studentId]);

  useEffect(() => {
    setFeedback(student?.feedback || "");
  }, [student]);

  const submitForm = (event) => {
    event.preventDefault();
    setMessage("");
    dispatch(editStudent(studentId, { feedback }))
      .then(() => setMessage("Feedback berhasil diperbarui."))
      .catch((error) => setMessage(error.message || "Feedback gagal diperbarui."));
  };

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg mx-auto mt-[3rem] w-[50%] md:w-[30%] sm:[20%] p-6">
      <p className="dark:text-white font-Comfortaa font-semibold text-[1.3rem]">DETAIL STUDENT</p>
      <div className="my-6 dark:text-white">
        <p><strong>Name:</strong> {student?.name}</p>
        <p><strong>NIM:</strong> {student?.NIM}</p>
      </div>
      <form onSubmit={submitForm}>
        <label className="block text-sm dark:text-white mb-2" htmlFor="feedback">Feedback</label>
        <textarea id="feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} className="block w-full p-3 text-sm text-gray-900 border border-gray-300 rounded-lg" rows="5" />
        <div className="mt-4">
          <button className="inline-flex items-center bg-gray-900 text-white rounded-lg text-sm px-3 py-2" type="submit">Save Feedback</button>
          <button onClick={() => navigate("/")} className="inline-flex items-center ml-2 border border-gray-900 rounded-lg text-sm px-3 py-2 dark:text-white" type="button">Back</button>
        </div>
      </form>
      {message && <p role="status" className="mt-4 dark:text-white">{message}</p>}
    </div>
  );
}
