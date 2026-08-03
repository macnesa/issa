import { tw } from "../shared/ui/tw";
export default function TableHistory(props) {
  const { data, index } = props;
  return (
    <tr className={tw("bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600")}>
      <td className={tw("w-4 p-4")}>{index + 1}</td>

      <td className={tw("px-6 py-4 text-black dark:text-white")}>{data.description}</td>
      <td className={tw("px-6 py-4 dark:text-white")}>{data.createdBy}</td>
      <td className={tw("px-6 py-4 dark:text-white")}>{data.updatedAt.substring(0, 10)}</td>
    </tr>
  );
}
