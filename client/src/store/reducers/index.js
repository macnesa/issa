import { combineReducers } from "redux"

import productReducer from "./product-reducer"
import categoryReducer from "./category-reducer"
import studentReducer from "./student-reducer"
import { RESET_PARENT_SESSION } from '../actions/actionTypes'



const appReducer = combineReducers(
  {
    product: productReducer,
    category: categoryReducer,
    student: studentReducer
  }
)

export default function rootReducer(state, action) {
  if (action.type === RESET_PARENT_SESSION) {
    return appReducer(undefined, { type: '@@redux/INIT' });
  }

  return appReducer(state, action);
}
