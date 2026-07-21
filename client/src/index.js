import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'animate.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  //<React.StrictMode>  
  <App />
  //</React.StrictMode>
);

// saat develop, unregister
serviceWorkerRegistration.register();

reportWebVitals();


 