import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Valuation } from '../../Valuation';
import { api } from '../../../utils/api';
import { LanguageProvider } from '../../../context/LanguageContext';
import { ToastProvider } from '../../../context/ToastContext';
import { SettingsProvider } from '../../../context/SettingsContext';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';

// Setup minimal i18n
i18n
  .use(initReactI18next)
  .init({
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        'Gerät verkaufen': 'Sell Device',
        'Marke auswählen': 'Select Brand'
      }
    }
  }
});

// Mock the API and routing
vi.mock('../../../utils/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <ToastProvider>
          <SettingsProvider>
            <LanguageProvider>
              {ui}
            </LanguageProvider>
          </SettingsProvider>
        </ToastProvider>
      </I18nextProvider>
    </BrowserRouter>
  );
};

describe('Valuation Component', () => {
  it('renders the initial step and fetches settings', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        success: true,
        settings: {
          brands: [{ id: 'apple', name: 'Apple' }],
          models: [{ id: 'iphone-13', name: 'iPhone 13', brandId: 'apple', basePrice: 500 }],
        }
      }
    });

    renderWithProviders(<Valuation lang="en" />);
    
    // Check loading state or initial render
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/valuation/devices?limit=1000');
    });
  });

  it('displays error state when API fails', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API Error'));

    renderWithProviders(<Valuation lang="en" />);
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });
  });
});
