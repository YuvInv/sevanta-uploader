import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../popup/App';
import { ErrorBoundary } from '../popup/components/ErrorBoundary';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
