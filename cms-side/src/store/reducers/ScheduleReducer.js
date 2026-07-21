import { FETCH_SCHEDULE, FETCH_SCHEDULE_BYID } from "../action/ActionTypes";

const initialState = {
  schedules: [],
  schedule: [],
};

function scheduleReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_SCHEDULE:
      return {
        ...state,
        schedules: action.payload,
      };
    case FETCH_SCHEDULE_BYID:
      return {
        ...state,
        schedule: action.payload,
      };

    default:
      return state;
  }
}

export default scheduleReducer;
