import React, { useEffect, useRef, useState } from 'react';

type Props = {
  onCapture: (file: File) => void;
  onCancel?: () => void;
};

const CameraCapture: React.FC<Props> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stickerRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  // Heuristic to label camera facing based on device label
  const getFacingLabel = (label?: string | null) => {
    if (!label) return 'Sconosciuta';
    const l = label.toLowerCase();
    if (/front|frontale|facing/i.test(l)) return 'Frontale';
    if (/back|rear|posteriore|trasera/i.test(l)) return 'Posteriore';
    return 'Sconosciuta';
  };
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [hasStream, setHasStream] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewAnimating, setPreviewAnimating] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const DELETE_ZONE_RATIO = 0.06; // top 6% of video area (smaller, per request)

  const removeSticker = () => {
    setSelectedSticker(null);
    setStickerPos({ x: 0.82, y: 0.78 });
    setStickerScale(1);
  };
  const [previewToolbarVisible, setPreviewToolbarVisible] =
    useState<boolean>(true);
  const [isOverDelete, setIsOverDelete] = useState<boolean>(false);

  // prevent page scroll when capturing or showing preview
  useEffect(() => {
    const shouldHide = capturing || !!previewUrl;
    const prev = document.body.style.overflow;
    if (shouldHide) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [capturing, previewUrl]);

  // native non-passive handlers to support preventDefault on touch on mobile

  // sticker placement state (normalized [0..1] relative to viewport/video container)
  const [stickerPos, setStickerPos] = useState<{ x: number; y: number }>({
    x: 0.82,
    y: 0.78,
  });
  const [stickerScale, setStickerScale] = useState<number>(1);
  const draggingRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startPos: { x: number; y: number } | null;
    pointerId?: number;
  } | null>(null);
  const pinchRef = useRef<{
    initialDistance: number;
    startScale: number;
  } | null>(null);

  // native non-passive handlers to support preventDefault on touch on mobile
  useEffect(() => {
    const onTouchMove = (ev: TouchEvent) => {
      if (!selectedSticker) return;
      if (ev.touches.length === 2) {
        const a = ev.touches[0];
        const b = ev.touches[1];
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const delta = dist / (pinchRef.current?.initialDistance || dist);
        setStickerScale(
          Math.max(
            0.3,
            Math.min(3, (pinchRef.current?.startScale || 1) * delta)
          )
        );
        ev.preventDefault();
      } else if (
        ev.touches.length === 1 &&
        draggingRef.current &&
        draggingRef.current.active
      ) {
        const t = ev.touches[0];
        if (!videoRef.current) return;
        const rect = videoRef.current.getBoundingClientRect();
        const dx = t.clientX - (draggingRef.current.startX || 0);
        const dy = t.clientY - (draggingRef.current.startY || 0);
        const nx = (draggingRef.current.startPos?.x || 0) + dx / rect.width;
        const ny = (draggingRef.current.startPos?.y || 0) + dy / rect.height;
        const clamped = {
          x: Math.max(0, Math.min(1, nx)),
          y: Math.max(0, Math.min(1, ny)),
        };
        setStickerPos(clamped);
        setIsOverDelete(clamped.y <= DELETE_ZONE_RATIO);
        ev.preventDefault();
      }
    };

    const onTouchStart = (ev: TouchEvent) => {
      if (!selectedSticker) return;
      if (ev.touches.length === 2) {
        const a = ev.touches[0];
        const b = ev.touches[1];
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        pinchRef.current = { initialDistance: dist, startScale: stickerScale };
      } else if (ev.touches.length === 1) {
        const t = ev.touches[0];
        draggingRef.current = {
          active: true,
          startX: t.clientX,
          startY: t.clientY,
          startPos: { ...stickerPos },
        };
      }
    };

    const onTouchEnd = (ev: TouchEvent) => {
      if (!selectedSticker) return;
      if (stickerPos.y <= DELETE_ZONE_RATIO) removeSticker();
      draggingRef.current = null;
      pinchRef.current = null;
      setIsOverDelete(false);
    };

    const onWheel = (ev: WheelEvent) => {
      if (!selectedSticker) return;
      ev.preventDefault();
      const delta = -ev.deltaY / 500;
      setStickerScale((s) => Math.max(0.3, Math.min(3, s + delta)));
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: false });
    document.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('wheel', onWheel);
    };
  }, [selectedSticker, stickerPos, stickerScale]);

  // enumerate devices on mount
  useEffect(() => {
    let mounted = true;
    const updateDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!mounted) return;
        const vids = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(vids);
        // keep previously selected if available, otherwise pick first
        if (!selectedDeviceId && vids.length > 0)
          setSelectedDeviceId(vids[0].deviceId);
      } catch (e) {
        console.warn('enumerateDevices error', e);
      }
    };
    updateDevices();
    // also update when devicechange event fires
    const onDeviceChange = () => updateDevices();
    navigator.mediaDevices.addEventListener?.('devicechange', onDeviceChange);
    return () => {
      mounted = false;
      navigator.mediaDevices.removeEventListener?.(
        'devicechange',
        onDeviceChange as any
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // start / restart stream when selectedDeviceId changes
  useEffect(() => {
    let mounted = true;
    const start = async (deviceId?: string | null) => {
      // stop existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      try {
        const constraints: MediaStreamConstraints = deviceId
          ? { video: { deviceId: { exact: deviceId } } }
          : { video: { facingMode: 'environment' } };
        const s = await navigator.mediaDevices.getUserMedia(constraints);
        if (!mounted) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
          setHasStream(true);
        }
      } catch (err) {
        console.error('Camera error', err);
        setError('Impossibile accedere alla fotocamera');
        setHasStream(false);
      }
    };

    start(selectedDeviceId);

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setHasStream(false);
    };
  }, [selectedDeviceId]);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Do not draw sticker onto the source canvas here; we'll draw it onto the
      // final (cropped) canvas so its position matches the preview after crop.

      // Crop the captured image to match the device screen aspect ratio
      const screenRatio = window.innerWidth / window.innerHeight || 1;
      const srcW = canvas.width;
      const srcH = canvas.height;
      const srcRatio = srcW / srcH;

      let sx = 0,
        sy = 0,
        sWidth = srcW,
        sHeight = srcH;

      if (Math.abs(srcRatio - screenRatio) > 0.001) {
        if (srcRatio > screenRatio) {
          // source is wider -> crop horizontally
          sHeight = srcH;
          sWidth = Math.round(sHeight * screenRatio);
          sx = Math.round((srcW - sWidth) / 2);
          sy = 0;
        } else {
          // source is taller -> crop vertically
          sWidth = srcW;
          sHeight = Math.round(sWidth / screenRatio);
          sx = 0;
          sy = Math.round((srcH - sHeight) / 2);
        }
      }

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = sWidth;
      finalCanvas.height = sHeight;
      const fctx = finalCanvas.getContext('2d');
      if (fctx) {
        // draw the cropped area from the original canvas into final canvas
        fctx.drawImage(canvas, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
        // If a sticker is selected, draw it on the final canvas using
        // coordinates mapped from the normalized sticker position so it
        // appears in the same place as the preview (compensating for crop).
        if (selectedSticker && videoRef.current) {
          try {
            const relX = Math.max(0, Math.min(1, stickerPos.x));
            const relY = Math.max(0, Math.min(1, stickerPos.y));
            // position on the source canvas
            const srcX = Math.round(relX * srcW);
            const srcY = Math.round(relY * srcH);
            // map to final canvas coordinates (account for crop offset)
            const fx = srcX - sx;
            const fy = srcY - sy;

            const baseFont = Math.floor(Math.min(sWidth, sHeight) * 0.12);
            const fontSize = Math.max(12, Math.round(baseFont * stickerScale));
            fctx.font = `${fontSize}px serif`;
            fctx.textAlign = 'center';
            fctx.textBaseline = 'middle';
            fctx.fillStyle = 'rgba(0,0,0,0.45)';
            fctx.fillText(selectedSticker, fx + 2, fy + 2);
            fctx.fillStyle = '#fff';
            fctx.fillText(selectedSticker, fx, fy);
          } catch (e) {
            console.warn('Sticker draw error on final canvas', e);
          }
        }
      }

      const blob: Blob | null = await new Promise((resolve) =>
        finalCanvas.toBlob(resolve as any, 'image/jpeg', 0.9)
      );
      if (blob) {
        const file = new File([blob], `capture_${Date.now()}.jpg`, {
          type: blob.type,
        });
        // show preview and allow confirm/retry
        const url = URL.createObjectURL(blob);
        setPreviewFile(file);
        setPreviewUrl(url);
        // animate in with cleanup tracking
        timeoutRef.current = setTimeout(() => setPreviewAnimating(true), 30);
      }
    } catch (err) {
      console.error('Capture error', err);
      setError('Errore nella cattura');
    } finally {
      setCapturing(false);
    }
  };

  const handleDeviceChange = (deviceId: string) => {
    // set selected device id; effect will restart stream
    setSelectedDeviceId(deviceId);
  };

  // handlers for dragging & resizing the sticker on the live preview
  const handleStickerPointerDown = (e: React.PointerEvent) => {
    if (!selectedSticker) return;
    const el = e.currentTarget as HTMLElement;
    (el as Element).setPointerCapture(e.pointerId);
    // store normalized start position and pointer origin; actual moves will be normalized by video rect
    draggingRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...stickerPos },
      pointerId: e.pointerId,
    };
  };

  const handleStickerPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !draggingRef.current.active) return;
    if (draggingRef.current.pointerId !== e.pointerId) return;
    if (!videoRef.current) return;
    const rect = videoRef.current.getBoundingClientRect();
    const dx = e.clientX - (draggingRef.current.startX || 0);
    const dy = e.clientY - (draggingRef.current.startY || 0);
    const nx = (draggingRef.current.startPos?.x || 0) + dx / rect.width;
    const ny = (draggingRef.current.startPos?.y || 0) + dy / rect.height;
    const clamped = {
      x: Math.max(0, Math.min(1, nx)),
      y: Math.max(0, Math.min(1, ny)),
    };
    setStickerPos(clamped);
    setIsOverDelete(clamped.y <= DELETE_ZONE_RATIO);
  };

  const handleStickerPointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const el = e.currentTarget as HTMLElement;
    try {
      (el as Element).releasePointerCapture?.(e.pointerId);
    } catch {}
    // if released near top of video, remove sticker
    if (videoRef.current) {
      const rect = videoRef.current.getBoundingClientRect();
      if (stickerPos.y <= DELETE_ZONE_RATIO) {
        removeSticker();
      }
    }
    draggingRef.current = null;
  };

  const handleStickerWheel = (e: React.WheelEvent) => {
    if (!selectedSticker) return;
    if (e.cancelable) e.preventDefault();
    const delta = -e.deltaY / 500; // small scale change
    setStickerScale((s) => Math.max(0.3, Math.min(3, s + delta)));
  };

  // touch pinch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!selectedSticker) return;
    if (e.touches.length === 2) {
      const a = e.touches[0];
      const b = e.touches[1];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchRef.current = { initialDistance: dist, startScale: stickerScale };
    } else if (e.touches.length === 1) {
      // emulate pointer down for single-touch drag
      const t = e.touches[0];
      draggingRef.current = {
        active: true,
        startX: t.clientX,
        startY: t.clientY,
        startPos: { ...stickerPos },
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!selectedSticker) return;
    if (pinchRef.current && e.touches.length === 2) {
      const a = e.touches[0];
      const b = e.touches[1];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const delta = dist / (pinchRef.current.initialDistance || dist);
      setStickerScale(
        Math.max(0.3, Math.min(3, (pinchRef.current.startScale || 1) * delta))
      );
      if (e.cancelable) e.preventDefault();
    } else if (
      e.touches.length === 1 &&
      draggingRef.current &&
      draggingRef.current.active
    ) {
      // single touch drag - normalize using video rect
      const t = e.touches[0];
      if (!videoRef.current) return;
      const rect = videoRef.current.getBoundingClientRect();
      const dx = t.clientX - (draggingRef.current.startX || 0);
      const dy = t.clientY - (draggingRef.current.startY || 0);
      const nx = (draggingRef.current.startPos?.x || 0) + dx / rect.width;
      const ny = (draggingRef.current.startPos?.y || 0) + dy / rect.height;
      const clamped = {
        x: Math.max(0, Math.min(1, nx)),
        y: Math.max(0, Math.min(1, ny)),
      };
      setStickerPos(clamped);
      setIsOverDelete(clamped.y <= DELETE_ZONE_RATIO);
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    pinchRef.current = null;
    // if dropped over delete zone, remove
    if (stickerPos.y <= DELETE_ZONE_RATIO) removeSticker();
    draggingRef.current = null;
    setIsOverDelete(false);
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setHasStream(false);
  };

  const handleConfirmPreview = () => {
    if (!previewFile) return;
    // stop camera and pass file to parent
    stopStream();
    // clean up any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onCapture(previewFile);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
    setPreviewAnimating(false);
  };

  const handleRetryPreview = () => {
    // remove preview and resume camera
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    // clean up any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // also remove any sticker selection when retrying
    removeSticker();
    setPreviewFile(null);
    setPreviewUrl(null);
    setPreviewAnimating(false);
    if (streamRef.current) setHasStream(true);
  };
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* camera selection control */}
      {videoDevices.length > 1 && (
        <div className="absolute top-4 right-4 z-60">
          <label className="text-xs block mb-1 text-white">Fotocamera</label>
          <select
            className="nes-select bg-white text-xs"
            value={selectedDeviceId || ''}
            onChange={(e) => handleDeviceChange(e.target.value)}
            aria-label="Seleziona fotocamera"
          >
            {videoDevices.map((d, i) => {
              const facing = getFacingLabel(d.label || null);
              const title = d.label || `Fotocamera ${i + 1}`;
              return (
                <option key={d.deviceId} value={d.deviceId}>
                  {`${title} — ${facing}`}
                </option>
              );
            })}
          </select>
        </div>
      )}
      {/* Fullscreen video background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Sticker overlay on live preview (draggable & resizable) */}
      {selectedSticker && (
        <div
          className="absolute touch-none pointer-events-auto"
          role="img"
          aria-hidden
          style={{
            right: 'auto',
            left: videoRef.current
              ? `${
                  videoRef.current.getBoundingClientRect().left +
                  stickerPos.x * videoRef.current.getBoundingClientRect().width
                }px`
              : `${stickerPos.x * 100}vw`,
            top: videoRef.current
              ? `${
                  videoRef.current.getBoundingClientRect().top +
                  stickerPos.y * videoRef.current.getBoundingClientRect().height
                }px`
              : `${stickerPos.y * 100}vh`,
            transform: 'translate(-50%,-50%)',
            fontSize: `clamp(36px, ${Math.round(6 * stickerScale)}vw, 96px)`,
            cursor: 'grab',
            userSelect: 'none',
            touchAction: 'none',
          }}
          onPointerDown={handleStickerPointerDown}
          onPointerMove={handleStickerPointerMove}
          onPointerUp={handleStickerPointerUp}
          onPointerCancel={handleStickerPointerUp}
          onWheel={handleStickerWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {selectedSticker}
        </div>
      )}

      {/* Loading / error overlays centered */}
      {!hasStream && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white">Apertura fotocamera...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-red-400 p-2 bg-black bg-opacity-60 rounded">
            {error}
          </div>
        </div>
      )}

      {/* Bottom controls overlay */}
      <div className="absolute left-0 right-0 bottom-0 p-4 pointer-events-none">
        <div className="mx-auto w-full max-w-md pointer-events-auto bg-black bg-opacity-40 backdrop-blur-sm rounded-xl p-3 flex items-center justify-evenly">
          <button
            className="nes-btn is-error"
            onClick={() => {
              removeSticker();
              onCancel && onCancel();
            }}
            aria-label="Annulla"
            data-testid="button-camera-cancel"
          >
            Annulla
          </button>

          <div className="flex items-center justify-center">
            <button
              className="nes-btn is-primary shadow-lg px-6"
              onClick={handleCapture}
              disabled={capturing}
              aria-label="Scatta foto"
              data-testid="button-camera-capture"
            >
              {capturing ? 'Scattando...' : 'Scatta'}
            </button>
          </div>
        </div>
        {/* Collapsible sticker toolbar - appears above controls (hidden while capturing) */}
        {/* live toolbar removed per UX request: stickers are selectable only in preview */}
      </div>
      {/* Preview overlay - full screen image with bottom controls */}
      {previewUrl && (
        <div className="absolute inset-0 z-50 bg-black">
          <img
            src={previewUrl}
            alt="Anteprima"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transform: previewAnimating ? 'scale(1)' : 'scale(0.98)',
              opacity: previewAnimating ? 1 : 0,
              transition: 'transform 220ms ease-out, opacity 220ms ease-out',
            }}
          />

          {/* Render interactive sticker on preview in same position (draggable & resizable) */}
          {selectedSticker && (
            <div
              className="absolute touch-none pointer-events-auto"
              role="img"
              aria-hidden
              style={{
                right: 'auto',
                left: videoRef.current
                  ? `${
                      videoRef.current.getBoundingClientRect().left +
                      stickerPos.x *
                        videoRef.current.getBoundingClientRect().width
                    }px`
                  : `${stickerPos.x * 100}vw`,
                top: videoRef.current
                  ? `${
                      videoRef.current.getBoundingClientRect().top +
                      stickerPos.y *
                        videoRef.current.getBoundingClientRect().height
                    }px`
                  : `${stickerPos.y * 100}vh`,
                transform: 'translate(-50%,-50%)',
                fontSize: `clamp(48px, ${Math.round(
                  8 * stickerScale
                )}vw, 128px)`,
                cursor: 'grab',
                userSelect: 'none',
                touchAction: 'none',
              }}
              onPointerDown={handleStickerPointerDown}
              onPointerMove={handleStickerPointerMove}
              onPointerUp={handleStickerPointerUp}
              onPointerCancel={handleStickerPointerUp}
              onWheel={handleStickerWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {selectedSticker}
            </div>
          )}

          {/* Preview delete hint zone (top) - shows when sticker present */}
          {selectedSticker && (
            <div className="absolute left-0 right-0 top-0 h-16 flex items-center justify-center pointer-events-none">
              <div
                className={`text-white rounded-full px-3 py-1 text-sm ${
                  stickerPos.y <= DELETE_ZONE_RATIO
                    ? 'bg-red-600 bg-opacity-95'
                    : 'bg-red-600 bg-opacity-80'
                }`}
              >
                Trascina qui per rimuovere
              </div>
            </div>
          )}

          {/* Preview sticker toolbar - HIDDEN per request: non permettere modifica emoji nella schermata di conferma */}
          {/* Top-right overlay: toggle preview toolbar visibility - RIMOSSO */}
          {/* 
          <div className="absolute right-4 top-4 z-60">
            <button
              className="nes-btn is-small"
              onClick={() => setPreviewToolbarVisible((v) => !v)}
              aria-label="Apri toolbar sticker"
            >
              🎨
            </button>
          </div>
          */}

          {/* Toolbar degli stickers - RIMOSSA per nascondere il tool di sovrapposizione emoji */}
          {/*
          <div
            className={`absolute left-0 right-0 bottom-24 flex justify-center pointer-events-auto ${
              previewToolbarVisible ? "" : "hidden"
            }`}
          >
            <div className="bg-black bg-opacity-60 backdrop-blur-sm rounded-xl p-2 flex gap-2">
              {["⭐", "🎉", "🔥", "💡", "📍"].map((st) => (
                <button
                  key={st}
                  className={`nes-btn ${
                    selectedSticker === st ? "is-success" : ""
                  }`}
                  onClick={() =>
                    setSelectedSticker((prev) => (prev === st ? null : st))
                  }
                  aria-label={`Sticker ${st}`}
                  title={st}
                  type="button"
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
          */}

          {/* Bottom controls overlay */}
          <div className="absolute left-0 right-0 bottom-0 p-4 pointer-events-none">
            <div className="mx-auto w-full max-w-md pointer-events-auto bg-black bg-opacity-40 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center gap-3">
              <button className="nes-btn is-error" onClick={handleRetryPreview}>
                Riprova
              </button>
              <button
                className="nes-btn is-primary"
                onClick={handleConfirmPreview}
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
