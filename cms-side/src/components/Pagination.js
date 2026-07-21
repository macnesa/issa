import { useDispatch } from "react-redux";
import { useState } from "react";

import { historiesFetch, studentsFetch } from "../store/action/ActionCreator";

export default function Pagination(props) {
  const { data } = props;
  const dispatch = useDispatch();

  const [currentPage, setCurrentPage] = useState(1);

  const [query, setQuery] = useState({ name: "" });

  const changeInputHandler = (event) => {
    const { name, value } = event.target;

    const newQuery = {
      ...query,
    };
    newQuery[name] = value;

    setQuery(newQuery);
  };

  const prePage = (e) => {
    e.preventDefault();
    if (currentPage !== 1 && currentPage > 0) {
      if (data?.rows[0].description !== "" && data.rows[0].description) {
        // console.log("masuk pre his");
        setCurrentPage(currentPage - 1);
        dispatch(historiesFetch(query, currentPage - 1));
      } else {
        // console.log("masuk pre ");
        setCurrentPage(currentPage - 1);
        dispatch(studentsFetch(query, currentPage - 1));
      }
    }
  };

  const nextPage = (e) => {
    e.preventDefault();
    if (data?.totalPages != currentPage && currentPage > 0) {
      if (data?.rows[0].description !== "" && data?.rows[0].description) {
        // console.log("masuk next his");
        setCurrentPage(currentPage + 1);
        dispatch(historiesFetch(query, currentPage + 1));
      } else {
        // console.log("masuk next ");
        setCurrentPage(currentPage + 1);
        dispatch(studentsFetch(query, currentPage + 1));
      }
    }
  };
  return (
    <div className="flex justify-center mt-[3rem]">
      <nav aria-label="Page navigation example">
        <ul className="inline-flex items-center -space-x-px">
          <li value={query.pageIndex} name="pageIndex" onChange={changeInputHandler} onClick={prePage}>
            <a
              href="#"
              className="block px-3 py-2 ml-0 leading-tight text-gray-800 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <div className="flex justify-between">
                <div>
                  <span className="sr-only">Previous</span>
                  <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>Previous</div>
              </div>
            </a>
          </li>

          <li onClick={nextPage} onChange={changeInputHandler} value={query.pageIndex} name="pageIndex">
            <a
              href="#"
              className="block px-3 py-2 leading-tight text-gray-800 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <div className="flex justify-between">
                <div>Next</div>
                <div>
                  <span className="sr-only">Next</span>
                  <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
