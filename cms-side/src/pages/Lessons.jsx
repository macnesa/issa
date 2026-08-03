import { tw } from "../shared/ui/tw";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { lessonsById, lessonsFetch, scheduleFetch } from "../store/action/ActionCreator";
import ClipLoader from "react-spinners/ClipLoader";
import TableLesson from "../components/TableLesson";

export default function Lessons(props) {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const lessons = useSelector((state) => state.lessons.lessons);

  console.log(lessons);
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1500);
    dispatch(lessonsFetch());
  }, []);

  return (
    <>
      {loading && (
        <div className={tw("relative overflow-x-auto shadow-md sm:rounded-lg ml-6 mr-6 mt-[18rem] w-full md:w-full sm:[50%]")}>
          <div className={tw("flex content-center justify-center my-auto ")}>
            <ClipLoader color={"gray-900"} loading={loading} size={100} aria-label="Loading Spinner" data-testid="loader" />
          </div>
        </div>
      )}
      {!loading && (
        <div className={tw("relative overflow-x-auto shadow-md sm:rounded-lg ml-6 mr-6 mt-[4rem] w-full md:w-full sm:[50%]")}>
          <div className={tw("flex items-center justify-center pb-4 bg-white dark:bg-gray-900 ml-6 mr-6")}>
            <div className={tw("grow-0 shrink-1 md:shrink-0 basis-auto xl:w-4/12 lg:w-4/12 md:w-7/12 mb-12 md:mb-[5rem] ")}>
              <div className={tw("w-[70%] mask mask-squircle mx-auto")}>
                <img src="https://res.cloudinary.com/dslzpyibe/image/upload/v1678369517/assets%20finalproject/undraw_Books_re_8gea_igp8f8.png" />
              </div>
              <p className={tw("dark:text-white font-sans font-semibold text-[1.3rem] text-center mt-6")}>LESSONS</p>
            </div>
          </div>

          <div className={tw("flex justify-center mb-10")}>
            <Link to="/formLesson">
              <button
                className={tw("inline-flex items-center   border-gray-900 focus:outline-none bg-gray-900 text-white focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-3 py-1.5 :bg-gray-800 dark:bg-gray-700 h-10")}
                type="button"
              >
                Add Lesson
              </button>
            </Link>
          </div>

          <div className={tw("flex justify-center items-center")}>
            <div className={tw("grid grid-cols-3 gap-4 ")}>
              {lessons.length > 0 &&
                lessons?.map((el, index) => {
                  return <TableLesson key={el.id} data={el} />;
                })}
            </div>
          </div>
        </div>
      )}
      ( )
    </>
  );
}
