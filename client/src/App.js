
import {
  createBrowserRouter,
  RouterProvider, 
  useLocation
} from "react-router-dom";

import { useEffect } from "react";
 
import router from "./router"
import { Provider } from "react-redux"
import store from "./store"
  
export default function App() {
  

  return (
    <Provider store={store} >
      {/* <BrowserRouter> */}
        <RouterProvider router={router} />
      {/* </BrowserRouter> */}
    </Provider>
  );
}


