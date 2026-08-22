import React from 'react';
import ReactDOM from 'react-dom/client';
import { StoreInit } from 'flowbite-react/store/init';
import { ThemeProvider } from 'flowbite-react/theme/provider';
import './index.css';
import './tailwind-overrides.css';
import App from './App';
import { registerOfflineAppShell } from './offline-workspace/registerServiceWorker';
import {
  issaFlowbiteApplyTheme,
  issaFlowbiteTheme,
} from './shared/ui/flowbite-theme';

registerOfflineAppShell();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StoreInit dark={false} prefix="" version={3} />
    <ThemeProvider
      applyTheme={issaFlowbiteApplyTheme}
      theme={issaFlowbiteTheme}
    >
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
