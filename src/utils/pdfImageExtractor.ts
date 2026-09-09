import * as pdfjsLib from 'pdfjs-dist';
import { ImageElement } from '../types';

function multiplyTransform(m1: number[], m2: number[]): number[] {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

async function convertPdfJsImageToDataUrl(imgObj: any): Promise<string | null> {
  if (!imgObj) return null;

  try {
    // Case 1: ImageBitmap
    if (imgObj.bitmap && typeof imgObj.bitmap.close === 'function') {
      const c = document.createElement('canvas');
      c.width = imgObj.width || imgObj.bitmap.width;
      c.height = imgObj.height || imgObj.bitmap.height;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(imgObj.bitmap, 0, 0);
      return c.toDataURL('image/png');
    }

    // Case 2: Direct Image / Canvas
    if (
      (typeof HTMLImageElement !== 'undefined' && imgObj instanceof HTMLImageElement) ||
      (typeof HTMLCanvasElement !== 'undefined' && imgObj instanceof HTMLCanvasElement)
    ) {
      const c = document.createElement('canvas');
      c.width = imgObj.width || (imgObj as HTMLImageElement).naturalWidth;
      c.height = imgObj.height || (imgObj as HTMLImageElement).naturalHeight;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(imgObj, 0, 0);
      return c.toDataURL('image/png');
    }

    // Case 3: Raw pixel buffer (data: Uint8Array | Uint8ClampedArray)
    if (imgObj.data && imgObj.width && imgObj.height) {
      const width = imgObj.width;
      const height = imgObj.height;
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      const ctx = c.getContext('2d');
      if (!ctx) return null;

      const imageData = ctx.createImageData(width, height);
      const data = imgObj.data;

      if (data.length === width * height * 4) {
        imageData.data.set(data);
      } else if (data.length === width * height * 3) {
        // RGB
        for (let s = 0, d = 0; s < data.length; s += 3, d += 4) {
          imageData.data[d] = data[s];
          imageData.data[d + 1] = data[s + 1];
          imageData.data[d + 2] = data[s + 2];
          imageData.data[d + 3] = 255;
        }
      } else if (data.length === width * height) {
        // 1-channel Grayscale
        for (let s = 0, d = 0; s < data.length; s++, d += 4) {
          const v = data[s];
          imageData.data[d] = v;
          imageData.data[d + 1] = v;
          imageData.data[d + 2] = v;
          imageData.data[d + 3] = 255;
        }
      } else {
        const maxLen = Math.min(imageData.data.length, data.length);
        imageData.data.set(data.subarray(0, maxLen));
      }

      ctx.putImageData(imageData, 0, 0);
      return c.toDataURL('image/png');
    }
  } catch (err) {
    console.warn('Could not convert PDF.js image object to Data URL:', err);
  }
  return null;
}

async function resolvePdfJsObj(objs: any, objId: string): Promise<any> {
  if (!objs) return null;
  if (typeof objs.has === 'function' && objs.has(objId)) {
    const direct = objs.get(objId);
    if (direct) return direct;
  }
  return new Promise((resolve) => {
    try {
      objs.get(objId, (data: any) => {
        resolve(data);
      });
      setTimeout(() => resolve(null), 800);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Scans a PDF page using PDF.js operator list and returns all embedded images
 * mapped to exact screen coordinate EditorElements with Data URLs.
 */
export async function extractImagesFromPdfPage(
  page: any,
  pageIndex: number
): Promise<ImageElement[]> {
  const images: ImageElement[] = [];
  try {
    const baseViewport = page.getViewport({ scale: 1.0 });
    const pageHeight = baseViewport.height;
    const ops = await page.getOperatorList();
    if (!ops || !ops.fnArray) return [];

    let currentCtm = [1, 0, 0, 1, 0, 0];
    const ctmStack: number[][] = [];

    const saveOp = (pdfjsLib.OPS as any)?.save ?? 13;
    const restoreOp = (pdfjsLib.OPS as any)?.restore ?? 14;
    const transformOp = (pdfjsLib.OPS as any)?.transform ?? 15;
    const paintImageXObjectOp = (pdfjsLib.OPS as any)?.paintImageXObject ?? 85;
    const paintInlineImageXObjectOp = (pdfjsLib.OPS as any)?.paintInlineImageXObject ?? 86;
    const paintImageMaskXObjectOp = (pdfjsLib.OPS as any)?.paintImageMaskXObject ?? 83;
    const paintImageXObjectRepeatOp = (pdfjsLib.OPS as any)?.paintImageXObjectRepeat ?? 88;

    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      const args = ops.argsArray[i];

      if (fn === saveOp) {
        ctmStack.push([...currentCtm]);
      } else if (fn === restoreOp) {
        if (ctmStack.length > 0) {
          currentCtm = ctmStack.pop()!;
        }
      } else if (fn === transformOp) {
        currentCtm = multiplyTransform(currentCtm, args);
      } else if (
        fn === paintImageXObjectOp ||
        fn === paintInlineImageXObjectOp ||
        fn === paintImageMaskXObjectOp ||
        fn === paintImageXObjectRepeatOp
      ) {
        const a = currentCtm[0];
        const b = currentCtm[1];
        const c = currentCtm[2];
        const d = currentCtm[3];
        const e = currentCtm[4];
        const f = currentCtm[5];

        const width = Math.hypot(a, b);
        const height = Math.hypot(c, d);

        // Filter out minuscule / 1px background patterns
        if (width < 10 || height < 10) continue;

        // Rotation in continuous degrees (0 to 360)
        let rot = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        if (rot < 0) rot += 360;
        rot = rot % 360;

        // In PDF coordinates, center of unit square (0.5, 0.5):
        const centerPdfX = a * 0.5 + c * 0.5 + e;
        const centerPdfY = b * 0.5 + d * 0.5 + f;

        // Convert to Screen coordinates (origin top-left):
        const centerScreenX = centerPdfX;
        const centerScreenY = pageHeight - centerPdfY;

        const x = Math.round((centerScreenX - width / 2) * 10) / 10;
        const y = Math.round((centerScreenY - height / 2) * 10) / 10;
        const roundedWidth = Math.round(width * 10) / 10;
        const roundedHeight = Math.round(height * 10) / 10;

        // Get image data
        let imgObj: any = null;
        if (fn === paintInlineImageXObjectOp) {
          imgObj = args[0];
        } else {
          const objId = args[0];
          if (typeof objId === 'string') {
            imgObj = await resolvePdfJsObj(page.objs, objId);
            if (!imgObj && page.commonObjs) {
              imgObj = await resolvePdfJsObj(page.commonObjs, objId);
            }
          } else if (typeof objId === 'object') {
            imgObj = objId;
          }
        }

        const dataUrl = await convertPdfJsImageToDataUrl(imgObj);
        if (!dataUrl) continue;

        const imgIndex = images.length + 1;
        const element: ImageElement = {
          id: `pdf_img_${pageIndex}_${Date.now()}_${imgIndex}`,
          pageIndex,
          type: 'image',
          x,
          y,
          width: roundedWidth,
          height: roundedHeight,
          rotation: rot,
          imageDataUrl: dataUrl,
          title: `Immagine PDF #${imgIndex}`,
          isOriginalPdfImage: true,
          originalX: x,
          originalY: y,
          originalWidth: roundedWidth,
          originalHeight: roundedHeight,
          originalRotation: rot,
          originalAspectRatio: roundedWidth / (roundedHeight || 1),
        };

        images.push(element);
      }
    }
  } catch (err) {
    console.warn('Error during PDF image extraction:', err);
  }
  return images;
}
