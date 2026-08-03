import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './tailwind-overrides.css';
import App from './App';
import { registerOfflineAppShell } from './offline-workspace/registerServiceWorker';

registerOfflineAppShell();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
