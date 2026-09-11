import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { EditorElement } from '../types';
import { applyImageFilters } from './imageHelper';

function parseHexColor(hex: string, defaultR = 0, defaultG = 0, defaultB = 0) {
  if (!hex || !hex.startsWith('#')) {
    return rgb(defaultR, defaultG, defaultB);
  }
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) / 255;
    const g = parseInt(clean[1] + clean[1], 16) / 255;
    const b = parseInt(clean[2] + clean[2], 16) / 255;
    return rgb(r, g, b);
  } else if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  }
  return rgb(defaultR, defaultG, defaultB);
}

function getRotatedDrawCoords(
  pdfX: number,
  pdfY: number,
  width: number,
  height: number,
  rotDegrees: number
) {
  if (!rotDegrees) return { x: pdfX, y: pdfY };
  const rad = (rotDegrees * Math.PI) / 180;
  const cx = pdfX + width / 2;
  const cy = pdfY + height / 2;
  const rx = -(width / 2) * Math.cos(rad) + (height / 2) * Math.sin(rad);
  const ry = -(width / 2) * Math.sin(rad) - (height / 2) * Math.cos(rad);
  return { x: cx + rx, y: cy + ry };
}

/**
 * Saves modified elements into a new PDF with interactive AcroForms or flattened graphics.
 */
