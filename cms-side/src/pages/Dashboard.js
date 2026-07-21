import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import Pagination from "../components/Pagination";
import TableStudent from "../components/TableStudents";
import { studentsFetch } from "../store/action/ActionCreator";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const students = useSelector((state) => state.students.students);
  const [query, setQuery] = useState({ name: "" });

  useEffect(() => {
    setLoading(true);
    dispatch(studentsFetch()).finally(() => setLoading(false));
  }, [dispatch]);

  const changeInputHandler = (event) => {
    setQuery({ name: event.target.value });
  };

  const submitQuery = (event) => {
    event.preventDefault();
    dispatch(studentsFetch(query));
  };

  return (
    <>
      {loading ? (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg ml-6 mr-6 mt-[18rem] w-full md:w-full sm:[50%]">
          <div className="flex content-center justify-center my-auto">
            <ClipLoader color="gray-900" loading={loading} size={100} aria-label="Loading Spinner" data-testid="loader" />
          </div>
        </div>
      ) : (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg ml-6 mr-6 mt-[3rem] w-full md:w-full sm:[50%]">
          <div className="flex items-center justify-between pb-4 bg-white dark:bg-gray-900 ml-6 mr-6">
            <div className="flex row">
              <div className="flex items-center dark:text-white"><div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2" /> Hadir</div>
              <div className="flex items-center ml-4 dark:text-white"><div className="h-2.5 w-2.5 rounded-full bg-yellow-500 mr-2" /> Sakit</div>
              <div className="flex items-center ml-4 dark:text-white"><div className="h-2.5 w-2.5 rounded-full bg-blue-500 mr-2" /> Izin</div>
              <div className="flex items-center ml-4 dark:text-white"><div className="h-2.5 w-2.5 rounded-full bg-red-500 mr-2" /> Alfa</div>
            </div>
            <form className="flex justify-between" onSubmit={submitQuery}>
              <input
                onChange={changeInputHandler}
                value={query.name}
                type="text"
                name="name"
                placeholder="Search By Name"
                className="input input-bordered max-w-xs block p-2 pl-10 text-sm text-gray-900 border border-gray-900 rounded-lg w-80 dark:bg-gray-700 dark:text-white h-10"
              />
              <button className="ml-4 inline-flex items-center dark:bg-gray-700 border border-gray-900 bg-gray-900 text-white rounded-lg text-sm px-3 py-1.5 h-10" type="submit">
                Search
              </button>
            </form>
          </div>

          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 mt-6">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 text-center">
              <tr>
                <th scope="col" className="p-4">No</th>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">NIS</th>
                <th scope="col" className="px-6 py-3">Gender</th>
                <th scope="col" className="px-6 py-3">Birth Day</th>
                <th scope="col" className="px-6 py-3">Class</th>
                <th scope="col" className="px-6 py-3">Attendances</th>
                <th scope="col" className="px-6 py-3">Action</th>
              </tr>
            </thead>
            {Array.isArray(students.rows) && students.rows.map((student, index) => <TableStudent key={student.id} data={student} index={index} />)}
          </table>

          <div className="mb-[5rem]"><Pagination data={students} /></div>
        </div>
      )}
    </>
  );
}
