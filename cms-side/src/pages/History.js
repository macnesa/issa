import TableHistory from "../components/TableHistory";
import { Link } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { historiesFetch } from "../store/action/ActionCreator";
import Pagination from "../components/Pagination";

export default function History(params) {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const histories = useSelector((state) => state.histories.histories);
  console.log(histories);
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
    dispatch(historiesFetch());
  }, []);

  const [query, setQuery] = useState({
    createdBy: "",
  });

  const changeInputHandler = (event) => {
    const { name, value } = event.target;

    const newQuery = {
      ...query,
    };
    newQuery[name] = value;

    setQuery(newQuery);
  };

  const submitQuery = (e) => {
    e.preventDefault();
    dispatch(historiesFetch(query));
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  return (
    <>
      {loading ? (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg ml-6 mr-6 mt-[18rem] w-full md:w-full sm:[50%]">
          <div className="flex content-center justify-center my-auto ">
            <ClipLoader color={"gray-900"} loading={loading} size={100} aria-label="Loading Spinner" data-testid="loader" />
          </div>
        </div>
      ) : (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg ml-6 mr-6 mt-[2rem] w-full md:w-full sm:[50%]">
          <div className="flex items-center justify-center pb-4 bg-white dark:bg-gray-900 ml-6 mr-6">
            <div className="grow-0 shrink-1 md:shrink-0 basis-auto xl:w-4/12 lg:w-4/12 md:w-7/12 mb-12 md:mb-[5rem] ">
              <div className="w-[70%] mask mask-squircle mx-auto">
                <img src="https://res.cloudinary.com/dslzpyibe/image/upload/v1678294641/assets%20finalproject/undraw_Photo_session_re_c0cp_j7b54x.png" />
              </div>
              <p className="dark:text-white font-Comfortaa font-semibold text-[1.3rem] text-center mt-6">HISTORY</p>
            </div>
          </div>
          <div className="flex items-center justify-end pb-4 bg-white dark:bg-gray-900 ml-6 mr-[18rem] mb-14">
            <div className="flex justify-end ">
              <input
                onChange={changeInputHandler}
                value={query.createdBy}
                type="text"
                name="createdBy"
                placeholder="Search By Name"
                className="input input-bordered  max-w-xs block p-2 pl-10 text-sm text-gray-900 border border-gray-900 rounded-lg w-80 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500  dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 h-10"
              />
            </div>
            <div className="ml-4">
              <button
                onClick={submitQuery}
                className="inline-flex items-center  dark:bg-gray-700 border border-gray-900 focus:outline-none bg-gray-900 text-white dark:text-white focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-3 py-1.5 :bg-gray-800  h-10"
                type="button"
              >
                Search
              </button>
            </div>
          </div>
          <table className="w-full text-l text-left text-gray-500 dark:text-gray-400 mt-6">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 text-center">
              <tr>
                <th scope="col" className="px-12 py-3">
                  No
                </th>
                <th scope="col" className="px-12 py-3">
                  Description
                </th>
                <th scope="col" className="px-12 py-3">
                  Created By
                </th>
                <th scope="col" className="px-6 py-3">
                  Updated At
                </th>
              </tr>
            </thead>
            <tbody className="text-center">
              {histories.rows?.map((el, index) => {
                return <TableHistory key={el.id} data={el} index={index} />;
              })}
            </tbody>
          </table>
          <div className="mb-[5rem]">
            <Pagination data={histories} />
          </div>
        </div>
      )}
    </>
  );
}
