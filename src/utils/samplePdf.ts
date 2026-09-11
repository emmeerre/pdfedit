import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Creates a clean default blank A4 PDF
 */
export async function createBlankPdf(pagesCount: number = 1): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pagesCount; i++) {
    // Standard A4 dimensions in points (595.28 x 841.89)
    pdfDoc.addPage([595.28, 841.89]);
  }
  return await pdfDoc.save();
}

/**
 * Creates a realistic sample Italian contract/modulo document to immediately test editing,
 * form fields, checkboxes, text replacing, and signatures.
 */
export async function createSampleContractPdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Top header bar
  page.drawRectangle({
    x: 40,
    y: height - 85,
    width: width - 80,
    height: 45,
    color: rgb(0.12, 0.23, 0.38), // dark navy
  });

  page.drawText('MODULO DI ACCORDO & PRESTAZIONE D\'OPERA', {
    x: 55,
    y: height - 60,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('Documento Esempio pronto per inserimento campi, firme e note', {
    x: 55,
    y: height - 76,
    size: 9,
    font: fontRegular,
    color: rgb(0.85, 0.9, 0.98),
  });

  // Section 1: Dati Richiedente
  let currentY = height - 120;
  page.drawText('1. DATI DEL RICHIEDENTE / COMMITTENTE', {
    x: 40,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.15),
  });

  page.drawLine({
    start: { x: 40, y: currentY - 5 },
    end: { x: width - 40, y: currentY - 5 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  currentY -= 30;
  page.drawText('Nome e Cognome:', {
    x: 40,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText('Codice Fiscale / P.IVA:', {
    x: 300,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Draw light placeholders for fields
  page.drawRectangle({
    x: 140,
    y: currentY - 4,
    width: 145,
    height: 18,
    borderColor: rgb(0.75, 0.75, 0.75),
    borderWidth: 0.8,
    color: rgb(0.97, 0.97, 0.98),
  });

  page.drawRectangle({
    x: 420,
    y: currentY - 4,
    width: 135,
    height: 18,
    borderColor: rgb(0.75, 0.75, 0.75),
    borderWidth: 0.8,
    color: rgb(0.97, 0.97, 0.98),
  });

  currentY -= 35;
  page.drawText('Indirizzo di Residenza:', {
    x: 40,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawRectangle({
    x: 155,
    y: currentY - 4,
    width: 400,
    height: 18,
    borderColor: rgb(0.75, 0.75, 0.75),
    borderWidth: 0.8,
    color: rgb(0.97, 0.97, 0.98),
  });

  // Section 2: Opzioni e Preferenze
  currentY -= 45;
  page.drawText('2. MODALITÀ DI EROGAZIONE SERVIZIO', {
    x: 40,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.15),
  });

  page.drawLine({
    start: { x: 40, y: currentY - 5 },
    end: { x: width - 40, y: currentY - 5 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  currentY -= 30;
  page.drawText('Tipologia di prestazione (selezionare una sola opzione):', {
    x: 40,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  currentY -= 25;
  page.drawCircle({
    x: 50,
    y: currentY + 4,
    size: 6,
    borderColor: rgb(0.5, 0.5, 0.5),
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });
  page.drawText('Presenziale presso sede operativa', {
    x: 65,
    y: currentY,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawCircle({
    x: 270,
    y: currentY + 4,
    size: 6,
    borderColor: rgb(0.5, 0.5, 0.5),
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });
  page.drawText('Remoto / Smart-working', {
    x: 285,
    y: currentY,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  currentY -= 28;
  page.drawText('Categoria / Tipologia Contratto:', {
    x: 40,
    y: currentY,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawRectangle({
    x: 195,
    y: currentY - 4,
    width: 220,
    height: 18,
    borderColor: rgb(0.75, 0.75, 0.75),
    borderWidth: 0.8,
    color: rgb(0.97, 0.97, 0.98),
  });

  currentY -= 35;
  page.drawText('3. DICHIARAZIONI & CONSENSI', {
    x: 40,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.15),
  });

  page.drawLine({
    start: { x: 40, y: currentY - 5 },
    end: { x: width - 40, y: currentY - 5 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  currentY -= 25;
  page.drawRectangle({
    x: 42,
    y: currentY - 4,
    width: 16,
    height: 16,
    borderColor: rgb(0.6, 0.6, 0.6),
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });
  page.drawText('Dichiaro di aver preso visione dell\'informativa sulla Privacy e Trattamento Dati (GDPR).', {
    x: 65,
    y: currentY,
    size: 9,
    font: fontRegular,
    color: rgb(0.25, 0.25, 0.25),
  });

  currentY -= 22;
  page.drawRectangle({
    x: 42,
    y: currentY - 4,
    width: 16,
    height: 16,
    borderColor: rgb(0.6, 0.6, 0.6),
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });
  page.drawText('Autorizzo l\'invio di comunicazioni e notifiche operative via posta elettronica.', {
    x: 65,
    y: currentY,
    size: 9,
    font: fontRegular,
    color: rgb(0.25, 0.25, 0.25),
  });

  // Notes section
  currentY -= 40;
  page.drawText('Note aggiuntive / Clausole particolari:', {
    x: 40,
    y: currentY,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  currentY -= 55;
  page.drawRectangle({
    x: 40,
    y: currentY,
    width: width - 80,
    height: 50,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.8,
    color: rgb(0.98, 0.98, 0.99),
  });

  page.drawText('Spazio riservato per annotazioni o testo personalizzato aggiunto con l\'editor.', {
    x: 50,
    y: currentY + 30,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.6, 0.6, 0.6),
  });

  // Section 4: Firme
  currentY -= 55;
  page.drawText('4. LUOGO, DATA E SOTTOSCRIZIONE', {
    x: 40,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.15),
  });

  page.drawLine({
    start: { x: 40, y: currentY - 5 },
    end: { x: width - 40, y: currentY - 5 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  currentY -= 35;
  page.drawText('Luogo e Data:', {
    x: 40,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawLine({
    start: { x: 115, y: currentY - 2 },
    end: { x: 230, y: currentY - 2 },
    thickness: 0.8,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText('Firma del Committente:', {
    x: 340,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Signature box
  page.drawRectangle({
    x: 340,
    y: currentY - 70,
    width: 215,
    height: 60,
    borderColor: rgb(0.7, 0.75, 0.82),
    borderWidth: 1,
    borderDashArray: [4, 3],
    color: rgb(0.97, 0.98, 1),
  });

  page.drawText('(Apporre qui la firma digitale o autografa)', {
    x: 365,
    y: currentY - 40,
    size: 8,
    font: fontRegular,
    color: rgb(0.55, 0.6, 0.7),
  });

  // Footer note
  page.drawText('Documento generato per PDF Studio Standalone - Modificabile offline direttamente nel browser.', {
    x: 40,
    y: 30,
    size: 8,
    font: fontRegular,
    color: rgb(0.6, 0.6, 0.6),
  });

  return await pdfDoc.save();
}

/**
 * Returns perfectly aligned sample elements matching createSampleContractPdf graphics
 */
export function getSampleElements(): any[] {
  return [
    {
      id: 'tf_nome',
      pageIndex: 0,
      type: 'text_field',
      fieldName: 'Nome_Cognome',
      defaultValue: 'Mario Rossi',
      fontSize: 10,
      fontColor: '#0f172a',
      borderColor: '#3b82f6',
      backgroundColor: '#ffffff',
      isMultiline: false,
      isRequired: true,
      x: 140,
      y: 136,
      width: 145,
      height: 18,
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
      x: 420,
      y: 136,
      width: 135,
      height: 18,
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
      x: 155,
      y: 171,
      width: 400,
      height: 18,
    },
    {
      id: 'rd_presenza',
      pageIndex: 0,
      type: 'radio',
      groupName: 'Modalita_Servizio',
      value: 'InPresenza',
      isSelected: true,
      borderColor: '#1d4ed8',
      x: 42,
      y: 273,
      width: 16,
      height: 16,
    },
    {
      id: 'rd_remoto',
      pageIndex: 0,
      type: 'radio',
      groupName: 'Modalita_Servizio',
      value: 'Smartworking',
      isSelected: false,
      borderColor: '#334155',
      x: 262,
      y: 273,
      width: 16,
      height: 16,
    },
    {
      id: 'dd_contratto',
      pageIndex: 0,
      type: 'dropdown',
      fieldName: 'Tipologia_Contratto',
      options: [
        'Consulenza Standard',
        'Sviluppo Software',
        'Assistenza Tecnica',
        'Progetto Speciale',
      ],
      defaultValue: 'Consulenza Standard',
      fontSize: 9.5,
      fontColor: '#0f172a',
      borderColor: '#3b82f6',
      backgroundColor: '#ffffff',
      isRequired: true,
      x: 195,
      y: 299,
      width: 220,
      height: 18,
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
      y: 361,
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
      y: 383,
      width: 16,
      height: 16,
    },
  ];
}
