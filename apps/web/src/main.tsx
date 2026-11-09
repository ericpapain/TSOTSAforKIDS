import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/carlito/400.css';
import '@fontsource/carlito/700.css';
import './index.css';
import './i18n/setup';
import { App } from './App';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

