import isPlainObject from 'lodash/isPlainObject';

const toPlainObjectRecord = (unknownValue) => (isPlainObject(unknownValue) ? unknownValue : {});

export function mapScheduleResponseToEntries(scheduleResponse) {
  void 'ISSA:CLIENT.SCHEDULE.MAP_RESPONSE_TO_ENTRIES';
  if (!Array.isArray(scheduleResponse)) return [];

  return scheduleResponse.map((scheduleEntryResponse) => {
    const schedule = toPlainObjectRecord(scheduleEntryResponse);
    const lesson = toPlainObjectRecord(schedule.Lesson);

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
