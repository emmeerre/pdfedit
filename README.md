# PDF Studio Editor (PDFEdit)

Editor PDF completo, 100% offline e client-side. Funziona direttamente nel browser web senza bisogno di backend, database o chiavi API.

## Caratteristiche principali

- **Nessuna API Key necessaria**: zero configurazione, pronto all'uso immediato.
- **Funzionamento 100% nel browser**: i documenti PDF non lasciano mai il dispositivo dell'utente.
- **Editing avanzato di immagini**: estrazione e modifica di immagini già presenti nei PDF (spostamento, ridimensionamento, rotazione continua, filtri, sostituzione).
- **Rotazione continua in gradi**: rotazione di elementi a 360° con precisione al singolo grado o con snap a 15°.
- **Campi modulo e testo**: aggiunta e modifica di campi testo, checkbox, radio button, firme digitali, rettangoli di copertura (whiteout) ed evidenziatori.
- **Esportazione flessibile**: salvataggio in PDF compilabile (AcroForm) o appiattito, con supporto per download come file HTML standalone a singolo file.

## Installazione e Avvio Locale

Non è richiesta alcuna variabile d'ambiente o chiave API.

```bash
# 1. Installa le dipendenze
npm install

# 2. Avvia il server di sviluppo locale
npm run dev

# 3. Compila per la produzione (crea la cartella dist/)
npm run build
```

## Pubblicazione su GitHub Pages

Il repository include già il workflow automatico di GitHub Actions in `.github/workflows/deploy.yml`.

1. Vai su **Settings** > **Pages** nel tuo repository GitHub.
2. Sotto **Build and deployment**, imposta la sorgente (**Source**) su **GitHub Actions**.
3. Al successivo commit/push l'applicazione verrà compilata e pubblicata automaticamente.
