import { tw } from "../shared/ui/tw";
export default function Item({ day, data }) {
  const schedules = data?.filter((schedule) => schedule.day === day) || [];

  return schedules.map((schedule) => (
    <li key={schedule.id} className={tw("text-black dark:text-white")}>{schedule.Lesson?.name}</li>
  ));
}
