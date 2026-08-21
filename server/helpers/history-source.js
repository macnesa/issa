'use strict';

const classroomDebriefSource = 'classroom_debrief';

function appendHistorySource(description, source) {
  return source === classroomDebriefSource
    ? `${description} [source: ${classroomDebriefSource}]`
    : description;
}

module.exports = {
  appendHistorySource,
  classroomDebriefSource,
};
