import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addSchedule, classesFetch, classesFetchSuccess, editSchedule, lessonsFetch, scheduleById, scheduleFetchSuccessById } from "../store/action/ActionCreator";

export default function AddSchedule(props) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const lessons = useSelector((state) => state.lessons.lessons);
  const schedule = useSelector((state) => state.schedules.schedule);

  console.log(schedule, "ini lessons");
  // console.log(lessons);

  const [form, setForm] = useState({
    day: "",
    LessonId: "",
  });

  useEffect(() => {
    let temp = schedule
      ? {
          day: schedule.day,
          LessonId: schedule.LessonId,
        }
      : {
          day: "",
          LessonId: "",
        };
    setForm(temp);
    dispatch(lessonsFetch());
  }, [schedule]);

  const changeInputHandler = (event) => {
    const { name, value } = event.target;

    const newForm = {
      ...form,
    };
    newForm[name] = value;

    setForm(newForm);
  };
  // console.log(form);

  const handleCancel = () => {
    dispatch(
      classesFetchSuccess({
        day: "",
        LessonId: "",
      })
    );
    navigate("/schedule");
  };

  const submitForm = (e) => {
    e.preventDefault();
    if (schedule.id) {
      dispatch(editSchedule(form, schedule.id)).then(() => {
        navigate("/schedule");
      });
    } else {
      dispatch(addSchedule(form)).then(() => {
        navigate("/schedule");
      });
    }
    dispatch(
      scheduleFetchSuccessById({
        day: "",
        LessonId: "",
      })
    );
  };

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg mx-auto  mt-[3rem] w-[50%] md:w-[30%] sm:[20%] ">
      <div className="mb-6">
        <p className="font-Comfortaa font-semibold text-[1.3rem] dark:text-white">Form Schedule</p>
      </div>
      <form className="mr-12" onSubmit={submitForm}>
        <div className="relative z-0 w-full mb-6 group">
          <input
            onChange={changeInputHandler}
            value={form.day}
            type="text"
            name="day"
            id="floating_name"
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder=" "
            required
          />
          <label
            htmlFor="floating_name"
            className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Day
          </label>
        </div>
        <div className="relative z-0 w-full mb-6 group">
          <select
            onChange={changeInputHandler}
            value={form.LessonId}
            name="LessonId"
            id="countries"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          >
            <option>Choose Lesson</option>

            {lessons?.map((el) => {
              return (
                <option key={el.id} value={el.id}>
                  {el.name}
                </option>
              );
            })}
          </select>
        </div>

        <button
          className="inline-flex items-center  border border-gray-900 focus:outline-none bg-gray-900 text-white focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-gray-400 "
          type="submit"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
