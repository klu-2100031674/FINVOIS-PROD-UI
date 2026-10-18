import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Move, X, ZoomIn } from 'lucide-react';
import { GENIE_BANNER_HEIGHT, GENIE_BANNER_WIDTH } from '../../api/genieAPI';

const RATIO = GENIE_BANNER_WIDTH / GENIE_BANNER_HEIGHT; // 16:9
const MAX_ZOOM = 3;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Lets the admin frame an image inside a fixed 16:9 window (drag to move, slider to zoom)
 * and returns a 1280×720 JPEG blob through onSave.
 */
export default function BannerCropper({ open, onClose, onSave }) {
  const fileInputRef = useRef(null);
  const frameRef = useRef(null);
  const dragRef = useRef(null);

  const [image, setImage] = useState(null); // HTMLImageElement
  const [frameWidth, setFrameWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const frameHeight = frameWidth / RATIO;
  const baseScale = image ? Math.max(frameWidth / image.naturalWidth, frameHeight / image.naturalHeight) : 1;
  const scale = baseScale * zoom;
  const drawnWidth = image ? image.naturalWidth * scale : 0;
  const drawnHeight = image ? image.naturalHeight * scale : 0;

  const clampOffset = useCallback(
    (x, y, width = drawnWidth, height = drawnHeight) => ({
      x: clamp(x, frameWidth - width, 0),
      y: clamp(y, frameHeight - height, 0),
    }),
    [drawnWidth, drawnHeight, frameWidth, frameHeight]
  );

  // Track the frame width so the crop math follows layout changes
  useEffect(() => {
    if (!open || !frameRef.current) return undefined;
    const observer = new ResizeObserver(([entry]) => setFrameWidth(entry.contentRect.width));
    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, [open, image]);

  // Center a newly loaded image
  useEffect(() => {
    if (!image || !frameWidth) return;
    const s = Math.max(frameWidth / image.naturalWidth, frameHeight / image.naturalHeight);
    setZoom(1);
    setOffset({
      x: (frameWidth - image.naturalWidth * s) / 2,
      y: (frameHeight - image.naturalHeight * s) / 2,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, frameWidth]);

  useEffect(() => {
    if (!open) {
      setImage(null);
      setError('');
      setSaving(false);
    }
  }, [open]);

  const pickFile = (file) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError('Choose a JPG, PNG or WebP image.');
      return;
    }
    setError('');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth < 640 || img.naturalHeight < 360) {
        setError('This image is small (under 640×360) and may look blurry. Use a larger image if you can.');
      }
      setImage(img);
    };
    img.onerror = () => setError('Could not read this image.');
    img.src = url;
  };

  const changeZoom = (nextZoom) => {
    if (!image) return;
    const nextScale = baseScale * nextZoom;
    // Keep the point under the frame centre fixed while zooming
    const cx = (frameWidth / 2 - offset.x) / scale;
    const cy = (frameHeight / 2 - offset.y) / scale;
    setZoom(nextZoom);
    setOffset(
      clampOffset(
        frameWidth / 2 - cx * nextScale,
        frameHeight / 2 - cy * nextScale,
        image.naturalWidth * nextScale,
        image.naturalHeight * nextScale
      )
    );
  };

  const onPointerDown = (event) => {
    if (!image) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startY: event.clientY, origin: offset };
  };
  const onPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    setOffset(clampOffset(drag.origin.x + event.clientX - drag.startX, drag.origin.y + event.clientY - drag.startY));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const handleSave = async () => {
    if (!image || !frameWidth) return;
    setSaving(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = GENIE_BANNER_WIDTH;
      canvas.height = GENIE_BANNER_HEIGHT;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        image,
        -offset.x / scale,
        -offset.y / scale,
        frameWidth / scale,
        frameHeight / scale,
        0,
        0,
        GENIE_BANNER_WIDTH,
        GENIE_BANNER_HEIGHT
      );
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Could not create the banner image.');
      await onSave(blob);
    } catch (err) {
      setError(err.message || 'Could not save the banner.');
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-['Manrope'] text-lg font-bold text-gray-900">Scheme banner</h2>
            <p className="text-xs text-gray-500">16:9 · saved at {GENIE_BANNER_WIDTH}×{GENIE_BANNER_HEIGHT}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {image ? (
            <>
              <div
                ref={frameRef}
                className="relative aspect-video w-full touch-none select-none overflow-hidden rounded-xl bg-gray-900 cursor-grab active:cursor-grabbing"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <img
                  src={image.src}
                  alt=""
                  draggable={false}
                  className="absolute left-0 top-0 max-w-none"
                  style={{
                    width: drawnWidth,
                    height: drawnHeight,
                    transform: `translate(${offset.x}px, ${offset.y}px)`,
                  }}
                />
                <div className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-white/70 rounded-xl" />
                <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">
                  <Move className="h-3.5 w-3.5" /> Drag to position
                </span>
              </div>
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <ZoomIn className="h-4 w-4 text-purple-700" />
                <span className="w-12">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={MAX_ZOOM}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => changeZoom(Number(e.target.value))}
                  className="flex-1 accent-purple-700"
                />
              </label>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/50 text-purple-800 hover:border-purple-400 hover:bg-purple-50"
            >
              <ImagePlus className="h-10 w-10" />
              <span className="text-sm font-semibold">Choose an image</span>
              <span className="text-xs text-purple-700/70">JPG, PNG or WebP · landscape works best</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              pickFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          {error && <p className="text-sm text-amber-700">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            className="text-sm font-semibold text-purple-700 hover:text-purple-900 disabled:opacity-60"
          >
            {image ? 'Choose another image' : ''}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!image || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save banner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
