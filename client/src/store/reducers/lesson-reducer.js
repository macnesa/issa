import {
   WRITE_LESSON
} from '../actions/actionTypes'



const initialState = {
  todayLesson: [

  ],  
  error: null,
  loading: false
}

function reducer(state = initialState, action) {
  switch (action.type) {
    case WRITE_LESSON: 
      return {
        ...state,
        todayLesson: action.payload
      } 
    case WRITE_PRODUCT:
      return {
        ...state,
        productById: action.payload,
        error: null,
        loading: false
      }

    case WRITE_PRODUCTS_BY_TYPE:
      // return state = action.payload
      return {
        ...state,
        productsByType: action.payload
      }


    case LOADING:
      return {
        ...state,
        error: null,
        loading: true
      }
    case WRITE_PRODUCT_FAILED:
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