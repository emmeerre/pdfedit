import React, { useState, useEffect } from 'react';
import { EditorElement } from '../types';
import {
  Code2,
  Play,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Database,
  FileText,
  AlertCircle,
  Terminal,
  Bookmark,
  X,
  Plus,
} from 'lucide-react';

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: EditorElement[];
  onApplyScript: (updatedElements: EditorElement[], message: string) => void;
}

interface ScriptPreset {
  id: string;
  name: string;
  description: string;
  code: string;
  defaultData?: string;
}

const PRESET_SCRIPTS: ScriptPreset[] = [
  {
    id: 'json_autofill',
    name: 'Compila Anagrafica da JSON',
    description: 'Popola i campi del modulo utilizzando i dati anagrafici forniti in formato JSON',
    defaultData: JSON.stringify(
      {
        Nome_Cognome: 'Giulia Bianchi',
        Codice_Fiscale: 'BNCGLI90A41H501Y',
        Indirizzo_Residenza: 'Corso Vittorio Emanuele 120, 00186 Roma (RM)',
        Tipologia_Contratto: 'Sviluppo Software',
        Consenso_GDPR: true,
        Consenso_Comunicazioni: true,
        Modalita_Servizio: 'Smartworking',
      },
      null,
      2
    ),
    code: `// Compila automaticamente tutti i campi presenti nei dati JSON
log("Inizio compilazione anagrafica da JSON...");

let count = 0;
for (const [key, val] of Object.entries(data)) {
  if (fields[key] !== undefined) {
    fields[key] = val;
    log(\`✓ Aggiornato campo "\${key}" con: \${val}\`);
    count++;
  }
}

log(\`Compilazione completata: \${count} campi aggiornati.\`);
`,
  },
  {
    id: 'uppercase_cf',
    name: 'Formatta e Converti in Maiuscolo',
    description: 'Rimuove spazi superflui e converte Codice Fiscale, Nome e altri campi in maiuscolo',
    code: `// Converte in maiuscolo e ripulisce il codice fiscale e il nome
if (fields.Codice_Fiscale) {
  const orig = fields.Codice_Fiscale;
  fields.Codice_Fiscale = orig.trim().toUpperCase().replace(/\\s+/g, '');
  log(\`Codice Fiscale formattato: \${orig} -> \${fields.Codice_Fiscale}\`);
}

if (fields.Nome_Cognome) {
  // Maiuscolo per ogni prima lettera delle parole
  fields.Nome_Cognome = fields.Nome_Cognome
    .trim()
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  log(\`Nome Cognome formattato: \${fields.Nome_Cognome}\`);
}

log("Formattazione completata con successo!");
`,
  },
  {
    id: 'date_protocol',
    name: 'Data Odierna & Numero Protocollo',
    description: 'Imposta la data odierna formattata in italiano e assegna un numero di protocollo univoco',
    code: `// Calcola data odierna e protocollo
const oggi = new Date();
const dataFormattata = oggi.toLocaleDateString('it-IT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

const randomProt = Math.floor(100000 + Math.random() * 900000);
const protocollo = \`PROT-\${oggi.getFullYear()}/\${randomProt}\`;

log(\`Data generata: \${dataFormattata}\`);
log(\`Protocollo univoco: \${protocollo}\`);

// Applica ai campi data o aggiungi come testo
if (fields.Data) {
  fields.Data = dataFormattata;
}

// Cerca un testo o crea annotazione
const dataText = elements.find(el => el.type === 'text' && (el.text.includes('Data') || el.text.includes('Roma')));
if (dataText) {
  dataText.text = \`Roma, \${dataFormattata} (\${protocollo})\`;
  log(\`Aggiornato testo luogo e data: \${dataText.text}\`);
}
`,
  },
  {
    id: 'calculate_totals',
    name: 'Calcolo Automatico Importi & IVA',
    description: 'Calcola imponibile, aliquota IVA e totale a partire da quantità e prezzo unitario',
    defaultData: JSON.stringify(
      {
        Quantita: 4,
        Prezzo_Unitario: 250,
        Aliquota_IVA: 22,
      },
      null,
      2
    ),
    code: `// Calcolo automatico importi, imponibile e totale fattura/contratto
const qty = parseFloat(data.Quantita || fields.Quantita || 1);
const prezzo = parseFloat(data.Prezzo_Unitario || fields.Prezzo || 0);
const iva = parseFloat(data.Aliquota_IVA || fields.IVA || 22);

const imponibile = qty * prezzo;
const importoIva = (imponibile * iva) / 100;
const totale = imponibile + importoIva;

log(\`Quantità: \${qty}, Prezzo: €\${prezzo.toFixed(2)}\`);
log(\`Imponibile: €\${imponibile.toFixed(2)}\`);
log(\`IVA (\${iva}%): €\${importoIva.toFixed(2)}\`);
log(\`Totale Complessivo: €\${totale.toFixed(2)}\`);

// Assegna ai campi se presenti
if (fields.Imponibile !== undefined) fields.Imponibile = '€ ' + imponibile.toFixed(2);
if (fields.Totale !== undefined) fields.Totale = '€ ' + totale.toFixed(2);
`,
  },
  {
    id: 'conditional_flags',
    name: 'Logica Condizionale & Spunte Automatiche',
    description: 'Seleziona o deseleziona checkbox e radio in base a regole di business',
    code: `// Se la modalità è "Smartworking", imposta il contratto su "Sviluppo Software"
// e spunta automaticamente il consenso comunicazioni elettroniche
if (fields.Modalita_Servizio === 'Smartworking') {
  fields.Tipologia_Contratto = 'Sviluppo Software';
  fields.Consenso_Comunicazioni = true;
  log("Regola applicata: Smartworking -> Sviluppo Software + Notifiche attive");
} else {
  fields.Tipologia_Contratto = 'Consulenza Standard';
  log("Regola applicata: InPresenza -> Consulenza Standard");
}
`,
  },
];

