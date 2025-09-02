import jsQR from 'jsqr';
import { QRGenerator } from '@/lib/qr';
import { QRData, UserScan } from '@shared/schema';
import { gameStorage } from '@/lib/storage';

export const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    image.src = url;
  });
};

export const createCanvasFromImage = (img: HTMLImageElement): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width || 640;
  canvas.height = img.naturalHeight || img.height || 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
};

export const tryDecodeFromCtx = (cctx: CanvasRenderingContext2D, w: number, h: number): QRData | null => {
  try {
    const imageData = cctx.getImageData(0, 0, w, h);
    const qr = jsQR(imageData.data, imageData.width, imageData.height);
    if (qr && qr.data) {
      const parsed = QRGenerator.parseQRData(qr.data);
      if (parsed) return parsed;
    }
  } catch (err) {
    // Possible CORS or decoding errors
    // eslint-disable-next-line no-console
    console.warn('tryDecodeFromCtx error', err);
  }
  return null;
};

export const createResizedCtx = (sourceCanvas: HTMLCanvasElement, targetW: number) => {
  const tmp = document.createElement('canvas');
  const aspect = sourceCanvas.width / sourceCanvas.height || 1;
  const targetH = Math.round(targetW / aspect);
  tmp.width = targetW;
  tmp.height = targetH;
  const tctx = tmp.getContext('2d');
  if (!tctx) throw new Error('Temp canvas context unavailable');
  tctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, targetW, targetH);
  return { tctx, tw: targetW, th: targetH } as { tctx: CanvasRenderingContext2D; tw: number; th: number };
};

export const applyContrastThreshold = (cctx: CanvasRenderingContext2D, w: number, h: number, contrast = 1.4, threshold = 128) => {
  try {
    const imgd = cctx.getImageData(0, 0, w, h);
    const data = imgd.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const contrasted = Math.max(0, Math.min(255, (lum - 128) * contrast + 128));
      const val = contrasted >= threshold ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = val;
    }
    cctx.putImageData(imgd, 0, 0);
  } catch (e) {
    // noop
    // eslint-disable-next-line no-console
    console.warn('applyContrastThreshold failed', e);
  }
};

export const decodeWithStrategies = (canvas: HTMLCanvasElement): QRData | null => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  let result = tryDecodeFromCtx(ctx, canvas.width, canvas.height);
  if (result) return result;

  const sizesToTry = [800, 600, 400];
  for (const w of sizesToTry) {
    if (canvas.width <= 0 || canvas.height <= 0) break;
    const targetW = Math.min(w, canvas.width);
    try {
      const { tctx, tw, th } = createResizedCtx(canvas, targetW);
      result = tryDecodeFromCtx(tctx, tw, th);
      if (result) return result;
    } catch (e) {
      // continue
    }
  }

  const filtSizes = [800, 400];
  for (const w of filtSizes) {
    try {
      const { tctx, tw, th } = createResizedCtx(canvas, Math.min(w, canvas.width));
      applyContrastThreshold(tctx, tw, th, 1.6, 140);
      result = tryDecodeFromCtx(tctx, tw, th);
      if (result) return result;
    } catch (e) {
      // continue
    }
  }

  return null;
};

export const persistMockScan = (qr: QRData, userId?: string) => {
  try {
    if (!userId) return;
    const newScan: UserScan = {
      opId: `scan_${Date.now()}`,
      scannedUserId: qr.userId,
      scannedName: qr.displayName,
      scannedAvatarUrl: qr.avatarUrl,
      scannedAt: new Date().toISOString(),
      source: 'qr',
      verified: false,
    };
    gameStorage.addScan(userId, newScan);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Unable to persist mock scan', e);
  }
};
