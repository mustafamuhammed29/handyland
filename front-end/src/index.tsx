import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';
import i18n from './i18n'; // FIX 4: import instance to check initialization
import './i18n';
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

// FIX 4: Wait for i18n to be initialized before first render to prevent
// flash of untranslated content (raw keys showing momentarily)
const AppWithI18nGate: React.FC = () => {
  const [i18nReady, setI18nReady] = useState(i18n.isInitialized);

  useEffect(() => {
    if (!i18n.isInitialized) {
      const handler = () => setI18nReady(true);
      i18n.on('initialized', handler);
      return () => { i18n.off('initialized', handler); };
    }
  }, []);

  if (!i18nReady) {
    // Minimal spinner — avoids any translated text before i18n is ready
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#020617'
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid #334155',
          borderTopColor: '#6366f1',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
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
};

const root = ReactDOM.createRoot(rootElement);
root.render(<AppWithI18nGate />);