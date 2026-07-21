import { WRITE_CATEGORIES, WRITE_CATEGORIES_FAILED } from '../actions/actionTypes'



const initialState = {
  categories: [],
  error: null,
  loading: false
}


function reducer(state = initialState, action) {
  switch (action.type) {
    case WRITE_CATEGORIES:
      return {
        ...state,
        categories: action.payload,
        loading: false
      }
    case WRITE_CATEGORIES_FAILED:
      return {
        ...state,
        error: action.payload,
        loading: false
      }
    default:
      return state
  }
}

export default reducer