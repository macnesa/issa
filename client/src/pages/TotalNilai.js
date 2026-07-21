

import { useSelector } from 'react-redux';
import BubbleChartDua from '../components/BubbleChartDua';

export default function TotalNilai(props) {


  const {
    student: {
      studentDetail
    }
  } = useSelector((state) => state)

  const statistic = Object.values(
    (studentDetail?.Scores || []).reduce((lessons, score) => {
      const name = score.Lesson?.name;
      const value = Number(score.value);

      if (!name || !Number.isFinite(value)) return lessons;

      if (!lessons[name]) {
        lessons[name] = { name, total: 0, count: 0 };
      }

      lessons[name].total += value;
      lessons[name].count += 1;
      return lessons;
    }, {})
  ).map(({ name, total, count }) => ({ name, avg: total / count }));
  
  if(!statistic.length) {
    return(
      <p>Belum ada nilai.</p>
    )
  }

  return (
    <>
      <div className='bg-gray-50 max-w-screen-lg mx-auto pt-10 dark:bg-gray-900 p-3 sm:p-5 '>
      <h5 class="text-xl font-semibold tracking-tight text-gray-900 dark:text-white"> Overview </h5>

        <div className=' bg-[] rounded-2xl mt-4 grid justify-center items-center overflow-scroll border-red-800'>

          <BubbleChartDua data={statistic} />

        </div>

      </div>

    </>
  )
}
