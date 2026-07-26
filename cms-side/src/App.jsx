// import "./App.css";

import { RouterProvider } from "react-router-dom";
import router from "./router";

import { Provider } from "react-redux";
import store from "./store";
import { OfflineWorkspaceProvider } from "./offline-workspace/OfflineWorkspaceProvider";

function App() {
  return (
    <div className="App mx-auto">
      <Provider store={store}>
        <OfflineWorkspaceProvider>
          <RouterProvider router={router} />
        </OfflineWorkspaceProvider>
      </Provider>
    </div>
  );
}

export default App;
