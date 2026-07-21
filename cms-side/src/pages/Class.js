import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import TableClass from "../components/TableClass";
import { classesFetch } from "../store/action/ActionCreator";
import ClipLoader from "react-spinners/ClipLoader";

export default function Classes(props) {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const classes = useSelector((state) => state.classes.classes);

  console.log(classes);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1500);
    dispatch(classesFetch());
  }, []);

  return (
    <>
      {loading ? (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg ml-6 mr-6 mt-[18rem] w-full md:w-full sm:[50%] ">
          <div className="flex content-center justify-center my-auto ">
            <ClipLoader color={"gray-900"} loading={loading} size={100} aria-label="Loading Spinner" data-testid="loader" />
          </div>
        </div>
      ) : (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg ml-6 mr-6 mt-[2rem] w-full md:w-full sm:[50%]">
          <div className="flex items-center justify-center pb-4 bg-white dark:bg-gray-900 ml-6 mr-6">
            <div className="grow-0 shrink-1 md:shrink-0 basis-auto xl:w-4/12 lg:w-4/12 md:w-7/12 mb-12 md:mb-[5rem] ">
              <div className="w-[70%] mask mask-squircle mx-auto">
                <img src="https://res.cloudinary.com/dslzpyibe/image/upload/v1678270352/assets%20finalproject/undraw_Teaching_re_g7e3_y1leeh.png" />
              </div>
              <p className="dark:text-white font-Comfortaa font-semibold text-[1.3rem] text-center mt-6">CLASSES</p>
            </div>
          </div>
          <div className="w-[80%] text-l text-left text-gray-500 dark:text-gray-400 mt-6 flex justify-end">
            <Link to="/formClass">
              <button
                className="inline-flex items-center  dark:text-white border border-gray-900 focus:outline-none bg-gray-900 text-white focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 h-10"
                type="button"
              >
                Add Class
              </button>
            </Link>
          </div>
          <table className="w-[80%] text-l text-left text-gray-500 dark:text-gray-400 mt-6 mx-auto">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 text-center">
              <tr>
                <th scope="col" className="px-12 py-3">
                  No
                </th>
                <th scope="col" className="px-12 py-3">
                  Class
                </th>
                <th scope="col" className="px-12 py-3">
                  Spp
                </th>
                <th scope="col" className="px-6 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="text-center">
              {classes.map((el, index) => {
                return <TableClass key={el.id} classes={el} index={index} />;
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
