/**
 * Test per il componente UpdateNotification
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpdateNotification } from '../UpdateNotification';

describe('UpdateNotification', () => {
  it('should not render when no update is available', () => {
    render(
      <UpdateNotification
        updateAvailable={false}
        onUpdate={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(
      screen.queryByText(/aggiornamento disponibile/i)
    ).not.toBeInTheDocument();
  });

  it('should render when update is available', () => {
    render(
      <UpdateNotification
        updateAvailable={true}
        onUpdate={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText(/aggiornamento disponibile/i)).toBeInTheDocument();
    expect(screen.getByText(/aggiorna ora/i)).toBeInTheDocument();
    expect(screen.getByText(/più tardi/i)).toBeInTheDocument();
  });

  it('should call onUpdate when update button is clicked', () => {
    const onUpdate = vi.fn();

    render(
      <UpdateNotification
        updateAvailable={true}
        onUpdate={onUpdate}
        onDismiss={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText(/aggiorna ora/i));
    expect(onUpdate).toHaveBeenCalled();
  });

  it('should call onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();

    render(
      <UpdateNotification
        updateAvailable={true}
        onUpdate={vi.fn()}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByText(/più tardi/i));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('should display custom message when provided', () => {
    const customMessage = 'Nuova versione fantastica disponibile!';

    render(
      <UpdateNotification
        updateAvailable={true}
        message={customMessage}
        onUpdate={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('should display version information when provided', () => {
    render(
      <UpdateNotification
        updateAvailable={true}
        currentVersion="1.0.0"
        latestVersion="1.1.0"
        onUpdate={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText(/1\.0\.0/)).toBeInTheDocument();
    expect(screen.getByText(/1\.1\.0/)).toBeInTheDocument();
  });

  it('should apply retro styling with nes.css classes', () => {
    render(
      <UpdateNotification
        updateAvailable={true}
        onUpdate={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('nes-dialog');

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('nes-btn');
    });
  });
});