export const AutomationModal: React.FC<AutomationModalProps> = ({
  isOpen,
  onClose,
  elements,
  onApplyScript,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('json_autofill');
  const [code, setCode] = useState<string>(PRESET_SCRIPTS[0].code);
  const [jsonData, setJsonData] = useState<string>(PRESET_SCRIPTS[0].defaultData || '{}');
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'data' | 'fields'>('editor');
  const [copied, setCopied] = useState<boolean>(false);
  const [savedScripts, setSavedScripts] = useState<{ id: string; name: string; code: string }[]>([]);

  // Load saved custom scripts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pdf_studio_saved_scripts');
      if (stored) {
        setSavedScripts(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  if (!isOpen) return null;

  // Extract all currently available fields in the document
  const availableFields: {
    id: string;
    fieldName: string;
    type: string;
    value: any;
  }[] = [];

  elements.forEach((el) => {
    if (el.type === 'text_field') {
      availableFields.push({
        id: el.id,
        fieldName: el.fieldName,
        type: 'Testo',
        value: el.defaultValue,
      });
    } else if (el.type === 'checkbox') {
      availableFields.push({
        id: el.id,
        fieldName: el.fieldName,
        type: 'Checkbox',
        value: el.isChecked,
      });
    } else if (el.type === 'radio') {
      availableFields.push({
        id: el.id,
        fieldName: el.groupName,
        type: `Radio (${el.value})`,
        value: el.isSelected,
      });
    } else if (el.type === 'dropdown') {
      availableFields.push({
        id: el.id,
        fieldName: el.fieldName,
        type: 'Dropdown',
        value: el.defaultValue,
      });
    }
  });

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = PRESET_SCRIPTS.find((p) => p.id === presetId);
    if (preset) {
      setCode(preset.code);
      if (preset.defaultData) {
        setJsonData(preset.defaultData);
      }
      setLogs([`Modello caricato: "${preset.name}". Clicca su "Esegui Script" per applicarlo.`]);
    }
  };

  const handleInsertFieldSnippet = (fieldName: string) => {
    setCode((prev) => prev + `\nfields['${fieldName}'] = 'NuovoValore';`);
    setActiveTab('editor');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSaveCustomScript = () => {
    const name = prompt('Inserisci un nome per questo script:', 'Mio Script Automazione');
    if (!name) return;
    const newScript = {
      id: `script_${Date.now()}`,
      name: name.trim(),
      code: code,
    };
    const updated = [...savedScripts, newScript];
    setSavedScripts(updated);
    try {
      localStorage.setItem('pdf_studio_saved_scripts', JSON.stringify(updated));
      alert('Script salvato con successo nei tuoi preferiti!');
    } catch (err) {
      console.warn(err);
    }
  };

  // Run the automation script
  const handleExecuteScript = () => {
    const outputLogs: string[] = [];
    const log = (msg: any) => {
      outputLogs.push(typeof msg === 'object' ? JSON.stringify(msg) : String(msg));
    };

    try {
      // Parse input JSON data
      let parsedData: any = {};
      if (jsonData.trim()) {
        try {
          parsedData = JSON.parse(jsonData);
        } catch (jsonErr: any) {
          throw new Error(`Errore sintassi nel JSON dei Dati: ${jsonErr.message}`);
        }
      }

      // Deep copy elements to work safely
      const workingElements = JSON.parse(JSON.stringify(elements)) as EditorElement[];

      // Create a reactive proxy/object for fields so that:
      // fields['Nome_Cognome'] = 'Mario Rossi' immediately updates the elements!
      const fieldsProxy: Record<string, any> = {};

      // Initialize with current values
      workingElements.forEach((el) => {
        if (el.type === 'text_field') {
          fieldsProxy[el.fieldName] = el.defaultValue;
        } else if (el.type === 'checkbox') {
          fieldsProxy[el.fieldName] = el.isChecked;
        } else if (el.type === 'radio') {
          if (el.isSelected) {
            fieldsProxy[el.groupName] = el.value;
          } else if (fieldsProxy[el.groupName] === undefined) {
            fieldsProxy[el.groupName] = null;
          }
        } else if (el.type === 'dropdown') {
          fieldsProxy[el.fieldName] = el.defaultValue;
        }
      });

      // Provide helper methods
      const setField = (nameOrId: string, value: any) => {
        fieldsProxy[nameOrId] = value;
      };

      const setText = (searchOrId: string, newText: string) => {
        const found = workingElements.find(
          (el) =>
            el.type === 'text' &&
            (el.id === searchOrId || el.text.toLowerCase().includes(searchOrId.toLowerCase()))
        );
        if (found && found.type === 'text') {
          found.text = newText;
          log(`Aggiornato blocco testo "${found.id}": ${newText}`);
        }
      };

      // Construct and execute the user's function
      const runner = new Function(
        'fields',
        'data',
        'elements',
        'setField',
        'setText',
        'log',
        code
      );

      runner(fieldsProxy, parsedData, workingElements, setField, setText, log);

      // Now synchronize the fieldsProxy back into workingElements
      let modifiedCount = 0;
      workingElements.forEach((el) => {
        if (el.type === 'text_field' && fieldsProxy[el.fieldName] !== undefined) {
          const newVal = String(fieldsProxy[el.fieldName] ?? '');
          if (el.defaultValue !== newVal) {
            el.defaultValue = newVal;
            modifiedCount++;
          }
        } else if (el.type === 'checkbox' && fieldsProxy[el.fieldName] !== undefined) {
          const newVal = Boolean(fieldsProxy[el.fieldName]);
          if (el.isChecked !== newVal) {
            el.isChecked = newVal;
            modifiedCount++;
          }
        } else if (el.type === 'radio' && fieldsProxy[el.groupName] !== undefined) {
          const targetVal = String(fieldsProxy[el.groupName]);
          const shouldSelect = el.value === targetVal;
          if (el.isSelected !== shouldSelect) {
            el.isSelected = shouldSelect;
            modifiedCount++;
          }
        } else if (el.type === 'dropdown' && fieldsProxy[el.fieldName] !== undefined) {
          const newVal = String(fieldsProxy[el.fieldName]);
          if (el.defaultValue !== newVal) {
            el.defaultValue = newVal;
            // If option doesn't exist, add it automatically
            if (el.options && !el.options.includes(newVal)) {
              el.options.push(newVal);
            }
            modifiedCount++;
          }
        }
      });

      outputLogs.push(
        `✓ Script completato con successo: ${modifiedCount} modifiche applicate al documento.`
      );
      setLogs(outputLogs);

      // Apply changes to parent state
      onApplyScript(workingElements, `Automazione eseguita: ${modifiedCount} elementi aggiornati!`);
    } catch (err: any) {
      outputLogs.push(`❌ ERRORE SCRIPT: ${err.message}`);
      setLogs(outputLogs);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">
                  Automazione & Scripting Campi PDF
                </h3>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  JavaScript
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Modifica il codice per calcolare, compilare e automatizzare i contenuti dei campi o dei testi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveCustomScript}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Salva lo script corrente nei preferiti locali"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>Salva Script</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preset & Tabs Toolbar */}
        <div className="px-6 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              Modelli Predefiniti:
            </span>
            <select
              value={selectedPreset}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 rounded-lg px-2.5 py-1.5 font-medium shadow-2xs focus:ring-2 focus:ring-violet-500 focus:outline-hidden cursor-pointer"
            >
              {PRESET_SCRIPTS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>

            {savedScripts.length > 0 && (
              <select
                onChange={(e) => {
                  const s = savedScripts.find((x) => x.id === e.target.value);
                  if (s) {
                    setCode(s.code);
                    setLogs([`Caricato script personalizzato: "${s.name}"`]);
                  }
                }}
                defaultValue=""
                className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg px-2.5 py-1.5 font-medium shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
              >
                <option value="" disabled>
                  I tuoi script salvati ({savedScripts.length})...
                </option>
                {savedScripts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeTab === 'editor'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Codice Script
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'data'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Dati JSON ({jsonData.trim() ? '1' : '0'})</span>
            </button>
            <button
              onClick={() => setActiveTab('fields')}
              className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'fields'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3 h-3 text-blue-600" />
              <span>Campi Rilevati ({availableFields.length})</span>
            </button>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left / Active Panel */}
          <div className="flex-1 flex flex-col bg-slate-900 border-r border-slate-800 overflow-hidden">
            {activeTab === 'editor' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Editor action header */}
                <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-violet-400">script.js</span>
                    <span className="text-[11px] text-slate-500">
                      (Oggetti: <code className="text-emerald-400">fields</code>,{' '}
                      <code className="text-blue-400">data</code>,{' '}
                      <code className="text-amber-400">elements</code>,{' '}
                      <code className="text-pink-400">log</code>)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-1 rounded-md hover:bg-slate-800 transition-colors"
                      title="Copia codice negli appunti"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copiato</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copia</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setCode('')}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 px-2 py-1 rounded-md hover:bg-slate-800 transition-colors"
                      title="Pulisci codice"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Pulisci</span>
                    </button>
                  </div>
                </div>

                {/* Code Textarea */}
                <div className="flex-1 relative font-mono text-xs">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="// Inserisci qui il tuo codice JavaScript per automatizzare i campi..."
                    spellCheck={false}
                    className="w-full h-full p-4 bg-slate-900 text-slate-100 resize-none font-mono text-[13px] leading-relaxed focus:outline-hidden selection:bg-violet-600/40"
                    style={{ tabSize: 2 }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="flex-1 flex flex-col p-4 bg-slate-900 overflow-hidden">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-400" />
                    Dati di Input JSON (Variabile <code className="text-emerald-400 font-mono">data</code>)
                  </span>
                  <span className="text-[11px]">Incolla dati JSON da API o anagrafiche</span>
                </div>
                <textarea
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  placeholder="{\n  &quot;Nome_Cognome&quot;: &quot;Mario Rossi&quot;\n}"
                  spellCheck={false}
                  className="flex-1 w-full p-3 bg-slate-950 text-emerald-300 rounded-xl border border-slate-800 font-mono text-xs leading-relaxed focus:outline-hidden focus:border-emerald-500 selection:bg-emerald-600/40 resize-none"
                  style={{ tabSize: 2 }}
                />
              </div>
            )}

            {activeTab === 'fields' && (
              <div className="flex-1 p-4 bg-slate-900 overflow-y-auto text-xs">
                <div className="pb-2 mb-3 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Campi Disponibili nel Documento ({availableFields.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Clicca su un campo per inserire la riga nel codice
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableFields.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => handleInsertFieldSnippet(f.fieldName)}
                      className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-violet-500/50 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-blue-300 truncate">
                          {f.fieldName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                          {f.type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-700/50 text-[11px] text-slate-400">
                        <span className="truncate max-w-[150px]">
                          Valore:{' '}
                          <span className="text-white font-mono">
                            {f.value !== undefined ? String(f.value) : 'vuoto'}
                          </span>
                        </span>
                        <span className="text-violet-400 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 font-sans font-medium text-[10px]">
                          <Plus className="w-3 h-3" /> Inserisci
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Console / Output Logs */}
            <div className="h-36 bg-slate-950 border-t border-slate-800 flex flex-col font-mono text-xs">
              <div className="px-4 py-1.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <Terminal className="w-3.5 h-3.5 text-violet-400" />
                  Console & Log di Esecuzione
                </span>
                <button
                  onClick={() => setLogs([])}
                  className="hover:text-white transition-colors text-[10px]"
                >
                  Cancella Log
                </button>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-1 select-text">
                {logs.length === 0 ? (
                  <div className="text-slate-500 italic text-[11px]">
                    Nessun output registrato. Clicca &quot;Esegui Script&quot; per avviare l&apos;automazione.
                  </div>
                ) : (
                  logs.map((logMsg, idx) => (
                    <div
                      key={idx}
                      className={`text-[12px] leading-relaxed ${
                        logMsg.startsWith('❌')
                          ? 'text-rose-400 font-semibold'
                          : logMsg.startsWith('✓')
                          ? 'text-emerald-400 font-semibold'
                          : 'text-slate-300'
                      }`}
                    >
                      {logMsg}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Quick Cheat Sheet & Available Fields */}
          <div className="w-72 bg-slate-50 p-4 border-l border-slate-200 flex flex-col text-xs overflow-y-auto">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              Guida Automazione
            </h4>
            <p className="text-slate-600 text-[11px] mb-3 leading-relaxed">
              Puoi leggere e modificare qualsiasi campo direttamente accedendo a{' '}
              <code className="bg-slate-200 px-1 py-0.5 rounded text-violet-700 font-mono font-semibold">
                fields
              </code>
              :
            </p>

            <div className="space-y-3 font-mono text-[11px]">
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold mb-1">
                  Imposta campo di testo o dropdown:
                </div>
                <code className="text-blue-700 block whitespace-pre-wrap">
                  fields.Nome_Cognome = &quot;Mario Rossi&quot;;
                </code>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold mb-1">
                  Spunta o togli checkbox:
                </div>
                <code className="text-emerald-700 block whitespace-pre-wrap">
                  fields.Consenso_GDPR = true;
                </code>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold mb-1">
                  Seleziona opzione radio:
                </div>
                <code className="text-purple-700 block whitespace-pre-wrap">
                  fields.Modalita_Servizio = &quot;Smartworking&quot;;
                </code>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold mb-1">
                  Usa i dati JSON:
                </div>
                <code className="text-amber-700 block whitespace-pre-wrap">
                  fields.Nome_Cognome = data.cliente.nome;
                </code>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold mb-1">
                  Scrivi nei log di console:
                </div>
                <code className="text-pink-700 block whitespace-pre-wrap">
                  log(&quot;Campo aggiornato!&quot;);
                </code>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="font-bold text-slate-800 text-[11px] mb-2 flex items-center justify-between">
                <span>Campi nel Documento</span>
                <span className="text-slate-400 font-normal">({availableFields.length})</span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {availableFields.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleInsertFieldSnippet(f.fieldName)}
                    className="w-full text-left px-2 py-1 rounded bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-300 text-slate-700 hover:text-violet-900 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <span className="font-mono text-[11px] truncate">{f.fieldName}</span>
                    <Plus className="w-3 h-3 text-violet-500 opacity-0 group-hover:opacity-100 shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            <span>Lo script viene eseguito in tempo reale localmente nel tuo browser.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
            >
              Chiudi
            </button>

            <button
              onClick={handleExecuteScript}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 active:scale-95 rounded-xl transition-all shadow-md shadow-violet-500/20 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Esegui Script (Applica al PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
