import React from 'react';
import { Download, CheckCircle2, Monitor, ShieldCheck, Sparkles, X, Terminal, Cpu } from 'lucide-react';
import { generateStandaloneHtml } from '../utils/standaloneHtmlGenerator';

interface StandaloneInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StandaloneInfoModal: React.FC<StandaloneInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleDownloadStandalone = () => {
    const htmlContent = generateStandaloneHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'PDF_Studio_Standalone.html';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            100% Standalone & Offline a Doppio Click
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Sì, è possibile avere l'Editor PDF in un solo file HTML!
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed max-w-xl">
            Puoi salvarlo sul tuo desktop e aprirlo con un doppio click del mouse su qualsiasi computer (Windows, Mac, Linux), senza installare alcun server.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Main download card */}
          <div className="bg-blue-50/70 border-2 border-blue-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Scarica il file .HTML Standalone</h3>
              <p className="text-xs text-slate-600 mt-1">
                Singolo file autonomo con motore grafico, campi AcroForms, firme e annotazioni integrati.
              </p>
            </div>
            <button
              onClick={handleDownloadStandalone}
              className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2.5 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow-md transition-all transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              Scarica .HTML (Doppio Click)
            </button>
          </div>

          {/* How it works */}
          <div>
            <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              Come funziona tecnicamente senza server?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2 font-bold text-xs">
                  1
                </div>
                <h5 className="font-semibold text-xs text-slate-800 mb-1">Nessun Server Richiesto</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  I browser moderni eseguono JavaScript direttamente sul tuo processore. Il file si apre tramite protocollo locale <code className="bg-slate-200 px-1 rounded-sm">file:///</code>.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 font-bold text-xs">
                  2
                </div>
                <h5 className="font-semibold text-xs text-slate-800 mb-1">Elaborazione PDF in RAM</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Grazie alle Web API (FileReader, ArrayBuffer, Canvas e PDF-Lib), la lettura e scrittura dei binari PDF avviene al 100% nella memoria del tuo browser.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2 font-bold text-xs">
                  3
                </div>
                <h5 className="font-semibold text-xs text-slate-800 mb-1">Massima Privacy</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  I tuoi documenti e le tue firme non vengono mai inviati su server esterni o cloud: rimangono rigorosamente nel tuo computer locale.
                </p>
              </div>
            </div>
          </div>

          {/* Features check list */}
          <div>
            <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Funzionalità supportate:
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <strong>Campi di testo compilabili</strong> (AcroForm nativo)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <strong>Caselle Checkbox</strong> selezionabili
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <strong>Radio Button</strong> con raggruppamento
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <strong>Firme autografe</strong> (disegno mouse o touch)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <strong>Firme calligrafiche e caricate</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <strong>Inserimento e modifica testo</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <strong>Bianchetto / Correzione testo originale</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <strong>Inserimento loghi, timbri e immagini</strong>
              </li>
            </ul>
          </div>

          {/* Guide on launching */}
          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Monitor className="w-4 h-4 text-emerald-400" />
              Istruzioni per l'uso dopo il download:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>Clicca sul pulsante blu in alto per scaricare <code className="text-amber-300">PDF_Studio_Standalone.html</code>.</li>
              <li>Sposta il file dove preferisci (ad esempio sul Desktop o su una chiavetta USB).</li>
              <li>Fai semplicemente <strong>doppio click col mouse</strong> sul file: si aprirà istantaneamente nel tuo browser predefinito (Chrome, Edge, Safari, Firefox).</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
