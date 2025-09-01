import QRCode from 'qrcode';
import { QRData } from '@shared/schema';

export class QRGenerator {
  static async generateQR(data: QRData): Promise<string> {
    try {
      const jsonString = JSON.stringify(data);
      const qrDataUrl = await QRCode.toDataURL(jsonString, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256,
      });
      
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  static parseQRData(qrString: string): QRData | null {
    try {
      const parsed = JSON.parse(qrString);
      
      // Validate required fields
      if (!parsed.userId || !parsed.displayName || !parsed.timestamp) {
        return null;
      }
      
      return {
        userId: parsed.userId,
        displayName: parsed.displayName,
        avatarUrl: parsed.avatarUrl,
        timestamp: parsed.timestamp,
      };
    } catch (error) {
      console.error('Error parsing QR data:', error);
      return null;
    }
  }

  static async downloadQR(qrDataUrl: string, filename: string = 'my-qr-code.png'): Promise<void> {
    try {
      const link = document.createElement('a');
      link.download = filename;
      link.href = qrDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      throw new Error('Failed to download QR code');
    }
  }

  static async copyQR(qrDataUrl: string): Promise<void> {
    try {
      // Convert data URL to blob
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
      } else {
        throw new Error('Clipboard API not supported');
      }
    } catch (error) {
      console.error('Error copying QR code:', error);
      throw new Error('Failed to copy QR code to clipboard');
    }
  }
}
