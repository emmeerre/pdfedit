import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { EditorElement } from '../types';

/**
 * Extracts and restores all editable form fields and elements from a PDF.
 * Supports:
 * 1. Previously exported PDFs with embedded editor state (100% full fidelity restore)
 * 2. External standard AcroForm interactive PDFs (text fields, checkboxes, radio buttons, choices)
 */
export async function parsePdfElements(bytes: Uint8Array): Promise<EditorElement[]> {
  // Method 1: Check if the PDF has embedded editor elements state in metadata
  try {
    const pdfDoc = await PDFDocument.load(bytes.slice());
    const subject = pdfDoc.getSubject() || '';
    if (subject.startsWith('EDITOR_ELEMENTS_DATA:')) {
      const rawJson = decodeURIComponent(subject.replace('EDITOR_ELEMENTS_DATA:', ''));
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (metaErr) {
    console.warn('Metadata state restore note:', metaErr);
  }

  // Method 2: Extract interactive AcroForm widgets via PDF.js annotations
  try {
    const pdf = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
    const extracted: EditorElement[] = [];

    for (let pIndex = 0; pIndex < pdf.numPages; pIndex++) {
      const page = await pdf.getPage(pIndex + 1);
      const viewport = page.getViewport({ scale: 1.0 });
      const annotations = await page.getAnnotations();

      for (const annot of annotations) {
        if (annot.subtype !== 'Widget') continue;

        // Bounding box in unzoomed points
        // annot.rect = [x1, y1, x2, y2] where (x1, y1) is bottom-left
        const rect = annot.rect;
        if (!rect || rect.length < 4) continue;

        const x = Math.max(0, Math.round(rect[0]));
        const y = Math.max(0, Math.round(viewport.height - rect[3]));
        const width = Math.max(14, Math.round(rect[2] - rect[0]));
        const height = Math.max(14, Math.round(rect[3] - rect[1]));

        const fieldName = annot.fieldName || `Campo_${extracted.length + 1}`;

        if (annot.fieldType === 'Tx') {
          // Interactive Text Field
          extracted.push({
            id: `tf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            pageIndex: pIndex,
            type: 'text_field',
            fieldName: fieldName,
            defaultValue: annot.fieldValue ? String(annot.fieldValue) : '',
            fontSize: 11,
            fontColor: '#0f172a',
            borderColor: '#94a3b8',
            backgroundColor: 'rgba(239, 246, 255, 0.9)',
            isMultiline: Boolean(annot.multiLine),
            isRequired: false,
            x,
            y,
            width,
            height,
            rotation: 0,
          });
        } else if (annot.fieldType === 'Btn') {
          if (annot.radioButton) {
            // Radio Button
            const groupName = annot.fieldName || 'Opzioni';
            const value = annot.buttonValue || `Valore_${extracted.length + 1}`;
            const isSelected = annot.fieldValue === annot.buttonValue;

            extracted.push({
              id: `rd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              pageIndex: pIndex,
              type: 'radio',
              groupName: groupName,
              value: value,
              isSelected: isSelected,
              borderColor: isSelected ? '#1d4ed8' : '#334155',
              x,
              y,
              width: Math.min(width, height, 22),
              height: Math.min(width, height, 22),
              rotation: 0,
            });
          } else if (annot.checkBox || (!annot.radioButton && !annot.pushButton)) {
            // Checkbox
            const isChecked = Boolean(
              annot.fieldValue &&
                annot.fieldValue !== 'Off' &&
                annot.fieldValue !== false &&
                annot.fieldValue !== 'false'
            );

            extracted.push({
              id: `cb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              pageIndex: pIndex,
              type: 'checkbox',
              fieldName: fieldName,
              isChecked: isChecked,
              borderColor: isChecked ? '#047857' : '#334155',
              backgroundColor: '#ffffff',
              x,
              y,
              width: Math.min(width, height, 22),
              height: Math.min(width, height, 22),
              rotation: 0,
            });
          }
        } else if (annot.fieldType === 'Ch') {
          // Choice / Dropdown menu as editable field
          const rawOptions = annot.options || [];
          const options = rawOptions.map((opt: any) =>
            typeof opt === 'string' ? opt : opt.displayValue || opt.exportValue || String(opt)
          );

          extracted.push({
            id: `dd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            pageIndex: pIndex,
            type: 'dropdown',
            fieldName: fieldName,
            options: options.length > 0 ? options : ['Opzione 1', 'Opzione 2'],
            defaultValue: annot.fieldValue ? String(annot.fieldValue) : options[0] || '',
            fontSize: 11,
            fontColor: '#0f172a',
            borderColor: '#94a3b8',
            backgroundColor: '#ffffff',
            isRequired: false,
            x,
            y,
            width,
            height,
            rotation: 0,
          });
        }
      }
    }

    return extracted;
  } catch (pdfjsErr) {
    console.warn('PDF.js annotation extraction note:', pdfjsErr);
    return [];
  }
}
