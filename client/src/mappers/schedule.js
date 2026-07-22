const asRecord = (value) => (value && typeof value === 'object' ? value : {});

export function mapSchedule(payload) {
  if (!Array.isArray(payload)) return [];

  return payload.map((record) => {
    const schedule = asRecord(record);
    const lesson = asRecord(schedule.Lesson);

    return {
      id: schedule.id ?? null,
      day: schedule.day ?? '',
      lesson: {
        id: lesson.id ?? null,
        name: lesson.name ?? '',
        imageUrl: lesson.imgUrl ?? '',
      },
    };
  });
}
