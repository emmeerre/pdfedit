import React, { useRef, useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { EditorElement, ToolType, ImageElement } from '../types';
import { RotateCw, Edit3, Trash2, FlipHorizontal, Upload, ChevronDown, Square } from 'lucide-react';
import { detectPdfFont, getCssFontFamily } from '../utils/fontHelper';
import { extractImagesFromPdfPage } from '../utils/pdfImageExtractor';
import { extractDecorationsFromPdfPage, ExtractedDecorationItem } from '../utils/pdfDecorationExtractor';

import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure worker with Vite-resolved URL, with fallback to local public worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker || './pdf.worker.mjs';
}

interface PageViewerProps {
  pdfBytes: Uint8Array | null;
  currentPage: number;
  zoom: number;
  elements: EditorElement[];
  selectedId: string | null;
  currentTool: ToolType;
  onSelectElement: (id: string | null) => void;
  onAddElement: (el: EditorElement) => void;
  onUpdateElement: (updated: EditorElement) => void;
  onDeleteElement?: (id: string) => void;
  onToolUsed: () => void;
  onSyncPageImages?: (images: EditorElement[]) => void;
}

interface ExtractedTextItem {
  str: string;
  x: number;
  y: number;
  baselineY: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic?: boolean;
}

export const PageViewer: React.FC<PageViewerProps> = ({
  pdfBytes,
  currentPage,
  zoom,
  elements,
  selectedId,
  currentTool,
  onSelectElement,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onToolUsed,
  onSyncPageImages,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentRenderTaskRef = useRef<any>(null);
  const replaceImageInputRef = useRef<HTMLInputElement | null>(null);

  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({
    width: 595.28,
    height: 841.89,
  });
  const [extractedTexts, setExtractedTexts] = useState<ExtractedTextItem[]>([]);
  const [extractedDecorations, setExtractedDecorations] = useState<ExtractedDecorationItem[]>([]);
  const [editingInlineId, setEditingInlineId] = useState<string | null>(null);

  // Dragging, Resizing & Continuous Rotating state
  const [dragState, setDragState] = useState<{
    elementId: string;
    action: 'move' | 'resize' | 'rotate';
    startMouseX: number;
    startMouseY: number;
    startElX: number;
    startElY: number;
    startElW: number;
    startElH: number;
    startRotation?: number;
    centerX?: number;
    centerY?: number;
  } | null>(null);

  // Render PDF Page to canvas
  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Cancel any ongoing render task before starting a new one
      if (currentRenderTaskRef.current) {
        try {
          currentRenderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        currentRenderTaskRef.current = null;
      }

      if (!pdfBytes) {
        const w = 595.28 * zoom;
        const h = 841.89 * zoom;
        canvas.width = w;
        canvas.height = h;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        setPageSize({ width: 595.28, height: 841.89 });
        setExtractedTexts([]);
        setExtractedDecorations([]);
        return;
      }

      try {
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker || './pdf.worker.mjs';
        }
        // Use a slice clone of the buffer so the original ArrayBuffer is never detached by PDF.js
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
        const pdf = await loadingTask.promise;
        if (isCancelled) return;

        const page = await pdf.getPage(currentPage);
        if (isCancelled) return;

        const baseViewport = page.getViewport({ scale: 1.0 });
        setPageSize({ width: baseViewport.width, height: baseViewport.height });

        // Extract text items from PDF page for the "Edita Testo Presente" tool
        try {
          const textContent = await page.getTextContent();
          const rawItems: any[] = [];

          for (const rawItem of textContent.items as any[]) {
            const str = rawItem.str ? rawItem.str.trim() : '';
            if (!str) continue;

            // rawItem.transform = [scaleX, skewY, skewX, scaleY, tx, ty]
            const tx = rawItem.transform[4];
            const ty = rawItem.transform[5];
            const fontPt =
              Math.sqrt(
                rawItem.transform[0] * rawItem.transform[0] +
                  rawItem.transform[1] * rawItem.transform[1]
              ) || rawItem.height || 12;

            // Baseline in top-down coordinates
            const baselineY = baseViewport.height - ty;
            const topY = baselineY - fontPt * 0.85;
            const itemH = fontPt * 1.15;
            const itemW = rawItem.width || (str.length * fontPt * 0.55);

            const styleObj = (textContent.styles as any)?.[rawItem.fontName] || {};
            const fontInfo = detectPdfFont(rawItem.fontName || '', styleObj, (page as any).commonObjs);

            rawItems.push({
              str: rawItem.str,
              x: tx,
              baselineY,
              topY,
              width: itemW,
              height: itemH,
              fontSize: Math.round(fontPt * 10) / 10,
              fontFamily: fontInfo.fontKey,
              isBold: fontInfo.isBold,
              isItalic: fontInfo.isItalic,
            });
          }

          // Sort items: top-to-bottom, then left-to-right
          rawItems.sort((a, b) =>
            Math.abs(a.baselineY - b.baselineY) > 2.5
              ? a.baselineY - b.baselineY
              : a.x - b.x
          );

          // Merge adjacent items on the same baseline into complete continuous lines
          const mergedLines: ExtractedTextItem[] = [];
          for (const it of rawItems) {
            const prev = mergedLines[mergedLines.length - 1];
            if (
              prev &&
              Math.abs(prev.baselineY - it.baselineY) <= Math.min(prev.fontSize, it.fontSize) * 0.45 &&
              (it.x - (prev.x + prev.width)) <= Math.max(prev.fontSize, it.fontSize) * 3.5 &&
              it.x >= prev.x - 2
            ) {
              // Merge with current line
              const spaceNeeded = it.x - (prev.x + prev.width) > 1 ? ' ' : '';
              prev.str = prev.str + spaceNeeded + it.str;
              const rightEdge = Math.max(prev.x + prev.width, it.x + it.width);
              prev.width = rightEdge - prev.x;
              prev.y = Math.min(prev.y, it.topY);
              prev.fontSize = Math.max(prev.fontSize, it.fontSize);
              prev.height = Math.max(prev.height, it.height);
              if (it.isBold) prev.isBold = true;
              if (it.isItalic) prev.isItalic = true;
            } else {
              mergedLines.push({
                str: it.str,
                x: it.x,
                y: it.topY,
                baselineY: it.baselineY,
                width: it.width,
                height: it.height,
                fontSize: it.fontSize,
                fontFamily: it.fontFamily,
                isBold: it.isBold,
                isItalic: it.isItalic,
              });
            }
          }

          if (!isCancelled) {
            setExtractedTexts(mergedLines);
          }
        } catch (textErr) {
          console.warn('Text content extraction note:', textErr);
        }

        // High DPI rendering for crisp, sharp text
        const pixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: zoom * pixelRatio });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${baseViewport.width * zoom}px`;
        canvas.style.height = `${baseViewport.height * zoom}px`;

        const renderContext = {
          canvasContext: ctx,
          canvas: canvas,
          viewport: viewport,
          annotationMode: 0, // Disable rendering AcroForm annotations into background canvas
        };

        const renderTask = page.render(renderContext);
        currentRenderTaskRef.current = renderTask;
        await renderTask.promise;
        currentRenderTaskRef.current = null;

        // Automatically extract embedded images from the PDF page so they become fully editable
        try {
          const pageImages = await extractImagesFromPdfPage(page, currentPage - 1);
          if (pageImages.length > 0 && onSyncPageImages && !isCancelled) {
            onSyncPageImages(pageImages);
          }
        } catch (imgScanErr) {
          console.warn('PDF image extraction scan note:', imgScanErr);
        }

        // Automatically extract vector decorations (lines, boxes, rules) for "Edita Linee e Riquadri"
        try {
          const pageDecs = await extractDecorationsFromPdfPage(page, baseViewport.width, baseViewport.height);
          if (!isCancelled) {
            setExtractedDecorations(pageDecs);
          }
        } catch (decErr) {
          console.warn('PDF decorations scan note:', decErr);
        }
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException') {
          return;
        }
        if (!isCancelled) {
          console.warn('PDF render fallback:', err);
          const w = 595.28 * zoom;
          const h = 841.89 * zoom;
          canvas.width = w;
          canvas.height = h;
          canvas.style.width = `${w}px`;
          canvas.style.height = `${h}px`;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (currentRenderTaskRef.current) {
        try {
          currentRenderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        currentRenderTaskRef.current = null;
      }
    };
  }, [pdfBytes, currentPage, zoom]);

  // Handle clicking an existing text item on the PDF to edit it
  const handleEditOriginalTextItem = (item: ExtractedTextItem) => {
    const pageIdx = currentPage - 1;
    const txtId = `txt_${Date.now()}`;

    // Add a single editable text element with an opaque white background
    // This cleanly covers the original text without changing font or jumping
    const newTextEl: EditorElement = {
      id: txtId,
      pageIndex: pageIdx,
      type: 'text',
      text: item.str,
      fontSize: item.fontSize,
      color: '#0f172a',
      fontFamily: item.fontFamily || 'Helvetica',
      isBold: Boolean(item.isBold),
      isItalic: Boolean(item.isItalic),
      backgroundColor: '#ffffff', // Opaque white background acts as seamless whiteout!
      x: Math.max(0, Math.round(item.x - 2)),
      y: Math.max(0, Math.round(item.y - 1)),
      width: Math.ceil(item.width + 10),
      height: Math.max(Math.ceil(item.height + 2), 16),
      rotation: 0,
    };
    onAddElement(newTextEl);
    onSelectElement(txtId);
    setEditingInlineId(txtId);
    onToolUsed();
  };

  // Handle clicking an existing decoration (line, rectangle, card) to edit it
  const handleEditOriginalDecoration = (item: ExtractedDecorationItem) => {
    const pageIdx = currentPage - 1;
    const shapeId = `shape_${Date.now()}`;

    // For thin lines, give an easily clickable/draggable interactive height (e.g. 8px)
    const isHLine = item.type === 'line' && item.width >= item.height;
    const isVLine = item.type === 'line' && item.height > item.width;
    const initialH = isHLine ? Math.max(item.height, 8) : item.height;
    const initialW = isVLine ? Math.max(item.width, 8) : item.width;
    const initialY = isHLine ? item.y - (initialH - item.height) / 2 : item.y;
    const initialX = isVLine ? item.x - (initialW - item.width) / 2 : item.x;

    const newShapeEl: EditorElement = {
      id: shapeId,
      pageIndex: pageIdx,
      type: 'shape',
      shapeType: item.type,
      x: Math.round(initialX),
      y: Math.round(initialY),
      width: Math.round(initialW),
      height: Math.round(initialH),
      strokeColor: item.strokeColor || '#334155',
      strokeWidth: item.strokeWidth || 1,
      strokeDash: 'solid',
      fillColor: item.type === 'line' ? 'transparent' : (item.fillColor || 'transparent'),
      borderRadius: item.type === 'circle' ? 9999 : 0,
      isOriginalPdfDecoration: true,
      originalX: item.x,
      originalY: item.y,
      originalWidth: item.width,
      originalHeight: item.height,
      originalRotation: 0,
      rotation: 0,
    };
    onAddElement(newShapeEl);
    onSelectElement(shapeId);
    onToolUsed();
  };

  // Handle replacing image file directly from canvas
  const handleReplaceImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedId) {
      const el = elements.find((x) => x.id === selectedId);
      if (el && el.type === 'image') {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          if (dataUrl) {
            onUpdateElement({
              ...el,
              imageDataUrl: dataUrl,
              title: file.name,
            });
          }
        };
        reader.readAsDataURL(file);
      }
      e.target.value = '';
    }
  };

  // Click on canvas container to place new elements
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicked on an element box, do not trigger canvas placement
    if ((e.target as HTMLElement).closest('.editor-element-box')) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickX = Math.round((e.clientX - rect.left) / zoom);
    const clickY = Math.round((e.clientY - rect.top) / zoom);

    if (currentTool === 'select' || currentTool === 'edit_existing_text') {
      onSelectElement(null);
      setEditingInlineId(null);
      return;
    }

    const newId = `el_${Date.now()}`;
    const pageIdx = currentPage - 1;

    switch (currentTool) {
      case 'text_field': {
        const tf: EditorElement = {
          id: newId,
          pageIndex: pageIdx,
          type: 'text_field',
          fieldName: `Campo_${elements.length + 1}`,
          defaultValue: '',
          fontSize: 11,
          fontColor: '#0f172a',
          borderColor: '#3b82f6',
          backgroundColor: '#ffffff',
          isMultiline: false,
          isRequired: false,
          x: clickX,
          y: clickY,
          width: 140,
          height: 22,
          rotation: 0,
        };
        onAddElement(tf);
        onSelectElement(tf.id);
        onToolUsed();
        break;
      }

      case 'checkbox': {
        const cb: EditorElement = {
          id: newId,
          pageIndex: pageIdx,
          type: 'checkbox',
          fieldName: `Check_${elements.length + 1}`,
          isChecked: false,
          borderColor: '#334155',
          backgroundColor: '#ffffff',
          x: clickX,
          y: clickY,
          width: 16,
          height: 16,
          rotation: 0,
        };
        onAddElement(cb);
        onSelectElement(cb.id);
        onToolUsed();
        break;
      }

      case 'radio': {
        const rd: EditorElement = {
          id: newId,
          pageIndex: pageIdx,
          type: 'radio',
          groupName: 'GruppoOpzioni_1',
          value: `Opzione_${elements.length + 1}`,
          isSelected: false,
          borderColor: '#334155',
          x: clickX,
          y: clickY,
          width: 16,
          height: 16,
          rotation: 0,
        };
        onAddElement(rd);
        onSelectElement(rd.id);
        onToolUsed();
        break;
      }

      case 'dropdown': {
        const dd: EditorElement = {
          id: newId,
          pageIndex: pageIdx,
          type: 'dropdown',
          fieldName: `Menu_${elements.length + 1}`,
          options: ['Opzione 1', 'Opzione 2', 'Opzione 3'],
          defaultValue: 'Opzione 1',
          fontSize: 10,
          fontColor: '#0f172a',
          borderColor: '#3b82f6',
          backgroundColor: '#ffffff',
          isRequired: false,
          x: clickX,
          y: clickY,
          width: 150,
          height: 22,
          rotation: 0,
        };
        onAddElement(dd);
        onSelectElement(dd.id);
        onToolUsed();
        break;
      }

      case 'text': {
        const tx: EditorElement = {
          id: newId,
          pageIndex: pageIdx,
          type: 'text',
          text: 'Nuovo Testo',
          fontSize: 12,
          color: '#0f172a',
          fontFamily: 'Helvetica',
          isBold: false,
          backgroundColor: 'transparent',
          x: clickX,
          y: clickY,
          width: 120,
          height: 24,
          rotation: 0,
        };
        onAddElement(tx);
        onSelectElement(tx.id);
        setEditingInlineId(tx.id);
        onToolUsed();
        break;
      }

      case 'whiteout': {
        const wo: EditorElement = {
          id: newId,
          pageIndex: pageIdx,
          type: 'whiteout',
          replacementText: '',
          replacementFontSize: 11,
          replacementColor: '#0f172a',
          x: clickX,
          y: clickY,
          width: 120,
          height: 22,
          rotation: 0,
        };
        onAddElement(wo);
        onSelectElement(wo.id);
        onToolUsed();
        break;
      }

      case 'highlight': {
        const hl: EditorElement = {
          id: newId,
          pageIndex: pageIdx,
          type: 'highlight',
          color: 'rgba(254, 240, 138, 0.5)',
          x: clickX,
          y: clickY,
          width: 140,
          height: 18,
          rotation: 0,
        };
        onAddElement(hl);
        onSelectElement(hl.id);
        onToolUsed();
        break;
      }

      case 'shape': {
        const sh: EditorElement = {
          id: newId,
          pageIndex: pageIdx,
          type: 'shape',
          shapeType: 'rectangle',
          strokeColor: '#2563eb',
          strokeWidth: 2,
          strokeDash: 'solid',
          fillColor: '#eff6ff',
          borderRadius: 4,
          x: clickX,
          y: clickY,
          width: 160,
          height: 80,
          rotation: 0,
        };
        onAddElement(sh);
        onSelectElement(sh.id);
        onToolUsed();
        break;
      }
    }
  };

  // Drag mouse movement
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragState.startMouseX) / zoom;
      const dy = (e.clientY - dragState.startMouseY) / zoom;

      const target = elements.find((el) => el.id === dragState.elementId);
      if (!target) return;

      if (dragState.action === 'move') {
        const newX = Math.max(0, Math.min(pageSize.width - target.width, dragState.startElX + dx));
        const newY = Math.max(0, Math.min(pageSize.height - target.height, dragState.startElY + dy));
        onUpdateElement({
          ...target,
          x: Math.round(newX),
          y: Math.round(newY),
        });
      } else if (dragState.action === 'resize') {
        const isShapeLine = target.type === 'shape' && (target as any).shapeType === 'line';
        const minW = isShapeLine && target.width >= target.height ? 10 : (target.type === 'checkbox' || target.type === 'radio' ? 12 : 16);
        const minH = isShapeLine && target.height <= target.width ? 2 : (target.type === 'checkbox' || target.type === 'radio' ? 12 : 16);
        const newW = Math.max(minW, dragState.startElW + dx);
        const newH = Math.max(minH, dragState.startElH + dy);
        onUpdateElement({
          ...target,
          width: Math.round(newW),
          height: Math.round(newH),
        });
      } else if (dragState.action === 'rotate') {
        const cx = dragState.centerX ?? 0;
        const cy = dragState.centerY ?? 0;
        const radians = Math.atan2(e.clientY - cy, e.clientX - cx);
        // Angle in continuous degrees from top-center
        let deg = Math.round(radians * (180 / Math.PI)) + 90;
        if (deg < 0) deg += 360;
        deg = deg % 360;

        // Holding Shift snaps to 15-degree steps
        if (e.shiftKey) {
          deg = Math.round(deg / 15) * 15;
          if (deg === 360) deg = 0;
        }

        onUpdateElement({
          ...target,
          rotation: deg,
        });
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, zoom, elements, pageSize, onUpdateElement]);

  const startDrag = (
    e: React.MouseEvent,
    el: EditorElement,
    action: 'move' | 'resize' = 'move'
  ) => {
    e.stopPropagation();
    onSelectElement(el.id);
    setDragState({
      elementId: el.id,
      action,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startElX: el.x,
      startElY: el.y,
      startElW: el.width,
      startElH: el.height,
    });
  };

  const startRotate = (e: React.MouseEvent, el: EditorElement) => {
    e.stopPropagation();
    onSelectElement(el.id);
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + (el.x + el.width / 2) * zoom;
    const centerY = rect.top + (el.y + el.height / 2) * zoom;

    setDragState({
      elementId: el.id,
      action: 'rotate',
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startElX: el.x,
      startElY: el.y,
      startElW: el.width,
      startElH: el.height,
      startRotation: el.rotation || 0,
      centerX,
      centerY,
    });
  };

  const pageElements = elements.filter((el) => el.pageIndex === currentPage - 1);

  return (
    <div
      id="pdf-viewer-scroll-container"
      className="flex-1 overflow-auto bg-slate-200/90 p-8 flex justify-center items-start min-h-0"
    >
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        style={{
          width: `${pageSize.width * zoom}px`,
          height: `${pageSize.height * zoom}px`,
        }}
        className="relative bg-white shadow-2xl rounded-xs select-none"
      >
        {/* Rendered PDF Canvas */}
        <canvas
          ref={canvasRef}
          className="block w-full h-full pointer-events-none rounded-xs"
        />

        {/* Existing PDF Text Detection Layer (Active when 'edit_existing_text' tool is selected) */}
        {currentTool === 'edit_existing_text' && (
          <div className="absolute inset-0 z-30 pointer-events-auto bg-blue-900/5">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2 pointer-events-none animate-pulse">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Clicca su qualsiasi testo del PDF per modificarlo direttamente</span>
            </div>
            {extractedTexts.map((item, idx) => (
              <div
                key={`txt_${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditOriginalTextItem(item);
                }}
                title={`Modifica: "${item.str}"`}
                style={{
                  left: `${item.x * zoom}px`,
                  top: `${item.y * zoom}px`,
                  width: `${Math.max(item.width * zoom, 24)}px`,
                  height: `${Math.max(item.height * zoom, 14)}px`,
                }}
                className="absolute cursor-pointer border border-blue-400/40 hover:border-blue-600 hover:bg-blue-400/25 rounded-xs transition-colors"
              />
            ))}
          </div>
        )}

        {/* Existing PDF Decorations Detection Layer (Active when 'edit_existing_decorations' tool is selected) */}
        {currentTool === 'edit_existing_decorations' && (
          <div className="absolute inset-0 z-30 pointer-events-auto bg-purple-950/5">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2 pointer-events-none animate-pulse">
              <Square className="w-3.5 h-3.5" />
              <span>Clicca su qualsiasi linea, riquadro o forma del PDF per modificarla</span>
            </div>
            {extractedDecorations.map((item) => {
              const isHLine = item.type === 'line' && item.width >= item.height;
              const isVLine = item.type === 'line' && item.height > item.width;
              // Provide an accessible, comfortable hit area of at least 18px for lines so clicks never miss!
              const hitHeight = isHLine ? Math.max(item.height * zoom, 18) : Math.max(item.height * zoom, 12);
              const hitWidth = isVLine ? Math.max(item.width * zoom, 18) : Math.max(item.width * zoom, 12);
              const renderTop = isHLine ? (item.y * zoom) - (hitHeight - item.height * zoom) / 2 : item.y * zoom;
              const renderLeft = isVLine ? (item.x * zoom) - (hitWidth - item.width * zoom) / 2 : item.x * zoom;

              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditOriginalDecoration(item);
                  }}
                  title={`Modifica ${item.title}: ${item.width}x${item.height}pt`}
                  style={{
                    left: `${renderLeft}px`,
                    top: `${renderTop}px`,
                    width: `${hitWidth}px`,
                    height: `${hitHeight}px`,
                  }}
                  className="absolute cursor-pointer flex items-center justify-center border-2 border-purple-500/80 bg-purple-500/15 hover:border-purple-600 hover:bg-purple-500/35 rounded-xs transition-all group z-30"
                >
                  {isHLine && (
                    <div
                      style={{ height: `${Math.max(2, item.height * zoom)}px` }}
                      className="w-full bg-purple-600 shadow-[0_0_6px_rgba(147,51,234,0.8)]"
                    />
                  )}
                  {isVLine && (
                    <div
                      style={{ width: `${Math.max(2, item.width * zoom)}px` }}
                      className="h-full bg-purple-600 shadow-[0_0_6px_rgba(147,51,234,0.8)]"
                    />
                  )}
                  <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-purple-700 text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-lg whitespace-nowrap pointer-events-none z-40">
                    {item.title} (clicca per modificare)
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Whiteout patches covering original background footprint of moved/modified PDF images and decorations */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {pageElements.map((el) => {
            if ((el.type === 'image' && el.isOriginalPdfImage) || (el.type === 'shape' && el.isOriginalPdfDecoration)) {
              const origX = (el as any).originalX ?? el.x;
              const origY = (el as any).originalY ?? el.y;
              const origW = (el as any).originalWidth ?? el.width;
              const origH = (el as any).originalHeight ?? el.height;
              const isThinLine = origH <= 3;
              const padY = isThinLine ? 1.5 : 0;
              return (
                <div
                  key={`orig_whiteout_${el.id}`}
                  style={{
                    left: `${origX * zoom}px`,
                    top: `${(origY - padY) * zoom}px`,
                    width: `${origW * zoom}px`,
                    height: `${(origH + padY * 2) * zoom}px`,
                    transform: `rotate(${(el as any).originalRotation || 0}deg)`,
                    transformOrigin: 'center center',
                  }}
                  className="absolute bg-white pointer-events-none"
                />
              );
            }
            return null;
          })}
        </div>

        {/* Interactive Elements Overlay */}
        <div className="absolute inset-0 pointer-events-auto">
          {pageElements.map((el) => {
            const isSelected = el.id === selectedId;
            const rot = el.rotation || 0;

            return (
              <div
                key={el.id}
                onMouseDown={(e) => startDrag(e, el, 'move')}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (el.type === 'text') {
                    setEditingInlineId(el.id);
                  }
                }}
                style={{
                  left: `${el.x * zoom}px`,
                  top: `${el.y * zoom}px`,
                  width: `${el.width * zoom}px`,
                  height: `${el.height * zoom}px`,
                  transform: `rotate(${rot}deg)`,
                  transformOrigin: 'center center',
                }}
                className={`editor-element-box absolute cursor-move transition-shadow ${
                  isSelected
                    ? 'ring-2 ring-blue-600 shadow-md z-40'
                    : 'hover:ring-1 hover:ring-blue-400 z-10'
                }`}
              >
                {/* Visual content based on element type */}
                {el.type === 'text_field' && (
                  <div className="w-full h-full bg-blue-50/90 border border-blue-500 rounded-xs px-1.5 py-0.5 flex items-center overflow-hidden">
                    <span
                      style={{ fontSize: `${(el.fontSize || 11) * zoom}px` }}
                      className="text-blue-950 font-sans truncate w-full"
                    >
                      {el.defaultValue || (
                        <span className="text-blue-500 italic font-mono text-[10px]">
                          [{el.fieldName}]
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {el.type === 'checkbox' && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateElement({ ...el, isChecked: !el.isChecked });
                    }}
                    className="w-full h-full bg-white border border-slate-700 rounded-xs flex items-center justify-center cursor-pointer shadow-2xs hover:bg-slate-50"
                  >
                    {el.isChecked && (
                      <span
                        style={{ fontSize: `${el.height * zoom * 0.75}px` }}
                        className="text-emerald-600 font-bold leading-none"
                      >
                        ✓
                      </span>
                    )}
                  </div>
                )}

                {el.type === 'radio' && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      // Set selected and unselect peers in same group
                      const updatedGroup = elements.map((item) => {
                        if (item.type === 'radio' && item.groupName === el.groupName) {
                          return { ...item, isSelected: item.id === el.id };
                        }
                        return item;
                      });
                      onUpdateElement({ ...el, isSelected: true });
                    }}
                    className="w-full h-full bg-white border border-slate-700 rounded-full flex items-center justify-center cursor-pointer shadow-2xs hover:bg-slate-50"
                  >
                    {el.isSelected && (
                      <div className="w-[55%] h-[55%] rounded-full bg-blue-600"></div>
                    )}
                  </div>
                )}

                {el.type === 'dropdown' && (
                  <div
                    style={{
                      backgroundColor: el.backgroundColor || '#ffffff',
                      borderColor: el.borderColor || '#3b82f6',
                    }}
                    className="w-full h-full border rounded-xs px-1.5 py-0.5 flex items-center justify-between overflow-hidden shadow-2xs select-none"
                  >
                    <span
                      style={{
                        fontSize: `${(el.fontSize || 10) * zoom}px`,
                        color: el.fontColor || '#0f172a',
                      }}
                      className="truncate font-sans flex-1"
                    >
                      {el.defaultValue || (el.options && el.options[0]) || (
                        <span className="text-slate-400 italic text-[10px]">
                          [{el.fieldName}]
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      style={{ width: `${12 * zoom}px`, height: `${12 * zoom}px` }}
                      className="text-slate-500 shrink-0 ml-1"
                    />
                  </div>
                )}

                {el.type === 'text' && (
                  <div
                    style={{
                      fontSize: `${(el.fontSize || 12) * zoom}px`,
                      color: el.color || '#0f172a',
                      fontWeight: el.isBold ? 'bold' : 'normal',
                      fontStyle: el.isItalic ? 'italic' : 'normal',
                      fontFamily: getCssFontFamily(el.fontFamily),
                      backgroundColor: el.backgroundColor || 'transparent',
                    }}
                    className="w-full h-full px-0.5 py-0 flex items-center whitespace-nowrap overflow-hidden select-none"
                  >
                    {editingInlineId === el.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={el.text}
                        style={{
                          fontSize: `${(el.fontSize || 12) * zoom}px`,
                          fontWeight: el.isBold ? 'bold' : 'normal',
                          fontStyle: el.isItalic ? 'italic' : 'normal',
                          color: el.color || '#0f172a',
                          fontFamily: getCssFontFamily(el.fontFamily),
                          padding: '0 2px',
                          margin: 0,
                          lineHeight: 1.1,
                          background: el.backgroundColor || '#ffffff',
                        }}
                        onChange={(e) => onUpdateElement({ ...el, text: e.target.value })}
                        onBlur={() => setEditingInlineId(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingInlineId(null);
                        }}
                        className="w-full h-full border-none outline-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xs"
                      />
                    ) : (
                      <span className="px-0.5">{el.text}</span>
                    )}
                  </div>
                )}

                {el.type === 'whiteout' && (
                  <div className="w-full h-full bg-white border border-slate-300 shadow-xs px-1 flex items-center overflow-hidden">
                    {el.replacementText ? (
                      <span
                        style={{
                          fontSize: `${(el.replacementFontSize || 11) * zoom}px`,
                          color: el.replacementColor || '#0f172a',
                        }}
                        className="font-sans truncate"
                      >
                        {el.replacementText}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic">Bianchetto</span>
                    )}
                  </div>
                )}

                {el.type === 'highlight' && (
                  <div
                    style={{ backgroundColor: el.color || 'rgba(254, 240, 138, 0.5)' }}
                    className="w-full h-full rounded-xs mix-blend-multiply"
                  />
                )}

                {el.type === 'shape' && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      boxSizing: 'border-box',
                      borderRadius: el.shapeType === 'circle' ? '50%' : `${(el.borderRadius || 0) * zoom}px`,
                      backgroundColor: el.shapeType === 'line' ? 'transparent' : (el.fillColor === 'transparent' ? 'transparent' : el.fillColor),
                      borderStyle: el.shapeType === 'line' ? 'none' : (el.strokeDash === 'dashed' ? 'dashed' : el.strokeDash === 'dotted' ? 'dotted' : 'solid'),
                      borderColor: el.strokeColor || '#334155',
                      borderWidth: el.shapeType === 'line' ? '0' : `${Math.max(0, (el.strokeWidth ?? 1) * zoom)}px`,
                    }}
                    className="w-full h-full relative pointer-events-none"
                  >
                    {el.shapeType === 'line' && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: el.height <= el.width ? '50%' : 0,
                          width: el.height <= el.width ? '100%' : `${Math.max(1, (el.strokeWidth || 1) * zoom)}px`,
                          height: el.height <= el.width ? `${Math.max(1, (el.strokeWidth || 1) * zoom)}px` : '100%',
                          transform: el.height <= el.width ? 'translateY(-50%)' : 'none',
                          backgroundColor: el.strokeDash && el.strokeDash !== 'solid' ? 'transparent' : (el.strokeColor || '#334155'),
                          borderTop: el.strokeDash && el.strokeDash !== 'solid'
                            ? `${Math.max(1, (el.strokeWidth || 1) * zoom)}px ${el.strokeDash} ${el.strokeColor || '#334155'}`
                            : undefined,
                        }}
                      />
                    )}
                  </div>
                )}

                {(el.type === 'signature' || el.type === 'image') && (
                  <img
                    src={el.imageDataUrl}
                    alt={el.type}
                    style={{
                      opacity: el.opacity !== undefined ? el.opacity : 1,
                      filter: [
                        el.brightness !== undefined && el.brightness !== 100 ? `brightness(${el.brightness}%)` : '',
                        el.contrast !== undefined && el.contrast !== 100 ? `contrast(${el.contrast}%)` : '',
                        el.grayscale ? 'grayscale(100%)' : '',
                        el.invert ? 'invert(100%)' : '',
                        el.sepia ? 'sepia(100%)' : '',
                      ].filter(Boolean).join(' ') || undefined,
                      transform: `${el.flipX ? 'scaleX(-1)' : ''} ${el.flipY ? 'scaleY(-1)' : ''}`.trim() || undefined,
                      border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || '#000000'}` : undefined,
                      borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
                    }}
                    className="w-full h-full object-contain pointer-events-none select-none"
                  />
                )}

                {/* Quick Action Buttons for Selected Element */}
                {isSelected && (
                  <div className="absolute -top-7 right-0 flex items-center gap-1 z-50">
                    {el.type === 'image' && (
                      <>
                        <button
                          type="button"
                          title="Sostituisci immagine con un'altra foto/file"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            replaceImageInputRef.current?.click();
                          }}
                          className="px-1.5 h-6 bg-white hover:bg-blue-50 text-blue-600 rounded-md border border-blue-200 shadow-md flex items-center gap-1 text-[10px] font-medium cursor-pointer transition-transform active:scale-90"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Sostituisci</span>
                        </button>
                        <button
                          type="button"
                          title="Rifletti orizzontalmente"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateElement({
                              ...el,
                              flipX: !el.flipX,
                            });
                          }}
                          className={`w-6 h-6 rounded-md border shadow-md flex items-center justify-center cursor-pointer transition-transform active:scale-90 ${
                            el.flipX
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          <FlipHorizontal className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    {onDeleteElement && (
                      <button
                        type="button"
                        title="Elimina elemento (Canc)"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteElement(el.id);
                        }}
                        className="w-6 h-6 bg-white hover:bg-red-50 text-red-600 rounded-md border border-red-200 shadow-md flex items-center justify-center cursor-pointer transition-transform active:scale-90"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Ruota elemento di -15°"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateElement({
                          ...el,
                          rotation: (((el.rotation || 0) - 15 + 360) % 360),
                        });
                      }}
                      className="px-1 h-6 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-300 shadow-md flex items-center justify-center font-mono text-[10px] font-bold cursor-pointer transition-transform active:scale-90"
                    >
                      -15°
                    </button>
                    <button
                      type="button"
                      title="Ruota elemento di +15°"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateElement({
                          ...el,
                          rotation: (((el.rotation || 0) + 15) % 360),
                        });
                      }}
                      className="px-1 h-6 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-300 shadow-md flex items-center justify-center font-mono text-[10px] font-bold cursor-pointer transition-transform active:scale-90"
                    >
                      +15°
                    </button>
                  </div>
                )}

                {/* Interactive Continuous Degree Rotation Handle (Top-Center) */}
                {isSelected && (
                  <div
                    onMouseDown={(e) => startRotate(e, el)}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing z-50 pointer-events-auto group/rot"
                    title={`Ruota elemento in gradi continui (Attuale: ${rot}°) — Trascina col mouse (Maiusc per snap a 15°)`}
                  >
                    <div className="text-[9px] font-mono font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded shadow whitespace-nowrap mb-0.5 pointer-events-none">
                      {rot}°
                    </div>
                    <div className="w-5 h-5 rounded-full bg-white border-2 border-blue-600 shadow-md flex items-center justify-center hover:bg-blue-50 transition-transform active:scale-95">
                      <RotateCw className="w-2.5 h-2.5 text-blue-600" />
                    </div>
                    <div className="w-0.5 h-2 bg-blue-500" />
                  </div>
                )}

                {/* Resize Handle (bottom-right) */}
                {isSelected && (
                  <div
                    onMouseDown={(e) => startDrag(e, el, 'resize')}
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-xs cursor-se-resize z-50 shadow-xs"
                    title="Trascina per ridimensionare"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <input
        type="file"
        ref={replaceImageInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleReplaceImageFile}
      />
    </div>
  );
};
