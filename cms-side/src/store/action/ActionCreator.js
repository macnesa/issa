import { FETCH_CLASS, FETCH_STUDENT, FETCH_STUDENT_BYID, FETCH_CLASS_BYID, FETCH_SCHEDULE, FETCH_TEACHER, FETCH_LESSON, FETCH_LESSON_BYID, FETCH_HISTORY, FETCH_SCHEDULE_BYID, FETCH_TRANSACTION } from './ActionTypes';
import baseUrl from '../../config/api';

// import Swal from "sweetalert2";

// STUDENT ONLY //

export const fetchStudentList = (studentSearchQuery = {}, pageIndex) => {
  void 'ISSA:CMS.STUDENT.FETCH_LIST';
  const params = new URLSearchParams();
  if (studentSearchQuery.name?.trim()) params.set('name', studentSearchQuery.name.trim());
  if (pageIndex) params.set('pageIndex', pageIndex);
  const url = `${baseUrl}/students${params.toString() ? `?${params.toString()}` : ''}`;

  return (dispatch, getState) => {
    return fetch(`${url}`, {
      headers: {
        access_token: localStorage.access_token,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Network was not ok');
        }
        return response.json();
      })
      .then((studentListResponse) => {
        dispatch(storeStudentList(studentListResponse));
        return studentListResponse;
      })
      .catch((error) => Promise.reject(error));
  };
};

export const storeStudentList = (studentListResponse) => {
  return {
    type: FETCH_STUDENT,
    payload: studentListResponse,
  };
};

export const fetchStudentDetail = (studentId) => {
  void 'ISSA:CMS.STUDENT.FETCH_DETAIL';
  return (dispatch, getState) => {
    return fetch(`${baseUrl}/students/${studentId}`, {
      method: 'GET',
      headers: {
        access_token: localStorage.access_token,
      },
    })
      .then(async (response) => {
        let data = null;
        try {
          data = await response.json();
        } catch (error) {
          data = null;
        }
        if (!response.ok) {
          const requestError = new Error(
            data?.msg || 'Student tidak dapat dimuat.'
          );
          requestError.status = response.status;
          throw requestError;
        }
        return data;
      })
      .then((studentDetailResponse) => {
        dispatch(storeStudentDetail(studentDetailResponse));
        return studentDetailResponse;
      })
      .catch((error) => Promise.reject(error));
  };
};

export const storeStudentDetail = (studentDetailResponse) => {
  return {
    type: FETCH_STUDENT_BYID,
    payload: studentDetailResponse,
  };
};

