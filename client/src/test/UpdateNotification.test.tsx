/**
 * Test per il componente UpdateNotification
 * Verifica il comportamento del componente di notifica aggiornamenti
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpdateNotification } from '../components/ui/UpdateNotification';

describe('UpdateNotification', () => {
  const defaultProps = {
    isUpdateAvailable: true,
    onUpdate: vi.fn(),
    onDismiss: vi.fn(),
    isUpdating: false,
  };

  it('should not render when update is not available', () => {
    render(
      <UpdateNotification
        {...defaultProps}
        isUpdateAvailable={false}
      />
    );

    expect(screen.queryByText(/Aggiornamento Disponibile/)).not.toBeInTheDocument();
  });

  it('should render when update is available', () => {
    render(<UpdateNotification {...defaultProps} />);

    expect(screen.getByText(/🎮 Aggiornamento Disponibile!/)).toBeInTheDocument();
    expect(screen.getByText(/Una nuova versione del gioco è disponibile/)).toBeInTheDocument();
  });

  it('should render action buttons', () => {
    render(<UpdateNotification {...defaultProps} />);

    expect(screen.getByRole('button', { name: /Aggiorna/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Più tardi/ })).toBeInTheDocument();
  });

  it('should call onUpdate when update button is clicked', () => {
    const onUpdateMock = vi.fn();
    
    render(
      <UpdateNotification
        {...defaultProps}
        onUpdate={onUpdateMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Aggiorna/ }));
    expect(onUpdateMock).toHaveBeenCalledTimes(1);
  });

  it('should call onDismiss when dismiss button is clicked', () => {
    const onDismissMock = vi.fn();
    
    render(
      <UpdateNotification
        {...defaultProps}
        onDismiss={onDismissMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Più tardi/ }));
    expect(onDismissMock).toHaveBeenCalledTimes(1);
  });

  it('should disable buttons when updating', () => {
    render(
      <UpdateNotification
        {...defaultProps}
        isUpdating={true}
      />
    );

    expect(screen.getByRole('button', { name: /Aggiornamento\.\.\./ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Più tardi/ })).toBeDisabled();
  });

  it('should show updating text when isUpdating is true', () => {
    render(
      <UpdateNotification
        {...defaultProps}
        isUpdating={true}
      />
    );

    expect(screen.getByText(/Aggiornamento\.\.\./)).toBeInTheDocument();
    expect(screen.queryByText(/^Aggiorna$/)).not.toBeInTheDocument();
  });

  it('should have correct CSS classes for styling', () => {
    render(<UpdateNotification {...defaultProps} />);

    const container = screen.getByText(/🎮 Aggiornamento Disponibile!/).closest('.nes-container');
    expect(container).toHaveClass('nes-container', 'is-rounded', 'is-dark');
  });

  it('should have correct positioning styles', () => {
    render(<UpdateNotification {...defaultProps} />);

    const container = screen.getByText(/🎮 Aggiornamento Disponibile!/).closest('div');
    expect(container).toHaveStyle({
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '9999',
      maxWidth: '300px'
    });
  });

  it('should have correct button classes', () => {
    render(<UpdateNotification {...defaultProps} />);

    const updateButton = screen.getByRole('button', { name: /Aggiorna/ });
    const dismissButton = screen.getByRole('button', { name: /Più tardi/ });

    expect(updateButton).toHaveClass('nes-btn', 'is-primary');
    expect(dismissButton).toHaveClass('nes-btn');
  });
});
