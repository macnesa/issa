import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import TableTeacher from "../components/TableTeacher";
import { teachersFetch } from "../store/action/ActionCreator";
import ClipLoader from "react-spinners/ClipLoader";

export default function Teacher(props) {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const teachers = useSelector((state) => state.teachers.teachers);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
    dispatch(teachersFetch());
  }, []);

  return (
    <>
      {loading ? (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg ml-6 mr-6 mt-[18rem] w-full md:w-full sm:[50%]">
          <div className="flex content-center justify-center my-auto ">
            <ClipLoader color={"gray-900"} loading={loading} size={100} aria-label="Loading Spinner" data-testid="loader" />
          </div>
        </div>
      ) : (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg ml-6 mr-6 mt-[4rem] w-full md:w-full sm:[50%]">
          <div className="flex items-center justify-center pb-4 bg-white dark:bg-gray-900 ml-6 mr-6">
            <div className="grow-0 shrink-1 md:shrink-0 basis-auto xl:w-4/12 lg:w-4/12 md:w-7/12 mb-12 md:mb-[5rem] ">
              <div className="w-[70%] mask mask-squircle mx-auto">
                <img src="https://res.cloudinary.com/dslzpyibe/image/upload/v1678271653/assets%20finalproject/undraw_Teacher_re_sico_a3o50c.png" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end pb-4 bg-white dark:bg-gray-900 mr-[20rem]">
            <div className="ml-[4rem]">
              <Link to="/newAdmin">
                <button
                  className="inline-flex items-center text-gray-300  border border-gray-900 focus:outline-none bg-gray-900 hover:text-white focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-gray-400 h-10"
                  type="button"
                >
                  Add Teacher
                </button>
              </Link>
            </div>
          </div>

          <table className="w-[80%] text-l text-left text-gray-500 dark:text-gray-400 mt-6 mx-auto">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 text-center">
              <tr>
                <th scope="col" className="px-6 py-3">
                  No
                </th>
                <th scope="col" className="px-6 py-3">
                  Name
                </th>
              </tr>
            </thead>
            <tbody className="text-center">
              {teachers.map((el, index) => {
                return <TableTeacher key={el.id} data={el} index={index} />;
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
