import React from 'react';
import { EditorElement } from '../types';
import {
  Layers,
  FileText,
  CheckSquare,
  CircleDot,
  Type,
  Eraser,
  PenTool,
  Image as ImageIcon,
  Highlighter,
  Trash2,
  ListFilter,
} from 'lucide-react';

interface SidebarProps {
  elements: EditorElement[];
  selectedId: string | null;
  onSelectElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  currentPage: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  elements,
  selectedId,
  onSelectElement,
  onDeleteElement,
  currentPage,
}) => {
  const pageElements = elements.filter((el) => el.pageIndex === currentPage - 1);

  const getIcon = (type: EditorElement['type']) => {
    switch (type) {
      case 'text_field':
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case 'checkbox':
        return <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case 'radio':
        return <CircleDot className="w-3.5 h-3.5 text-purple-600" />;
      case 'dropdown':
        return <ListFilter className="w-3.5 h-3.5 text-indigo-600" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-amber-600" />;
      case 'whiteout':
        return <Eraser className="w-3.5 h-3.5 text-rose-500" />;
      case 'signature':
        return <PenTool className="w-3.5 h-3.5 text-indigo-600" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-teal-600" />;
      case 'highlight':
        return <Highlighter className="w-3.5 h-3.5 text-yellow-500" />;
    }
  };

  const getLabel = (el: EditorElement) => {
    switch (el.type) {
      case 'text_field':
        return el.fieldName || 'Campo di Testo';
      case 'checkbox':
        return el.fieldName || 'Casella Checkbox';
      case 'radio':
        return `${el.groupName}: ${el.value}`;
      case 'dropdown':
        return el.fieldName || 'Menu a Tendina';
      case 'text':
        return el.text.slice(0, 18) + (el.text.length > 18 ? '...' : '') || 'Testo';
      case 'whiteout':
        return el.replacementText ? `Modifica: ${el.replacementText}` : 'Bianchetto';
      case 'signature':
        return 'Firma Apposta';
      case 'image':
        return el.title || 'Immagine / Timbro';
      case 'highlight':
        return 'Evidenziatore';
    }
  };

  return (
    <div className="w-60 bg-white border-r border-slate-200 flex flex-col h-full select-none">
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-600" />
          <span className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
            Elementi Pagina ({pageElements.length})
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {pageElements.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 mt-4 leading-relaxed">
            Nessun elemento ancora aggiunto a questa pagina.
            <div className="mt-2 text-[11px] text-slate-400">
              Usa la barra degli strumenti in alto per aggiungere campi o testi.
            </div>
          </div>
        ) : (
          pageElements.map((el) => {
            const isSelected = el.id === selectedId;
            return (
              <div
                key={el.id}
                onClick={() => onSelectElement(el.id)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-all ${
                  isSelected
                    ? 'bg-blue-50 border border-blue-200 text-blue-900 font-medium'
                    : 'hover:bg-slate-50 border border-transparent text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1 mr-2">
                  {getIcon(el.type)}
                  <span className="truncate">{getLabel(el)}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteElement(el.id);
                  }}
                  title="Elimina"
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-sm hover:bg-slate-200/60 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Quick stats footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 flex justify-between items-center">
        <span>Totale elementi: {elements.length}</span>
        <span className="font-medium text-emerald-600">Client-Side</span>
      </div>
    </div>
  );
};
