import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CameraCapture from '../CameraCapture';

// Mock dei metodi del browser
const mockGetUserMedia = vi.fn();
const mockEnumerateDevices = vi.fn();

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
    enumerateDevices: mockEnumerateDevices,
  },
});

// Mock per HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: vi.fn(),
  fillText: vi.fn(),
  fillStyle: '',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  font: '10px sans-serif',
})) as any;

HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
  const blob = new Blob(['test'], { type: 'image/jpeg' });
  callback(blob);
}) as any;

// Mock per URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('CameraCapture', () => {
  const mockOnCapture = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock per i dispositivi video
    mockEnumerateDevices.mockResolvedValue([
      { deviceId: 'device1', kind: 'videoinput', label: 'Camera 1' },
    ]);

    // Setup mock per getUserMedia
    const mockStream = {
      getTracks: () => [{ stop: vi.fn() }],
    };
    mockGetUserMedia.mockResolvedValue(mockStream);

    // Mock per HTMLVideoElement
    Object.defineProperty(HTMLVideoElement.prototype, 'play', {
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });

    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
      writable: true,
      value: 1920,
    });

    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
      writable: true,
      value: 1080,
    });
  });

  it('deve nascondere il bottone della toolbar emoji nella schermata di conferma', async () => {
    render(<CameraCapture onCapture={mockOnCapture} onCancel={mockOnCancel} />);

    // Aspetta che la camera si carichi
    await waitFor(() => {
      expect(screen.getByTestId('button-camera-capture')).toBeInTheDocument();
    });

    // Simula lo scatto di una foto
    const captureButton = screen.getByTestId('button-camera-capture');
    fireEvent.click(captureButton);

    // Aspetta che appaia la schermata di conferma
    await waitFor(() => {
      expect(screen.getByText('Conferma')).toBeInTheDocument();
    });

    // Verifica che il bottone della toolbar emoji NON sia presente nella schermata di conferma
    const emojiToolbarButton = screen.queryByLabelText('Apri toolbar sticker');
    expect(emojiToolbarButton).not.toBeInTheDocument();
  });

  it('deve nascondere la toolbar degli stickers nella schermata di conferma', async () => {
    render(<CameraCapture onCapture={mockOnCapture} onCancel={mockOnCancel} />);

    // Aspetta che la camera si carichi
    await waitFor(() => {
      expect(screen.getByTestId('button-camera-capture')).toBeInTheDocument();
    });

    // Simula lo scatto di una foto
    const captureButton = screen.getByTestId('button-camera-capture');
    fireEvent.click(captureButton);

    // Aspetta che appaia la schermata di conferma
    await waitFor(() => {
      expect(screen.getByText('Conferma')).toBeInTheDocument();
    });

    // Verifica che nessuno degli stickers sia presente nella schermata di conferma
    const starSticker = screen.queryByLabelText('Sticker ⭐');
    const partySticker = screen.queryByLabelText('Sticker 🎉');
    const fireSticker = screen.queryByLabelText('Sticker 🔥');
    const lightSticker = screen.queryByLabelText('Sticker 💡');
    const pinSticker = screen.queryByLabelText('Sticker 📍');

    expect(starSticker).not.toBeInTheDocument();
    expect(partySticker).not.toBeInTheDocument();
    expect(fireSticker).not.toBeInTheDocument();
    expect(lightSticker).not.toBeInTheDocument();
    expect(pinSticker).not.toBeInTheDocument();
  });

  it('deve permettere ancora di scattare foto normalmente', async () => {
    render(<CameraCapture onCapture={mockOnCapture} onCancel={mockOnCancel} />);

    // Aspetta che la camera si carichi
    await waitFor(() => {
      expect(screen.getByTestId('button-camera-capture')).toBeInTheDocument();
    });

    // Simula lo scatto di una foto
    const captureButton = screen.getByTestId('button-camera-capture');
    fireEvent.click(captureButton);

    // Aspetta che appaia la schermata di conferma
    await waitFor(() => {
      expect(screen.getByText('Conferma')).toBeInTheDocument();
    });

    // Conferma la foto
    const confirmButton = screen.getByText('Conferma');
    fireEvent.click(confirmButton);

    // Verifica che onCapture sia stato chiamato
    expect(mockOnCapture).toHaveBeenCalledTimes(1);
  });

  it('deve permettere di riprovare lo scatto dalla schermata di conferma', async () => {
    render(<CameraCapture onCapture={mockOnCapture} onCancel={mockOnCancel} />);

    // Aspetta che la camera si carichi
    await waitFor(() => {
      expect(screen.getByTestId('button-camera-capture')).toBeInTheDocument();
    });

    // Simula lo scatto di una foto
    const captureButton = screen.getByTestId('button-camera-capture');
    fireEvent.click(captureButton);

    // Aspetta che appaia la schermata di conferma
    await waitFor(() => {
      expect(screen.getByText('Conferma')).toBeInTheDocument();
    });

    // Clicca su Riprova
    const retryButton = screen.getByText('Riprova');
    fireEvent.click(retryButton);

    // Verifica che torni alla schermata di cattura
    await waitFor(() => {
      expect(screen.getByTestId('button-camera-capture')).toBeInTheDocument();
    });

    // Verifica che onCapture non sia stato chiamato
    expect(mockOnCapture).not.toHaveBeenCalled();
  });
});
