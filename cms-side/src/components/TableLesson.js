import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { lessonDelete, lessonsById } from "../store/action/ActionCreator";

export default function TableLesson(props) {
  const { data } = props;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // console.log(data);

  const handleLessonById = (id) => {
    dispatch(lessonsById(id)).then(() => {
      navigate("/formLesson");
    });
  };

  const handleDeleteLesson = (id) => {
    dispatch(lessonDelete(id));
  };
  return (
    <div className="max-w-sm bg-[#d4d4d4] border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
      <div className="p-5 mx-auto">
        <div className="avatar ml-[2.9rem]">
          <div className="w-24 rounded-full">
            <img className="mx-auto" src={data.imgUrl} />
          </div>
        </div>
        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white text-center ml-5">{data.name}</h5>

        <button
          onClick={() => handleLessonById(data.id)}
          className="inline-flex items-center   border-gray-900 focus:outline-none bg-gray-900 text-white focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-3 py-1.5 :bg-gray-800 dark:bg-gray-700 h-10 ml-6"
          type="button"
        >
          Update
        </button>
        <button
          onClick={() => handleDeleteLesson(data.id)}
          className="inline-flex items-center   border-gray-900 focus:outline-none bg-gray-900 text-white focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-3 py-1.5 :bg-gray-800 dark:bg-gray-700 h-10 ml-2"
          type="button"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
