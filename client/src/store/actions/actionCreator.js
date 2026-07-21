import { LOADING, COUNTER_INCREMENTER, WRITE_PRODUCTS, WRITE_PRODUCT, WRITE_PRODUCT_FAILED, WRITE_PRODUCTS_BY_TYPE, WRITE_PRODUCTS_BY_TYPE_FAILED, WRITE_CATEGORIES, WRITE_CATEGORIES_FAILED, WRITE_LESSON } from './actionTypes';

import { FETCH_STATUS, FETCH_SCHEDULE, FETCH_CLASSMATE, FETCH_STUDENT_DETAIL, FETCH_CLASS_SCHEDULE, FETCH_ACTIVIY, FETCH_SPP, FETCH_STATISTIC } from './actionTypes';
import axios from 'axios';
import baseUrl from '../../config/api';

// DEVELOPING PURPOSES'
//   localStorage.setItem('access_token', "eyJhbGciOiJIUzI1NiJ9.MDIwMzIwMjMwMw.KonkCxKvwN64cDI51mdvjWs2OcebdJUylynmQ17kaPo" )

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
      const request = await fetch(baseUrl + `/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      let respon = await request.json();

      if (!request.ok) throw respon;

      localStorage.setItem('access_token', respon.access_token);
      localStorage.setItem('userId', respon.id);
      localStorage.setItem('teacherId', respon.teacherId);

      return true;
    } catch (error) {
      console.log(error);
      throw error;
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

export const insert_Classmate_redux = (payload) => {
  return {
    type: FETCH_CLASSMATE,
    payload: payload,
  };
};

export const insert_StudentDetail_redux = (payload) => {
  return {
    type: FETCH_STUDENT_DETAIL,
    payload: payload,
  };
};

export const insert_ClassSchedule_redux = (payload) => {
  return {
    type: FETCH_CLASS_SCHEDULE,
    payload: payload,
  };
};

export const insert_Activity_redux = (payload) => {
  return {
    type: FETCH_ACTIVIY,
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
  return async (dispatch, getState) => {
    try {
      // let query = `?`
      let { data } = await axios({
        url: baseUrl + `/users/login`,
        method: `POST`,
        data: {
          NIM: dataLogin.NIM,
          password: dataLogin.password,
        },
      });
      localStorage.access_token = data.access_token;
    } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
    }
  };
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
      console.log(error);
    }
  };
};

// teman2 satu kelas
export const fetchClassmate = (day) => {
  return async (dispatch, getState) => {
    try {
      let { data } = await axios({
        url: baseUrl + `/public/classmate`,
        headers: { access_token: localStorage.access_token },
      });
      dispatch(insert_Classmate_redux(data));
    } catch (error) {
      console.log(error);
    }
  };
};

// detail siswa (nama, nilai, kelas dll)
export const fetchStudentDetail = (day) => {
  return async (dispatch, getState) => {
    try {
      dispatch(loading());
      let { data } = await axios({
        url: baseUrl + `/public/detail`,
        headers: { access_token: localStorage.access_token },
      });
      dispatch(insert_StudentDetail_redux(data));
    } catch (error) {
      console.log(error);
    }
  };
};

// jadwal 1 minggu per kelas
export const fetchClassSchedule = (day) => {
  return async (dispatch, getState) => {
    try {
      let { data } = await axios({
        url: baseUrl + `/public/schedule`,
        headers: { access_token: localStorage.access_token },
      });
      console.log(data, 'melech');
      dispatch(insert_ClassSchedule_redux(data));
    } catch (error) {
      console.log(error);
    }
  };
};

// aktifitas satu sekolah
export const fetchActivity = (day) => {
  return async (dispatch, getState) => {
    try {
      let { data } = await axios({
        url: baseUrl + `/public/activity`,
        headers: { access_token: localStorage.access_token },
      });
      dispatch(insert_Activity_redux(data));
    } catch (error) {
      console.log(error);
    }
  };
};

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
      console.log(error);
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
      console.log(error);
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
      console.log(error);
    }
  };
}

export function snap(id) {
  return async (dispatch, getState) => {
    try {
      let { data } = await axios({
        method: 'post',
        url: baseUrl + `/users/generate-midtrans/` + id,
        headers: { access_token: localStorage.access_token },
      });

      window.snap.pay(data.transactionToken, {
        onSuccess: function (result) {
          console.log(result);
          dispatch(fetchSPP());
        },
      });
    } catch (error) {
      console.log(error);
    }
  };
}
