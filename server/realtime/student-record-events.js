const studentRecordEventName = 'student.record.updated';
const supportedRecordTypes = new Set([
  'attendance',
  'score',
  'feedback',
  'evidence',
]);

let realtimeServer = null;

function getStudentRoom(studentId) {
  return `student:${studentId}`;
}

function setRealtimeServer(io) {
  realtimeServer = io;
}

function normalizeOccurredAt(occurredAt) {
  if (occurredAt instanceof Date) return occurredAt.toISOString();
  if (typeof occurredAt === 'string' && occurredAt.trim()) return occurredAt;
  return new Date().toISOString();
}

function emitStudentRecordUpdated({ studentId, recordType, occurredAt }) {
  if (!realtimeServer || !studentId || !supportedRecordTypes.has(recordType)) {
    return false;
  }

  try {
    realtimeServer.to(getStudentRoom(studentId)).emit(studentRecordEventName, {
      studentId,
      recordType,
      occurredAt: normalizeOccurredAt(occurredAt),
    });
  } catch (error) {
    return false;
  }

  return true;
}

module.exports = {
  emitStudentRecordUpdated,
  getStudentRoom,
  setRealtimeServer,
  studentRecordEventName,
};
