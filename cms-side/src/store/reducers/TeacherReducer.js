import { FETCH_TEACHER } from "../action/ActionTypes";

const initialState = {
  teachers: [],
  teacher: [],
};

function teacherReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_TEACHER:
      return {
        ...state,
        teachers: action.payload,
      };
    // case FETCH_CLASS_BYID:
    //   return {
    //     ...state,
    //     classById: action.payload,
    //   };

    default:
      return state;
  }
}

export default teacherReducer;
