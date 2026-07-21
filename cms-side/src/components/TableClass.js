import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { classesById, classDelete } from "../store/action/ActionCreator";

export default function TableClass(props) {
  const { classes, index } = props;
  const dispatch = useDispatch();

  const handleDetail = (id) => {
    dispatch(classesById(id));
  };

  const handleDeleteClass = (id) => {
    dispatch(classDelete(id));
  };

  return (
    <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
      <td className="w-4 p-4">{index + 1}</td>

      <td className="px-6 py-4 text-gray-900 dark:text-white">{classes.name}</td>
      <td className="px-6 py-4 text-black dark:text-white">
        {new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(classes.SPP)}
      </td>
      <td className="px-6 py-4">
        <Link to="/formClass">
          <button
            onClick={() => handleDetail(classes.id)}
            className="inline-flex items-center text-gray-900 dark:text-white bg-white border border-gray-900 focus:outline-none hover:bg-gray-900 hover:text-white focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 h-10 mr-4"
            type="button"
          >
            Edit
          </button>
        </Link>
        <button
          onClick={() => handleDeleteClass(classes.id)}
          className="inline-flex items-center text-gray-900 dark:text-white bg-white border border-gray-900 focus:outline-none hover:bg-[red] hover:text-white focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 h-10 "
          type="button"
        >
          DELETE
        </button>
      </td>
    </tr>
  );
}
