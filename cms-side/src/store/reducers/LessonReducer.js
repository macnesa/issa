import { FETCH_LESSON, FETCH_LESSON_BYID } from "../action/ActionTypes";

const initialState = {
  lessons: [],
  lesson: {},
};

function lessonReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_LESSON:
      return {
        ...state,
        lessons: action.payload,
      };
    case FETCH_LESSON_BYID:
      return {
        ...state,
        lesson: action.payload,
      };

    default:
      return state;
  }
}

export default lessonReducer;
