export type ToolType = 
  | 'select'
  | 'edit_existing_text'
  | 'text_field'
  | 'checkbox'
  | 'radio'
  | 'text'
  | 'whiteout'
  | 'signature'
  | 'image'
  | 'highlight';

export interface BaseElement {
  id: string;
  pageIndex: number;
  x: number; // PDF points (0,0 is top-left in our normalized space)
  y: number;
  width: number;
  height: number;
  rotation?: number; // In continuous degrees (0 to 360)
}

export interface TextFieldElement extends BaseElement {
  type: 'text_field';
  fieldName: string;
  defaultValue: string;
  placeholder?: string;
  fontSize: number;
  fontColor: string;
  borderColor: string;
  backgroundColor: string;
  isMultiline: boolean;
  isRequired: boolean;
}

export interface CheckboxElement extends BaseElement {
  type: 'checkbox';
  fieldName: string;
  isChecked: boolean;
  borderColor: string;
  backgroundColor: string;
}

export interface RadioElement extends BaseElement {
  type: 'radio';
  groupName: string;
  value: string;
  isSelected: boolean;
  borderColor: string;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  isBold: boolean;
  isItalic?: boolean;
}

export interface WhiteoutElement extends BaseElement {
  type: 'whiteout';
  replacementText?: string;
  replacementFontSize?: number;
  replacementColor?: string;
}

export interface SignatureElement extends BaseElement {
  type: 'signature';
  imageDataUrl: string;
  signerName?: string;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  imageDataUrl: string;
  title?: string;
  opacity?: number; // 0 to 1
  brightness?: number; // 50 to 150 (%)
  contrast?: number; // 50 to 150 (%)
  grayscale?: boolean;
  invert?: boolean;
  sepia?: boolean;
  flipX?: boolean;
  flipY?: boolean;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  originalAspectRatio?: number;
  isOriginalPdfImage?: boolean;
  originalX?: number;
  originalY?: number;
  originalWidth?: number;
  originalHeight?: number;
  originalRotation?: number;
}

export interface HighlightElement extends BaseElement {
  type: 'highlight';
  color: string; // e.g. rgba(254, 240, 138, 0.5)
}

export type EditorElement = 
  | TextFieldElement 
  | CheckboxElement 
  | RadioElement 
  | TextElement 
  | WhiteoutElement 
  | SignatureElement 
  | ImageElement 
  | HighlightElement;

export interface PageDimension {
  pageIndex: number;
  width: number; // in PDF points (72 pt = 1 inch, A4 is 595.28 x 841.89)
  height: number;
}
