import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import Document from '../models/documentModel.js';
import { uploadPdfDocument } from '../controllers/documentController.js';
import { repairAndParseJson } from '../utils/jsonRepair.js';
import { buildOutlineFromBlocks, sectionizeText, structurePdfText } from '../utils/documentText.js';
import { buildFallbackDeck, buildFallbackSlide } from '../utils/deckBuilder.js';
import { extractPdfTextFromBuffer } from '../utils/pdfTextExtractor.js';

const sampleText = `
EXECUTIVE SUMMARY

Revenue increased
by 25% year on year
across the portfolio.

- Margin expansion improved
- Hiring remained controlled

RISKS

Collections slowed in Q4.
`;

const repaired = repairAndParseJson("```json\n{title:'Deck',slides:[{id:1,type:'title',title:'Hello'}]}\n```");
assert.equal(repaired.title, 'Deck');
assert.equal(repaired.slides[0].title, 'Hello');

const structured = structurePdfText(sampleText);
assert.match(structured.text, /Revenue increased by 25% year on year across the portfolio\./);
assert.equal(sectionizeText(sampleText).length, 2);
assert.match(buildOutlineFromBlocks(sampleText), /Executive Summary/);

const deck = buildFallbackDeck({
  sourceText: sampleText,
  slideCount: 8,
  theme: 'professional',
  audience: 'executive',
  titleHint: 'performance-review.pdf',
});
assert.equal(deck.slides[0].type, 'title');
assert.equal(deck.slides.at(-1).type, 'closing');
assert.ok(deck.slides.length >= 6);

const slide = buildFallbackSlide({
  currentSlide: { id: 2, type: 'bullets', title: 'Growth Drivers', bullets: [] },
  sourceText: sampleText,
  instruction: 'Make the slide tighter',
});
assert.equal(slide.id, 2);
assert.equal(slide.type, 'bullets');
assert.ok(slide.bullets.length > 0);

const pdfDoc = await PDFDocument.create();
const page = pdfDoc.addPage([600, 400]);
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
page.drawText('FundCo Deck Prep Test', {
  x: 50,
  y: 300,
  size: 24,
  font,
  color: rgb(0, 0, 0),
});
const pdfBytes = await pdfDoc.save();
const parsedPdf = await extractPdfTextFromBuffer(Buffer.from(pdfBytes));
assert.match(parsedPdf.fullText, /FundCo Deck Prep Test/);
assert.ok(parsedPdf.pages >= 1);

const originalSave = Document.prototype.save;
Document.prototype.save = async function saveMock() {
  this.updatedAt = this.updatedAt || new Date();
  this.createdAt = this.createdAt || new Date();
  return this;
};

const req = {
  user: { _id: '507f1f77bcf86cd799439011' },
  file: {
    originalname: 'fundco-smoke.pdf',
    mimetype: 'application/pdf',
    size: pdfBytes.length,
    buffer: Buffer.from(pdfBytes),
  },
};

const res = {
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
};

await uploadPdfDocument(req, res);
Document.prototype.save = originalSave;

assert.equal(res.statusCode, 201);
assert.equal(res.body?.success, true);
assert.match(res.body?.fullText || '', /FundCo Deck Prep Test/);
assert.equal(res.body?.document?.sourceFileName, 'fundco-smoke.pdf');
assert.equal(res.body?.document?.originalFileId?.fileName, 'fundco-smoke.pdf');

console.log('Deck Prep smoke checks passed.');
