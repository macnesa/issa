export default function TableTeacher(props) {
  const { data, index } = props;
  return (
    <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
      <td className="w-4 p-4">{index + 1}</td>
      <td className="px-6 py-4">{data.name}</td>
    </tr>
  );
}
