import React, { useState, useEffect, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { PageViewer } from './components/PageViewer';
import { PropertiesPanel } from './components/PropertiesPanel';
import { SignatureModal } from './components/SignatureModal';
import { EditorElement, ToolType } from './types';
import { createSampleContractPdf, createBlankPdf } from './utils/samplePdf';
import { exportPdfWithElements } from './utils/pdfGenerator';
import { parsePdfElements } from './utils/pdfParser';
import { generateStandaloneHtml } from './utils/standaloneHtmlGenerator';
import { PDFDocument } from 'pdf-lib';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.0);
  const [currentTool, setCurrentTool] = useState<ToolType>('select');
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modals
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Initialize with sample document
  useEffect(() => {
    async function init() {
      try {
        const sampleBytes = await createSampleContractPdf();
        setPdfBytes(sampleBytes);
        setTotalPages(1);

        // Pre-place starter sample interactive elements
        const starterElements: EditorElement[] = [
          {
            id: 'tf_nome',
            pageIndex: 0,
            type: 'text_field',
            fieldName: 'Nome_Cognome',
            defaultValue: 'Mario Rossi',
            fontSize: 10.5,
            fontColor: '#0f172a',
            borderColor: '#3b82f6',
            backgroundColor: '#ffffff',
            isMultiline: false,
            isRequired: true,
            x: 142,
            y: 147,
            width: 142,
            height: 20,
          },
          {
            id: 'tf_cf',
            pageIndex: 0,
            type: 'text_field',
            fieldName: 'Codice_Fiscale',
            defaultValue: 'RSSMRA85M01H501Z',
            fontSize: 10,
            fontColor: '#0f172a',
            borderColor: '#3b82f6',
            backgroundColor: '#ffffff',
            isMultiline: false,
            isRequired: true,
            x: 422,
            y: 147,
            width: 132,
            height: 20,
          },
          {
            id: 'tf_indirizzo',
            pageIndex: 0,
            type: 'text_field',
            fieldName: 'Indirizzo_Residenza',
            defaultValue: 'Via Roma 42, 20121 Milano (MI)',
            fontSize: 10,
            fontColor: '#0f172a',
            borderColor: '#3b82f6',
            backgroundColor: '#ffffff',
            isMultiline: false,
            isRequired: false,
            x: 157,
            y: 182,
            width: 396,
            height: 20,
          },
          {
            id: 'rd_presenza',
            pageIndex: 0,
            type: 'radio',
            groupName: 'Modalita_Servizio',
            value: 'InPresenza',
            isSelected: true,
            borderColor: '#1d4ed8',
            x: 44,
            y: 254,
            width: 15,
            height: 15,
          },
          {
            id: 'rd_remoto',
            pageIndex: 0,
            type: 'radio',
            groupName: 'Modalita_Servizio',
            value: 'Smartworking',
            isSelected: false,
            borderColor: '#334155',
            x: 264,
            y: 254,
            width: 15,
            height: 15,
          },
          {
            id: 'cb_privacy',
            pageIndex: 0,
            type: 'checkbox',
            fieldName: 'Consenso_GDPR',
            isChecked: true,
            borderColor: '#047857',
            backgroundColor: '#ffffff',
            x: 42,
            y: 317,
            width: 16,
            height: 16,
          },
          {
            id: 'cb_newsletter',
            pageIndex: 0,
            type: 'checkbox',
            fieldName: 'Consenso_Comunicazioni',
            isChecked: false,
            borderColor: '#334155',
            backgroundColor: '#ffffff',
            x: 42,
            y: 339,
            width: 16,
            height: 16,
          },
        ];

        setElements(starterElements);
      } catch (err) {
        console.error('Error loading sample pdf:', err);
      }
    }
    init();
  }, []);

  // Update total pages when pdfBytes changes
  const updatePdfInfo = async (bytes: Uint8Array) => {
    try {
      const doc = await PDFDocument.load(bytes.slice());
      setTotalPages(doc.getPageCount());
      setCurrentPage(1);
    } catch (err) {
      console.warn('Error reading pdf info:', err);
      setTotalPages(1);
    }
  };

  // Handlers
  const handleOpenPdfFile = async (file: File) => {
    try {
      showToast('Caricamento ed estrazione campi in corso...');
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      setPdfBytes(bytes);
      await updatePdfInfo(bytes);

      // Extract existing AcroForm fields (text fields, checkboxes, radios, dropdowns)
      // or restore embedded editor elements from previously exported PDFs
      const extractedElements = await parsePdfElements(bytes);
      setElements(extractedElements);
      setSelectedId(null);

      if (extractedElements.length > 0) {
        showToast(
          `Documento "${file.name}" aperto: rilevati ${extractedElements.length} campi pronti da modificare o eliminare!`
        );
      } else {
        showToast(`Documento "${file.name}" aperto con successo!`);
      }
    } catch (err: any) {
      alert(`Errore apertura file: ${err.message}`);
    }
  };

  const handleCreateBlankPdf = async () => {
    const bytes = await createBlankPdf(1);
    setPdfBytes(bytes);
    setTotalPages(1);
    setCurrentPage(1);
    setElements([]);
    setSelectedId(null);
    showToast('Creato nuovo foglio bianco A4');
  };

  const handleLoadSamplePdf = async () => {
    const bytes = await createSampleContractPdf();
    setPdfBytes(bytes);
    setTotalPages(1);
    setCurrentPage(1);
    setElements([]);
    setSelectedId(null);
    showToast('Modulo di esempio caricato con sezioni compilabili');
  };

  const handleExportPdf = async (mode: 'interactive' | 'flatten') => {
    if (!pdfBytes) return;
    try {
      showToast('Generazione PDF in corso...');
      const outBytes = await exportPdfWithElements(pdfBytes, elements, mode);
      const blob = new Blob([outBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download =
        mode === 'interactive' ? 'documento_compilabile.pdf' : 'documento_appiattito.pdf';
      link.click();
      showToast(
        mode === 'interactive'
          ? 'PDF esportato con campi interattivi AcroForm!'
          : 'PDF esportato e appiattito con successo!'
      );
    } catch (err: any) {
      console.error(err);
      alert(`Errore durante l'esportazione: ${err.message}`);
    }
  };

  const handleDownloadStandaloneHtml = () => {
    try {
      showToast('Generazione file HTML offline in corso...');
      const htmlContent = generateStandaloneHtml();
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'PDF_Studio_Standalone.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('File "PDF_Studio_Standalone.html" scaricato! Aprilo direttamente con doppio click.');
    } catch (err: any) {
      console.error(err);
      alert(`Errore durante il download del file HTML standalone: ${err.message}`);
    }
  };

  const handleConfirmSignature = (dataUrl: string) => {
    const newEl: EditorElement = {
      id: `sig_${Date.now()}`,
      pageIndex: currentPage - 1,
      type: 'signature',
      imageDataUrl: dataUrl,
      x: 345,
      y: 545,
      width: 165,
      height: 52,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
    setCurrentTool('select');
    showToast('Firma inserita! Puoi trascinarla e posizionarla sul foglio.');
  };

  const handleOpenImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        const newEl: EditorElement = {
          id: `img_${Date.now()}`,
          pageIndex: currentPage - 1,
          type: 'image',
          imageDataUrl: dataUrl,
          title: file.name,
          x: 200,
          y: 200,
          width: 140,
          height: 100,
        };
        setElements((prev) => [...prev, newEl]);
        setSelectedId(newEl.id);
        setCurrentTool('select');
        showToast('Immagine caricata e posizionata sul documento');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddElement = (el: EditorElement) => {
    setElements((prev) => [...prev, el]);
  };

  const handleUpdateElement = (updated: EditorElement) => {
    setElements((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleDeleteElement = (id: string) => {
    const target = elements.find((item) => item.id === id);
    if (target && target.type === 'image' && (target as any).isOriginalPdfImage) {
      const origX = (target as any).originalX ?? target.x;
      const origY = (target as any).originalY ?? target.y;
      const origW = (target as any).originalWidth ?? target.width;
      const origH = (target as any).originalHeight ?? target.height;
      const whiteoutEl: EditorElement = {
        id: `wo_del_${Date.now()}`,
        pageIndex: target.pageIndex,
        type: 'whiteout',
        x: origX,
        y: origY,
        width: origW,
        height: origH,
        rotation: (target as any).originalRotation || 0,
      };
      setElements((prev) => [...prev.filter((item) => item.id !== id), whiteoutEl]);
      showToast('Immagine del PDF rimossa con successo');
    } else {
      setElements((prev) => prev.filter((item) => item.id !== id));
    }
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const handleSyncPageImages = (extractedImages: EditorElement[]) => {
    setElements((prev) => {
      const toAdd = extractedImages.filter((ext) => {
        return !prev.some(
          (p) =>
            p.pageIndex === ext.pageIndex &&
            (p.id === ext.id ||
              ((p as any).isOriginalPdfImage &&
                Math.abs(p.x - ext.x) < 2 &&
                Math.abs(p.y - ext.y) < 2))
        );
      });
      if (toAdd.length === 0) return prev;
      return [...prev, ...toAdd];
    });
  };

  const handleDuplicateElement = (el: EditorElement) => {
    const copy: EditorElement = {
      ...el,
      id: `el_${Date.now()}`,
      x: Math.min(el.x + 20, 500),
      y: Math.min(el.y + 20, 750),
      ...(el.type === 'text_field' || el.type === 'checkbox'
        ? { fieldName: `${(el as any).fieldName}_copia` }
        : {}),
    };
    setElements((prev) => [...prev, copy]);
    setSelectedId(copy.id);
    showToast('Elemento duplicato');
  };

  // Keyboard shortcut delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedId &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        handleDeleteElement(selectedId);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setCurrentTool('select');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 text-slate-900 overflow-hidden font-sans">
      {/* Main Top Toolbar */}
      <Toolbar
        currentTool={currentTool}
        onSelectTool={setCurrentTool}
        onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
        onOpenImageUpload={handleOpenImageUpload}
        onOpenPdfFile={handleOpenPdfFile}
        onCreateBlankPdf={handleCreateBlankPdf}
        onLoadSamplePdf={handleLoadSamplePdf}
        onExportPdf={handleExportPdf}
        onDownloadStandaloneHtml={handleDownloadStandaloneHtml}
        zoom={zoom}
        onZoomChange={setZoom}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Main Workspace Area (Sidebar + PageViewer + PropertiesPanel) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Elements / Layer explorer */}
        <Sidebar
          elements={elements}
          selectedId={selectedId}
          onSelectElement={setSelectedId}
          onDeleteElement={handleDeleteElement}
          currentPage={currentPage}
        />

        {/* Central PDF Canvas + Interaction Layer */}
        <PageViewer
          pdfBytes={pdfBytes}
          currentPage={currentPage}
          zoom={zoom}
          elements={elements}
          selectedId={selectedId}
          currentTool={currentTool}
          onSelectElement={setSelectedId}
          onAddElement={handleAddElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onToolUsed={() => setCurrentTool('select')}
          onSyncPageImages={handleSyncPageImages}
        />

        {/* Right Element Property Inspector */}
        <PropertiesPanel
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
        />
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onConfirm={handleConfirmSignature}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
