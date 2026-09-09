export interface FontInfo {
  fontKey: string;
  cssFontFamily: string;
  isBold: boolean;
  isItalic: boolean;
  cleanName: string;
}

export const COMMON_FONTS = [
  { key: 'Arial', label: 'Arial (Sans-Serif)', css: 'Arial, "Helvetica Neue", Helvetica, sans-serif' },
  { key: 'Helvetica', label: 'Helvetica (Standard Sans)', css: 'Helvetica, Arial, sans-serif' },
  { key: 'Calibri', label: 'Calibri (Modern Sans)', css: 'Calibri, "Segoe UI", Candara, sans-serif' },
  { key: 'TimesRoman', label: 'Times New Roman (Serif)', css: '"Times New Roman", Times, "Liberation Serif", serif' },
  { key: 'Georgia', label: 'Georgia (Classic Serif)', css: 'Georgia, "Times New Roman", serif' },
  { key: 'Verdana', label: 'Verdana (Legible Sans)', css: 'Verdana, Geneva, sans-serif' },
  { key: 'Trebuchet MS', label: 'Trebuchet MS (Humanist Sans)', css: '"Trebuchet MS", "Lucida Grande", sans-serif' },
  { key: 'Segoe UI', label: 'Segoe UI (Clean Sans)', css: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
  { key: 'Roboto', label: 'Roboto (Digital Sans)', css: 'Roboto, "Helvetica Neue", Arial, sans-serif' },
  { key: 'Open Sans', label: 'Open Sans (Neutral Sans)', css: '"Open Sans", "Helvetica Neue", Arial, sans-serif' },
  { key: 'Garamond', label: 'Garamond (Elegant Serif)', css: 'Garamond, "Hoefler Text", "Times New Roman", serif' },
  { key: 'Courier', label: 'Courier New (Monospace)', css: '"Courier New", Courier, monospace' },
];

export function getCssFontFamily(fontKey?: string): string {
  if (!fontKey) return 'Helvetica, Arial, sans-serif';
  const match = COMMON_FONTS.find((f) => f.key.toLowerCase() === fontKey.toLowerCase());
  if (match) return match.css;

  const lower = fontKey.toLowerCase();
  if (lower.includes('times') || lower.includes('roman') || lower.includes('serif')) {
    return '"Times New Roman", Times, "Liberation Serif", serif';
  }
  if (lower.includes('courier') || lower.includes('mono') || lower.includes('consolas')) {
    return '"Courier New", Courier, monospace';
  }
  if (lower.includes('georgia')) {
    return 'Georgia, "Times New Roman", serif';
  }
  if (lower.includes('calibri')) {
    return 'Calibri, "Segoe UI", Candara, sans-serif';
  }
  if (lower.includes('arial')) {
    return 'Arial, "Helvetica Neue", Helvetica, sans-serif';
  }
  return `${fontKey}, Helvetica, Arial, sans-serif`;
}

export function detectPdfFont(rawFontName: string, styleObj?: any, commonObjs?: any): FontInfo {
  let fontName = '';
  let isBold = false;
  let isItalic = false;

  // Try commonObjs
  try {
    if (commonObjs) {
      let fontObj = null;
      if (typeof commonObjs.has === 'function' && commonObjs.has(rawFontName)) {
        fontObj = commonObjs.get(rawFontName);
      } else if (commonObjs._objs && commonObjs._objs[rawFontName]) {
        fontObj = commonObjs._objs[rawFontName]?.data || commonObjs._objs[rawFontName];
      }
      if (fontObj) {
        fontName = fontObj.name || fontObj.fallbackName || '';
        isBold = Boolean(fontObj.bold || fontObj.black);
        isItalic = Boolean(fontObj.italic);
      }
    }
  } catch (e) {
    // ignore
  }

  if (!fontName) {
    fontName = (styleObj && styleObj.fontFamily) || rawFontName || '';
  }

  // Strip 6-char subset tag like 'BCDFEE+Arial-BoldMT' -> 'Arial-BoldMT'
  const cleanName = fontName.replace(/^[A-Z]{6}\+/, '').replace(/^\//, '');
  const lower = cleanName.toLowerCase();

  if (!isBold) {
    isBold =
      lower.includes('bold') ||
      lower.includes('black') ||
      lower.includes('heavy') ||
      lower.includes('semibold') ||
      lower.includes('medium') ||
      lower.includes('w7') ||
      lower.includes('w8') ||
      lower.includes('w9');
  }
  if (!isItalic) {
    isItalic = lower.includes('italic') || lower.includes('oblique');
  }

  let fontKey = 'Helvetica';
  if (lower.includes('arial')) {
    fontKey = 'Arial';
  } else if (lower.includes('calibri')) {
    fontKey = 'Calibri';
  } else if (lower.includes('times') || lower.includes('roman')) {
    fontKey = 'TimesRoman';
  } else if (lower.includes('georgia')) {
    fontKey = 'Georgia';
  } else if (lower.includes('verdana')) {
    fontKey = 'Verdana';
  } else if (lower.includes('tahoma')) {
    fontKey = 'Tahoma';
  } else if (lower.includes('trebuchet')) {
    fontKey = 'Trebuchet MS';
  } else if (lower.includes('segoe')) {
    fontKey = 'Segoe UI';
  } else if (lower.includes('roboto')) {
    fontKey = 'Roboto';
  } else if (lower.includes('open sans') || lower.includes('opensans')) {
    fontKey = 'Open Sans';
  } else if (lower.includes('garamond')) {
    fontKey = 'Garamond';
  } else if (lower.includes('courier') || lower.includes('mono') || lower.includes('consolas')) {
    fontKey = 'Courier';
  } else if (lower.includes('serif')) {
    fontKey = 'TimesRoman';
  }

  return {
    fontKey,
    cssFontFamily: getCssFontFamily(fontKey),
    isBold,
    isItalic,
    cleanName,
  };
}
