
import { RouterProvider } from "react-router-dom";
import { useEffect } from "react";
 
import router from "./router"
import { Provider, useDispatch } from "react-redux"
import store from "./store"
import { resetParentSession } from './store/actions/actionCreator';
import { SESSION_EXPIRED_EVENT } from './utils/session';

function SessionRuntime() {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleSessionExpired = () => {
      dispatch(resetParentSession());
      router.navigate('/login?session=expired', { replace: true });
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [dispatch]);

  return <RouterProvider router={router} />;
}
  
export default function App() {
  

  return (
    <Provider store={store} >
      <SessionRuntime />
    </Provider>
  );
}

