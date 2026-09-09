import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Type, Upload, Trash2, Check, X } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dataUrl: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [tab, setTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('Mario Rossi');
  const [selectedStyle, setSelectedStyle] = useState(0);
  const [strokeColor, setStrokeColor] = useState('#0f172a');
  const [strokeWidth, setStrokeWidth] = useState(2.5);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    if (isOpen && tab === 'draw') {
      setTimeout(() => {
        clearCanvas();
      }, 50);
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const cursiveStyles = [
    { font: 'italic bold 28px "Brush Script MT", "Caveat", cursive', label: 'Stile Elegante' },
    { font: 'italic 26px "Segoe Script", "Lucida Handwriting", cursive', label: 'Stile Formale' },
    { font: 'italic bold 24px "Apple Chancery", "Snell Roundhand", cursive', label: 'Stile Classico' },
    { font: '30px "Comic Sans MS", cursive', label: 'Stile Libero' },
  ];

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const handleConfirm = () => {
    if (tab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      onConfirm(canvas.toDataURL('image/png'));
      onClose();
    } else if (tab === 'type') {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 400;
      tempCanvas.height = 140;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      ctx.font = cursiveStyles[selectedStyle].font;
      ctx.fillStyle = strokeColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName || 'Firma', 200, 70);

      onConfirm(tempCanvas.toDataURL('image/png'));
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onConfirm(result);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">Apponi la tua Firma</h3>
            <p className="text-xs text-slate-500">Crea o carica una firma da inserire nel documento</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-white">
          <button
            onClick={() => setTab('draw')}
            className={`flex items-center gap-2 py-2.5 px-4 font-medium text-sm border-b-2 transition-all ${
              tab === 'draw'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PenTool className="w-4 h-4" />
            Disegna a mano
          </button>
          <button
            onClick={() => setTab('type')}
            className={`flex items-center gap-2 py-2.5 px-4 font-medium text-sm border-b-2 transition-all ${
              tab === 'type'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Type className="w-4 h-4" />
            Digita nome
          </button>
          <button
            onClick={() => setTab('upload')}
            className={`flex items-center gap-2 py-2.5 px-4 font-medium text-sm border-b-2 transition-all ${
              tab === 'upload'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            Carica file
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {tab === 'draw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600">Inchiostro:</span>
                  <div className="flex gap-2">
                    {['#0f172a', '#1e40af', '#047857'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setStrokeColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          strokeColor === c ? 'scale-110 border-blue-500 shadow-xs' : 'border-white'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={clearCanvas}
                  className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-md transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Pulisci
                </button>
              </div>

              <div className="relative border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-slate-50/50">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[180px] cursor-crosshair touch-none"
                />
                <div className="absolute bottom-2 left-3 pointer-events-none text-[11px] text-slate-400">
                  Usa il mouse o il touchscreen per firmare sulla linea tratteggiata
                </div>
              </div>
            </div>
          )}

          {tab === 'type' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Digita il tuo Nome Completo
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="Es. Mario Rossi"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Seleziona Stile Calligrafico
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {cursiveStyles.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedStyle(idx)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedStyle === idx
                          ? 'border-blue-600 bg-blue-50/40 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="text-[11px] text-slate-500 mb-1">{item.label}</div>
                      <div
                        style={{
                          fontStyle: 'italic',
                          fontFamily: 'cursive',
                          fontSize: '18px',
                          color: strokeColor,
                        }}
                        className="truncate"
                      >
                        {typedName || 'Firma Esempio'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'upload' && (
            <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 mb-1">
                Carica immagine della tua firma
              </p>
              <p className="text-xs text-slate-500 mb-4">Supporta formati PNG trasparenti o JPEG</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer transition-colors shadow-xs">
                <span>Sfoglia File</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Annulla
          </button>
          {tab !== 'upload' && (
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              <Check className="w-4 h-4" />
              Inserisci Firma nel PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