export const studentAdd = (payload) => {
  console.log(payload, 'masuk ni');

  return (dispatch, getState) => {
    return fetch(`${baseUrl}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: localStorage.access_token,
      },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = await response.json();
          console.log(error);
          throw new Error(error.message);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Success:", data);
        // Swal.fire({
        //   position: "top-end",
        //   icon: "success",
        //   title: "Add Product Success",
        //   showConfirmButton: false,
        //   timer: 1500,
        // });
        dispatch(fetchStudentList());
        console.log('masuk nih');
      })
      .catch((error) => {
        console.error('Error:', error);
        // Swal.fire({
        //   icon: "error",
        //   title: "Oops...",
        //   text: error.message,
        // });
      });
  };
};

export const updateStudentRecord = (studentId, studentUpdatePayload) => {
  void 'ISSA:CMS.STUDENT.UPDATE_RECORD';
  return (dispatch, getState) => {
    return fetch(`${baseUrl}/students/${studentId}`, {
      method: 'PUT',
      headers: {
        access_token: localStorage.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentUpdatePayload),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'Unable to update student');
        return data;
      })
      .then((studentUpdateResponse) => {
        dispatch(storeStudentDetail(studentUpdateResponse.data));
        dispatch(fetchStudentList());
        return studentUpdateResponse;
      })
      .catch((error) => Promise.reject(error));
  };
};

export const studentDelete = (id) => {
  return (dispatch, getState) => {
    fetch(`${baseUrl}/students/${id}`, {
      method: 'DELETE',
      headers: {
        access_token: localStorage.access_token,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Success:", data);
        dispatch(fetchStudentList());
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };
};

//  TEACHER ONLY //
export const teachersFetch = (payload) => {
  return (dispatch, getState) => {
    fetch(`${baseUrl}/teachers`, {
      headers: {
        access_token: localStorage.access_token,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Network was not ok');
        }
        return response.json();
      })
      .then((data) => {
        console.log(data, '>>>>>>>>');
        dispatch(teachersFetchSuccess(data));
        // console.log(data);
      })
      .catch((err) => {
        console.log(err);
      });
  };
};

export const teachersFetchSuccess = (payload) => {
  return {
    type: FETCH_TEACHER,
    payload: payload,
  };
};

export const teacherAdd = (payload) => {
  return (dispatch, getState) => {
    return fetch(`${baseUrl}/teachers/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: localStorage.access_token,
      },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = await response.json();
          console.log(error);
          throw new Error(error.message);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Success:", data);
        // Swal.fire({
        //   position: "top-end",
        //   icon: "success",
        //   title: "Add Product Success",
        //   showConfirmButton: false,
        //   timer: 1500,
        // });
        dispatch(teachersFetch());
      })
      .catch((error) => {
        console.error('Error:', error);
        // Swal.fire({
        //   icon: "error",
        //   title: "Oops...",
        //   text: error.message,
        // });
      });
  };
};

// CLASS ONLY //

export const classesFetch = (payload) => {
  return (dispatch, getState) => {
    fetch(`${baseUrl}/classes`, {
      headers: {
        access_token: localStorage.access_token,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Network was not ok');
        }
        return response.json();
      })
      .then((data) => {
        dispatch(classesFetchSuccess(data));
        // console.log(data);
      })
      .catch((err) => {
        console.log(err);
      });
  };
};

export const classesFetchSuccess = (payload) => {
  return {
    type: FETCH_CLASS,
    payload: payload,
  };
};

