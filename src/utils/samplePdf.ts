import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Creates an in-memory 3-page sample PDF file for testing
 */
export async function createSamplePdf(): Promise<{ file: File; bytes: ArrayBuffer }> {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const timesBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Cover Page
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
  page1.drawRectangle({
    x: 40,
    y: 720,
    width: 515.28,
    height: 70,
    color: rgb(0.12, 0.22, 0.38),
  });
  page1.drawText('PDF STUDIO PRO - SAMPLE DOCUMENT', {
    x: 60,
    y: 748,
    size: 18,
    font: timesBold,
    color: rgb(1, 1, 1),
  });

  page1.drawText('Sample Document for Offline PDF Editing', {
    x: 60,
    y: 650,
    size: 14,
    font: timesBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page1.drawText(
    'This is Page 1 (Cover Page). You can test adding Bengali, English, or Arabic page numbers,\n' +
    'uploading stamps/photos, and configuring page exclusions (e.g. Skip cover page).\n\n' +
    'Key features tested:\n' +
    '1. Multilingual Page Numbering (Bangla, English, Arabic)\n' +
    '2. Dynamic stamp/photo placement on any coordinates\n' +
    '3. Repeat stamp on all pages or ignore specific pages\n' +
    '4. 100% Client-side and offline execution',
    {
      x: 60,
      y: 580,
      size: 11,
      font: timesRoman,
      color: rgb(0.2, 0.2, 0.2),
      lineHeight: 18,
    }
  );

  page1.drawRectangle({
    x: 60,
    y: 200,
    width: 475.28,
    height: 120,
    borderColor: rgb(0.7, 0.75, 0.8),
    borderWidth: 1,
    color: rgb(0.96, 0.98, 1),
  });
  page1.drawText('Cover Page Notice', {
    x: 80,
    y: 285,
    size: 12,
    font: timesBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  page1.drawText('Usually cover pages skip page numbering. Toggle "Skip 1st Page" to verify!', {
    x: 80,
    y: 255,
    size: 10,
    font: timesRoman,
    color: rgb(0.3, 0.35, 0.4),
  });

  // Page 2: Content Page
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  page2.drawText('Chapter 1: Offline PDF Processing', {
    x: 60,
    y: 760,
    size: 16,
    font: timesBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page2.drawText(
    'PDF processing in PDF Studio Pro is executed strictly in your local browser sandbox.\n' +
    'No file is transmitted over the internet, guaranteeing complete data privacy and security.\n\n' +
    'Bengali typography is rendered using Google Fonts "Hind Siliguri Light" with vector\n' +
    'rendering to preserve complex conjuncts and crisp clarity at any zoom level.\n\n' +
    'Test adding a stamp on this page: you will see it previewed in real-time on canvas,\n' +
    'and when exported, it burns into the generated PDF at the exact coordinates.',
    {
      x: 60,
      y: 700,
      size: 11,
      font: timesRoman,
      color: rgb(0.25, 0.25, 0.25),
      lineHeight: 18,
    }
  );

  // Page 3: Summary / Signature Page
  const page3 = pdfDoc.addPage([595.28, 841.89]);
  page3.drawText('Chapter 2: Verification and Authorization', {
    x: 60,
    y: 760,
    size: 16,
    font: timesBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page3.drawText(
    'This page represents an official conclusion or agreement section.\n' +
    'Try placing an "APPROVED" or "CONFIDENTIAL" stamp here or adding your custom photo.\n' +
    'Notice how the "Apply to all pages" option lets you replicate the stamp across pages,\n' +
    'or exclude individual pages as required.',
    {
      x: 60,
      y: 700,
      size: 11,
      font: timesRoman,
      color: rgb(0.25, 0.25, 0.25),
      lineHeight: 18,
    }
  );

  page3.drawLine({
    start: { x: 60, y: 350 },
    end: { x: 260, y: 350 },
    thickness: 1,
    color: rgb(0.4, 0.4, 0.4),
  });
  page3.drawText('Authorized Signature Placeholder', {
    x: 60,
    y: 330,
    size: 10,
    font: timesRoman,
    color: rgb(0.4, 0.4, 0.4),
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const file = new File([blob], 'sample_document_3pages.pdf', {
    type: 'application/pdf',
    lastModified: Date.now(),
  });

  return { file, bytes: pdfBytes.buffer as ArrayBuffer };
}
