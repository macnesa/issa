import { useState } from "react";
import { useDispatch } from "react-redux";
import { addAttendances, editAttendance, studentById } from "../store/action/ActionCreator";
import ModalAttendances from "./ModalAttendances";

const supportedStatuses = ["Hadir", "Sakit", "Alfa", "Izin"];

function isToday(dateValue) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

export default function TableAttendances({ data, index }) {
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const todayAttendance = (data.Attendances || []).find((attendance) => isToday(attendance.createdAt));

  const handleStatusChange = (event) => {
    const status = event.target.value;
    if (!supportedStatuses.includes(status)) return;

    const payload = { StudentId: data.id, status };
    const action = todayAttendance ? editAttendance(payload) : addAttendances(payload);
    setMessage("");
    dispatch(action).catch((error) => setMessage(error.message || "Attendance gagal diperbarui."));
  };

  const handleStudentId = () => {
    dispatch(studentById(data.id));
  };

  return (
    <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
      <td className="w-4 p-4">{index + 1}</td>
      <th scope="row" className="flex justify-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
        <img className="w-10 h-10 rounded-full" src={data.imgUrl} alt={data.name} />
        <div className="pl-3"><div className="text-base font-semibold">{data.name}</div><div className="font-normal text-gray-900 dark:text-white">{data.age} Tahun</div></div>
      </th>
      <td className="px-6 py-4 text-gray-900 dark:text-white">{data.Class?.name}</td>
      <td className="px-6 py-4">
        <select
          value={todayAttendance?.status || ""}
          onChange={handleStatusChange}
          name="status"
          className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-lg block w-full p-2.5"
        >
          <option value="" disabled>Input Attendance</option>
          {supportedStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        {message && <p role="status" className="mt-1 text-red-600">{message}</p>}
      </td>
      <td onClick={handleStudentId}>
        <label htmlFor={data.id} className="btn bg-gray-900 hover:bg-transparent hover:text-black dark:bg-gray-700">Attendance</label>
        <ModalAttendances data={data.Attendances || []} id={data.id} />
      </td>
    </tr>
  );
}
