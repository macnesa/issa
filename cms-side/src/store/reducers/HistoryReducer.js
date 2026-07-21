import { FETCH_HISTORY } from "../action/ActionTypes";

const initialState = {
  histories: [],
  history: [],
};

function historyReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_HISTORY:
      return {
        ...state,
        histories: action.payload,
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

export default historyReducer;
