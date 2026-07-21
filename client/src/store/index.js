import { legacy_createStore as createStore, applyMiddleware } from 'redux'
import logger from './middlewares/logger'
import rootReducer from './reducers'
import thunk from "redux-thunk"
const store = createStore(rootReducer, applyMiddleware(thunk))

// store.subscribe(function() {
//   console.log(store.getState())
// })


export default store








