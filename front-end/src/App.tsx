import React from 'react';
import { AppProviders } from './providers/AppProviders';
import { AppRouter } from './router/AppRouter';
import { CookieConsent } from './components/CookieConsent';

function App() {
    return (
        <AppProviders>
            <AppRouter />
            <CookieConsent />
        </AppProviders>
    );
}

export default App;

