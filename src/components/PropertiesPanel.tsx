import React, { useRef } from 'react';
import { EditorElement, ImageElement } from '../types';
import {
  Trash2,
  Copy,
  Sliders,
  Type,
  CheckSquare,
  CircleDot,
  FileEdit,
  Palette,
  RotateCw,
  Upload,
  FlipHorizontal,
  FlipVertical,
  RefreshCw,
  Sun,
  Contrast,
  Image as ImageIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { COMMON_FONTS, getCssFontFamily } from '../utils/fontHelper';
import { getImageDimensions } from '../utils/imageHelper';

interface PropertiesPanelProps {
  selectedElement: EditorElement | null;
  onUpdateElement: (updated: EditorElement) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (el: EditorElement) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
}) => {
  if (!selectedElement) {
    return (
      <div className="w-72 bg-white border-l border-slate-200 p-5 flex flex-col items-center justify-center text-center text-slate-400 select-none">
        <Sliders className="w-10 h-10 mb-3 text-slate-300 stroke-[1.5]" />
        <h4 className="font-medium text-slate-700 text-sm mb-1">Nessun elemento selezionato</h4>
        <p className="text-xs text-slate-500 max-w-[200px]">
          Clicca su un campo modulo, testo, firma o immagine per modificarne le opzioni.
        </p>
      </div>
    );
  }

  const el = selectedElement;
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleReplaceImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && el.type === 'image') {
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
      e.target.value = '';
    }
  };

  const handleResetImageDimensions = async () => {
    if (el.type === 'image') {
      try {
        const dims = await getImageDimensions(el.imageDataUrl);
        // Scale to reasonable maximum while keeping exact aspect ratio
        let newW = dims.width;
        let newH = dims.height;
        const maxDim = 300;
        if (newW > maxDim || newH > maxDim) {
          const ratio = Math.min(maxDim / newW, maxDim / newH);
          newW = Math.round(newW * ratio);
          newH = Math.round(newH * ratio);
        }
        onUpdateElement({
          ...el,
          width: newW,
          height: newH,
        });
      } catch (err) {
        console.warn('Could not reset dimensions:', err);
      }
    }
  };

  return (
    <div className="w-72 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          {el.type === 'text_field' && <FileEdit className="w-4 h-4 text-blue-600" />}
          {el.type === 'checkbox' && <CheckSquare className="w-4 h-4 text-emerald-600" />}
          {el.type === 'radio' && <CircleDot className="w-4 h-4 text-purple-600" />}
          {el.type === 'text' && <Type className="w-4 h-4 text-amber-600" />}
          {el.type === 'whiteout' && <Palette className="w-4 h-4 text-slate-600" />}
          <span className="font-semibold text-xs uppercase tracking-wider text-slate-700">
            {el.type === 'text_field' && 'Campo di Testo'}
            {el.type === 'checkbox' && 'Casella Checkbox'}
            {el.type === 'radio' && 'Pulsante Radio'}
            {el.type === 'text' && 'Blocco Testo'}
            {el.type === 'whiteout' && 'Bianchetto / Modifica'}
            {el.type === 'signature' && 'Firma Apposta'}
            {el.type === 'image' && 'Immagine / Timbro'}
            {el.type === 'highlight' && 'Evidenziatore'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicateElement(el)}
            title="Duplica elemento"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteElement(el.id)}
            title="Elimina elemento"
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body Properties */}
      <div className="p-4 space-y-4 flex-1">
        {/* TEXT FIELD PROPERTIES */}
        {el.type === 'text_field' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Campo (AcroForm ID)
              </label>
              <input
                type="text"
                value={el.fieldName}
                onChange={(e) => onUpdateElement({ ...el, fieldName: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Identificativo univoco PDF</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valore Predefinito
              </label>
              <input
                type="text"
                value={el.defaultValue}
                onChange={(e) => onUpdateElement({ ...el, defaultValue: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                placeholder="Testo visibile inizialmente"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Font (pt)</label>
                <input
                  type="number"
                  min="6"
                  max="36"
                  value={el.fontSize}
                  onChange={(e) => onUpdateElement({ ...el, fontSize: parseInt(e.target.value) || 11 })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Colore Bordo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={el.borderColor || '#94a3b8'}
                    onChange={(e) => onUpdateElement({ ...el, borderColor: e.target.value })}
                    className="w-8 h-7 p-0 border border-slate-300 rounded-sm cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-500">{el.borderColor || '#94a3b8'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={el.isMultiline}
                  onChange={(e) => onUpdateElement({ ...el, isMultiline: e.target.checked })}
                  className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-700 font-medium">Testo Multiriga (Area Note)</span>
              </label>
            </div>
          </>
        )}

        {/* CHECKBOX PROPERTIES */}
        {el.type === 'checkbox' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Campo Checkbox</label>
              <input
                type="text"
                value={el.fieldName}
                onChange={(e) => onUpdateElement({ ...el, fieldName: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
              />
            </div>
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={el.isChecked}
                  onChange={(e) => onUpdateElement({ ...el, isChecked: e.target.checked })}
                  className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <div>
                  <div className="text-xs font-medium text-slate-800">Spuntata di default</div>
                  <div className="text-[10px] text-slate-400">Selezionata all'apertura del PDF</div>
                </div>
              </label>
            </div>
          </>
        )}

        {/* RADIO PROPERTIES */}
        {el.type === 'radio' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Gruppo Radio</label>
              <input
                type="text"
                value={el.groupName}
                onChange={(e) => onUpdateElement({ ...el, groupName: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                placeholder="es. SceltaMetodo"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">I radio con lo stesso gruppo sono mutuamente esclusivi</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Valore Opzione</label>
              <input
                type="text"
                value={el.value}
                onChange={(e) => onUpdateElement({ ...el, value: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                placeholder="es. Opzione_1"
              />
            </div>
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={el.isSelected}
                  onChange={(e) => onUpdateElement({ ...el, isSelected: e.target.checked })}
                  className="rounded-full border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-800">Selezionato di default</span>
              </label>
            </div>
          </>
        )}

        {/* TEXT PROPERTIES */}
        {el.type === 'text' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contenuto Testo</label>
              <textarea
                rows={3}
                value={el.text}
                onChange={(e) => onUpdateElement({ ...el, text: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dimensione (pt)</label>
                <input
                  type="number"
                  min="6"
                  max="72"
                  step="0.5"
                  value={el.fontSize}
                  onChange={(e) => onUpdateElement({ ...el, fontSize: parseFloat(e.target.value) || 12 })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Carattere</label>
                <select
                  value={el.fontFamily}
                  onChange={(e) => onUpdateElement({ ...el, fontFamily: e.target.value as any })}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md truncate"
                >
                  {COMMON_FONTS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                  {/* If the current font is detected from the PDF and not in the default list */}
                  {!COMMON_FONTS.some((f) => f.key === el.fontFamily) && el.fontFamily && (
                    <option value={el.fontFamily}>{el.fontFamily} (PDF Original)</option>
                  )}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={el.color || '#000000'}
                  onChange={(e) => onUpdateElement({ ...el, color: e.target.value })}
                  className="w-7 h-7 p-0 border border-slate-300 rounded-sm cursor-pointer"
                />
                <span className="text-xs text-slate-600">Colore</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-slate-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={el.isBold}
                    onChange={(e) => onUpdateElement({ ...el, isBold: e.target.checked })}
                    className="rounded-sm"
                  />
                  <span>Grassetto</span>
                </label>
                <label className="flex items-center gap-1 text-xs text-slate-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={el.isItalic || false}
                    onChange={(e) => onUpdateElement({ ...el, isItalic: e.target.checked })}
                    className="rounded-sm"
                  />
                  <span>Corsivo</span>
                </label>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={el.backgroundColor === '#ffffff'}
                  onChange={(e) =>
                    onUpdateElement({
                      ...el,
                      backgroundColor: e.target.checked ? '#ffffff' : 'transparent',
                    })
                  }
                  className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Sfondo Bianco Coprente</span>
                  <span className="text-[10px] text-slate-500 block">Copre il testo/grafica originale del PDF</span>
                </div>
              </label>
            </div>
          </>
        )}

        {/* WHITEOUT (BIANCHETTO / SOSTITUISCI TESTO) PROPERTIES */}
        {el.type === 'whiteout' && (
          <>
            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900 text-xs leading-relaxed">
              <strong>Strumento Bianchetto:</strong> Copre il testo o la grafica originale sottostante con un rettangolo opaco bianco, consentendoti di scrivere nuovo testo correttivo sopra!
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nuovo Testo Sostitutivo (opzionale)
              </label>
              <input
                type="text"
                value={el.replacementText || ''}
                onChange={(e) => onUpdateElement({ ...el, replacementText: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                placeholder="Scrivi qui per sovrascrivere..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Font (pt)</label>
                <input
                  type="number"
                  min="6"
                  max="36"
                  value={el.replacementFontSize || 11}
                  onChange={(e) => onUpdateElement({ ...el, replacementFontSize: parseInt(e.target.value) || 11 })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Colore</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={el.replacementColor || '#111827'}
                    onChange={(e) => onUpdateElement({ ...el, replacementColor: e.target.value })}
                    className="w-7 h-7 p-0 border border-slate-300 rounded-sm cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-500">{el.replacementColor || '#111827'}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* SIGNATURE PROPERTIES */}
        {el.type === 'signature' && (
          <>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
              <img
                src={el.imageDataUrl}
                alt="Anteprima Firma"
                className="max-h-24 max-w-full object-contain"
              />
            </div>
            <div className="text-xs text-slate-500">
              Dimensioni: {Math.round(el.width)} x {Math.round(el.height)} pt
            </div>
            <div className="text-[11px] text-slate-400">
              Trascina la maniglia nell'angolo in basso a destra per ridimensionare la firma sul foglio.
            </div>
          </>
        )}

        {/* IMAGE PROPERTIES & FULL EDITING TOOLS */}
        {el.type === 'image' && (
          <div className="space-y-3">
            {/* Live Preview Box */}
            <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-lg flex flex-col items-center justify-center gap-2 overflow-hidden">
              <div className="max-h-28 max-w-full flex items-center justify-center overflow-hidden">
                <img
                  src={el.imageDataUrl}
                  alt="Anteprima Immagine"
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
                  className="max-h-28 max-w-full object-contain"
                />
              </div>
              <span className="text-[10px] text-slate-400 truncate max-w-[220px]">
                {el.title || 'Immagine incorporata'}
              </span>
            </div>

            {/* Replace Image Button */}
            <div>
              <button
                type="button"
                onClick={() => imageFileInputRef.current?.click()}
                className="w-full py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Sostituisci con altra immagine...</span>
              </button>
              <input
                type="file"
                ref={imageFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleReplaceImage}
              />
            </div>

            {/* Dimensions (Width & Height) */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Dimensioni (pt)</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Larghezza</span>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={Math.round(el.width)}
                    onChange={(e) => onUpdateElement({ ...el, width: Math.max(10, parseInt(e.target.value) || 10) })}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Altezza</span>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={Math.round(el.height)}
                    onChange={(e) => onUpdateElement({ ...el, height: Math.max(10, parseInt(e.target.value) || 10) })}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetImageDimensions}
                className="mt-1.5 w-full text-[11px] text-slate-600 hover:text-blue-600 hover:bg-slate-50 py-1 rounded border border-slate-200 flex items-center justify-center gap-1 transition-colors"
                title="Ripristina le proporzioni originali della foto"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Ripristina proporzioni originali</span>
              </button>
            </div>

            {/* Flip / Reflection */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Riflessione (Specchio)</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateElement({ ...el, flipX: !el.flipX })}
                  className={`py-1 px-2 text-xs rounded-md border font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    el.flipX
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Orizzontale</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateElement({ ...el, flipY: !el.flipY })}
                  className={`py-1 px-2 text-xs rounded-md border font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    el.flipY
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>Verticale</span>
                </button>
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Opacità / Trasparenza</span>
                <span className="font-mono text-slate-500 text-[11px]">
                  {Math.round((el.opacity !== undefined ? el.opacity : 1) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={el.opacity !== undefined ? el.opacity : 1}
                onChange={(e) => onUpdateElement({ ...el, opacity: parseFloat(e.target.value) })}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Brightness & Contrast */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-500" />
                    Luminosità
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    {el.brightness !== undefined ? el.brightness : 100}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  step="5"
                  value={el.brightness !== undefined ? el.brightness : 100}
                  onChange={(e) => onUpdateElement({ ...el, brightness: parseInt(e.target.value) })}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Contrast className="w-3 h-3 text-slate-600" />
                    Contrasto
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    {el.contrast !== undefined ? el.contrast : 100}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  step="5"
                  value={el.contrast !== undefined ? el.contrast : 100}
                  onChange={(e) => onUpdateElement({ ...el, contrast: parseInt(e.target.value) })}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Quick Filter Effects */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Filtri ed Effetti</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateElement({ ...el, grayscale: !el.grayscale })}
                  className={`py-1 text-[11px] rounded-md border font-medium transition-all ${
                    el.grayscale
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  B/N
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateElement({ ...el, sepia: !el.sepia })}
                  className={`py-1 text-[11px] rounded-md border font-medium transition-all ${
                    el.sepia
                      ? 'bg-amber-700 text-white border-amber-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Seppia
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateElement({ ...el, invert: !el.invert })}
                  className={`py-1 text-[11px] rounded-md border font-medium transition-all ${
                    el.invert
                      ? 'bg-indigo-700 text-white border-indigo-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Inverti
                </button>
              </div>

              {(el.grayscale || el.sepia || el.invert || el.brightness !== 100 || el.contrast !== 100) && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateElement({
                      ...el,
                      grayscale: false,
                      sepia: false,
                      invert: false,
                      brightness: 100,
                      contrast: 100,
                    })
                  }
                  className="mt-1.5 w-full text-[10px] text-rose-600 hover:bg-rose-50 py-0.5 rounded border border-rose-200 transition-colors"
                >
                  Azzera tutti i filtri visivi
                </button>
              )}
            </div>

            {/* Borders & Corners */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bordi e Angoli</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Spessore Bordo</span>
                  <select
                    value={el.borderWidth || 0}
                    onChange={(e) => onUpdateElement({ ...el, borderWidth: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md"
                  >
                    <option value="0">Nessuno</option>
                    <option value="1">1 pt</option>
                    <option value="2">2 pt</option>
                    <option value="3">3 pt</option>
                    <option value="4">4 pt</option>
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Colore Bordo</span>
                  <input
                    type="color"
                    value={el.borderColor || '#000000'}
                    onChange={(e) => onUpdateElement({ ...el, borderColor: e.target.value })}
                    disabled={!el.borderWidth}
                    className="w-full h-7 p-0 border border-slate-300 rounded-sm cursor-pointer disabled:opacity-30"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[10px] text-slate-500">Arrotondamento angoli</span>
                  <span className="font-mono text-slate-500 text-[10px]">{el.borderRadius || 0}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="2"
                  value={el.borderRadius || 0}
                  onChange={(e) => onUpdateElement({ ...el, borderRadius: parseInt(e.target.value) || 0 })}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Rotation Controls (Continuous Degrees, Slider & Precision Tuning) */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-blue-600" />
              Rotazione in Gradi:
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="360"
                value={el.rotation || 0}
                onChange={(e) => {
                  let deg = parseInt(e.target.value) || 0;
                  deg = ((deg % 360) + 360) % 360;
                  onUpdateElement({ ...el, rotation: deg });
                }}
                className="w-16 px-1.5 py-0.5 text-right font-mono text-xs font-bold text-blue-600 border border-slate-300 rounded bg-white"
              />
              <span className="text-xs text-slate-500 font-bold">°</span>
            </div>
          </div>

          {/* Continuous Range Slider (0° - 360°) */}
          <div className="mb-2">
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={el.rotation || 0}
              onChange={(e) => onUpdateElement({ ...el, rotation: parseInt(e.target.value) || 0 })}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
              <span>0°</span>
              <span>90°</span>
              <span>180°</span>
              <span>270°</span>
              <span>360°</span>
            </div>
          </div>

          {/* Precision Micro-Adjustments (-5°, -1°, 0°, +1°, +5°) */}
          <div className="flex items-center gap-1 mb-2">
            <button
              type="button"
              onClick={() => onUpdateElement({ ...el, rotation: (((el.rotation || 0) - 5 + 360) % 360) })}
              className="flex-1 py-1 text-[11px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded font-medium cursor-pointer transition-colors"
              title="Ruota di -5 gradi"
            >
              -5°
            </button>
            <button
              type="button"
              onClick={() => onUpdateElement({ ...el, rotation: (((el.rotation || 0) - 1 + 360) % 360) })}
              className="flex-1 py-1 text-[11px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded font-medium cursor-pointer transition-colors"
              title="Ruota di -1 grado"
            >
              -1°
            </button>
            <button
              type="button"
              onClick={() => onUpdateElement({ ...el, rotation: 0 })}
              className="flex-1 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium cursor-pointer text-center transition-colors"
              title="Ripristina a 0 gradi"
            >
              0°
            </button>
            <button
              type="button"
              onClick={() => onUpdateElement({ ...el, rotation: (((el.rotation || 0) + 1) % 360) })}
              className="flex-1 py-1 text-[11px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded font-medium cursor-pointer transition-colors"
              title="Ruota di +1 grado"
            >
              +1°
            </button>
            <button
              type="button"
              onClick={() => onUpdateElement({ ...el, rotation: (((el.rotation || 0) + 5) % 360) })}
              className="flex-1 py-1 text-[11px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded font-medium cursor-pointer transition-colors"
              title="Ruota di +5 gradi"
            >
              +5°
            </button>
          </div>

          {/* Quick Preset Angles */}
          <div className="grid grid-cols-5 gap-1">
            {[0, 45, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                type="button"
                onClick={() => onUpdateElement({ ...el, rotation: deg })}
                className={`py-1 text-[11px] rounded border font-medium transition-all cursor-pointer ${
                  (el.rotation || 0) === deg
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>

        {/* Position coordinates info */}
        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
          <span>X: {Math.round(el.x)} pt</span>
          <span>Y: {Math.round(el.y)} pt</span>
          <span>W: {Math.round(el.width)} pt</span>
          <span>H: {Math.round(el.height)} pt</span>
        </div>
      </div>
    </div>
  );
};
