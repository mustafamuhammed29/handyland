import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ResetPassword } from '../../ResetPassword';
import { api } from '../../../utils/api';

// Removed ToastProvider import

const mockAddToast = vi.fn();

vi.mock('../../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  })
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter initialEntries={['/reset-password?token=valid-token']}>
      {ui}
    </MemoryRouter>
  );
};

describe('ResetPassword', () => {
  beforeEach(() => {
    mockAddToast.mockClear();
  });

  it('renders the reset password form', () => {
    renderWithRouter(<ResetPassword />);
    expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
  });

  it('shows an error if passwords do not match', async () => {
    renderWithRouter(<ResetPassword />);
    
    const inputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(inputs[0], { target: { value: 'password123' } });
    fireEvent.change(inputs[1], { target: { value: 'password456' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));
    
    expect(mockAddToast).toHaveBeenCalledWith('Passwords do not match', 'error');
  });

  it('shows success toast when passwords match', async () => {
    renderWithRouter(<ResetPassword />);
    
    const inputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(inputs[0], { target: { value: 'password123' } });
    fireEvent.change(inputs[1], { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));
    
    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('Password reset successfully (Mock)', 'success');
    }, { timeout: 2000 });
  });
});
