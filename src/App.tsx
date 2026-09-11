import React, { useState, useEffect, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { PageViewer } from './components/PageViewer';
import { PropertiesPanel } from './components/PropertiesPanel';
import { SignatureModal } from './components/SignatureModal';
import { AutomationModal } from './components/AutomationModal';
import { EditorElement, ToolType } from './types';
import { createSampleContractPdf, createBlankPdf, getSampleElements } from './utils/samplePdf';
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
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState<boolean>(false);
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

        // Pre-place calibrated sample interactive elements including Dropdown
        setElements(getSampleElements());
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
    setElements(getSampleElements());
    setSelectedId(null);
    showToast('Modulo di esempio caricato con sezioni e campi calibrati');
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

  // Keyboard shortcuts: fine-movement of selected elements, delete, page change and page scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input, textarea or contentEditable
      const targetTag = (e.target as HTMLElement)?.tagName;
      const isInputFocused =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag) ||
        (e.target as HTMLElement)?.isContentEditable;

      if (isInputFocused) return;

      // 1. DELETE / BACKSPACE: delete selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        handleDeleteElement(selectedId);
        return;
      }

      // 2. ESCAPE: deselect element and reset tool
      if (e.key === 'Escape') {
        setSelectedId(null);
        setCurrentTool('select');
        return;
      }

      const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      const isPageKey = ['PageUp', 'PageDown', 'Home', 'End'].includes(e.key);

      // CASE A: A field/element IS SELECTED -> Nudge / Fine-tune movement with Arrow keys
      if (selectedId && isArrowKey) {
        const target = elements.find((el) => el.id === selectedId);
        if (!target) return;

        e.preventDefault();
        // Fine movement: 1px by default, 10px if holding Shift
        const step = e.shiftKey ? 10 : 1;
        let nextX = target.x;
        let nextY = target.y;

        if (e.key === 'ArrowUp') nextY = Math.max(0, target.y - step);
        if (e.key === 'ArrowDown') nextY = target.y + step;
        if (e.key === 'ArrowLeft') nextX = Math.max(0, target.x - step);
        if (e.key === 'ArrowRight') nextX = target.x + step;

        handleUpdateElement({
          ...target,
          x: nextX,
          y: nextY,
        });
        return;
      }

      // CASE B: NOTHING IS SELECTED -> Page change and Page movement
      if (!selectedId && (isArrowKey || isPageKey)) {
        const scrollContainer = document.getElementById('pdf-viewer-scroll-container');

        // Page changing with ArrowLeft / ArrowRight or PageUp / PageDown
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          if (currentPage > 1) {
            setCurrentPage((p) => p - 1);
            showToast(`Pagina ${currentPage - 1} di ${totalPages}`);
          }
          return;
        }

        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          e.preventDefault();
          if (currentPage < totalPages) {
            setCurrentPage((p) => p + 1);
            showToast(`Pagina ${currentPage + 1} di ${totalPages}`);
          }
          return;
        }

        if (e.key === 'Home') {
          e.preventDefault();
          if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
          if (currentPage !== 1) {
            setCurrentPage(1);
            showToast(`Pagina 1 di ${totalPages}`);
          }
          return;
        }

        if (e.key === 'End') {
          e.preventDefault();
          if (currentPage !== totalPages) {
            setCurrentPage(totalPages);
            showToast(`Pagina ${totalPages} di ${totalPages}`);
          }
          if (scrollContainer) scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
          return;
        }

        // Page movement / scrolling with ArrowUp / ArrowDown
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (scrollContainer) {
            const isAtTop = scrollContainer.scrollTop <= 5;
            if (isAtTop && currentPage > 1) {
              // Boundary reached: go to previous page and scroll to its bottom
              setCurrentPage((p) => p - 1);
              showToast(`Pagina ${currentPage - 1} di ${totalPages}`);
              setTimeout(() => {
                scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'auto' });
              }, 50);
            } else {
              // Smoothly move/scroll page up
              scrollContainer.scrollBy({ top: -75, behavior: 'smooth' });
            }
          }
          return;
        }

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (scrollContainer) {
            const isAtBottom =
              scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight <= 5;
            if (isAtBottom && currentPage < totalPages) {
              // Boundary reached: go to next page and scroll to its top
              setCurrentPage((p) => p + 1);
              showToast(`Pagina ${currentPage + 1} di ${totalPages}`);
              setTimeout(() => {
                scrollContainer.scrollTo({ top: 0, behavior: 'auto' });
              }, 50);
            } else {
              // Smoothly move/scroll page down
              scrollContainer.scrollBy({ top: 75, behavior: 'smooth' });
            }
          }
          return;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements, currentPage, totalPages]);

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
        onOpenAutomationModal={() => setIsAutomationModalOpen(true)}
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

      {/* Automation & Scripting Modal */}
      <AutomationModal
        isOpen={isAutomationModalOpen}
        onClose={() => setIsAutomationModalOpen(false)}
        elements={elements}
        onApplyScript={(updatedElements, msg) => {
          setElements(updatedElements);
          showToast(msg);
        }}
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
