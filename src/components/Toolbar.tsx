import React, { useRef } from 'react';
import { ToolType } from '../types';
import {
  MousePointer,
  FileText,
  CheckSquare,
  CircleDot,
  Type,
  Eraser,
  PenTool,
  Image as ImageIcon,
  Highlighter,
  Upload,
  FilePlus,
  BookOpen,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  ChevronDown,
  Edit3,
} from 'lucide-react';

interface ToolbarProps {
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onOpenSignatureModal: () => void;
  onOpenImageUpload: (file: File) => void;
  onOpenPdfFile: (file: File) => void;
  onCreateBlankPdf: () => void;
  onLoadSamplePdf: () => void;
  onExportPdf: (mode: 'interactive' | 'flatten') => void;
  onDownloadStandaloneHtml: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onSelectTool,
  onOpenSignatureModal,
  onOpenImageUpload,
  onOpenPdfFile,
  onCreateBlankPdf,
  onLoadSamplePdf,
  onExportPdf,
  onDownloadStandaloneHtml,
  zoom,
  onZoomChange,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [exportDropdownOpen, setExportDropdownOpen] = React.useState(false);

  const handlePdfInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenPdfFile(file);
      e.target.value = '';
    }
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenImageUpload(file);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 select-none shadow-xs z-30">
      {/* Top Main Navigation Bar */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100 flex-wrap gap-2">
        {/* Left: Brand and File Operations */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800 text-sm tracking-tight">PDF Studio</span>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded-sm border border-blue-200">
                  Standalone
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Editor PDF Client-Side</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="file"
              ref={pdfInputRef}
              accept=".pdf"
              className="hidden"
              onChange={handlePdfInputChange}
            />
            <button
              onClick={() => pdfInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              Apri PDF
            </button>

            <button
              onClick={onCreateBlankPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
            >
              <FilePlus className="w-3.5 h-3.5 text-emerald-600" />
              Nuovo A4
            </button>

            <button
              onClick={onLoadSamplePdf}
              title="Carica modulo di esempio con sezioni compilabili"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              Modulo Esempio
            </button>
          </div>
        </div>

        {/* Right: Standalone HTML Download & Export PDF */}
        <div className="flex items-center gap-2">
          {/* Standalone HTML File Button (Direct Download on Click) */}
          <button
            onClick={onDownloadStandaloneHtml}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 rounded-lg transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
            title="Scarica immediatamente questo editor completo in un unico file HTML offline (senza server)"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Scarica HTML Standalone (Offline)</span>
          </button>

          {/* Export PDF Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Esporta PDF</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {exportDropdownOpen && (
              <div
                className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs"
                onMouseLeave={() => setExportDropdownOpen(false)}
              >
                <button
                  onClick={() => {
                    onExportPdf('interactive');
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-blue-50/70 transition-colors flex flex-col"
                >
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    PDF Compilabile (AcroForms)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Campi di testo, checkbox e radio rimangono editabili e cliccabili
                  </span>
                </button>

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  onClick={() => {
                    onExportPdf('flatten');
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex flex-col"
                >
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    PDF Appiattito (Non Modificabile)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Tutto viene convertito in grafica e testo fisso
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Tool Icons Bar */}
      <div className="px-4 py-2 flex items-center justify-between bg-slate-50/70 flex-wrap gap-2">
        {/* Editing Tools */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Pointer / Select */}
          <button
            onClick={() => onSelectTool('select')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTool === 'select'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
            title="Seleziona, sposta e ridimensiona elementi"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Seleziona</span>
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1"></div>

          {/* Form Fields Group */}
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1 pr-0.5 hidden sm:inline">
            Moduli:
          </span>

          {/* Text Field */}
          <button
            onClick={() => onSelectTool('text_field')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTool === 'text_field'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
            title="Aggiungi campo di testo editabile per il PDF"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>Campo Testo</span>
          </button>

          {/* Checkbox */}
          <button
            onClick={() => onSelectTool('checkbox')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTool === 'checkbox'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
            title="Aggiungi casella di controllo (Checkbox)"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Checkbox</span>
          </button>

          {/* Radio */}
          <button
            onClick={() => onSelectTool('radio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTool === 'radio'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
            title="Aggiungi opzione Radio Button"
          >
            <CircleDot className="w-3.5 h-3.5 text-purple-600" />
            <span>Radio</span>
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1"></div>

          {/* Text & Whiteout Group */}
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1 pr-0.5 hidden sm:inline">
            Contenuti:
          </span>

          {/* Edit Existing Text */}
          <button
            onClick={() => onSelectTool('edit_existing_text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              currentTool === 'edit_existing_text'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
            title="Clicca su qualsiasi testo o parola già presente nel PDF per modificarla direttamente"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
            <span>Edita Testo Presente</span>
          </button>

          {/* Free Text */}
          <button
            onClick={() => onSelectTool('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTool === 'text'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
            title="Inserisci testo libero personalizzato"
          >
            <Type className="w-3.5 h-3.5 text-amber-600" />
            <span>Nuovo Testo</span>
          </button>

          {/* Whiteout / Edit Original Text */}
          <button
            onClick={() => onSelectTool('whiteout')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTool === 'whiteout'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
            title="Bianchetto: cancella o sovrascrivi parti di testo nel documento esistente"
          >
            <Eraser className="w-3.5 h-3.5 text-rose-500" />
            <span>Bianchetto / Modifica</span>
          </button>

          {/* Signature */}
          <button
            onClick={onOpenSignatureModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200/70 transition-all"
            title="Inserisci firma disegnata, digitata o caricata"
          >
            <PenTool className="w-3.5 h-3.5 text-indigo-600" />
            <span>Firma</span>
          </button>

          {/* Image */}
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageInputChange}
          />
          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200/70 transition-all"
            title="Inserisci logo, timbro o immagine"
          >
            <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
            <span>Immagine / Timbro</span>
          </button>

          {/* Highlight */}
          <button
            onClick={() => onSelectTool('highlight')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTool === 'highlight'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
            title="Evidenzia una porzione del documento"
          >
            <Highlighter className="w-3.5 h-3.5 text-yellow-500" />
            <span>Evidenzia</span>
          </button>
        </div>

        {/* Page & Zoom Controls */}
        <div className="flex items-center gap-3">
          {/* Page nav */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 text-xs text-slate-600 bg-white px-2 py-1 border border-slate-200 rounded-md">
              <button
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="px-1 font-bold disabled:opacity-30 hover:text-blue-600"
              >
                ◀
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="px-1 font-bold disabled:opacity-30 hover:text-blue-600"
              >
                ▶
              </button>
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-white px-2 py-0.5 border border-slate-200 rounded-md text-xs">
            <button
              onClick={() => onZoomChange(Math.max(0.4, zoom - 0.15))}
              className="p-1 hover:text-blue-600 transition-colors"
              title="Riduci zoom"
            >
              <ZoomOut className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <span className="font-semibold text-slate-700 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => onZoomChange(Math.min(2.0, zoom + 0.15))}
              className="p-1 hover:text-blue-600 transition-colors"
              title="Aumenta zoom"
            >
              <ZoomIn className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
              onClick={() => onZoomChange(1.0)}
              className="p-1 hover:text-blue-600 border-l border-slate-200 ml-1 pl-1.5 transition-colors"
              title="Reimposta 100%"
            >
              <Maximize2 className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
