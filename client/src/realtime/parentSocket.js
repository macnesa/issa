import { io } from 'socket.io-client';
import apiBaseUrl from '../config/api';

export const studentRecordEventName = 'student.record.updated';

let activeParentSocket = null;

function warnInDevelopment(message, error) {
  if (import.meta.env.DEV) {
    console.warn(message, error);
  }
}

export function disconnectParentSocket() {
  if (!activeParentSocket) return;

  activeParentSocket.removeAllListeners();
  activeParentSocket.disconnect();
  activeParentSocket = null;
}

export function connectParentSocket({
  accessToken,
  studentId,
  onStudentRecordUpdated,
}) {
  disconnectParentSocket();

  if (!accessToken || !studentId || typeof onStudentRecordUpdated !== 'function') {
    return disconnectParentSocket;
  }

  const socket = io(apiBaseUrl, {
    autoConnect: false,
    auth: {
      accessToken,
    },
  });
  activeParentSocket = socket;

  socket.on(studentRecordEventName, (studentRecordEvent) => {
    if (String(studentRecordEvent?.studentId) !== String(studentId)) return;
    onStudentRecordUpdated(studentRecordEvent);
  });
  socket.on('connect_error', (error) => {
    warnInDevelopment('Parent realtime connection is unavailable.', error);
  });
  socket.on('error', (error) => {
    warnInDevelopment('Parent realtime connection reported an error.', error);
  });
  socket.connect();

  return () => {
    if (activeParentSocket === socket) {
      disconnectParentSocket();
      return;
    }

    socket.removeAllListeners();
    socket.disconnect();
  };
}
