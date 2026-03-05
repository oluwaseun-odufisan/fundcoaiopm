// backend/controllers/documentController.js
import Document from '../models/documentModel.js';
import GrokChat from '../models/grokModel.js'; // Existing
import File from '../models/fileModel.js'; // Existing
import { grokQuery } from '../services/grokService.js'; // Assume existing or add if needed
// Create new document conversion (init after upload)
export const createDocument = async (req, res) => {
    const { fileId } = req.body; // From uploaded PDF
    try {
        const file = await File.findById(fileId);
        if (!file || file.owner.toString() !== req.user._id.toString()) {
            return res.status(404).json({ success: false, message: 'File not found or not owned by you' });
        }
        const newDoc = new Document({
            userId: req.user._id,
            originalFileId: fileId,
        });
        await newDoc.save();
        res.status(201).json({ success: true, document: newDoc });
    } catch (error) {
        console.error('Create document error:', error);
        res.status(500).json({ success: false, message: 'Failed to create document' });
    }
};
// Extract text via AI (calls Grok with search_pdf_attachment implicitly via prompt)
export const extractText = async (req, res) => {
    const { documentId, prompt } = req.body;
    try {
        const doc = await Document.findById(documentId);
        if (!doc || doc.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }
        const file = await File.findById(doc.originalFileId);
        // Simulate tool call: In reality, Grok prompt would use search_pdf_attachment on file.cid (IPFS URL)
        const extractionPrompt = `${prompt || 'Extract meaningful content from this PDF'}.\nFile: https://gateway.pinata.cloud/ipfs/${file.cid}`;
        const extracted = await grokQuery(extractionPrompt, 'pdf-extractor'); // Uses Grok with tool
        doc.extractedText = extracted;
        await doc.save();
        // Link to new GrokChat (simulate creation)
        const grokChat = new GrokChat({ userId: req.user._id, toolId: 'pdf-extractor', messages: [{ role: 'user', content: extractionPrompt }, { role: 'assistant', content: extracted }] });
        await grokChat.save();
        doc.grokChatId = grokChat._id;
        await doc.save();
        res.json({ success: true, extractedText: extracted, grokChatId: grokChat._id });
    } catch (error) {
        console.error('Extract text error:', error);
        res.status(500).json({ success: false, message: 'Failed to extract text' });
    }
};
// Generate PPT JSON via AI
export const generatePPT = async (req, res) => {
    const { documentId, prompt, templateId } = req.body;
    try {
        const doc = await Document.findById(documentId);
        if (!doc || doc.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }
        if (templateId) {
            const template = await File.findById(templateId);
            if (!template || template.owner.toString() !== req.user._id.toString()) {
                return res.status(400).json({ success: false, message: 'Invalid template' });
            }
            doc.templateFileId = templateId;
        }
        const generationPrompt = `${prompt}.\nUse extracted text: ${doc.extractedText}.\nOutput as JSON: {slides: [{title: string, content: string, layout: string}]}`;
        const pptJson = await grokQuery(generationPrompt, 'ppt-generator'); // Grok generates JSON structure
        doc.pptJson = JSON.parse(pptJson); // Assume valid JSON
        await doc.save();
        // Update GrokChat if linked
        if (doc.grokChatId) {
            await GrokChat.findByIdAndUpdate(doc.grokChatId, { $push: { messages: { role: 'assistant', content: pptJson } } });
        }
        res.json({ success: true, pptJson: doc.pptJson });
    } catch (error) {
        console.error('Generate PPT error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate PPT' });
    }
};
// Get document history for user
export const getHistory = async (req, res) => {
    try {
        const histories = await Document.find({ userId: req.user._id }).sort({ createdAt: -1 }).populate('originalFileId templateFileId');
        res.json({ success: true, histories });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch history' });
    }
};
