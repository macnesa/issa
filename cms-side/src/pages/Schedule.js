import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { scheduleFetch } from "../store/action/ActionCreator";
import ClipLoader from "react-spinners/ClipLoader";
import Item from "../components/ItemCardSchedule";

export default function Schedule(props) {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const schedules = useSelector((state) => state.schedules.schedules);

  useEffect(() => {
    setLoading(true);
    dispatch(scheduleFetch()).finally(() => setLoading(false));
  }, [dispatch]);

  const result1 = schedules?.filter((el) => el.day == "Monday");
  const result2 = schedules?.filter((el) => el.day == "Tuesday");
  const result3 = schedules?.filter((el) => el.day == "Wednesday");
  const result4 = schedules?.filter((el) => el.day == "Thursday");
  const result5 = schedules?.filter((el) => el.day == "Friday");

  const day = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <>
      {loading && (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg ml-6 mr-6 mt-[18rem] w-full md:w-full sm:[50%] ">
          <div className="flex content-center justify-center my-auto ">
            <ClipLoader color={"gray-900"} loading={loading} size={100} aria-label="Loading Spinner" data-testid="loader" />
          </div>
        </div>
      )}
      {!loading && (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg ml-6 mr-6 mt-[4rem] w-full md:w-full sm:[50%]">
          <div className="flex items-center justify-center pb-4 bg-white dark:bg-gray-900 ml-6 mr-6">
            <div className="grow-0 shrink-1 md:shrink-0 basis-auto xl:w-4/12 lg:w-4/12 md:w-7/12 mb-12 md:mb-[5rem] ">
              <div className="w-[70%] mask mask-squircle mx-auto">
                <img src="https://res.cloudinary.com/dslzpyibe/image/upload/v1678369993/assets%20finalproject/undraw_Checking_boxes_re_9h8m_sb5nqo.png" />
              </div>
              <p className="dark:text-white font-Comfortaa font-semibold text-[1.3rem] text-center mt-6">SCHEDULE</p>
            </div>
          </div>
          <div className="flex justify-center items-center">
            <div className="grid grid-cols-3 gap-4 ">
              {day?.map((el, index) => {
                return (
                  <div class="max-w-sm bg-[#d4d4d4] border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                    <div class="p-5">
                      <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white text-center">{el.toUpperCase()}</h5>
                      <ul className="list-disc ml-2">
                        <Item key={el.id} day={el} data={schedules} />
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