export const classesById = (id) => {
  console.log(id);
  return (dispatch, getState) => {
    fetch(`${baseUrl}/classes/${id}`, {
      method: 'GET',
      headers: {
        access_token: localStorage.access_token,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Success:", data);
        dispatch(classFetchSuccessById(data));
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };
};

export const classFetchSuccessById = (payload) => {
  return {
    type: FETCH_CLASS_BYID,
    payload: payload,
  };
};

export const classesAdd = (payload) => {
  return (dispatch, getState) => {
    return fetch(`${baseUrl}/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: localStorage.access_token,
      },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = await response.json();
          console.log(error);
          throw new Error(error.message);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Success:", data);
        // Swal.fire({
        //   position: "top-end",
        //   icon: "success",
        //   title: "Add Product Success",
        //   showConfirmButton: false,
        //   timer: 1500,
        // });
        dispatch(classesFetch());
      })
      .catch((error) => {
        console.error('Error:', error);
        // Swal.fire({
        //   icon: "error",
        //   title: "Oops...",
        //   text: error.message,
        // });
      });
  };
};

export const editClass = (payload) => {
  console.log(payload, 'ini action');
  return (dispatch, getState) => {
    return fetch(`${baseUrl}/classes/${payload.StudentId}`, {
      method: 'PUT',
      headers: {
        access_token: localStorage.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Success:", data);
        dispatch(classesFetch());
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };
};

export const classDelete = (id) => {
  return (dispatch, getState) => {
    fetch(`${baseUrl}/classes/${id}`, {
      method: 'DELETE',
      headers: {
        access_token: localStorage.access_token,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Success:", data);
        dispatch(classesFetch());
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };
};

// LESSON ONLY //

export const lessonsFetch = (payload) => {
  return (dispatch, getState) => {
    fetch(`${baseUrl}/lessons`, {
      headers: {
        access_token: localStorage.access_token,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Network was not ok');
        }
        return response.json();
      })
      .then((data) => {
        dispatch(lessonsFetchSuccess(data));
        // console.log(data);
      })
      .catch((err) => {
        console.log(err);
      });
  };
};

export const lessonsFetchSuccess = (payload) => {
  return {
    type: FETCH_LESSON,
    payload: payload,
  };
};

export const lessonsById = (id) => {
  console.log(id);
  return (dispatch, getState) => {
    return fetch(`${baseUrl}/lessons/${id}`, {
      method: 'GET',
      headers: {
        access_token: localStorage.access_token,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Success:", data);
        dispatch(lessonFetchSuccessById(data));
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };
};

export const lessonFetchSuccessById = (payload) => {
  return {
    type: FETCH_LESSON_BYID,
    payload: payload,
  };
};

export const addLesson = (payload) => {
  console.log(payload);
  return (dispatch, getState) => {
    return fetch(`${baseUrl}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: localStorage.access_token,
      },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = await response.json();
          console.log(error);
          throw new Error(error.message);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Success:", data);
        // Swal.fire({
        //   position: "top-end",
        //   icon: "success",
        //   title: "Add Product Success",
        //   showConfirmButton: false,
        //   timer: 1500,
        // });
        dispatch(lessonsFetch());
        // console.log("masuk nih");
      })
      .catch((error) => {
        console.error('Error:', error);
        // Swal.fire({
        //   icon: "error",
        //   title: "Oops...",
        //   text: error.message,
        // });
      });
  };
};

export const editLesson = (payload, id) => {
  return (dispatch, getState) => {
    return fetch(`${baseUrl}/lessons/${id}`, {
      method: 'PUT',
      headers: {
        access_token: localStorage.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Success:", data);
        dispatch(lessonsFetch());
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };
};

export const lessonDelete = (id) => {
  return (dispatch, getState) => {
    fetch(`${baseUrl}/lessons/${id}`, {
      method: 'DELETE',
      headers: {
        access_token: localStorage.access_token,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Success:", data);
        dispatch(lessonsFetch());
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };
};

// ONLY SCORES //

export const updateStudentScore = (studentId, scoreUpdatePayload) => {
  void 'ISSA:CMS.SCORE.UPDATE_STUDENT_SCORE';
  return (dispatch, getState) => {
    return fetch(`${baseUrl}/scores`, {
      method: 'PUT',
      headers: {
        access_token: localStorage.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scoreUpdatePayload),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'Unable to update score');
        return data;
      })
      .then((data) => {
        dispatch(fetchStudentDetail(studentId));
        return data;
      })
      .catch((error) => Promise.reject(error));
  };
};

// ATTENDANCE ONLY //

export const createAttendanceRecord = (attendancePayload) => {
  void 'ISSA:CMS.ATTENDANCE.CREATE_RECORD';
  return (dispatch, getState) => {
    return fetch(`${baseUrl}/attendances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: localStorage.access_token,
      },
      body: JSON.stringify(attendancePayload),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'Unable to create attendance');
        return data;
      })
      .then((data) => {
        dispatch(fetchStudentList());
        return data;
      })
      .catch((error) => Promise.reject(error));
  };
};

export const updateAttendanceRecord = (attendancePayload) => {
  void 'ISSA:CMS.ATTENDANCE.UPDATE_RECORD';
  return (dispatch, getState) => {
    return fetch(`${baseUrl}/attendances`, {
      method: 'PUT',
      headers: {
        access_token: localStorage.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attendancePayload),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'Unable to update attendance');
        return data;
      })
      .then((data) => {
        dispatch(fetchStudentList());
        return data;
      })
      .catch((error) => Promise.reject(error));
  };
};

// SCHEDULE ONLY //

export const fetchClassSchedule = () => {
  void 'ISSA:CMS.SCHEDULE.FETCH_CLASS_SCHEDULE';
  return (dispatch, getState) => {
    return fetch(`${baseUrl}/schedules`, {
      headers: {
        access_token: localStorage.access_token,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Network was not ok');
        }
        return response.json();
      })
      .then((data) => {
        dispatch(schedulesFetchSuccess(data));
        return data;
      })
      .catch((error) => Promise.reject(error));
  };
};

export const schedulesFetchSuccess = (payload) => {
  return {
    type: FETCH_SCHEDULE,
    payload: payload,
  };
};

export const scheduleById = (id) => {
  console.log(id);
  return (dispatch, getState) => {
    fetch(`${baseUrl}/schedules/${id}`, {
      method: 'GET',
      headers: {
        access_token: localStorage.access_token,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Success:", data);
        dispatch(scheduleFetchSuccessById(data));
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };
};

export const scheduleFetchSuccessById = (payload) => {
  return {
    type: FETCH_SCHEDULE_BYID,
    payload: payload,
  };
};

export const addSchedule = (payload) => {
  console.log(payload);
  return (dispatch, getState) => {
    return fetch(`${baseUrl}/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: localStorage.access_token,
      },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = await response.json();
          console.log(error);
          throw new Error(error.message);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Success:", data);
        // Swal.fire({
        //   position: "top-end",
        //   icon: "success",
        //   title: "Add Product Success",
        //   showConfirmButton: false,
        //   timer: 1500,
        // });
        dispatch(fetchClassSchedule());
        // console.log("masuk nih");
      })
      .catch((error) => {
        console.error('Error:', error);
        // Swal.fire({
        //   icon: "error",
        //   title: "Oops...",
        //   text: error.message,
        // });
      });
  };
};

export const editSchedule = (payload, id) => {
  return (dispatch, getState) => {
    return fetch(`${baseUrl}/schedules/${id}`, {
      method: 'PUT',
      headers: {
        access_token: localStorage.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Success:", data);
        dispatch(fetchClassSchedule());
      })
      .catch((error) => {
        // console.error("Error:", error);
      });
  };
};

export const scheduleDelete = (id) => {
  return (dispatch, getState) => {
    fetch(`${baseUrl}/schedules/${id}`, {
      method: 'DELETE',
      headers: {
        access_token: localStorage.access_token,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Success:", data);
        dispatch(fetchClassSchedule());
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };
};

// HISTORY ONLY //

export const historiesFetch = (query, pageIndex) => {
  console.log(query, pageIndex);
  let url = `${baseUrl}/histories?`;

  if (!query && !pageIndex) {
    url = url;
  } else if (!pageIndex && query.createdBy !== '') {
    url += `createdBy=${query.createdBy}`;
  } else if (pageIndex && !query.createdBy) {
    url += `pageIndex=${pageIndex}`;
  } else if (query.createdBy !== '' && pageIndex) {
    url += `createdBy=${query.createdBy}&pageIndex=${pageIndex}`;
  }

  return (dispatch, getState) => {
    fetch(`${url}`, {
      headers: {
        access_token: localStorage.access_token,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Network was not ok');
        }
        return response.json();
      })
      .then((data) => {
        // console.log(data, ">>>>>>>>");
        dispatch(historiesFetchSuccess(data));
        // console.log(data);
      })
      .catch((err) => {
        console.log(err);
      });
  };
};

export const historiesFetchSuccess = (payload) => {
  return {
    type: FETCH_HISTORY,
    payload: payload,
  };
};

// TRANSACTIONS ONLY //

export const transactionsFetch = (query, pageIndex) => {
  return (dispatch, getState) => {
    return fetch(`${baseUrl}/transactions`, {
      headers: {
        access_token: localStorage.access_token,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Network was not ok');
        }
        return response.json();
      })
      .then((data) => {
        // console.log(data, ">>>>>>>>");
        dispatch(transactionsFetchSuccess(data));
        // console.log(data);
      })
      .catch((err) => {
        console.log(err);
      });
  };
};

export const transactionsFetchSuccess = (payload) => {
  return {
    type: FETCH_TRANSACTION,
    payload: payload,
  };
};
