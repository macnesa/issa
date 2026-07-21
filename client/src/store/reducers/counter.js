import { COUNTER_INCREMENTER } from '../actions/actionTypes'

const initialState = {
  value: 0,
}
function counterReducer(state = initialState, action) {
  switch (action.type) {
    case COUNTER_INCREMENTER:
      return {
        ...state,
        value: state.value + 1
      }
    case "counter/decremented":
      return {
        ...state,
        value: state.value - 1
      }
    default:
      return state
  }
}

export default counterReducer