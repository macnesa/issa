import { useEffect, useState, useRef } from "react";

import { Link, useNavigate } from "react-router-dom";

import { useSelector, useDispatch } from "react-redux";

import { fetchStudentDetail } from "../store/actions/actionCreator";

import ScrollReveal from "scrollreveal";

import HeatmapDua from "../components/HeatmapChartDua";

export default function AttendancePage(props) {
  const dispatch = useDispatch();

  const {
    student: { studentDetail },
  } = useSelector((state) => state);

  const { Attendances } = studentDetail;

  let result;
  if (Attendances?.length) {
    result = Attendances.reduce((acc, cur) => {
      const date = new Date(cur.createdAt);
      const month = date.toLocaleString("default", { month: "long" });
      const status = cur.status;

      if (!acc[month]) {
        acc[month] = {
          Hadir: 0,
          Sakit: 0,
          Izin: 0,
          Alfa: 0,
        };
      }

      acc[month][status]++;

      return acc;
    }, {});
  }

  console.log(result, "lech");
  // console.log(result);

  useEffect(() => {}, []);

  if (Attendances?.length) {
    return (
      <>
        <div className=" max-w-screen-lg mb-20 mx-auto pt-4 dark:bg-gray-900 p-3 sm:p-5 ">
          <h5 class="text-xl font-semibold mt-10 tracking-tight text-gray-900 dark:text-white">
            {" "}
            Rekap   Kehadiran{" "}
          </h5>

          <div style={{backgroundImage: "url(https://cdn.pixabay.com/photo/2017/09/06/11/41/clean-2721102__340.jpg)"}} className=" bg-[#fce4bb] rounded-2xl mt-4 grid items-center overflow-scroll border-red-800">
            {/* <div className='transform scale-[2] ' > */}

            <HeatmapDua data={Attendances} />

            {/* </div> */}
          </div>

          <div className="grid grid-cols-[1fr_1fr_1fr] mt-10   border-black justify-items-center gap-4 ">
            {Object.keys(result).map((month) => (
              <div className="  text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <a
                  href="#"
                  aria-current="true"
                  className="block w-full font-bold px-4 py-2 text-white bg-gray-700 border-b border-gray-200 rounded-t-lg cursor-pointer dark:bg-gray-800 dark:border-gray-600"
                >
                  {month}
                </a>
                {Object.keys(result[month]).map((status) => (
                  <>
                    <a
                      href="#"
                      className="block w-full px-4 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white"
                    >
                      {status}: {result[month][status]}
                    </a> 
                  </>
                ))}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }
}
