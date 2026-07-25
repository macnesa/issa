import { LOADING, COUNTER_INCREMENTER, WRITE_PRODUCTS, WRITE_PRODUCT, WRITE_PRODUCT_FAILED, WRITE_PRODUCTS_BY_TYPE, WRITE_CATEGORIES, WRITE_CATEGORIES_FAILED, WRITE_LESSON } from './actionTypes';

import { FETCH_STATUS, FETCH_SCHEDULE, FETCH_SPP, FETCH_STATISTIC, STUDENT_DETAIL_REQUEST, STUDENT_DETAIL_SUCCESS, STUDENT_DETAIL_FAILURE, CLASSMATE_REQUEST, CLASSMATE_SUCCESS, CLASSMATE_FAILURE, CLASS_SCHEDULE_REQUEST, CLASS_SCHEDULE_SUCCESS, CLASS_SCHEDULE_FAILURE, ACTIVITY_REQUEST, ACTIVITY_SUCCESS, ACTIVITY_FAILURE, RESET_PARENT_SESSION } from './actionTypes';
import apiClient from '../../config/apiClient';
import { mapStudentResponseToOverview } from '../../mappers/studentDetail';
import { mapScheduleResponseToEntries } from '../../mappers/schedule';
import normalizeApiError from '../../utils/normalizeApiError';
import { startParentSession } from '../../utils/session';
import isNil from 'lodash/isNil';

// export const conterIncremented = (payload) => {
//   return { type: COUNTER_INCREMENTER, payload }
// }

export function loading() {
  return { type: LOADING };
}

export function writeProduct(payload) {
  return { type: WRITE_PRODUCTS, payload };
}

export function writeProductById(payload) {
  return { type: WRITE_PRODUCT, payload };
}
export function writeProductsByType(payload) {
  return { type: WRITE_PRODUCTS_BY_TYPE, payload };
}

export function writeProductFailed(payload) {
  return { type: WRITE_PRODUCT_FAILED, payload };
}

export function writeTodayLesson(payload) {
  return { type: WRITE_LESSON, payload };
}

// FUNCTIONS /////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////

export function submitParentLogin(loginCredentials) {
  void 'ISSA:CLIENT.AUTH.SUBMIT_PARENT_LOGIN';
  return async (dispatch) => {
    try {
      const { data: loginResponse } = await apiClient.post('/users/login', loginCredentials);

      localStorage.setItem('access_token', loginResponse.access_token);
      if (!isNil(loginResponse.id)) {
        localStorage.setItem('userId', String(loginResponse.id));
      }
      startParentSession(loginResponse.access_token);
      return loginResponse;
    } catch (apiError) {
      throw normalizeApiError(apiError);
    }
  };
}

// ////////////////////////

//! redux
export const insert_Schedule_redux = (payload) => {
  return {
    type: FETCH_SCHEDULE,
    payload: payload,
  };
};

export const insert_SPP_redux = (payload) => {
  return {
    type: FETCH_SPP,
    payload: payload,
  };
};

export const insert_Statistic_redux = (payload) => {
  return {
    type: FETCH_STATISTIC,
    payload: payload,
  };
};

export const insert_status_redux = (payload) => {
  return {
    type: FETCH_STATUS,
    payload: payload,
  };
};

//! fetching API

// jadwal pelajaran kelas per hari nya
export const fetchScheduleLesson = (day) => {
  return async (dispatch, getState) => {
    try {
      const { data } = await apiClient.get('/public/lesson', { params: { day } });
      dispatch(insert_Schedule_redux(data));
    } catch (error) {
      return normalizeApiError(error);
    }
  };
};

// teman2 satu kelas
export const fetchClassmate = (day) => {
  return async (dispatch) => {
    dispatch({ type: CLASSMATE_REQUEST });
    try {
      const { data } = await apiClient.get('/public/classmate');
      dispatch({ type: CLASSMATE_SUCCESS, payload: Array.isArray(data) ? data : [] });
    } catch (error) {
      if (error?.response?.status !== 401) {
        dispatch({ type: CLASSMATE_FAILURE, payload: normalizeApiError(error) });
      }
    }
  };
};

// detail siswa (nama, nilai, kelas dll)
export const fetchStudentOverview = () => {
  void 'ISSA:CLIENT.STUDENT.FETCH_OVERVIEW';
  return async (dispatch) => {
    dispatch({ type: STUDENT_DETAIL_REQUEST });
    try {
      const { data: studentResponse } = await apiClient.get('/public/detail');
      dispatch({ type: STUDENT_DETAIL_SUCCESS, payload: mapStudentResponseToOverview(studentResponse) });
      return true;
    } catch (apiError) {
      if (apiError?.response?.status !== 401) {
        dispatch({ type: STUDENT_DETAIL_FAILURE, payload: normalizeApiError(apiError) });
      }
      return false;
    }
  };
};

// jadwal 1 minggu per kelas
export const fetchClassSchedule = () => {
  void 'ISSA:CLIENT.SCHEDULE.FETCH_CLASS_SCHEDULE';
  return async (dispatch) => {
    dispatch({ type: CLASS_SCHEDULE_REQUEST });
    try {
      const { data: scheduleResponse } = await apiClient.get('/public/schedule');
      dispatch({ type: CLASS_SCHEDULE_SUCCESS, payload: mapScheduleResponseToEntries(scheduleResponse) });
    } catch (apiError) {
      if (apiError?.response?.status !== 401) {
        dispatch({ type: CLASS_SCHEDULE_FAILURE, payload: normalizeApiError(apiError) });
      }
    }
  };
};

// aktifitas satu sekolah
export const fetchSchoolActivities = () => {
  void 'ISSA:CLIENT.ACTIVITY.FETCH_SCHOOL_ACTIVITIES';
  return async (dispatch) => {
    dispatch({ type: ACTIVITY_REQUEST });
    try {
      const { data: activityResponse } = await apiClient.get('/public/activity');
      dispatch({ type: ACTIVITY_SUCCESS, payload: Array.isArray(activityResponse) ? activityResponse : [] });
    } catch (apiError) {
      if (apiError?.response?.status !== 401) {
        dispatch({ type: ACTIVITY_FAILURE, payload: normalizeApiError(apiError) });
      }
    }
  };
};

export const clearParentAuthenticationState = () => ({ type: RESET_PARENT_SESSION });

// history table pembayaran SPP
export const fetchSPP = (day) => {
  return async (dispatch, getState) => {
    try {
      const { data } = await apiClient.get('/public/transaction');
      dispatch(insert_SPP_redux(data));
    } catch (error) {
      return normalizeApiError(error);
    }
  };
};

// history table pembayaran SPP
export const fetchStatistic = (day) => {
  return async (dispatch, getState) => {
    try {
      const { data } = await apiClient.get('/public/statistic');
      dispatch(insert_Statistic_redux(data));
    } catch (error) {
      return normalizeApiError(error);
    }
  };
};

export function getPaymentStatus() {
  return async (dispatch) => {
    try {
      const { data } = await apiClient.get('/public/transaction');

      dispatch(insert_status_redux(data));
    } catch (error) {
      return normalizeApiError(error);
    }
  };
}
