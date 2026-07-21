import { combineReducers } from "redux"

import productReducer from "./product-reducer"
import categoryReducer from "./category-reducer"
import studentReducer from "./student-reducer"



const rootReducer = combineReducers(
  {
    product: productReducer,
    category: categoryReducer,
    student: studentReducer
  }
)



export default rootReducer