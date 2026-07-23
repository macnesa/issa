
import { RouterProvider } from "react-router-dom";
import { useEffect, useState } from "react";
 
import router from "./router"
import { Provider, useDispatch } from "react-redux"
import store from "./store"
import { resetParentSession } from './store/actions/actionCreator';
import {
  SESSION_STATUS,
  clearSessionExpiryTimer,
  configureParentSessionEndHandler,
  getParentSessionStatus,
  initializeParentSession,
  subscribeToParentSessionStatus,
} from './utils/session';

function SessionRuntime() {
  const dispatch = useDispatch();
  const [sessionStatus, setSessionStatus] = useState(getParentSessionStatus);

  useEffect(() => {
    const handleSessionEnd = (reason) => {
      dispatch(resetParentSession());
      router.navigate(reason === 'expired' ? '/login?session=expired' : '/login', { replace: true });
    };

    const unsubscribe = subscribeToParentSessionStatus(setSessionStatus);
    const removeSessionEndHandler = configureParentSessionEndHandler(handleSessionEnd);
    initializeParentSession();

    return () => {
      unsubscribe();
      removeSessionEndHandler();
      clearSessionExpiryTimer();
    };
  }, [dispatch]);

  if (sessionStatus === SESSION_STATUS.CHECKING) {
    return <main className="runtime-state min-h-screen">Memeriksa sesi...</main>;
  }

  return <RouterProvider router={router} />;
}
  
export default function App() {
  

  return (
    <Provider store={store} >
      <SessionRuntime />
    </Provider>
  );
}
