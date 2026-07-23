
import { RouterProvider } from "react-router-dom";
import { useEffect, useState } from "react";
 
import router from "./router"
import { Provider, useDispatch } from "react-redux"
import store from "./store"
import { clearParentAuthenticationState } from './store/actions/actionCreator';
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
    const resetParentStateAndRedirectToLogin = (sessionEndReason) => {
      dispatch(clearParentAuthenticationState());
      router.navigate(sessionEndReason === 'expired' ? '/login?session=expired' : '/login', { replace: true });
    };

    const unsubscribe = subscribeToParentSessionStatus(setSessionStatus);
    const removeSessionEndHandler = configureParentSessionEndHandler(resetParentStateAndRedirectToLogin);
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
