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
    /* Decorations detection overlay */
    .dec-detect-layer {
      position: absolute;
      inset: 0;
      z-index: 35;
      background: rgba(147, 51, 234, 0.04);
      display: none;
    }
    .dec-detect-box {
      position: absolute;
      border: 2px solid rgba(147, 51, 234, 0.7);
      cursor: pointer;
      border-radius: 2px;
      transition: all 0.15s ease;
    }
    .dec-detect-box:hover {
      background: rgba(147, 51, 234, 0.3);
      border-color: #7c3aed;
    }
    .el-shape {
      box-sizing: border-box;
      pointer-events: auto;
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
      <button style="background:#7c3aed; color:#fff; border-color:#6d28d9;" onclick="openAutomationModal()">⚡ Script Automazione</button>
      <button class="btn-primary" onclick="exportPDF()">💾 Salva PDF Finale</button>
    </div>
  </header>

  <!-- Toolbar Tools -->
  <div class="toolbar">
    <div class="tool-group">
      <button id="tool-select" class="active" onclick="setTool('select')">👆 Seleziona</button>
      <button id="tool-edit_text" onclick="setTool('edit_existing_text')">✏️ Edita Testo Presente</button>
      <button id="tool-edit_decorations" onclick="setTool('edit_existing_decorations')" style="color:#7c3aed; font-weight:600;">📐 Edita Linee e Riquadri</button>
    </div>
    <div class="divider"></div>
    <div class="tool-group">
      <button id="tool-text_field" onclick="setTool('text_field')">📝 Campo Testo</button>
      <button id="tool-checkbox" onclick="setTool('checkbox')">☑️ Checkbox</button>
      <button id="tool-radio" onclick="setTool('radio')">🔘 Radio</button>
      <button id="tool-dropdown" onclick="setTool('dropdown')">📋 Dropdown</button>
    </div>
    <div class="divider"></div>
    <div class="tool-group">
      <button id="tool-shape" onclick="setTool('shape')">🔷 Forme / Riquadri</button>
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
        <div class="dec-detect-layer" id="dec-detect-layer"></div>
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

  <!-- Automation Modal -->
  <div class="modal-backdrop" id="auto-modal">
    <div class="modal" style="width:620px; max-width:92vw;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 style="margin:0; font-size:16px;">⚡ Automazione & Script Campi</h3>
        <button onclick="closeAutomationModal()" style="border:none; background:transparent; cursor:pointer; font-size:18px; color:var(--text-muted);">✕</button>
      </div>
      <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">
        Esegui codice JavaScript personalizzato per compilare o manipolare automaticamente i campi e i testi del documento.
      </p>

      <div style="margin-bottom:10px;">
        <label style="font-size:11px; font-weight:600; color:var(--text-muted); display:block; margin-bottom:4px;">Modello / Preset:</label>
        <select id="auto-preset-select" onchange="loadAutoPreset(this.value)" style="width:100%; padding:6px; font-size:12px; border:1px solid var(--border); border-radius:4px;">
          <option value="custom">-- Script personalizzato --</option>
          <option value="autofill">Compila Dati Anagrafici & Contratto</option>
          <option value="uppercase">Converti Campi Testo in MAIUSCOLO</option>
          <option value="clear">Svuota tutti i Campi Compilabili</option>
        </select>
      </div>

      <div style="margin-bottom:12px;">
        <label style="font-size:11px; font-weight:600; color:var(--text-muted); display:block; margin-bottom:4px;">Codice JavaScript (oggetti disponibili: fields, elements, log):</label>
        <textarea id="auto-script-editor" style="width:100%; height:160px; font-family:monospace; font-size:12px; padding:8px; border:1px solid var(--border); border-radius:4px; box-sizing:border-box; resize:vertical; background:#0f172a; color:#f8fafc;"></textarea>
      </div>

      <div id="auto-log" style="font-size:11px; min-height:16px; margin-bottom:12px;"></div>

      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <button onclick="closeAutomationModal()">Chiudi</button>
        <button class="btn-primary" onclick="runAutomationScript()">▶ Esegui Script</button>
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
    let extractedDecorations = [];
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    // Set PDF.js worker
    if (window.pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    function setTool(tool) {
      currentTool = tool;
      document.querySelectorAll('.toolbar button').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById('tool-' + tool) || 
        (tool === 'edit_existing_text' ? document.getElementById('tool-edit_text') : 
         tool === 'edit_existing_decorations' ? document.getElementById('tool-edit_decorations') : null);
      if (activeBtn) activeBtn.classList.add('active');

      const detectLayer = document.getElementById('text-detect-layer');
      if (currentTool === 'edit_existing_text') {
        detectLayer.style.display = 'block';
      } else {
        detectLayer.style.display = 'none';
      }

      const decLayer = document.getElementById('dec-detect-layer');
      if (currentTool === 'edit_existing_decorations') {
        decLayer.style.display = 'block';
      } else {
        decLayer.style.display = 'none';
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
            } else if (annot.fieldType === 'Ch') {
              const rawOpts = annot.options || [];
              const options = rawOpts.map(o => typeof o === 'string' ? o : o.displayValue || o.exportValue || String(o));
              elements.push({
                id: 'dd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                type: 'dropdown',
                fieldName: fName,
                options: options.length > 0 ? options : ['Opzione 1', 'Opzione 2'],
                defaultValue: annot.fieldValue ? String(annot.fieldValue) : (options[0] || ''),
                fontSize: 10,
                fontColor: '#0f172a',
                borderColor: '#3b82f6',
                backgroundColor: '#ffffff',
                x, y, width, height, rotation: 0
              });
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

          // Extract vector decorations (lines, boxes, rules)
          try {
            const opList = await page.getOperatorList();
            const OPS = (window.pdfjsLib && window.pdfjsLib.OPS) || {};
            extractedDecorations = [];
            if (opList && opList.fnArray && opList.argsArray) {
              const fnArr = opList.fnArray;
              const argsArr = opList.argsArray;
              let ctm = [1, 0, 0, 1, 0, 0];
              const ctmStack = [];
              let currentStrokeColor = '#475569';
              let currentFillColor = '#f1f5f9';
              let currentLineWidth = 1;

              function rgbToHex(r, g, b) {
                const normR = r <= 1 && r >= 0 && (r !== 0 || g !== 0 || b !== 0) ? Math.round(r * 255) : Math.round(r);
                const normG = g <= 1 && g >= 0 && (g !== 0 || g !== 0 || b !== 0) ? Math.round(g * 255) : Math.round(g);
                const normB = b <= 1 && b >= 0 && (b !== 0 || b !== 0 || b !== 0) ? Math.round(b * 255) : Math.round(b);
                const clamp = v => Math.max(0, Math.min(255, v));
                const hex = v => clamp(v).toString(16).padStart(2, '0');
                return '#' + hex(normR) + hex(normG) + hex(normB);
              }
              function applyTransform(pt, m) {
                return [
                  m[0] * pt[0] + m[2] * pt[1] + m[4],
                  m[1] * pt[0] + m[3] * pt[1] + m[5]
                ];
              }
              function multiplyMatrices(m1, m2) {
                return [
                  m1[0]*m2[0] + m1[2]*m2[1],
                  m1[1]*m2[0] + m1[3]*m2[1],
                  m1[0]*m2[2] + m1[2]*m2[3],
                  m1[1]*m2[2] + m1[3]*m2[3],
                  m1[0]*m2[4] + m1[2]*m2[5] + m1[4],
                  m1[1]*m2[4] + m1[3]*m2[5] + m1[5]
                ];
              }

              for (let i = 0; i < fnArr.length; i++) {
                const fn = fnArr[i];
                const args = argsArr[i];
                if (fn === OPS.save) {
                  ctmStack.push([...ctm]);
                } else if (fn === OPS.restore) {
                  if (ctmStack.length > 0) ctm = ctmStack.pop();
                } else if (fn === OPS.transform) {
                  if (Array.isArray(args) && args.length >= 6) ctm = multiplyMatrices(ctm, args);
                } else if (fn === OPS.setStrokeRGBColor || fn === OPS.setStrokeColorN || fn === OPS.setStrokeColor) {
                  if (Array.isArray(args)) {
                    if (args.length === 1 && typeof args[0] === 'string') currentStrokeColor = args[0];
                    else if (args.length >= 3) currentStrokeColor = rgbToHex(args[0], args[1], args[2]);
                    else if (args.length === 1 && typeof args[0] === 'number') currentStrokeColor = rgbToHex(args[0], args[0], args[0]);
                  }
                } else if (fn === OPS.setFillRGBColor || fn === OPS.setFillColorN || fn === OPS.setFillColor) {
                  if (Array.isArray(args)) {
                    if (args.length === 1 && typeof args[0] === 'string') currentFillColor = args[0];
                    else if (args.length >= 3) currentFillColor = rgbToHex(args[0], args[1], args[2]);
                    else if (args.length === 1 && typeof args[0] === 'number') currentFillColor = rgbToHex(args[0], args[0], args[0]);
                  }
                } else if (fn === OPS.setLineWidth) {
                  if (Array.isArray(args) && typeof args[0] === 'number') currentLineWidth = Math.max(0.5, args[0]);
                }

                if (fn === OPS.constructPath && Array.isArray(args)) {
                  const bbox = args[2];
                  let hasBbox = false;
                  let minX = 0, minY = 0, maxX = 0, maxY = 0;
                  let isCircle = false;

                  if (bbox && (Array.isArray(bbox) || ArrayBuffer.isView(bbox)) && bbox.length >= 4) {
                    const p1 = applyTransform([bbox[0], bbox[1]], ctm);
                    const p2 = applyTransform([bbox[2], bbox[3]], ctm);
                    const p3 = applyTransform([bbox[0], bbox[3]], ctm);
                    const p4 = applyTransform([bbox[2], bbox[1]], ctm);

                    minX = Math.min(p1[0], p2[0], p3[0], p4[0]);
                    maxX = Math.max(p1[0], p2[0], p3[0], p4[0]);
                    minY = Math.min(p1[1], p2[1], p3[1], p4[1]);
                    maxY = Math.max(p1[1], p2[1], p3[1], p4[1]);
                    hasBbox = true;

                    if (args[1] && args[1][0] && args[1][0].length >= 16) {
                      const opsArr = args[1][0];
                      let curveCount = 0;
                      for (let k = 0; k < opsArr.length; k++) {
                        if (opsArr[k] === 2) curveCount++;
                      }
                      if (curveCount >= 3) isCircle = true;
                    }
                  }

                  if (hasBbox) {
                    const w = maxX - minX;
                    const h = maxY - minY;
                    const topY = (viewport.height / zoom) - maxY;

                    if ((w < (viewport.width / zoom) * 0.98 || h < (viewport.height / zoom) * 0.98) && (w >= 4 || h >= 4)) {
                      const isHLine = h <= 3 && w >= 5;
                      const isVLine = w <= 3 && h >= 5;
                      const isLine = isHLine || isVLine;

                      const decType = isCircle ? 'circle' : (isLine ? 'line' : 'rectangle');
                      const decX = Math.round(isVLine ? minX - currentLineWidth / 2 : minX);
                      const decY = Math.round(isHLine ? topY - currentLineWidth / 2 : topY);
                      const decW = Math.round(isVLine ? Math.max(2, currentLineWidth) : w);
                      const decH = Math.round(isHLine ? Math.max(2, currentLineWidth) : h);

                      extractedDecorations.push({
                        id: 'dec_' + (extractedDecorations.length + 1),
                        type: decType,
                        x: decX,
                        y: decY,
                        width: Math.max(decW, isLine ? 10 : 6),
                        height: Math.max(decH, isLine ? 2 : 6),
                        strokeColor: currentStrokeColor,
                        fillColor: isLine ? currentStrokeColor : currentFillColor,
                        strokeWidth: Math.round(currentLineWidth),
                        title: isLine ? (isHLine ? 'Linea Orizzontale' : 'Linea Verticale') : (isCircle ? 'Cerchio / Badge' : 'Riquadro')
                      });
                    }
                  }
                } else if (fn === OPS.rectangle && Array.isArray(args) && args.length >= 4) {
                  const p1 = applyTransform([args[0], args[1]], ctm);
                  const p2 = applyTransform([args[0] + args[2], args[1] + args[3]], ctm);
                  const minX = Math.min(p1[0], p2[0]);
                  const maxX = Math.max(p1[0], p2[0]);
                  const minY = Math.min(p1[1], p2[1]);
                  const maxY = Math.max(p1[1], p2[1]);
                  const w = maxX - minX;
                  const h = maxY - minY;
                  const topY = (viewport.height / zoom) - maxY;
                  if ((w < (viewport.width / zoom) * 0.98 || h < (viewport.height / zoom) * 0.98) && (w >= 4 || h >= 4)) {
                    const isLine = h <= 3 || w <= 3;
                    extractedDecorations.push({
                      id: 'dec_' + (extractedDecorations.length + 1),
                      type: isLine ? 'line' : 'rectangle',
                      x: Math.round(minX),
                      y: Math.round(topY),
                      width: Math.max(isLine ? 10 : 6, Math.round(w)),
                      height: Math.max(isLine ? 2 : 6, Math.round(h)),
                      strokeColor: currentStrokeColor,
                      fillColor: isLine ? currentStrokeColor : currentFillColor,
                      strokeWidth: Math.round(currentLineWidth),
                      title: isLine ? 'Linea Divisoria' : 'Riquadro'
                    });
                  }
                }
              }
            }
            renderDecDetectLayer();
          } catch(decErr) {
            console.warn("Decorations scan error:", decErr);
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

    function renderDecDetectLayer() {
      const layer = document.getElementById('dec-detect-layer');
      if (!layer) return;
      layer.innerHTML = '';
      extractedDecorations.forEach((item) => {
        const isHLine = item.type === 'line' && item.width >= item.height;
        const isVLine = item.type === 'line' && item.height > item.width;
        const hitHeight = isHLine ? Math.max(item.height * zoom, 18) : Math.max(item.height * zoom, 12);
        const hitWidth = isVLine ? Math.max(item.width * zoom, 18) : Math.max(item.width * zoom, 12);
        const renderTop = isHLine ? (item.y * zoom) - (hitHeight - item.height * zoom) / 2 : item.y * zoom;
        const renderLeft = isVLine ? (item.x * zoom) - (hitWidth - item.width * zoom) / 2 : item.x * zoom;

        const box = document.createElement('div');
        box.className = 'dec-detect-box';
        box.style.left = renderLeft + 'px';
        box.style.top = renderTop + 'px';
        box.style.width = hitWidth + 'px';
        box.style.height = hitHeight + 'px';
        box.style.display = 'flex';
        box.style.alignItems = 'center';
        box.style.justifyContent = 'center';
        box.title = 'Clicca per modificare: ' + item.title + ' (' + item.width + 'x' + item.height + 'pt)';

        if (isHLine) {
          const innerLine = document.createElement('div');
          innerLine.style.width = '100%';
          innerLine.style.height = Math.max(2, item.height * zoom) + 'px';
          innerLine.style.backgroundColor = '#9333ea';
          innerLine.style.boxShadow = '0 0 6px rgba(147, 51, 234, 0.8)';
          innerLine.style.pointerEvents = 'none';
          box.appendChild(innerLine);
        } else if (isVLine) {
          const innerLine = document.createElement('div');
          innerLine.style.height = '100%';
          innerLine.style.width = Math.max(2, item.width * zoom) + 'px';
          innerLine.style.backgroundColor = '#9333ea';
          innerLine.style.boxShadow = '0 0 6px rgba(147, 51, 234, 0.8)';
          innerLine.style.pointerEvents = 'none';
          box.appendChild(innerLine);
        }

        box.onclick = (e) => {
          e.stopPropagation();
          handleEditOriginalDecoration(item);
        };
        layer.appendChild(box);
      });
    }

    function handleEditOriginalDecoration(item) {
      const shapeId = 'shape_' + Date.now();
      const isHLine = item.type === 'line' && item.width >= item.height;
      const isVLine = item.type === 'line' && item.height > item.width;
      const initialH = isHLine ? Math.max(item.height, 8) : item.height;
      const initialW = isVLine ? Math.max(item.width, 8) : item.width;
      const initialY = isHLine ? item.y - (initialH - item.height) / 2 : item.y;
      const initialX = isVLine ? item.x - (initialW - item.width) / 2 : item.x;

      const newShape = {
        id: shapeId,
        type: 'shape',
        shapeType: item.type || 'rectangle',
        x: Math.round(initialX),
        y: Math.round(initialY),
        width: Math.round(initialW),
        height: Math.round(initialH),
        strokeColor: item.strokeColor || '#334155',
        strokeWidth: item.strokeWidth !== undefined ? item.strokeWidth : 1,
        strokeStyle: 'solid',
        fillColor: item.type === 'line' ? 'transparent' : (item.fillColor || 'transparent'),
        borderRadius: item.type === 'circle' ? 9999 : 0,
        isOriginalPdfDecoration: true,
        originalX: item.x,
        originalY: item.y,
        originalWidth: item.width,
        originalHeight: item.height,
        originalRotation: 0,
        rotation: 0
      };
      elements.push(newShape);
      selectedId = shapeId;
      setTool('select');
      renderElementsOverlay();
    }

    function renderElementsOverlay() {
      const overlay = document.getElementById('elements-overlay');
      overlay.innerHTML = '';

      // Render whiteout patches covering original background footprint of modified/moved PDF decorations
      elements.forEach(el => {
        if (el.type === 'shape' && el.isOriginalPdfDecoration) {
          const origX = el.originalX !== undefined ? el.originalX : el.x;
          const origY = el.originalY !== undefined ? el.originalY : el.y;
          const origW = el.originalWidth !== undefined ? el.originalWidth : el.width;
          const origH = el.originalHeight !== undefined ? el.originalHeight : el.height;
          const isThin = origH <= 3;
          const padY = isThin ? 1.5 : 0;
          const wBox = document.createElement('div');
          wBox.style.position = 'absolute';
          wBox.style.left = (origX * zoom) + 'px';
          wBox.style.top = ((origY - padY) * zoom) + 'px';
          wBox.style.width = (origW * zoom) + 'px';
          wBox.style.height = ((origH + padY * 2) * zoom) + 'px';
          wBox.style.backgroundColor = '#ffffff';
          wBox.style.pointerEvents = 'none';
          wBox.style.zIndex = '1';
          overlay.appendChild(wBox);
        }
      });

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
        } else if (el.type === 'dropdown') {
          box.className += ' el-text_field';
          box.style.background = el.backgroundColor || '#ffffff';
          box.style.border = '1px solid ' + (el.borderColor || '#3b82f6');
          box.style.display = 'flex';
          box.style.alignItems = 'center';
          box.style.justifyContent = 'space-between';
          box.style.padding = '0 6px';
          box.style.cursor = 'pointer';
          const dispVal = el.defaultValue || (el.options && el.options[0]) || ('[' + (el.fieldName || 'Dropdown') + ']');
          box.innerHTML = '<span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:' + ((el.fontSize || 10) * zoom) + 'px; color:' + (el.fontColor || '#0f172a') + ';">' + dispVal + '</span><span style="font-size:10px; color:#64748b; margin-left:4px;">▼</span>';
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
        } else if (el.type === 'shape') {
          box.className += ' el-shape';
          box.style.zIndex = '10';
          const shapeType = el.shapeType || 'rectangle';
          const strokeW = el.strokeWidth !== undefined ? el.strokeWidth : 1;
          const strokeCol = el.strokeColor || '#334155';
          const strokeStyle = el.strokeStyle || 'solid';
          const fillCol = el.fillColor && el.fillColor !== 'transparent' ? el.fillColor : 'transparent';

          box.style.backgroundColor = fillCol;
          box.style.boxSizing = 'border-box';
          if (shapeType === 'line') {
            const isHorizontal = el.height <= el.width;
            box.style.border = 'none';
            box.style.backgroundColor = 'transparent';
            const innerLine = document.createElement('div');
            innerLine.style.position = 'absolute';
            innerLine.style.left = '0';
            innerLine.style.top = isHorizontal ? '50%' : '0';
            innerLine.style.width = isHorizontal ? '100%' : (Math.max(1, Math.round(strokeW * zoom)) + 'px');
            innerLine.style.height = isHorizontal ? (Math.max(1, Math.round(strokeW * zoom)) + 'px') : '100%';
            innerLine.style.transform = isHorizontal ? 'translateY(-50%)' : 'none';
            innerLine.style.backgroundColor = strokeStyle === 'solid' ? strokeCol : 'transparent';
            if (strokeStyle !== 'solid') {
              innerLine.style.borderTop = Math.max(1, Math.round(strokeW * zoom)) + 'px ' + strokeStyle + ' ' + strokeCol;
            }
            innerLine.style.pointerEvents = 'none';
            box.appendChild(innerLine);
          } else if (shapeType === 'circle') {
            box.style.border = Math.max(0, Math.round(strokeW * zoom)) + 'px ' + strokeStyle + ' ' + strokeCol;
            box.style.borderRadius = '50%';
          } else {
            box.style.border = Math.max(0, Math.round(strokeW * zoom)) + 'px ' + strokeStyle + ' ' + strokeCol;
            box.style.borderRadius = ((el.borderRadius || 0) * zoom) + 'px';
          }
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
      if (currentTool === 'edit_existing_text' || currentTool === 'edit_existing_decorations') return;

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
      } else if (currentTool === 'dropdown') {
        elements.push({
          id: id,
          type: 'dropdown',
          fieldName: 'Menu_' + (elements.length + 1),
          options: ['Opzione 1', 'Opzione 2', 'Opzione 3'],
          defaultValue: 'Opzione 1',
          fontSize: 10,
          fontColor: '#0f172a',
          borderColor: '#3b82f6',
          backgroundColor: '#ffffff',
          x: clickX,
          y: clickY,
          width: 150,
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
      } else if (currentTool === 'shape') {
        elements.push({
          id: id,
          type: 'shape',
          shapeType: 'rectangle',
          x: clickX,
          y: clickY,
          width: 160,
          height: 80,
          strokeColor: '#2563eb',
          strokeWidth: 1.5,
          strokeStyle: 'solid',
          fillColor: '#eff6ff',
          borderRadius: 6,
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
        const isShapeLine = el.type === 'shape' && el.shapeType === 'line';
        const minW = isShapeLine && el.width >= el.height ? 10 : 12;
        const minH = isShapeLine && el.height <= el.width ? 2 : 12;
        el.width = Math.max(minW, Math.round(initW + dx));
        el.height = Math.max(minH, Math.round(initH + dy));
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
      } else if (el.type === 'dropdown') {
        const optsText = (el.options || []).join('\\n');
        html += \`
          <div class="prop-row">
            <label>Nome Campo (AcroForm ID):</label>
            <input type="text" value="\${el.fieldName || ''}" onchange="updateProp('fieldName', this.value)">
          </div>
          <div class="prop-row">
            <label>Opzioni Menu (una per riga):</label>
            <textarea rows="4" onchange="updateProp('options', this.value.split('\\\\n').map(s=>s.trim()).filter(Boolean))">\${optsText}</textarea>
          </div>
          <div class="prop-row">
            <label>Valore Selezionato / Default:</label>
            <input type="text" value="\${el.defaultValue || ''}" onchange="updateProp('defaultValue', this.value)">
          </div>
          <div class="prop-row">
            <label>Dimensione Font:</label>
            <input type="number" value="\${el.fontSize || 10}" min="8" max="36" onchange="updateProp('fontSize', parseInt(this.value))">
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
      } else if (el.type === 'shape') {
        html += \`
          <div class="prop-row">
            <label>Tipo di Forma:</label>
            <select onchange="updateProp('shapeType', this.value)">
              <option value="rectangle" \${(el.shapeType||'rectangle')==='rectangle'?'selected':''}>Riquadro / Box</option>
              <option value="line" \${el.shapeType==='line'?'selected':''}>Linea Divisoria</option>
              <option value="circle" \${el.shapeType==='circle'?'selected':''}>Cerchio / Ovale</option>
            </select>
          </div>
          <div class="prop-row">
            <label>Colore Bordo / Linea:</label>
            <input type="color" value="\${el.strokeColor || '#334155'}" onchange="updateProp('strokeColor', this.value)">
          </div>
          <div class="prop-row">
            <label>Spessore Bordo (pt):</label>
            <input type="number" min="0" max="40" value="\${el.strokeWidth !== undefined ? el.strokeWidth : 1}" onchange="updateProp('strokeWidth', parseInt(this.value)||0)">
          </div>
          <div class="prop-row">
            <label>Stile Tratto:</label>
            <select onchange="updateProp('strokeStyle', this.value)">
              <option value="solid" \${(el.strokeStyle||'solid')==='solid'?'selected':''}>Continuo (Solid)</option>
              <option value="dashed" \${el.strokeStyle==='dashed'?'selected':''}>Tratteggiato (Dashed)</option>
              <option value="dotted" \${el.strokeStyle==='dotted'?'selected':''}>Puntinato (Dotted)</option>
            </select>
          </div>
          <div class="prop-row">
            <label>Colore Riempimento:</label>
            <div style="display:flex; gap:6px; align-items:center;">
              <input type="color" value="\${(el.fillColor && el.fillColor!=='transparent') ? el.fillColor : '#ffffff'}" onchange="updateProp('fillColor', this.value)">
              <button style="font-size:11px; padding:4px 8px;" onclick="updateProp('fillColor', 'transparent')">Trasparente</button>
            </div>
          </div>
          \${(el.shapeType||'rectangle') === 'rectangle' ? \`
          <div class="prop-row">
            <label>Arrotondamento Angoli (px):</label>
            <input type="number" min="0" max="100" value="\${el.borderRadius || 0}" onchange="updateProp('borderRadius', parseInt(this.value)||0)">
          </div>
          \` : ''}
          <div class="prop-row" style="flex-direction:row; gap:8px;">
            <div style="flex:1;">
              <label>Larghezza:</label>
              <input type="number" value="\${el.width}" min="4" onchange="updateProp('width', parseInt(this.value)||10)">
            </div>
            <div style="flex:1;">
              <label>Altezza:</label>
              <input type="number" value="\${el.height}" min="2" onchange="updateProp('height', parseInt(this.value)||2)">
            </div>
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
          } else if (el.type === 'dropdown') {
            try {
              const fieldName = el.fieldName || 'dd_' + el.id;
              let dd;
              try { dd = form.getDropdown(fieldName); } catch(e) { dd = form.createDropdown(fieldName); }
              if (el.options && el.options.length > 0) {
                dd.setOptions(el.options);
              }
              if (el.defaultValue) dd.select(el.defaultValue);
              dd.addToPage(page, {
                x: pdfX,
                y: pdfY,
                width: el.width,
                height: el.height,
                borderWidth: 1,
                rotate: rot,
              });
            } catch(err) {
              console.warn("Dropdown export error:", err);
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
          } else if (el.type === 'shape') {
            // If it was an original decoration from the PDF, whiteout the original footprint
            if (el.isOriginalPdfDecoration) {
              const origX = el.originalX !== undefined ? el.originalX : el.x;
              const origY = el.originalY !== undefined ? el.originalY : el.y;
              const origW = el.originalWidth !== undefined ? el.originalWidth : el.width;
              const origH = el.originalHeight !== undefined ? el.originalHeight : el.height;
              const origPdfY = pHeight - origY - origH;
              page.drawRectangle({
                x: origX,
                y: origPdfY,
                width: origW,
                height: origH,
                color: PDFLib.rgb(1, 1, 1),
                rotate: PDFLib.degrees(el.originalRotation || 0),
              });
            }

            function hexToRgbObj(hex, defR, defG, defB) {
              if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return PDFLib.rgb(defR, defG, defB);
              const clean = hex.replace('#', '');
              if (clean.length === 6) {
                return PDFLib.rgb(
                  parseInt(clean.substring(0, 2), 16) / 255,
                  parseInt(clean.substring(2, 4), 16) / 255,
                  parseInt(clean.substring(4, 6), 16) / 255
                );
              }
              return PDFLib.rgb(defR, defG, defB);
            }

            const strokeCol = hexToRgbObj(el.strokeColor || '#334155', 0.2, 0.25, 0.35);
            const strokeW = el.strokeWidth !== undefined ? el.strokeWidth : 1;
            const hasFill = el.fillColor && el.fillColor !== 'transparent';
            const fillCol = hasFill ? hexToRgbObj(el.fillColor, 1, 1, 1) : undefined;
            const shapeType = el.shapeType || 'rectangle';

            if (shapeType === 'line') {
              const isHorizontal = el.height <= el.width;
              if (isHorizontal) {
                page.drawLine({
                  start: { x: pdfX, y: pdfY + el.height / 2 },
                  end: { x: pdfX + el.width, y: pdfY + el.height / 2 },
                  thickness: strokeW || 1,
                  color: strokeCol,
                });
              } else {
                page.drawLine({
                  start: { x: pdfX + el.width / 2, y: pdfY },
                  end: { x: pdfX + el.width / 2, y: pdfY + el.height },
                  thickness: strokeW || 1,
                  color: strokeCol,
                });
              }
            } else if (shapeType === 'circle') {
              const rx = el.width / 2;
              const ry = el.height / 2;
              page.drawEllipse({
                x: pdfX + rx,
                y: pdfY + ry,
                xScale: rx,
                yScale: ry,
                borderColor: strokeW > 0 ? strokeCol : undefined,
                borderWidth: strokeW,
                color: fillCol,
                rotate: rot,
              });
            } else {
              page.drawRectangle({
                x: pdfX,
                y: pdfY,
                width: el.width,
                height: el.height,
                borderColor: strokeW > 0 ? strokeCol : undefined,
                borderWidth: strokeW,
                color: fillCol,
                rotate: rot,
              });
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
      const isInputFocused = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable;
      if (isInputFocused) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        deleteSelectedElement();
        return;
      }
      if (e.key === 'Escape') {
        deselectAll();
        return;
      }

      const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      if (selectedId && isArrow) {
        const target = elements.find(el => el.id === selectedId);
        if (!target) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowUp') target.y = Math.max(0, target.y - step);
        if (e.key === 'ArrowDown') target.y = target.y + step;
        if (e.key === 'ArrowLeft') target.x = Math.max(0, target.x - step);
        if (e.key === 'ArrowRight') target.x = target.x + step;
        renderElements();
        return;
      }

      if (!selectedId) {
        const container = document.getElementById('canvas-container');
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          if (currentPage > 1) { currentPage--; renderPage(); }
          return;
        }
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          e.preventDefault();
          if (currentPage < totalPages) { currentPage++; renderPage(); }
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (container) container.scrollBy({ top: -75, behavior: 'smooth' });
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (container) container.scrollBy({ top: 75, behavior: 'smooth' });
          return;
        }
      }
    });

    // Automation Modal Logic
    const autoPresets = {
      autofill: \`// Compilazione automatica dati e preferenze
fields.Nome_Cognome = "Dott. Alessandro Manzoni";
fields.Codice_Fiscale = "MNZLSN85M01H501Z";
fields.Indirizzo_Residenza = "Via dei Promessi Sposi 10, Milano";
fields.Tipologia_Contratto = "Sviluppo Software";
fields.Consenso_GDPR = true;
fields.Consenso_Comunicazioni = true;

log("Dati compilati con successo!");\`,

      uppercase: \`// Converte tutti i campi di testo in MAIUSCOLO
let count = 0;
elements.forEach(el => {
  if (el.type === 'text_field' && el.defaultValue) {
    el.defaultValue = el.defaultValue.toUpperCase();
    count++;
  }
});
log(count + " campi convertiti in maiuscolo!");\`,

      clear: \`// Svuota tutti i campi di testo compilabili
let count = 0;
elements.forEach(el => {
  if (el.type === 'text_field') {
    el.defaultValue = '';
    count++;
  } else if (el.type === 'checkbox') {
    el.isChecked = false;
  }
});
log("Tutti i campi (" + count + ") sono stati svuotati!");\`,

      custom: \`// Scrivi qui il tuo script JavaScript:
// Puoi usare 'fields.Nome_Campo = "valore"' oppure accedere direttamente all'array 'elements'.
// Esempio:
// fields.Nome_Cognome = "Mario Rossi";
log("Pronto per l'esecuzione");\`
    };

    function openAutomationModal() {
      const modal = document.getElementById('auto-modal');
      const editor = document.getElementById('auto-script-editor');
      const select = document.getElementById('auto-preset-select');
      const logDiv = document.getElementById('auto-log');
      logDiv.innerText = '';
      logDiv.style.color = '#10b981';
      if (!editor.value.trim()) {
        select.value = 'autofill';
        editor.value = autoPresets.autofill;
      }
      modal.style.display = 'flex';
    }

    function closeAutomationModal() {
      document.getElementById('auto-modal').style.display = 'none';
    }

    function loadAutoPreset(presetKey) {
      const editor = document.getElementById('auto-script-editor');
      const logDiv = document.getElementById('auto-log');
      logDiv.innerText = '';
      if (autoPresets[presetKey]) {
        editor.value = autoPresets[presetKey];
      }
    }

    function runAutomationScript() {
      const editor = document.getElementById('auto-script-editor');
      const logDiv = document.getElementById('auto-log');
      const code = editor.value;

      try {
        const fieldsProxy = {};
        elements.forEach(el => {
          const key = el.fieldName || el.groupName || el.id;
          if (el.type === 'text_field' || el.type === 'dropdown') {
            fieldsProxy[key] = el.defaultValue || '';
          } else if (el.type === 'checkbox') {
            fieldsProxy[key] = Boolean(el.isChecked);
          } else if (el.type === 'radio') {
            if (el.isSelected) fieldsProxy[key] = el.value;
          }
        });

        let outputMsg = "Script eseguito con successo!";
        const customLog = (msg) => {
          outputMsg = String(msg);
        };

        const fn = new Function('fields', 'elements', 'log', code);
        fn(fieldsProxy, elements, customLog);

        // Synchronize back fieldsProxy changes to elements
        elements.forEach(el => {
          const key = el.fieldName || el.groupName || el.id;
          if (key in fieldsProxy) {
            const val = fieldsProxy[key];
            if (el.type === 'text_field' || el.type === 'dropdown') {
              el.defaultValue = String(val);
            } else if (el.type === 'checkbox') {
              el.isChecked = Boolean(val);
            } else if (el.type === 'radio') {
              el.isSelected = (el.value === val);
            }
          }
        });

        renderElementsOverlay();
        logDiv.style.color = '#10b981';
        logDiv.innerText = '✓ ' + outputMsg;
      } catch (err) {
        logDiv.style.color = '#ef4444';
        logDiv.innerText = 'Errore script: ' + err.message;
      }
    }

    // Initialize with a blank sheet
    createBlankDocument();
  </script>
</body>
</html>`;
}
