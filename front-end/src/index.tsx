import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';
import './i18n'; // Import i18n to initialize it
import ErrorBoundary from './components/ErrorBoundary';
import { LoadingProvider } from './context/LoadingContext';
import { GlobalLoader } from './components/GlobalLoader';

import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
  integrations: [Sentry.browserTracingIntegration()],
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <LoadingProvider>
          <BrowserRouter>
            <App />
            <GlobalLoader />
          </BrowserRouter>
        </LoadingProvider>
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>
);