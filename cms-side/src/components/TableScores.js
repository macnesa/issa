import { useState } from "react";
import { useDispatch } from "react-redux";
import Editable from "./EditTable";
import { editScores } from "../store/action/ActionCreator";

export default function TableScores({ data, student }) {
  const dispatch = useDispatch();
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");

  const submitForm = (event) => {
    event.preventDefault();
    const nextValue = Number(value);
    if (!Number.isInteger(nextValue) || nextValue < 0 || nextValue > 100) {
      setMessage("Nilai harus berupa angka bulat 0–100.");
      return;
    }

    setMessage("");
    dispatch(editScores(student.id, { ScoreId: data.id, value: nextValue }))
      .then(() => setValue(""))
      .catch((error) => setMessage(error.message || "Score gagal diperbarui."));
  };

  return (
    <tr className="bg-white dark:bg-gray-800">
      <th scope="row" className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap dark:text-white">{data.Assignment?.name}</th>
      <th scope="row" className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap dark:text-white">{data.Lesson?.name}</th>
      <td className="px-6 py-4">{data.Lesson?.KKM}</td>
      <td className="px-6 py-4">
        <Editable text="" value={data.value} type="input">
          <form onSubmit={submitForm}>
            <input min="0" max="100" step="1" type="number" placeholder={data.value} onChange={(event) => setValue(event.target.value)} value={value} />
            <button type="submit" className="ml-2 hover:text-blue-800">save</button>
          </form>
        </Editable>
        {message && <p role="status" className="text-red-600">{message}</p>}
      </td>
      <td className="px-6 py-4">{data.category}</td>
      <td className="px-6 py-4 max-w-[100px]">{data.desc}</td>
    </tr>
  );
}
