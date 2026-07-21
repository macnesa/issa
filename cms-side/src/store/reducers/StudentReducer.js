import { FETCH_STUDENT, FETCH_STUDENT_BYID } from "../action/ActionTypes";

const initialState = {
  students: [],
  student: [],
};

function studentReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_STUDENT:
      return {
        ...state,
        students: action.payload,
      };
    case FETCH_STUDENT_BYID:
      return {
        ...state,
        student: action.payload,
      };
    // case FETCH_CATEGORY:
    //   return {
    //     ...state,
    //     categories: action.payload,
    //   };
    // case FETCH_PRODUCT_BYID:
    //   return {
    //     ...state,
    //     productId: action.payload,
    //     flag: "true",
    //   };
    default:
      return state;
  }
}

export default studentReducer;
