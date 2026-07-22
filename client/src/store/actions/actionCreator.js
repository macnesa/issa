import { LOADING, COUNTER_INCREMENTER, WRITE_PRODUCTS, WRITE_PRODUCT, WRITE_PRODUCT_FAILED, WRITE_PRODUCTS_BY_TYPE, WRITE_CATEGORIES, WRITE_CATEGORIES_FAILED, WRITE_LESSON } from './actionTypes';

import { FETCH_STATUS, FETCH_SCHEDULE, FETCH_SPP, FETCH_STATISTIC, STUDENT_DETAIL_REQUEST, STUDENT_DETAIL_SUCCESS, STUDENT_DETAIL_FAILURE, CLASSMATE_REQUEST, CLASSMATE_SUCCESS, CLASSMATE_FAILURE, CLASS_SCHEDULE_REQUEST, CLASS_SCHEDULE_SUCCESS, CLASS_SCHEDULE_FAILURE, ACTIVITY_REQUEST, ACTIVITY_SUCCESS, ACTIVITY_FAILURE, RESET_PARENT_SESSION } from './actionTypes';
import axios from '../../config/apiClient';
import baseUrl from '../../config/api';
import apiClient, { resetSessionExpiryHandling } from '../../config/apiClient';
import { mapStudentDetail } from '../../mappers/studentDetail';
import { mapSchedule } from '../../mappers/schedule';
import normalizeApiError from '../../utils/normalizeApiError';

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

export function act_login(data) {
  return async (dispatch) => {
    try {
      const { data: response } = await apiClient.post('/users/login', data);

      localStorage.setItem('access_token', response.access_token);
      if (response.id !== undefined && response.id !== null) {
        localStorage.setItem('userId', String(response.id));
      }
      resetSessionExpiryHandling();
      return response;
    } catch (error) {
      throw normalizeApiError(error);
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

// handle login | logout
export const handleLogin = (dataLogin) => {
  return act_login(dataLogin);
};

//! fetching API

// jadwal pelajaran kelas per hari nya
export const fetchScheduleLesson = (day) => {
  return async (dispatch, getState) => {
    try {
      let query = `?day=${day}`;
      let { data } = await axios({
        url: baseUrl + `/public/lesson` + query,
        headers: { access_token: localStorage.access_token },
      });
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
export const fetchStudentDetail = (day) => {
  return async (dispatch) => {
    dispatch({ type: STUDENT_DETAIL_REQUEST });
    try {
      const { data } = await apiClient.get('/public/detail');
      dispatch({ type: STUDENT_DETAIL_SUCCESS, payload: mapStudentDetail(data) });
    } catch (error) {
      if (error?.response?.status !== 401) {
        dispatch({ type: STUDENT_DETAIL_FAILURE, payload: normalizeApiError(error) });
      }
    }
  };
};

// jadwal 1 minggu per kelas
export const fetchClassSchedule = (day) => {
  return async (dispatch) => {
    dispatch({ type: CLASS_SCHEDULE_REQUEST });
    try {
      const { data } = await apiClient.get('/public/schedule');
      dispatch({ type: CLASS_SCHEDULE_SUCCESS, payload: mapSchedule(data) });
    } catch (error) {
      if (error?.response?.status !== 401) {
        dispatch({ type: CLASS_SCHEDULE_FAILURE, payload: normalizeApiError(error) });
      }
    }
  };
};

// aktifitas satu sekolah
export const fetchActivity = (day) => {
  return async (dispatch) => {
    dispatch({ type: ACTIVITY_REQUEST });
    try {
      const { data } = await apiClient.get('/public/activity');
      dispatch({ type: ACTIVITY_SUCCESS, payload: Array.isArray(data) ? data : [] });
    } catch (error) {
      if (error?.response?.status !== 401) {
        dispatch({ type: ACTIVITY_FAILURE, payload: normalizeApiError(error) });
      }
    }
  };
};

export const resetParentSession = () => ({ type: RESET_PARENT_SESSION });

// history table pembayaran SPP
export const fetchSPP = (day) => {
  return async (dispatch, getState) => {
    try {
      let { data } = await axios({
        url: baseUrl + `/public/transaction`,
        headers: { access_token: localStorage.access_token },
      });
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
      let { data } = await axios({
        url: baseUrl + `/public/statistic`,
        headers: { access_token: localStorage.access_token },
      });
      dispatch(insert_Statistic_redux(data));
    } catch (error) {
      return normalizeApiError(error);
    }
  };
};

export function getPaymentStatus() {
  return async (dispatch) => {
    try {
      let { data } = await axios({
        method: 'get',
        url: baseUrl + `/public/transaction`,
        headers: { access_token: localStorage.access_token },
      });

      dispatch(insert_status_redux(data));
    } catch (error) {
      return normalizeApiError(error);
    }
  };
}
