import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChallengeButton } from '../ChallengeButton';

describe('ChallengeButton', () => {
  it('should render with default props', () => {
    render(<ChallengeButton onClick={vi.fn()}>Test Button</ChallengeButton>);

    const button = screen.getByRole('button', { name: 'Test Button' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('nes-btn');
  });

  it('should apply correct variant classes', () => {
    const { rerender } = render(
      <ChallengeButton variant="default" onClick={vi.fn()}>
        Default
      </ChallengeButton>
    );
    expect(screen.getByRole('button')).toHaveClass('nes-btn');
    expect(screen.getByRole('button')).not.toHaveClass('is-primary');

    rerender(
      <ChallengeButton variant="primary" onClick={vi.fn()}>
        Primary
      </ChallengeButton>
    );
    expect(screen.getByRole('button')).toHaveClass('is-primary');

    rerender(
      <ChallengeButton variant="success" onClick={vi.fn()}>
        Success
      </ChallengeButton>
    );
    expect(screen.getByRole('button')).toHaveClass('is-success');

    rerender(
      <ChallengeButton variant="error" onClick={vi.fn()}>
        Error
      </ChallengeButton>
    );
    expect(screen.getByRole('button')).toHaveClass('is-error');

    rerender(
      <ChallengeButton variant="disabled" onClick={vi.fn()}>
        Disabled
      </ChallengeButton>
    );
    expect(screen.getByRole('button')).toHaveClass('is-disabled');
  });

  it('should handle onClick when not disabled', () => {
    const handleClick = vi.fn();
    render(<ChallengeButton onClick={handleClick}>Clickable</ChallengeButton>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not handle onClick when disabled', () => {
    const handleClick = vi.fn();
    render(
      <ChallengeButton onClick={handleClick} disabled>
        Disabled
      </ChallengeButton>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply disabled state correctly', () => {
    render(
      <ChallengeButton onClick={vi.fn()} disabled>
        Disabled Button
      </ChallengeButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('is-disabled');
  });

  it('should apply size variants correctly', () => {
    const { rerender } = render(
      <ChallengeButton onClick={vi.fn()} size="small">
        Small
      </ChallengeButton>
    );
    expect(screen.getByRole('button')).toHaveClass('text-sm');

    rerender(
      <ChallengeButton onClick={vi.fn()} size="normal">
        Normal
      </ChallengeButton>
    );
    expect(screen.getByRole('button')).toHaveClass('text-base');
  });

  it('should apply blinking animation when specified', () => {
    render(
      <ChallengeButton onClick={vi.fn()} variant="success" shouldBlink>
        Blinking
      </ChallengeButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('is-success');
    // Note: Testing the actual blink animation would require more complex setup
    // with fake timers, but the basic rendering is covered here
  });

  it('should apply custom className', () => {
    render(
      <ChallengeButton onClick={vi.fn()} className="custom-class">
        Custom
      </ChallengeButton>
    );

    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('should forward additional props', () => {
    render(
      <ChallengeButton onClick={vi.fn()} data-testid="custom-button">
        Test
      </ChallengeButton>
    );

    expect(screen.getByTestId('custom-button')).toBeInTheDocument();
  });
});
