import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders the dialog with correct content when open', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Item"
        message="Are you sure you want to delete this?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this?')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={false}
        title="Delete Item"
        message="Are you sure?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirmMock = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm"
        message="Are you sure?"
        onConfirm={onConfirmMock}
        onCancel={() => {}}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancelMock = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm"
        message="Are you sure?"
        onConfirm={() => {}}
        onCancel={onCancelMock}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });
});
