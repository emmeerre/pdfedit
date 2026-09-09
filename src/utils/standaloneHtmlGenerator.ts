/**
 * Generates a completely standalone single-file HTML document (.html)
 * that works offline with a double-click on any computer without any web server.
 * Uses client-side Web APIs (FileReader, HTML5 Canvas, Blob, SVG, PDF-Lib UMD).
 */
export function generateStandaloneHtml(): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF Studio Standalone - Editor PDF Locale a Doppio Click</title>
  <!-- Carica PDF-Lib e PDF.js via CDN (con fallback locale browser) -->
  <script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"><\/script>
  <style>
    :root {
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --surface: #ffffff;
      --background: #f1f5f9;
      --border: #cbd5e1;
      --text: #0f172a;
      --text-muted: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--background);
      color: var(--text);
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      user-select: none;
    }
    /* Header Toolbar */
    header {
      background: #0f172a;
      color: #fff;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 100;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 15px;
      letter-spacing: -0.3px;
    }
    .badge-standalone {
      background: #059669;
      color: #fff;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 9999px;
      font-weight: 600;
    }
    .header-actions {
      display: flex;
      gap: 8px;
    }
    button {
      font-family: inherit;
      cursor: pointer;
      border: 1px solid var(--border);
      background: #fff;
      color: var(--text);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    button:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    button.btn-primary {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
      font-weight: 600;
    }
    button.btn-primary:hover {
      background: var(--primary-hover);
    }
    button.active {
      background: #2563eb;
      color: #fff;
      border-color: #2563eb;
    }
    /* Tools Bar */
    .toolbar {
      background: var(--surface);
      border-b: 1px solid var(--border);
      padding: 6px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      z-index: 90;
      border-bottom: 1px solid var(--border);
    }
    .tool-group {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .divider {
      width: 1px;
      height: 22px;
      background: var(--border);
      margin: 0 4px;
    }
    /* Main Layout */
    .main-workspace {
      flex: 1;
      display: flex;
      overflow: hidden;
      position: relative;
    }
    /* Center Canvas Area */
    .canvas-container {
      flex: 1;
      overflow: auto;
      background: #e2e8f0;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 30px;
    }
    .page-wrapper {
      position: relative;
      background: #fff;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.25);
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    /* Elements Overlay */
    .elements-layer {
      position: absolute;
      inset: 0;
      pointer-events: auto;
    }
    .element-box {
      position: absolute;
      cursor: move;
      border: 1px solid transparent;
      user-select: none;
      transform-origin: center center;
    }
    .element-box:hover {
      border: 1px dashed #3b82f6;
    }
    .element-box.selected {
      border: 2px solid #2563eb;
      box-shadow: 0 0 0 1px #fff;
      z-index: 50;
    }
    .resize-handle {
      position: absolute;
      right: -3px;
      bottom: -3px;
      width: 8px;
      height: 8px;
      background: #2563eb;
      border: 1px solid #fff;
      cursor: se-resize;
      display: none;
    }
    .element-box.selected .resize-handle {
      display: block;
    }
    .rotate-quick-btn {
      position: absolute;
      top: -26px;
      right: -2px;
      width: 22px;
      height: 22px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      color: #2563eb;
      font-size: 11px;
      font-weight: bold;
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
      z-index: 60;
    }
    .delete-quick-btn {
      position: absolute;
      top: -26px;
      right: 24px;
      width: 22px;
      height: 22px;
      background: #ffffff;
      border: 1px solid #fca5a5;
      border-radius: 4px;
      color: #ef4444;
      font-size: 11px;
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
      z-index: 60;
    }
    .delete-quick-btn:hover {
      background: #fee2e2;
    }
    .element-box.selected .rotate-quick-btn,
    .element-box.selected .delete-quick-btn {
      display: flex;
    }
    /* Element Types Visuals */
    .el-text_field {
      background: rgba(239, 246, 255, 0.9);
      border: 1px solid #3b82f6;
      border-radius: 2px;
      padding: 2px 4px;
      font-size: 11px;
      color: #0f172a;
      display: flex;
      align-items: center;
      overflow: hidden;
      white-space: nowrap;
    }
    .el-checkbox {
      background: #fff;
      border: 1.5px solid #334155;
      border-radius: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #059669;
      font-size: 12px;
      cursor: pointer;
    }
    .el-radio {
      background: #fff;
      border: 1.5px solid #334155;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .el-text {
      padding: 1px 3px;
      line-height: 1.2;
      white-space: nowrap;
      display: flex;
      align-items: center;
      overflow: hidden;
    }
    .el-whiteout {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 2px 4px;
      font-size: 11px;
      display: flex;
      align-items: center;
      overflow: hidden;
    }
    .el-signature img, .el-image img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      pointer-events: none;
    }
    /* Side Properties Panel */
    .panel {
      width: 290px;
      background: var(--surface);
      border-left: 1px solid var(--border);
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .panel h3 {
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }
    .prop-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .prop-row label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
    }
    .prop-row input, .prop-row select, .prop-row textarea {
      padding: 6px 8px;
      font-size: 12px;
      border: 1px solid var(--border);
      border-radius: 4px;
      font-family: inherit;
    }
    .btn-rotate-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      margin-top: 4px;
    }
    /* Signature Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 200;
    }
    .modal {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      width: 480px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);
    }
    .sig-canvas {
      border: 1px dashed #94a3b8;
      border-radius: 6px;
      background: #fafafa;
      cursor: crosshair;
      display: block;
      margin: 12px 0;
      width: 100%;
      height: 160px;
    }
    /* Text detection overlay */
    .text-detect-layer {
      position: absolute;
      inset: 0;
      z-index: 35;
      background: rgba(37, 99, 235, 0.03);
      display: none;
    }
    .text-detect-box {
      position: absolute;
      border: 1px solid rgba(59, 130, 246, 0.4);
      cursor: pointer;
      border-radius: 2px;
    }
    .text-detect-box:hover {
      background: rgba(59, 130, 246, 0.25);
      border-color: #2563eb;
    }
  </style>
</head>
<body>

  <!-- Top Header -->
  <header>
    <div class="brand">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
      <span>PDF Studio Standalone</span>
      <span class="badge-standalone">100% Offline / Standalone</span>
    </div>
    <div class="header-actions">
      <input type="file" id="file-input" accept=".pdf" style="display:none">
      <button onclick="document.getElementById('file-input').click()">📂 Apri PDF</button>
      <button onclick="createBlankDocument()">📄 Nuovo Foglio A4</button>
      <button class="btn-primary" onclick="exportPDF()">💾 Salva PDF Finale</button>
    </div>
  </header>

  <!-- Toolbar Tools -->
  <div class="toolbar">
    <div class="tool-group">
      <button id="tool-select" class="active" onclick="setTool('select')">👆 Seleziona</button>
      <button id="tool-edit_text" onclick="setTool('edit_existing_text')">✏️ Edita Testo Presente</button>
    </div>
    <div class="divider"></div>
    <div class="tool-group">
      <button id="tool-text_field" onclick="setTool('text_field')">📝 Campo Testo</button>
      <button id="tool-checkbox" onclick="setTool('checkbox')">☑️ Checkbox</button>
      <button id="tool-radio" onclick="setTool('radio')">🔘 Radio</button>
    </div>
    <div class="divider"></div>
    <div class="tool-group">
      <button id="tool-text" onclick="setTool('text')">🔤 Nuovo Testo</button>
      <button id="tool-whiteout" onclick="setTool('whiteout')">🩹 Bianchetto / Modifica</button>
      <button onclick="openSignatureModal()">✍️ Firma</button>
      <input type="file" id="img-input" accept="image/*" style="display:none" onchange="handleImageUpload(event)">
      <button onclick="document.getElementById('img-input').click()">🖼️ Immagine</button>
    </div>
    <div class="divider"></div>
    <div class="tool-group">
      <button onclick="changeZoom(-0.15)">🔍 -</button>
      <span id="zoom-text" style="font-size:12px; font-weight:600; min-width:40px; text-align:center;">100%</span>
      <button onclick="changeZoom(0.15)">🔍 +</button>
    </div>
    <div class="tool-group" style="margin-left:auto;">
      <button style="color:#ef4444;" onclick="deleteSelectedElement()">🗑️ Elimina</button>
    </div>
  </div>

  <!-- Workspace -->
  <div class="main-workspace">
    <!-- Center Canvas -->
    <div class="canvas-container" id="canvas-container" onclick="handleCanvasClick(event)">
      <div class="page-wrapper" id="page-wrapper">
        <canvas id="pdf-canvas"></canvas>
        <div class="text-detect-layer" id="text-detect-layer"></div>
        <div class="elements-layer" id="elements-overlay"></div>
      </div>
    </div>

    <!-- Properties Panel -->
    <div class="panel" id="properties-panel">
      <h3>Proprietà Elemento</h3>
      <div id="prop-content" style="color:var(--text-muted); font-size:12px;">
        Seleziona un elemento o clicca su uno strumento per aggiungerlo.
      </div>
    </div>
  </div>

  <!-- Signature Modal -->
  <div class="modal-backdrop" id="sig-modal">
    <div class="modal">
      <h3 style="margin-bottom:8px; font-size:15px;">Disegna la tua Firma</h3>
      <p style="font-size:12px; color:#64748b;">Traccia con il mouse o il dito all'interno del riquadro:</p>
      <canvas class="sig-canvas" id="sig-canvas" width="440" height="160"></canvas>
      <div style="display:flex; justify-content:space-between; margin-top:12px;">
        <button onclick="clearSignatureCanvas()">Cancella Tratto</button>
        <div style="display:flex; gap:8px;">
          <button onclick="closeSignatureModal()">Annulla</button>
          <button class="btn-primary" onclick="confirmSignature()">Applica Firma</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    // State
    let currentTool = 'select';
    let zoom = 1.0;
    let elements = [];
    let selectedId = null;
    let rawPdfBuffer = null; // NEVER detached: stored as untouched ArrayBuffer
    let extractedTexts = [];
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    // Set PDF.js worker
    if (window.pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    function setTool(tool) {
      currentTool = tool;
      document.querySelectorAll('.toolbar button').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById('tool-' + tool) || (tool === 'edit_existing_text' ? document.getElementById('tool-edit_text') : null);
      if (activeBtn) activeBtn.classList.add('active');

      const detectLayer = document.getElementById('text-detect-layer');
      if (currentTool === 'edit_existing_text') {
        detectLayer.style.display = 'block';
      } else {
        detectLayer.style.display = 'none';
      }
    }

    // Initialize Blank A4 PDF
    async function createBlankDocument() {
      if (!window.PDFLib) {
        alert("Caricamento libreria PDF in corso...");
        return;
      }
      const doc = await PDFLib.PDFDocument.create();
      doc.addPage([pageWidth, pageHeight]);
      const bytes = await doc.save();
      rawPdfBuffer = bytes.buffer.slice(0);
      elements = [];
      selectedId = null;
      renderCurrentPage();
    }

    // File input handler
    document.getElementById('file-input').addEventListener('change', async function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const arrayBuffer = await file.arrayBuffer();
      // Store a dedicated copy of the buffer so PDF.js never empties our original
      rawPdfBuffer = arrayBuffer.slice(0);
      elements = [];
      selectedId = null;

      // Restore previously saved elements or AcroForm widgets
      if (window.PDFLib) {
        try {
          const checkDoc = await PDFLib.PDFDocument.load(new Uint8Array(rawPdfBuffer.slice(0)));
          const subject = checkDoc.getSubject() || '';
          if (subject.startsWith('EDITOR_ELEMENTS_DATA:')) {
            const rawJson = decodeURIComponent(subject.replace('EDITOR_ELEMENTS_DATA:', ''));
            const restored = JSON.parse(rawJson);
            if (Array.isArray(restored) && restored.length > 0) {
              elements = restored;
            }
          }
        } catch (metaErr) {
          console.warn('Restore metadata error:', metaErr);
        }
      }

      if (elements.length === 0 && window.pdfjsLib) {
        try {
          const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(rawPdfBuffer.slice(0)) }).promise;
          const page = await pdf.getPage(1);
          const baseViewport = page.getViewport({ scale: 1.0 });
          const annotations = await page.getAnnotations();
          for (const annot of annotations) {
            if (annot.subtype !== 'Widget' || !annot.rect) continue;
            const r = annot.rect;
            const x = Math.max(0, Math.round(r[0]));
            const y = Math.max(0, Math.round(baseViewport.height - r[3]));
            const width = Math.max(14, Math.round(r[2] - r[0]));
            const height = Math.max(14, Math.round(r[3] - r[1]));
            const fName = annot.fieldName || ('Campo_' + (elements.length + 1));

            if (annot.fieldType === 'Tx') {
              elements.push({
                id: 'tf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                type: 'text_field',
                fieldName: fName,
                defaultValue: annot.fieldValue ? String(annot.fieldValue) : '',
                fontSize: 11,
                fontColor: '#0f172a',
                borderColor: '#94a3b8',
                x, y, width, height, rotation: 0
              });
            } else if (annot.fieldType === 'Btn') {
              if (annot.radioButton) {
                const groupName = annot.fieldName || 'Opzioni';
                const value = annot.buttonValue || ('Opzione_' + (elements.length + 1));
                elements.push({
                  id: 'rd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                  type: 'radio',
                  groupName: groupName,
                  value: value,
                  isSelected: annot.fieldValue === annot.buttonValue,
                  borderColor: '#1d4ed8',
                  x, y, width: Math.min(width, height, 22), height: Math.min(width, height, 22), rotation: 0
                });
              } else if (annot.checkBox || (!annot.radioButton && !annot.pushButton)) {
                elements.push({
                  id: 'cb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                  type: 'checkbox',
                  fieldName: fName,
                  isChecked: Boolean(annot.fieldValue && annot.fieldValue !== 'Off'),
                  borderColor: '#047857',
                  backgroundColor: '#ffffff',
                  x, y, width: Math.min(width, height, 22), height: Math.min(width, height, 22), rotation: 0
                });
              }
            }
          }
        } catch (annotErr) {
          console.warn('AcroForm extraction note:', annotErr);
        }
      }

      renderCurrentPage();
    });

    async function renderCurrentPage() {
      const canvas = document.getElementById('pdf-canvas');
      const ctx = canvas.getContext('2d');
      const wrapper = document.getElementById('page-wrapper');

      wrapper.style.width = (pageWidth * zoom) + 'px';
      wrapper.style.height = (pageHeight * zoom) + 'px';
      canvas.width = pageWidth * zoom;
      canvas.height = pageHeight * zoom;

      if (!rawPdfBuffer) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        renderElementsOverlay();
        return;
      }

      if (window.pdfjsLib) {
        try {
          // Pass a cloned slice to PDF.js to avoid buffer detachment
          const cloneBytes = new Uint8Array(rawPdfBuffer.slice(0));
          const loadingTask = pdfjsLib.getDocument({ data: cloneBytes });
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: zoom });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          wrapper.style.width = viewport.width + 'px';
          wrapper.style.height = viewport.height + 'px';

          await page.render({ canvasContext: ctx, viewport: viewport, annotationMode: 0 }).promise;

          // Extract text items from PDF page
          try {
            const textContent = await page.getTextContent();
            const rawList = [];
            for (const item of textContent.items) {
              if (!item.str || !item.str.trim()) continue;
              const tx = item.transform[4];
              const ty = item.transform[5];
              const fontPt = Math.sqrt(item.transform[0]*item.transform[0] + item.transform[1]*item.transform[1]) || item.height || 11;
              const baselineY = (viewport.height / zoom) - ty;
              const topY = baselineY - fontPt * 0.85;
              const uiW = item.width || (item.str.length * fontPt * 0.55);
              const uiH = fontPt * 1.15;

              const fontNameStr = (item.fontName || '').toLowerCase();
              const styleObj = (textContent.styles && textContent.styles[item.fontName]) || {};
              const isBold = fontNameStr.includes('bold') || fontNameStr.includes('black') || fontNameStr.includes('heavy') || fontNameStr.includes('semibold') || fontNameStr.includes('medium') || Boolean(styleObj.fontFamily && styleObj.fontFamily.toLowerCase().includes('bold'));
              let fontFamily = 'Helvetica';
              const styleFam = (styleObj.fontFamily || '').toLowerCase();
              if (styleFam.includes('serif') || fontNameStr.includes('times') || fontNameStr.includes('serif')) {
                fontFamily = 'TimesRoman';
              } else if (styleFam.includes('mono') || fontNameStr.includes('courier') || fontNameStr.includes('mono')) {
                fontFamily = 'Courier';
              }

              rawList.push({
                str: item.str,
                x: tx,
                baselineY: baselineY,
                topY: topY,
                width: uiW,
                height: uiH,
                fontSize: Math.round(fontPt * 10) / 10,
                fontFamily: fontFamily,
                isBold: isBold
              });
            }

            // Sort top-to-bottom, then left-to-right
            rawList.sort((a, b) => Math.abs(a.baselineY - b.baselineY) > 2.5 ? a.baselineY - b.baselineY : a.x - b.x);

            // Merge adjacent items on the same baseline into complete continuous lines
            extractedTexts = [];
            for (const it of rawList) {
              const prev = extractedTexts[extractedTexts.length - 1];
              if (
                prev &&
                Math.abs(prev.baselineY - it.baselineY) <= Math.min(prev.fontSize, it.fontSize) * 0.45 &&
                (it.x - (prev.x + prev.width)) <= Math.max(prev.fontSize, it.fontSize) * 3.5 &&
                it.x >= prev.x - 2
              ) {
                const spaceNeeded = it.x - (prev.x + prev.width) > 1 ? ' ' : '';
                prev.str = prev.str + spaceNeeded + it.str;
                const rightEdge = Math.max(prev.x + prev.width, it.x + it.width);
                prev.width = rightEdge - prev.x;
                prev.y = Math.min(prev.y, it.topY);
                prev.fontSize = Math.max(prev.fontSize, it.fontSize);
                prev.height = Math.max(prev.height, it.height);
                if (it.isBold) prev.isBold = true;
              } else {
                extractedTexts.push({
                  str: it.str,
                  x: it.x,
                  y: it.topY,
                  baselineY: it.baselineY,
                  width: it.width,
                  height: it.height,
                  fontSize: it.fontSize,
                  fontFamily: it.fontFamily,
                  isBold: it.isBold
                });
              }
            }

            renderTextDetectLayer();
          } catch(err) {
            console.warn("Text content extraction error:", err);
          }

        } catch (err) {
          console.warn("Rendering fallback:", err);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
      renderElementsOverlay();
    }

    function renderTextDetectLayer() {
      const layer = document.getElementById('text-detect-layer');
      layer.innerHTML = '';
      extractedTexts.forEach((item, idx) => {
        const box = document.createElement('div');
        box.className = 'text-detect-box';
        box.style.left = (item.x * zoom) + 'px';
        box.style.top = (item.y * zoom) + 'px';
        box.style.width = Math.max(item.width * zoom, 24) + 'px';
        box.style.height = Math.max(item.height * zoom, 14) + 'px';
        box.title = 'Clicca per modificare: "' + item.str + '"';
        box.onclick = (e) => {
          e.stopPropagation();
          handleEditOriginalText(item);
        };
        layer.appendChild(box);
      });
    }

    function handleEditOriginalText(item) {
      // Add a single editable text element with an opaque white background
      // This seamlessly covers the original background text without separate disconnected patches
      const txtEl = {
        id: 'txt_' + Date.now(),
        type: 'text',
        text: item.str,
        fontSize: item.fontSize || 12,
        color: '#0f172a',
        fontFamily: item.fontFamily || 'Helvetica',
        isBold: item.isBold || false,
        backgroundColor: '#ffffff',
        x: Math.max(0, Math.round(item.x - 2)),
        y: Math.max(0, Math.round(item.y - 1)),
        width: Math.ceil(item.width + 12),
        height: Math.max(Math.ceil(item.height + 2), 18),
        rotation: 0
      };
      elements.push(txtEl);
      selectedId = txtEl.id;
      setTool('select');
      renderElementsOverlay();
    }

    function renderElementsOverlay() {
      const overlay = document.getElementById('elements-overlay');
      overlay.innerHTML = '';

      elements.forEach(el => {
        const box = document.createElement('div');
        box.className = 'element-box' + (el.id === selectedId ? ' selected' : '');
        box.id = 'el-' + el.id;
        box.style.left = (el.x * zoom) + 'px';
        box.style.top = (el.y * zoom) + 'px';
        box.style.width = (el.width * zoom) + 'px';
        box.style.height = (el.height * zoom) + 'px';
        box.style.transform = 'rotate(' + (el.rotation || 0) + 'deg)';

        if (el.type === 'text_field') {
          box.className += ' el-text_field';
          box.innerText = el.defaultValue || el.fieldName || '[Campo di Testo]';
        } else if (el.type === 'checkbox') {
          box.className += ' el-checkbox';
          box.innerHTML = el.isChecked ? '✓' : '';
          box.onclick = (e) => {
            e.stopPropagation();
            el.isChecked = !el.isChecked;
            renderElementsOverlay();
          };
        } else if (el.type === 'radio') {
          box.className += ' el-radio';
          box.innerHTML = el.isSelected ? '<div style="width:55%;height:55%;border-radius:50%;background:#2563eb;"></div>' : '';
          box.onclick = (e) => {
            e.stopPropagation();
            elements.forEach(item => {
              if (item.type === 'radio' && item.groupName === el.groupName) item.isSelected = false;
            });
            el.isSelected = true;
            renderElementsOverlay();
          };
        } else if (el.type === 'text') {
          box.className += ' el-text';
          box.innerText = el.text;
          box.style.fontSize = (el.fontSize * zoom) + 'px';
          box.style.color = el.color || '#0f172a';
          box.style.fontWeight = el.isBold ? 'bold' : 'normal';
          box.style.fontFamily = el.fontFamily === 'TimesRoman' ? '"Times New Roman", Times, serif' : (el.fontFamily === 'Courier' ? '"Courier New", Courier, monospace' : 'Helvetica, Arial, sans-serif');
          if (el.backgroundColor && el.backgroundColor !== 'transparent') {
            box.style.backgroundColor = el.backgroundColor;
          }
          box.ondblclick = (e) => {
            e.stopPropagation();
            const newText = prompt("Modifica testo:", el.text);
            if (newText !== null) {
              el.text = newText;
              renderElementsOverlay();
            }
          };
        } else if (el.type === 'whiteout') {
          box.className += ' el-whiteout';
          box.innerText = el.replacementText || '';
          box.style.fontSize = ((el.replacementFontSize || 11) * zoom) + 'px';
        } else if (el.type === 'signature' || el.type === 'image') {
          box.className += el.type === 'signature' ? ' el-signature' : ' el-image';
          const img = document.createElement('img');
          img.src = el.imageDataUrl;
          box.appendChild(img);
        }

        // Quick Delete Button
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-quick-btn';
        delBtn.innerHTML = '🗑️';
        delBtn.title = 'Elimina elemento (Canc)';
        delBtn.onmousedown = (e) => e.stopPropagation();
        delBtn.onclick = (e) => {
          e.stopPropagation();
          deleteSelectedElement();
        };
        box.appendChild(delBtn);

        // Quick 90° Rotate Button
        const rotBtn = document.createElement('button');
        rotBtn.className = 'rotate-quick-btn';
        rotBtn.innerHTML = '🔄';
        rotBtn.title = 'Ruota campo di 90°';
        rotBtn.onmousedown = (e) => e.stopPropagation();
        rotBtn.onclick = (e) => {
          e.stopPropagation();
          el.rotation = ((el.rotation || 0) + 90) % 360;
          renderElementsOverlay();
        };
        box.appendChild(rotBtn);

        // Resize handle
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        handle.onmousedown = (e) => startResizeElement(e, el);
        box.appendChild(handle);

        box.onmousedown = (e) => startDragElement(e, el);
        overlay.appendChild(box);
      });

      updatePropertiesPanel();
    }

    function handleCanvasClick(e) {
      if (e.target.closest('.element-box')) return;
      if (currentTool === 'edit_existing_text') return;

      const rect = document.getElementById('page-wrapper').getBoundingClientRect();
      const clickX = Math.round((e.clientX - rect.left) / zoom);
      const clickY = Math.round((e.clientY - rect.top) / zoom);

      if (currentTool === 'select') {
        selectedId = null;
        renderElementsOverlay();
        return;
      }

      const id = 'el_' + Date.now();
      if (currentTool === 'text_field') {
        elements.push({
          id: id,
          type: 'text_field',
          fieldName: 'Campo_' + (elements.length + 1),
          defaultValue: '',
          fontSize: 11,
          x: clickX,
          y: clickY,
          width: 140,
          height: 22,
          rotation: 0
        });
      } else if (currentTool === 'checkbox') {
        elements.push({
          id: id,
          type: 'checkbox',
          fieldName: 'Check_' + (elements.length + 1),
          isChecked: false,
          x: clickX,
          y: clickY,
          width: 16,
          height: 16,
          rotation: 0
        });
      } else if (currentTool === 'radio') {
        elements.push({
          id: id,
          type: 'radio',
          groupName: 'Gruppo_1',
          value: 'Opzione_' + (elements.length + 1),
          isSelected: false,
          x: clickX,
          y: clickY,
          width: 16,
          height: 16,
          rotation: 0
        });
      } else if (currentTool === 'text') {
        elements.push({
          id: id,
          type: 'text',
          text: 'Nuovo Testo',
          fontSize: 12,
          color: '#0f172a',
          x: clickX,
          y: clickY,
          width: 120,
          height: 24,
          rotation: 0
        });
      } else if (currentTool === 'whiteout') {
        elements.push({
          id: id,
          type: 'whiteout',
          replacementText: '',
          replacementFontSize: 11,
          x: clickX,
          y: clickY,
          width: 120,
          height: 22,
          rotation: 0
        });
      }

      selectedId = id;
      setTool('select');
      renderElementsOverlay();
    }

    // Drag & Resize
    function startDragElement(e, el) {
      if (e.target.classList.contains('resize-handle') || e.target.classList.contains('rotate-quick-btn')) return;
      e.stopPropagation();
      selectedId = el.id;
      renderElementsOverlay();

      const startX = e.clientX;
      const startY = e.clientY;
      const initX = el.x;
      const initY = el.y;

      function onMouseMove(moveEvent) {
        const dx = (moveEvent.clientX - startX) / zoom;
        const dy = (moveEvent.clientY - startY) / zoom;
        el.x = Math.round(initX + dx);
        el.y = Math.round(initY + dy);
        renderElementsOverlay();
      }

      function onMouseUp() {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    function startResizeElement(e, el) {
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const initW = el.width;
      const initH = el.height;

      function onMouseMove(moveEvent) {
        const dx = (moveEvent.clientX - startX) / zoom;
        const dy = (moveEvent.clientY - startY) / zoom;
        el.width = Math.max(14, Math.round(initW + dx));
        el.height = Math.max(14, Math.round(initH + dy));
        renderElementsOverlay();
      }

      function onMouseUp() {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    function deleteSelectedElement() {
      if (!selectedId) return;
      elements = elements.filter(el => el.id !== selectedId);
      selectedId = null;
      renderElementsOverlay();
    }

    // Properties Panel
    function updatePropertiesPanel() {
      const panel = document.getElementById('prop-content');
      const el = elements.find(item => item.id === selectedId);
      if (!el) {
        panel.innerHTML = '<p style="color:var(--text-muted);font-size:12px;">Seleziona un elemento sul foglio per modificarne le proprietà.</p>';
        return;
      }

      let html = '<div style="margin-bottom:8px;font-weight:bold;color:#2563eb;font-size:12px;">Tipo: ' + el.type.toUpperCase() + '</div>';

      if (el.type === 'text_field') {
        html += \`
          <div class="prop-row">
            <label>Nome Campo (AcroForm ID):</label>
            <input type="text" value="\${el.fieldName || ''}" onchange="updateProp('fieldName', this.value)">
          </div>
          <div class="prop-row">
            <label>Valore Predefinito:</label>
            <input type="text" value="\${el.defaultValue || ''}" onchange="updateProp('defaultValue', this.value)">
          </div>
          <div class="prop-row">
            <label>Dimensione Font:</label>
            <input type="number" value="\${el.fontSize || 11}" min="8" max="36" onchange="updateProp('fontSize', parseInt(this.value))">
          </div>
        \`;
      } else if (el.type === 'checkbox') {
        html += \`
          <div class="prop-row">
            <label>Nome Campo:</label>
            <input type="text" value="\${el.fieldName || ''}" onchange="updateProp('fieldName', this.value)">
          </div>
          <div class="prop-row" style="flex-direction:row; align-items:center; gap:8px;">
            <input type="checkbox" \${el.isChecked ? 'checked' : ''} onchange="updateProp('isChecked', this.checked)">
            <label style="margin:0;">Selezionato</label>
          </div>
        \`;
      } else if (el.type === 'radio') {
        html += \`
          <div class="prop-row">
            <label>Gruppo Radio:</label>
            <input type="text" value="\${el.groupName || ''}" onchange="updateProp('groupName', this.value)">
          </div>
          <div class="prop-row">
            <label>Valore Opzione:</label>
            <input type="text" value="\${el.value || ''}" onchange="updateProp('value', this.value)">
          </div>
          <div class="prop-row" style="flex-direction:row; align-items:center; gap:8px;">
            <input type="checkbox" \${el.isSelected ? 'checked' : ''} onchange="updateProp('isSelected', this.checked)">
            <label style="margin:0;">Selezionato</label>
          </div>
        \`;
      } else if (el.type === 'text') {
        html += \`
          <div class="prop-row">
            <label>Testo:</label>
            <textarea rows="3" onchange="updateProp('text', this.value)">\${el.text || ''}</textarea>
          </div>
          <div class="prop-row">
            <label>Dimensione Font:</label>
            <input type="number" value="\${el.fontSize || 12}" min="6" max="72" onchange="updateProp('fontSize', parseInt(this.value))">
          </div>
          <div class="prop-row">
            <label>Colore:</label>
            <input type="color" value="\${el.color || '#0f172a'}" onchange="updateProp('color', this.value)">
          </div>
        \`;
      } else if (el.type === 'whiteout') {
        html += \`
          <div class="prop-row">
            <label>Testo Sostitutivo:</label>
            <input type="text" value="\${el.replacementText || ''}" placeholder="Scrivi qui per sovrascrivere..." onchange="updateProp('replacementText', this.value)">
          </div>
          <div class="prop-row">
            <label>Dimensione Font:</label>
            <input type="number" value="\${el.replacementFontSize || 11}" onchange="updateProp('replacementFontSize', parseInt(this.value))">
          </div>
        \`;
      }

      // Rotation Section for ALL elements
      html += \`
        <div class="prop-row" style="margin-top:10px; border-top:1px solid #e2e8f0; padding-top:10px;">
          <label style="display:flex; justify-content:space-between;">
            <span>Rotazione Campo:</span>
            <span style="color:#2563eb; font-weight:bold;">\${el.rotation || 0}°</span>
          </label>
          <div class="btn-rotate-grid">
            <button onclick="updateProp('rotation', 0)" style="\${(el.rotation||0)===0?'background:#2563eb;color:#fff;':''}">0°</button>
            <button onclick="updateProp('rotation', 90)" style="\${(el.rotation||0)===90?'background:#2563eb;color:#fff;':''}">90°</button>
            <button onclick="updateProp('rotation', 180)" style="\${(el.rotation||0)===180?'background:#2563eb;color:#fff;':''}">180°</button>
            <button onclick="updateProp('rotation', 270)" style="\${(el.rotation||0)===270?'background:#2563eb;color:#fff;':''}">270°</button>
          </div>
          <button style="margin-top:6px; width:100%; justify-content:center;" onclick="updateProp('rotation', (((el.rotation||0)+90)%360))">🔄 Ruota di +90°</button>
        </div>
        <div style="margin-top:14px; padding-top:12px; border-top:1px solid #e2e8f0;">
          <button style="width:100%; justify-content:center; background:#fee2e2; border-color:#fca5a5; color:#b91c1c; font-weight:600; padding:8px; display:flex; align-items:center; gap:6px;" onclick="deleteSelectedElement()">
            🗑️ Elimina Elemento
          </button>
        </div>
      \`;

      panel.innerHTML = html;
    }

    function updateProp(prop, val) {
      const el = elements.find(item => item.id === selectedId);
      if (el) {
        el[prop] = val;
        renderElementsOverlay();
      }
    }

    // Zoom
    function changeZoom(delta) {
      zoom = Math.max(0.5, Math.min(2.0, zoom + delta));
      document.getElementById('zoom-text').innerText = Math.round(zoom * 100) + '%';
      renderCurrentPage();
    }

    // Signature Modal
    const sigModal = document.getElementById('sig-modal');
    const sigCanvas = document.getElementById('sig-canvas');
    const sigCtx = sigCanvas.getContext('2d');
    let isDrawing = false;

    function openSignatureModal() {
      sigModal.style.display = 'flex';
      clearSignatureCanvas();
    }
    function closeSignatureModal() {
      sigModal.style.display = 'none';
    }
    function clearSignatureCanvas() {
      sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    }
    sigCanvas.onmousedown = (e) => {
      isDrawing = true;
      sigCtx.beginPath();
      sigCtx.moveTo(e.offsetX, e.offsetY);
    };
    sigCanvas.onmousemove = (e) => {
      if (!isDrawing) return;
      sigCtx.lineWidth = 2.2;
      sigCtx.lineCap = 'round';
      sigCtx.strokeStyle = '#0f172a';
      sigCtx.lineTo(e.offsetX, e.offsetY);
      sigCtx.stroke();
    };
    sigCanvas.onmouseup = () => isDrawing = false;

    function confirmSignature() {
      const dataUrl = sigCanvas.toDataURL('image/png');
      const newEl = {
        id: 'sig_' + Date.now(),
        type: 'signature',
        imageDataUrl: dataUrl,
        x: 100,
        y: 200,
        width: 150,
        height: 55,
        rotation: 0
      };
      elements.push(newEl);
      selectedId = newEl.id;
      closeSignatureModal();
      renderElementsOverlay();
    }

    // Image Upload
    function handleImageUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        const newEl = {
          id: 'img_' + Date.now(),
          type: 'image',
          imageDataUrl: evt.target.result,
          x: 120,
          y: 180,
          width: 140,
          height: 100,
          rotation: 0
        };
        elements.push(newEl);
        selectedId = newEl.id;
        renderElementsOverlay();
      };
      reader.readAsDataURL(file);
    }

    // PDF-Lib Export (100% Client-Side with proper buffer cloning)
    async function exportPDF() {
      if (!window.PDFLib) {
        alert("Libreria PDF non pronta. Assicurati di attendere il caricamento.");
        return;
      }
      try {
        let pdfDoc;
        if (rawPdfBuffer) {
          // Pass a fresh clone so buffer is never detached
          const cloneBytes = new Uint8Array(rawPdfBuffer.slice(0));
          pdfDoc = await PDFLib.PDFDocument.load(cloneBytes);
        } else {
          pdfDoc = await PDFLib.PDFDocument.create();
          pdfDoc.addPage([pageWidth, pageHeight]);
        }
        const pages = pdfDoc.getPages();
        const page = pages[0];
        const form = pdfDoc.getForm();
        const { height: pHeight } = page.getSize();

        // Clean up existing fields so deleted fields are truly removed
        try {
          const existingFields = form.getFields();
          for (const f of existingFields) {
            try { form.removeField(f); } catch(rmErr){}
          }
        } catch(cleanErr){}

        const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        const fontTimes = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
        const fontTimesBold = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRomanBold);
        const fontCourier = await pdfDoc.embedFont(PDFLib.StandardFonts.Courier);
        const fontCourierBold = await pdfDoc.embedFont(PDFLib.StandardFonts.CourierBold);

        // Group radio buttons by groupName
        const radioMap = {};

        for (const el of elements) {
          const pdfX = el.x;
          const pdfY = pHeight - el.y - el.height;
          const rot = PDFLib.degrees(el.rotation || 0);

          if (el.type === 'whiteout') {
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: el.width,
              height: el.height,
              color: PDFLib.rgb(1, 1, 1),
              rotate: rot,
            });
            if (el.replacementText) {
              page.drawText(el.replacementText, {
                x: pdfX + 2,
                y: pdfY + (el.height - (el.replacementFontSize || 11)) / 2 + 1,
                size: el.replacementFontSize || 11,
                font: font,
                color: PDFLib.rgb(0.1, 0.1, 0.1),
                rotate: rot,
              });
            }
          } else if (el.type === 'text') {
            let txtFont = font;
            if (el.fontFamily === 'TimesRoman') {
              txtFont = el.isBold ? fontTimesBold : fontTimes;
            } else if (el.fontFamily === 'Courier') {
              txtFont = el.isBold ? fontCourierBold : fontCourier;
            } else {
              txtFont = el.isBold ? fontBold : font;
            }

            if (el.backgroundColor && el.backgroundColor !== 'transparent') {
              page.drawRectangle({
                x: pdfX,
                y: pdfY,
                width: el.width,
                height: el.height,
                color: PDFLib.rgb(1, 1, 1),
                rotate: rot,
              });
            }

            const fSize = el.fontSize || 12;
            page.drawText(el.text, {
              x: pdfX + 2,
              y: pdfY + (el.height - fSize) / 2,
              size: fSize,
              font: txtFont,
              color: PDFLib.rgb(0.06, 0.09, 0.16),
              rotate: rot,
            });
          } else if (el.type === 'text_field') {
            try {
              const fieldName = el.fieldName || 'tf_' + el.id;
              let tf;
              try { tf = form.getTextField(fieldName); } catch(e) { tf = form.createTextField(fieldName); }
              if (el.defaultValue) tf.setText(el.defaultValue);
              tf.addToPage(page, {
                x: pdfX,
                y: pdfY,
                width: el.width,
                height: el.height,
                borderWidth: 1,
                rotate: rot,
              });
            } catch(err) {
              page.drawRectangle({
                x: pdfX,
                y: pdfY,
                width: el.width,
                height: el.height,
                borderColor: PDFLib.rgb(0.6, 0.6, 0.7),
                borderWidth: 1,
                color: PDFLib.rgb(0.98, 0.98, 0.99),
                rotate: rot,
              });
            }
          } else if (el.type === 'checkbox') {
            try {
              const fieldName = el.fieldName || 'cb_' + el.id;
              let cb;
              try { cb = form.getCheckBox(fieldName); } catch(e) { cb = form.createCheckBox(fieldName); }
              cb.addToPage(page, {
                x: pdfX,
                y: pdfY,
                width: el.width,
                height: el.height,
                borderWidth: 1.2,
                rotate: rot,
              });
              if (el.isChecked) cb.check();
            } catch(err) {
              page.drawRectangle({
                x: pdfX,
                y: pdfY,
                width: el.width,
                height: el.height,
                borderColor: PDFLib.rgb(0.2, 0.2, 0.2),
                borderWidth: 1.2,
                color: PDFLib.rgb(1, 1, 1),
                rotate: rot,
              });
            }
          } else if (el.type === 'radio') {
            const grp = el.groupName || 'RadioGroup_1';
            if (!radioMap[grp]) radioMap[grp] = [];
            radioMap[grp].push({ ...el, pdfX, pdfY, rot });
          } else if (el.type === 'signature' || el.type === 'image') {
            try {
              const embedded = await pdfDoc.embedPng(el.imageDataUrl);
              page.drawImage(embedded, {
                x: pdfX,
                y: pdfY,
                width: el.width,
                height: el.height,
                rotate: rot,
              });
            } catch(err) {
              console.warn("Image embed error:", err);
            }
          }
        }

        // Process radio groups
        for (const [groupName, items] of Object.entries(radioMap)) {
          try {
            let rg;
            try { rg = form.getRadioGroup(groupName); } catch(e) { rg = form.createRadioGroup(groupName); }
            items.forEach((item, idx) => {
              const optVal = item.value || ('opt_' + idx);
              rg.addOptionToPage(optVal, page, {
                x: item.pdfX,
                y: item.pdfY,
                width: item.width,
                height: item.height,
                borderWidth: 1.2,
                rotate: item.rot,
              });
              if (item.isSelected) rg.select(optVal);
            });
          } catch(err) {
            console.warn("Radio export error:", err);
          }
        }

        // Embed full editor elements state into Subject for lossless restore
        try {
          pdfDoc.setSubject('EDITOR_ELEMENTS_DATA:' + encodeURIComponent(JSON.stringify(elements)));
        } catch(subjErr){}

        const outBytes = await pdfDoc.save();
        const blob = new Blob([outBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'documento_modificato.pdf';
        link.click();
      } catch (err) {
        alert("Errore esportazione PDF: " + err.message);
      }
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        if (!['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
          deleteSelectedElement();
        }
      }
    });

    // Initialize with a blank sheet
    createBlankDocument();
  </script>
</body>
</html>`;
}
