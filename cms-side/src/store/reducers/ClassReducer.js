import { FETCH_CLASS, FETCH_CLASS_BYID } from "../action/ActionTypes";

const initialState = {
  classes: [],
  classById: [],
};

function classReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_CLASS:
      return {
        ...state,
        classes: action.payload,
      };
    case FETCH_CLASS_BYID:
      return {
        ...state,
        classById: action.payload,
      };

    default:
      return state;
  }
}

export default classReducer;
