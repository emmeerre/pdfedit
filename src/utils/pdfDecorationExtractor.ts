import * as pdfjsLib from 'pdfjs-dist';

export interface ExtractedDecorationItem {
  id: string;
  type: 'rectangle' | 'line' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  title: string;
}

// Helper to convert rgb components or strings to hex
function rgbToHex(r: any, g?: any, b?: any): string {
  if (typeof r === 'string' && r.startsWith('#')) return r;
  if (typeof r === 'string' && r.startsWith('rgb')) return r;
  const numR = typeof r === 'number' ? r : 0;
  const numG = typeof g === 'number' ? g : numR;
  const numB = typeof b === 'number' ? b : numR;
  const normR = numR <= 1 && numR >= 0 ? Math.round(numR * 255) : Math.round(numR);
  const normG = numG <= 1 && numG >= 0 ? Math.round(numG * 255) : Math.round(numG);
  const normB = numB <= 1 && numB >= 0 ? Math.round(numB * 255) : Math.round(numB);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const hex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${hex(normR)}${hex(normG)}${hex(normB)}`;
}

// Apply 2D affine matrix [a, b, c, d, e, f] to point (x, y)
function applyTransform(pt: [number, number], m: number[]): [number, number] {
  return [
    m[0] * pt[0] + m[2] * pt[1] + m[4],
    m[1] * pt[0] + m[3] * pt[1] + m[5],
  ];
}

// Multiply 2D matrices [a, b, c, d, e, f]
function multiplyMatrices(m1: number[], m2: number[]): number[] {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

export async function extractDecorationsFromPdfPage(
  page: any,
  pageWidth: number,
  pageHeight: number
): Promise<ExtractedDecorationItem[]> {
  const decorations: ExtractedDecorationItem[] = [];

  try {
    const opList = await page.getOperatorList();
    if (!opList || !opList.fnArray || !opList.argsArray) {
      return decorations;
    }

    const OPS = (pdfjsLib as any).OPS || {};
    const fnArray: number[] = opList.fnArray;
    const argsArray: any[] = opList.argsArray;

    // State machine for tracking CTM and graphics state
    let ctm = [1, 0, 0, 1, 0, 0];
    const ctmStack: number[][] = [];
    let currentStrokeColor = '#475569';
    let currentFillColor = '#f1f5f9';
    let currentLineWidth = 1;

    for (let i = 0; i < fnArray.length; i++) {
      const fn = fnArray[i];
      const args = argsArray[i];

      if (fn === OPS.save) {
        ctmStack.push([...ctm]);
      } else if (fn === OPS.restore) {
        if (ctmStack.length > 0) {
          ctm = ctmStack.pop()!;
        }
      } else if (fn === OPS.transform) {
        if (Array.isArray(args) && args.length >= 6) {
          ctm = multiplyMatrices(ctm, args);
        }
      } else if (
        fn === OPS.setStrokeRGBColor ||
        fn === OPS.setStrokeColorN ||
        fn === OPS.setStrokeColor
      ) {
        if (Array.isArray(args)) {
          if (args.length === 1 && typeof args[0] === 'string') {
            currentStrokeColor = args[0];
          } else if (args.length >= 3) {
            currentStrokeColor = rgbToHex(args[0], args[1], args[2]);
          } else if (args.length === 1 && typeof args[0] === 'number') {
            currentStrokeColor = rgbToHex(args[0], args[0], args[0]);
          }
        }
      } else if (
        fn === OPS.setFillRGBColor ||
        fn === OPS.setFillColorN ||
        fn === OPS.setFillColor
      ) {
        if (Array.isArray(args)) {
          if (args.length === 1 && typeof args[0] === 'string') {
            currentFillColor = args[0];
          } else if (args.length >= 3) {
            currentFillColor = rgbToHex(args[0], args[1], args[2]);
          } else if (args.length === 1 && typeof args[0] === 'number') {
            currentFillColor = rgbToHex(args[0], args[0], args[0]);
          }
        }
      } else if (fn === OPS.setLineWidth) {
        if (Array.isArray(args) && typeof args[0] === 'number') {
          currentLineWidth = Math.max(0.5, args[0]);
        }
      }

      // Check for constructPath (PDF.js standard operator for vector paths)
      if (fn === OPS.constructPath && Array.isArray(args)) {
        const bbox = args[2];
        let hasBbox = false;
        let minX = 0, minY = 0, maxX = 0, maxY = 0;
        let isCircle = false;

        if (bbox && (Array.isArray(bbox) || ArrayBuffer.isView(bbox)) && (bbox as any).length >= 4) {
          const bArr = bbox as any;
          const p1 = applyTransform([bArr[0], bArr[1]], ctm);
          const p2 = applyTransform([bArr[2], bArr[3]], ctm);
          const p3 = applyTransform([bArr[0], bArr[3]], ctm);
          const p4 = applyTransform([bArr[2], bArr[1]], ctm);

          minX = Math.min(p1[0], p2[0], p3[0], p4[0]);
          maxX = Math.max(p1[0], p2[0], p3[0], p4[0]);
          minY = Math.min(p1[1], p2[1], p3[1], p4[1]);
          maxY = Math.max(p1[1], p2[1], p3[1], p4[1]);
          hasBbox = true;

          // Check if path has bezier curves (circle / oval)
          if (args[1] && args[1][0] && args[1][0].length >= 16) {
            const opsArr = args[1][0];
            let curveCount = 0;
            for (let k = 0; k < opsArr.length; k++) {
              if (opsArr[k] === 2) curveCount++; // 2 = curveTo in PDF.js path stream
            }
            if (curveCount >= 3) isCircle = true;
          }
        }

        if (hasBbox) {
          const w = maxX - minX;
          const h = maxY - minY;
          const topY = pageHeight - maxY;

          // Filter out full-page canvas background or 0-size invisible elements
          if ((w < pageWidth * 0.98 || h < pageHeight * 0.98) && (w >= 4 || h >= 4)) {
            const isHLine = h <= 3 && w >= 5;
            const isVLine = w <= 3 && h >= 5;
            const isLine = isHLine || isVLine;

            const type: 'line' | 'rectangle' | 'circle' = isCircle
              ? 'circle'
              : isLine
              ? 'line'
              : 'rectangle';

            const decX = Math.round(isVLine ? minX - currentLineWidth / 2 : minX);
            const decY = Math.round(isHLine ? topY - currentLineWidth / 2 : topY);
            const decW = Math.round(isVLine ? Math.max(2, currentLineWidth) : w);
            const decH = Math.round(isHLine ? Math.max(2, currentLineWidth) : h);

            decorations.push({
              id: `dec_${decorations.length + 1}`,
              type,
              x: decX,
              y: decY,
              width: Math.max(decW, isLine ? 10 : 6),
              height: Math.max(decH, isLine ? 2 : 6),
              strokeColor: currentStrokeColor,
              fillColor: isLine ? currentStrokeColor : currentFillColor,
              strokeWidth: Math.round(currentLineWidth),
              title: isLine
                ? (isHLine ? 'Linea Divisoria Orizzontale' : 'Linea Divisoria Verticale')
                : isCircle
                ? 'Cerchio / Punto Grafico'
                : 'Riquadro / Sfondo',
            });
          }
        }
      } else if (fn === OPS.rectangle && Array.isArray(args) && args.length >= 4) {
        // Direct rectangle operator
        const rx = args[0];
        const ry = args[1];
        const rw = args[2];
        const rh = args[3];
        const p1 = applyTransform([rx, ry], ctm);
        const p2 = applyTransform([rx + rw, ry + rh], ctm);
        const minX = Math.min(p1[0], p2[0]);
        const maxX = Math.max(p1[0], p2[0]);
        const minY = Math.min(p1[1], p2[1]);
        const maxY = Math.max(p1[1], p2[1]);
        const w = maxX - minX;
        const h = maxY - minY;
        const topY = pageHeight - maxY;

        if ((w < pageWidth * 0.98 || h < pageHeight * 0.98) && (w >= 4 || h >= 4)) {
          const isLine = h <= 3 || w <= 3;
          decorations.push({
            id: `dec_${decorations.length + 1}`,
            type: isLine ? 'line' : 'rectangle',
            x: Math.round(minX),
            y: Math.round(topY),
            width: Math.max(isLine ? 10 : 6, Math.round(w)),
            height: Math.max(isLine ? 2 : 6, Math.round(h)),
            strokeColor: currentStrokeColor,
            fillColor: isLine ? currentStrokeColor : currentFillColor,
            strokeWidth: Math.round(currentLineWidth),
            title: isLine ? 'Linea Divisoria' : 'Riquadro / Sfondo',
          });
        }
      }
    }
  } catch (err) {
    console.warn('Decoration vector extraction warning:', err);
  }

  // Deduplicate overlapping decorations (e.g. stroke & fill of the same box)
  const uniqueDecorations: ExtractedDecorationItem[] = [];
  for (const dec of decorations) {
    const existing = uniqueDecorations.find(
      (u) =>
        Math.abs(u.x - dec.x) <= 3 &&
        Math.abs(u.y - dec.y) <= 3 &&
        Math.abs(u.width - dec.width) <= 4 &&
        Math.abs(u.height - dec.height) <= 4
    );

    if (existing) {
      if (dec.fillColor && dec.fillColor !== 'transparent' && dec.fillColor !== '#ffffff') {
        existing.fillColor = dec.fillColor;
      }
      if (dec.strokeColor && dec.strokeColor !== existing.strokeColor) {
        existing.strokeColor = dec.strokeColor;
      }
    } else {
      uniqueDecorations.push(dec);
    }
  }

  return uniqueDecorations;
}

