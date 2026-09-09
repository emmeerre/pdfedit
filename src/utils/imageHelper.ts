import { ImageElement } from '../types';

/**
 * Reads a File object into a base64 Data URL
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        resolve(e.target.result);
      } else {
        reject(new Error('Impossibile leggere il file immagine.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Gets natural width, height, and aspect ratio of an image Data URL
 */
export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number; aspectRatio: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        aspectRatio: (img.naturalWidth || img.width) / ((img.naturalHeight || img.height) || 1),
      });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Applies visual filters (brightness, contrast, grayscale, invert, sepia, flipX, flipY)
 * via an offscreen canvas to produce a clean exported image Data URL for PDF embedding.
 */
export async function applyImageFilters(
  dataUrlOrEl: string | Partial<ImageElement>,
  maybeEl?: Partial<ImageElement>
): Promise<string> {
  const dataUrl = typeof dataUrlOrEl === 'string' ? dataUrlOrEl : dataUrlOrEl.imageDataUrl || '';
  const el = typeof dataUrlOrEl === 'string' ? (maybeEl || {}) : dataUrlOrEl;

  if (!dataUrl) return '';

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        const filters: string[] = [];
        if (el.brightness !== undefined && el.brightness !== 100) {
          filters.push(`brightness(${el.brightness}%)`);
        }
        if (el.contrast !== undefined && el.contrast !== 100) {
          filters.push(`contrast(${el.contrast}%)`);
        }
        if (el.grayscale) {
          filters.push('grayscale(100%)');
        }
        if (el.invert) {
          filters.push('invert(100%)');
        }
        if (el.sepia) {
          filters.push('sepia(100%)');
        }

        if (filters.length > 0) {
          ctx.filter = filters.join(' ');
        }

        ctx.save();
        if (el.flipX || el.flipY) {
          ctx.translate(el.flipX ? canvas.width : 0, el.flipY ? canvas.height : 0);
          ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);
        }

        ctx.drawImage(img, 0, 0);
        ctx.restore();

        // Optional border drawing on pixel level if requested
        if (el.borderWidth && el.borderWidth > 0 && el.borderColor) {
          ctx.lineWidth = el.borderWidth * 2;
          ctx.strokeStyle = el.borderColor;
          ctx.strokeRect(0, 0, canvas.width, canvas.height);
        }

        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Canvas filter error:', err);
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
