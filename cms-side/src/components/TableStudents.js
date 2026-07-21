import { Link } from "react-router-dom";

function isToday(dateValue) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

export default function TableStudent({ data, index }) {
  const attendanceToday = (data.Attendances || []).find((attendance) => isToday(attendance.createdAt));
  const colorByStatus = {
    Hadir: "bg-green-500",
    Sakit: "bg-yellow-500",
    Izin: "bg-blue-500",
    Alfa: "bg-red-600",
  };

  return (
    <tbody className="text-center">
      <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
        <td className="w-4 p-4">{index + 1}</td>
        <th scope="row" className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
          <img className="w-10 h-10 rounded-full" src={data.imgUrl} alt={data.name} />
          <div className="pl-3"><div className="text-base font-semibold">{data.name}</div><div className="font-normal text-gray-900 dark:text-white">{data.age} Tahun</div></div>
        </th>
        <td className="px-6 py-4 text-gray-900 dark:text-white">{data.NIM}</td>
        <td className="px-6 py-4 text-gray-900 dark:text-white">{data.gender}</td>
        <td className="px-6 py-4 text-gray-900 dark:text-white">{data.birthDate?.substring(0, 10)}</td>
        <td className="px-6 py-4 text-gray-900 dark:text-white">{data.Class?.name}</td>
        <td className="px-6 py-4 justify-center">
          <div className="flex justify-center"><div className={`h-2.5 w-2.5 rounded-full ${colorByStatus[attendanceToday?.status] || "bg-red-600"}`} /></div>
        </td>
        <td className="px-6 py-4">
          <Link to={`/scores/${data.id}`}><button className="inline-flex items-center text-gray-900 bg-white border border-gray-900 hover:bg-gray-900 hover:text-white rounded-lg text-sm px-3 py-1.5 h-10" type="button">See Score</button></Link>
          <Link to={`/students/${data.id}`}><button className="inline-flex items-center text-gray-900 bg-white border border-gray-900 hover:bg-blue-600 hover:text-white rounded-lg text-sm px-3 py-1.5 ml-2 h-10" type="button">Detail</button></Link>
        </td>
      </tr>
    </tbody>
  );
}
