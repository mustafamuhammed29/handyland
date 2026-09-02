import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LanguageSwitcher } from '../../LanguageSwitcher';
import * as LanguageContextHooks from '../../../context/LanguageContext';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  }
}));

describe('LanguageSwitcher', () => {
  it('renders correctly with current language', () => {
    vi.spyOn(LanguageContextHooks, 'useLang').mockReturnValue({ lang: 'en', setLang: vi.fn() });
    render(<LanguageSwitcher />);
    expect(screen.getAllByText(/en/i)[0]).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    vi.spyOn(LanguageContextHooks, 'useLang').mockReturnValue({ lang: 'en', setLang: vi.fn() });
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    const mainButton = buttons[0];
    fireEvent.click(mainButton);
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Deutsch')).toBeInTheDocument();
  });

  it('calls setLang when a new language is selected', () => {
    const setLangMock = vi.fn();
    vi.spyOn(LanguageContextHooks, 'useLang').mockReturnValue({ lang: 'en', setLang: setLangMock });
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    const mainButton = buttons[0];
    fireEvent.click(mainButton);
    
    const germanOption = screen.getByText('Deutsch');
    fireEvent.click(germanOption);
    
    expect(setLangMock).toHaveBeenCalledWith('de');
  });
});