export async function exportPdfWithElements(
  originalPdfBytes: Uint8Array,
  elements: EditorElement[],
  mode: 'interactive' | 'flatten' = 'interactive'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const pages = pdfDoc.getPages();
  const form = pdfDoc.getForm();

  // Clean up existing fields so deleted fields are truly removed,
  // and modified/moved fields are recreated with exact new positions and properties
  try {
    const existingFields = form.getFields();
    for (const f of existingFields) {
      try {
        form.removeField(f);
      } catch (rmErr) {
        console.warn('Field removal note:', rmErr);
      }
    }
  } catch (cleanErr) {
    console.warn('Form field reset note:', cleanErr);
  }

  // Pre-load standard fonts including Bold and Italics
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const helveticaBoldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const timesBoldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

  const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
  const courierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);
  const courierItalic = await pdfDoc.embedFont(StandardFonts.CourierOblique);
  const courierBoldItalic = await pdfDoc.embedFont(StandardFonts.CourierBoldOblique);

  // Group radio buttons by groupName so we create the RadioGroup once
  const radioGroupsMap = new Map<string, { groupName: string; elements: Array<any> }>();

  for (const el of elements) {
    const page = pages[el.pageIndex];
    if (!page) continue;
    const { height: pageHeight } = page.getSize();

    // In PDF coordinates, (0,0) is bottom-left
    const pdfX = el.x;
    const pdfY = pageHeight - el.y - el.height;
    const pdfWidth = el.width;
    const pdfHeight = el.height;

    const rot = degrees(el.rotation || 0);

    switch (el.type) {
      case 'whiteout': {
        const rotDeg = el.rotation || 0;
        const drawCoords = getRotatedDrawCoords(pdfX, pdfY, pdfWidth, pdfHeight, rotDeg);
        // Draw white rectangle to cover existing PDF content
        page.drawRectangle({
          x: drawCoords.x,
          y: drawCoords.y,
          width: pdfWidth,
          height: pdfHeight,
          color: rgb(1, 1, 1),
          rotate: rot,
        });
        // If there's replacement text
        if (el.replacementText) {
          const fontSize = el.replacementFontSize || 11;
          const textColor = parseHexColor(el.replacementColor || '#111827', 0, 0, 0);
          page.drawText(el.replacementText, {
            x: drawCoords.x + 2,
            y: drawCoords.y + (pdfHeight - fontSize) / 2 + 1,
            size: fontSize,
            font: helveticaFont,
            color: textColor,
            rotate: rot,
          });
        }
        break;
      }

      case 'highlight': {
        const rotDeg = el.rotation || 0;
        const drawCoords = getRotatedDrawCoords(pdfX, pdfY, pdfWidth, pdfHeight, rotDeg);
        // Semi-transparent highlight box
        page.drawRectangle({
          x: drawCoords.x,
          y: drawCoords.y,
          width: pdfWidth,
          height: pdfHeight,
          color: rgb(1, 0.95, 0.4), // warm yellow
          opacity: 0.45,
          rotate: rot,
        });
        break;
      }

      case 'text': {
        let font = helveticaFont;
        const family = (el.fontFamily || 'Helvetica').toLowerCase();
        if (family.includes('times') || family.includes('serif')) {
          if (el.isBold && el.isItalic) font = timesBoldItalic;
          else if (el.isBold) font = timesBold;
          else if (el.isItalic) font = timesItalic;
          else font = timesFont;
        } else if (family.includes('courier') || family.includes('mono')) {
          if (el.isBold && el.isItalic) font = courierBoldItalic;
          else if (el.isBold) font = courierBold;
          else if (el.isItalic) font = courierItalic;
          else font = courierFont;
        } else {
          if (el.isBold && el.isItalic) font = helveticaBoldItalic;
          else if (el.isBold) font = helveticaBold;
          else if (el.isItalic) font = helveticaItalic;
          else font = helveticaFont;
        }

        // Draw optional background (e.g. white background covering original PDF text)
        if (el.backgroundColor && el.backgroundColor !== 'transparent') {
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
            color: parseHexColor(el.backgroundColor, 1, 1, 1),
            rotate: rot,
          });
        }

        const textColor = parseHexColor(el.color, 0.1, 0.1, 0.1);
        const fontSize = el.fontSize || 12;

        page.drawText(el.text, {
          x: pdfX + 2,
          y: pdfY + (pdfHeight - fontSize) / 2,
          size: fontSize,
          font: font,
          color: textColor,
          rotate: rot,
        });
        break;
      }

      case 'text_field': {
        if (mode === 'interactive') {
          try {
            // Generate unique field name if duplicates exist
            const fieldName = el.fieldName || `TextField_${el.id}`;
            let textField;
            try {
              textField = form.getTextField(fieldName);
            } catch {
              textField = form.createTextField(fieldName);
            }
            if (textField) {
              if (el.defaultValue) {
                textField.setText(el.defaultValue);
              }
              if (el.isMultiline) {
                textField.enableMultiline();
              }
              textField.addToPage(page, {
                x: pdfX,
                y: pdfY,
                width: pdfWidth,
                height: pdfHeight,
                borderColor: parseHexColor(el.borderColor || '#94a3b8', 0.6, 0.6, 0.7),
                borderWidth: 1,
                rotate: rot,
              });
            }
          } catch (err) {
            console.warn('Fallback drawing text field as box:', err);
            // Fallback drawing if AcroForm name conflict
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: pdfWidth,
              height: pdfHeight,
              borderColor: parseHexColor(el.borderColor || '#94a3b8', 0.6, 0.6, 0.7),
              borderWidth: 1,
              color: rgb(0.98, 0.98, 0.99),
              rotate: rot,
            });
            if (el.defaultValue) {
              page.drawText(el.defaultValue, {
                x: pdfX + 5,
                y: pdfY + (pdfHeight - el.fontSize) / 2,
                size: el.fontSize || 11,
                font: helveticaFont,
                color: parseHexColor(el.fontColor || '#0f172a', 0.1, 0.1, 0.1),
                rotate: rot,
              });
            }
          }
        } else {
          // Flattened mode: draw visible box and value
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
            borderColor: parseHexColor(el.borderColor || '#94a3b8', 0.6, 0.6, 0.7),
            borderWidth: 1,
            color: rgb(0.98, 0.98, 0.99),
            rotate: rot,
          });
          if (el.defaultValue) {
            page.drawText(el.defaultValue, {
              x: pdfX + 5,
              y: pdfY + (pdfHeight - el.fontSize) / 2,
              size: el.fontSize || 11,
              font: helveticaFont,
              color: parseHexColor(el.fontColor || '#0f172a', 0.1, 0.1, 0.1),
              rotate: rot,
            });
          }
        }
        break;
      }

      case 'checkbox': {
        if (mode === 'interactive') {
          try {
            const fieldName = el.fieldName || `CheckBox_${el.id}`;
            let checkBox;
            try {
              checkBox = form.getCheckBox(fieldName);
            } catch {
              checkBox = form.createCheckBox(fieldName);
            }
            if (checkBox) {
              checkBox.addToPage(page, {
                x: pdfX,
                y: pdfY,
                width: pdfWidth,
                height: pdfHeight,
                borderColor: parseHexColor(el.borderColor || '#475569', 0.3, 0.3, 0.4),
                borderWidth: 1.2,
                rotate: rot,
              });
              if (el.isChecked) {
                checkBox.check();
              }
            }
          } catch (err) {
            console.warn('Fallback checkbox render:', err);
          }
        } else {
          // Flattened mode: draw square and checkmark if checked
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
            borderColor: rgb(0.3, 0.3, 0.4),
            borderWidth: 1.2,
            color: rgb(1, 1, 1),
            rotate: rot,
          });
          if (el.isChecked) {
            // Draw checkmark lines
            page.drawLine({
              start: { x: pdfX + pdfWidth * 0.2, y: pdfY + pdfHeight * 0.5 },
              end: { x: pdfX + pdfWidth * 0.45, y: pdfY + pdfHeight * 0.2 },
              thickness: 2,
              color: rgb(0.1, 0.5, 0.2),
            });
            page.drawLine({
              start: { x: pdfX + pdfWidth * 0.45, y: pdfY + pdfHeight * 0.2 },
              end: { x: pdfX + pdfWidth * 0.85, y: pdfY + pdfHeight * 0.8 },
              thickness: 2,
              color: rgb(0.1, 0.5, 0.2),
            });
          }
        }
        break;
      }

      case 'radio': {
        const group = el.groupName || 'RadioGroup_1';
        if (!radioGroupsMap.has(group)) {
          radioGroupsMap.set(group, { groupName: group, elements: [] });
        }
        radioGroupsMap.get(group)!.elements.push({
          ...el,
          pdfX,
          pdfY,
          pdfWidth,
          pdfHeight,
          page,
          rot,
        });
        break;
      }

      case 'dropdown': {
        const options = (el.options && el.options.length > 0) ? el.options : ['Opzione 1', 'Opzione 2'];
        const selectedVal = el.defaultValue || options[0] || '';

        if (mode === 'interactive') {
          try {
            const fieldName = el.fieldName || `Dropdown_${el.id}`;
            let dropdown;
            try {
              dropdown = form.getDropdown(fieldName);
            } catch {
              dropdown = form.createDropdown(fieldName);
            }
            if (dropdown) {
              dropdown.addOptions(options);
              if (selectedVal && options.includes(selectedVal)) {
                dropdown.select(selectedVal);
              }
              dropdown.addToPage(page, {
                x: pdfX,
                y: pdfY,
                width: pdfWidth,
                height: pdfHeight,
                textColor: parseHexColor(el.fontColor || '#0f172a', 0.1, 0.1, 0.1),
                backgroundColor: parseHexColor(el.backgroundColor || '#ffffff', 1, 1, 1),
                borderColor: parseHexColor(el.borderColor || '#3b82f6', 0.2, 0.5, 0.9),
                borderWidth: 1,
                rotate: rot,
              });
            }
          } catch (err) {
            console.warn('Fallback dropdown render:', err);
          }
        } else {
          // Flattened mode: draw rectangular field with text and arrow
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
            borderColor: parseHexColor(el.borderColor || '#cbd5e1', 0.8, 0.8, 0.85),
            borderWidth: 1,
            color: parseHexColor(el.backgroundColor || '#ffffff', 1, 1, 1),
            rotate: rot,
          });
          if (selectedVal) {
            page.drawText(selectedVal, {
              x: pdfX + 6,
              y: pdfY + (pdfHeight - (el.fontSize || 10)) / 2 + 1,
              size: el.fontSize || 10,
              font: helveticaFont,
              color: parseHexColor(el.fontColor || '#0f172a', 0.1, 0.1, 0.1),
              rotate: rot,
            });
          }
          // Small chevron down icon
          const arrowX = pdfX + pdfWidth - 12;
          const arrowY = pdfY + pdfHeight / 2;
          page.drawLine({
            start: { x: arrowX - 4, y: arrowY + 2 },
            end: { x: arrowX, y: arrowY - 2 },
            thickness: 1.2,
            color: rgb(0.4, 0.4, 0.4),
          });
          page.drawLine({
            start: { x: arrowX, y: arrowY - 2 },
            end: { x: arrowX + 4, y: arrowY + 2 },
            thickness: 1.2,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
        break;
      }

      case 'signature':
      case 'image': {
        try {
          // If this is an existing PDF image that was moved, resized, or filtered,
          // erase its original footprint on the PDF background first
          if (el.type === 'image' && el.isOriginalPdfImage) {
            const origX = el.originalX ?? el.x;
            const origY = el.originalY ?? el.y;
            const origW = el.originalWidth ?? el.width;
            const origH = el.originalHeight ?? el.height;
            const origRot = degrees(el.originalRotation || 0);
            const origPdfY = pageHeight - origY - origH;
            const origDrawCoords = getRotatedDrawCoords(origX, origPdfY, origW, origH, el.originalRotation || 0);

            const isMovedOrModified =
              Math.abs(el.x - origX) > 1 ||
              Math.abs(el.y - origY) > 1 ||
              Math.abs(el.width - origW) > 1 ||
              Math.abs(el.height - origH) > 1 ||
              Math.abs((el.rotation || 0) - (el.originalRotation || 0)) > 1 ||
              el.opacity !== undefined ||
              el.brightness !== undefined ||
              el.contrast !== undefined ||
              el.grayscale ||
              el.invert ||
              el.sepia ||
              el.flipX ||
              el.flipY;

            if (isMovedOrModified) {
              // Erase original image on the background
              page.drawRectangle({
                x: origDrawCoords.x,
                y: origDrawCoords.y,
                width: origW,
                height: origH,
                color: rgb(1, 1, 1),
                rotate: origRot,
              });
            }
          }

          let dataUrl = el.imageDataUrl;
          if (el.type === 'image') {
            try {
              dataUrl = await applyImageFilters(el);
            } catch (filterErr) {
              console.warn('Fallback using raw image dataUrl:', filterErr);
            }
          }
          if (dataUrl) {
            let embeddedImage;
            if (dataUrl.startsWith('data:image/png')) {
              embeddedImage = await pdfDoc.embedPng(dataUrl);
            } else if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
              embeddedImage = await pdfDoc.embedJpg(dataUrl);
            } else {
              embeddedImage = await pdfDoc.embedPng(dataUrl);
            }
            if (embeddedImage) {
              const opacity = el.type === 'image' && el.opacity !== undefined ? el.opacity : 1;
              const rotDeg = el.rotation || 0;
              const drawCoords = getRotatedDrawCoords(pdfX, pdfY, pdfWidth, pdfHeight, rotDeg);
              page.drawImage(embeddedImage, {
                x: drawCoords.x,
                y: drawCoords.y,
                width: pdfWidth,
                height: pdfHeight,
                rotate: rot,
                opacity,
              });
            }
          }
        } catch (err) {
          console.error('Error embedding signature/image:', err);
        }
        break;
      }

      case 'shape': {
        const rotDeg = el.rotation || 0;
        const drawCoords = getRotatedDrawCoords(pdfX, pdfY, pdfWidth, pdfHeight, rotDeg);

        // If it was an original decoration from the PDF, erase the original location
        if (el.isOriginalPdfDecoration) {
          const origX = el.originalX ?? el.x;
          const origY = el.originalY ?? el.y;
          const origW = el.originalWidth ?? el.width;
          const origH = el.originalHeight ?? el.height;
          const origPdfY = pageHeight - origY - origH;
          const origRotDeg = el.originalRotation || 0;
          const origDrawCoords = getRotatedDrawCoords(origX, origPdfY, origW, origH, origRotDeg);

          page.drawRectangle({
            x: origDrawCoords.x,
            y: origDrawCoords.y,
            width: origW,
            height: origH,
            color: rgb(1, 1, 1),
            rotate: degrees(origRotDeg),
          });
        }

        const strokeCol = parseHexColor(el.strokeColor || '#334155', 0.2, 0.25, 0.35);
        const strokeW = el.strokeWidth !== undefined ? el.strokeWidth : 1;
        const hasFill = el.fillColor && el.fillColor !== 'transparent';
        const fillCol = hasFill ? parseHexColor(el.fillColor, 1, 1, 1) : undefined;

        if (el.shapeType === 'line') {
          const isHorizontal = pdfHeight <= pdfWidth;
          if (isHorizontal) {
            page.drawLine({
              start: { x: drawCoords.x, y: drawCoords.y + pdfHeight / 2 },
              end: { x: drawCoords.x + pdfWidth, y: drawCoords.y + pdfHeight / 2 },
              thickness: strokeW || 1,
              color: strokeCol,
            });
          } else {
            page.drawLine({
              start: { x: drawCoords.x + pdfWidth / 2, y: drawCoords.y },
              end: { x: drawCoords.x + pdfWidth / 2, y: drawCoords.y + pdfHeight },
              thickness: strokeW || 1,
              color: strokeCol,
            });
          }
        } else if (el.shapeType === 'circle') {
          const rx = pdfWidth / 2;
          const ry = pdfHeight / 2;
          page.drawEllipse({
            x: drawCoords.x + rx,
            y: drawCoords.y + ry,
            xScale: rx,
            yScale: ry,
            borderColor: strokeW > 0 ? strokeCol : undefined,
            borderWidth: strokeW,
            color: fillCol,
            rotate: rot,
          });
        } else {
          // Rectangle / Box
          page.drawRectangle({
            x: drawCoords.x,
            y: drawCoords.y,
            width: pdfWidth,
            height: pdfHeight,
            borderColor: strokeW > 0 ? strokeCol : undefined,
            borderWidth: strokeW,
            color: fillCol,
            rotate: rot,
          });
        }
        break;
      }
    }
  }

  // Process Radio Groups
  for (const [groupName, groupData] of radioGroupsMap.entries()) {
    if (mode === 'interactive') {
      try {
        let radioGroup;
        try {
          radioGroup = form.getRadioGroup(groupName);
        } catch {
          radioGroup = form.createRadioGroup(groupName);
        }
        for (const item of groupData.elements) {
          const optionValue = item.value || `opt_${item.id}`;
          radioGroup.addOptionToPage(optionValue, item.page, {
            x: item.pdfX,
            y: item.pdfY,
            width: item.pdfWidth,
            height: item.pdfHeight,
            borderColor: parseHexColor(item.borderColor || '#475569', 0.3, 0.3, 0.4),
            borderWidth: 1.2,
            rotate: item.rot,
          });
          if (item.isSelected) {
            radioGroup.select(optionValue);
          }
        }
      } catch (err) {
        console.warn('Fallback radio group rendering:', err);
      }
    } else {
      // Flattened radio buttons
      for (const item of groupData.elements) {
        const radius = Math.min(item.pdfWidth, item.pdfHeight) / 2;
        const cx = item.pdfX + radius;
        const cy = item.pdfY + radius;
        item.page.drawCircle({
          x: cx,
          y: cy,
          size: radius,
          borderColor: rgb(0.3, 0.3, 0.4),
          borderWidth: 1.2,
          color: rgb(1, 1, 1),
        });
        if (item.isSelected) {
          item.page.drawCircle({
            x: cx,
            y: cy,
            size: radius * 0.5,
            color: rgb(0.15, 0.35, 0.75),
          });
        }
      }
    }
  }

  // If user chose flattened mode, flatten form fields
  if (mode === 'flatten') {
    try {
      form.flatten();
    } catch {
      // ignore
    }
  }

  // Embed full editor elements state into PDF Subject so it can be 100% restored on reopen
  try {
    const stateJson = JSON.stringify(elements);
    pdfDoc.setSubject(`EDITOR_ELEMENTS_DATA:${encodeURIComponent(stateJson)}`);
  } catch (subjErr) {
    console.warn('Embed editor elements metadata note:', subjErr);
  }

  return await pdfDoc.save();
}
