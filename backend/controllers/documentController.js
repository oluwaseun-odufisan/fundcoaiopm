// backend/controllers/documentController.js
import Document from '../models/documentModel.js';
import GrokChat from '../models/grokModel.js';
import File from '../models/fileModel.js';
import mongoose from 'mongoose';
import axios from 'axios'; // For fetching from IPFS
import { grokChat as callGrokChat } from './grokController.js'; // Rename import to avoid conflict

// Create new document conversion (init after upload or selection)
export const createDocument = async (req, res) => {
  const { fileId } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ success: false, message: 'Invalid file ID' });
    }
    const file = await File.findById(fileId);
    if (!file || file.owner.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'File not found or not owned by you' });
    }
    if (file.type !== 'pdf') {
      return res.status(400).json({ success: false, message: 'Only PDF files are supported' });
    }
    const newDoc = new Document({
      userId: req.user._id,
      originalFileId: fileId,
    });
    await newDoc.save();
    res.status(201).json({ success: true, document: newDoc });
  } catch (error) {
    console.error('Create document error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create document', error: error.message });
  }
};

// Raw extract full text from PDF using Grok
export const rawExtract = async (req, res) => {
  const { documentId } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ success: false, message: 'Invalid document ID' });
    }
    const doc = await Document.findById(documentId);
    if (!doc || doc.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Document not found or not owned by you' });
    }
    const file = await File.findById(doc.originalFileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'Associated file not found' });
    }
    const url = `https://gateway.pinata.cloud/ipfs/${file.cid}`;
    // Fetch PDF buffer from IPFS
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    // Simulate req for grokChat with specific raw extract prompt
    const simulatedReq = {
      user: req.user,
      body: {
        messages: [{ role: 'user', content: 'Extract and output ONLY the full raw text from all pages of the attached PDF, concatenated sequentially, without any additional text, introductions, summaries, formatting, markdown, or comments. Use browse_pdf_attachment(file_name="attached.pdf", pages="all") or search_pdf_attachment(query="") to get the complete text.' }],
        taskContext: null,
        toolId: 'pdf-extractor'
      },
      files: [{ buffer, originalname: file.fileName, mimetype: 'application/pdf' }]
    };
    let fullContent = '';
    // Call grokChat function, capture stream
    await callGrokChat(simulatedReq, {
      setHeader: () => {}, // Mock res methods
      write: (data) => {
        if (data.includes('data: {"content":')) {
          const content = JSON.parse(data.replace('data: ', '')).content;
          fullContent += content;
        }
      },
      end: () => {}
    });
    if (!fullContent.trim()) {
      throw new Error('No text extracted from PDF');
    }
    doc.fullText = fullContent;
    await doc.save();
    // Create GrokChat for history
    const newGrokChat = new GrokChat({
      userId: req.user._id,
      toolId: 'pdf-extractor',
      messages: simulatedReq.body.messages.concat({ role: 'assistant', content: fullContent }),
    });
    await newGrokChat.save();
    doc.grokChatId = newGrokChat._id; // For now, overwrite; can array if multiple
    await doc.save();
    res.json({ success: true, fullText: fullContent, grokChatId: newGrokChat._id });
  } catch (error) {
    console.error('Raw extract error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to extract full text', error: error.message });
  }
};

// Meaningful extraction using prompt on fullText
export const extractText = async (req, res) => {
  const { documentId, prompt } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ success: false, message: 'Invalid document ID' });
    }
    const doc = await Document.findById(documentId);
    if (!doc || doc.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Document not found or not owned by you' });
    }
    if (!doc.fullText.trim()) {
      return res.status(400).json({ success: false, message: 'Perform raw extraction first' });
    }
    // Simulate req for grokChat
    const simulatedReq = {
      user: req.user,
      body: {
        messages: [{ role: 'user', content: `${prompt || 'Extract meaningful content and key points from this text'} in a clean, structured format ready for PowerPoint: use plain bullet points for key points, numbered lists for steps, and simple section titles without markdown symbols like # or *. No introductory text, summaries, or additional comments—just the structured content.\nFull Text: ${doc.fullText}` }],
        taskContext: null,
        toolId: 'pdf-extractor'
      },
      files: [] // No file needed, text in prompt
    };
    let extracted = '';
    await callGrokChat(simulatedReq, {
      setHeader: () => {},
      write: (data) => {
        if (data.includes('data: {"content":')) {
          const content = JSON.parse(data.replace('data: ', '')).content;
          extracted += content;
        }
      },
      end: () => {}
    });
    if (!extracted.trim()) {
      throw new Error('No meaningful content extracted');
    }
    doc.extractedText = extracted;
    await doc.save();
    // Create/link GrokChat
    let newGrokChat;
    if (doc.grokChatId) {
      await GrokChat.findByIdAndUpdate(doc.grokChatId, {
        $push: { messages: simulatedReq.body.messages.concat({ role: 'assistant', content: extracted }) }
      });
    } else {
      newGrokChat = new GrokChat({
        userId: req.user._id,
        toolId: 'pdf-extractor',
        messages: simulatedReq.body.messages.concat({ role: 'assistant', content: extracted }),
      });
      await newGrokChat.save();
      doc.grokChatId = newGrokChat._id;
      await doc.save();
    }
    res.json({ success: true, extractedText: extracted, grokChatId: doc.grokChatId });
  } catch (error) {
    console.error('Meaningful extract error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to extract meaningful content', error: error.message });
  }
};

// Generate PPT JSON via AI (using extractedText)
export const generatePPT = async (req, res) => {
  const { documentId, prompt, templateId } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ success: false, message: 'Invalid document ID' });
    }
    const doc = await Document.findById(documentId);
    if (!doc || doc.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Document not found or not owned by you' });
    }
    if (templateId) {
      if (!mongoose.Types.ObjectId.isValid(templateId)) {
        return res.status(400).json({ success: false, message: 'Invalid template ID' });
      }
      const template = await File.findById(templateId);
      if (!template || template.owner.toString() !== req.user._id.toString()) {
        return res.status(400).json({ success: false, message: 'Invalid template' });
      }
      doc.templateFileId = templateId;
    }
    if (!doc.extractedText.trim()) {
      return res.status(400).json({ success: false, message: 'Perform meaningful extraction first' });
    }
    // Simulate req for grokChat
    const simulatedReq = {
      user: req.user,
      body: {
        messages: [{ role: 'user', content: `${prompt || 'Generate PPT from this content'}.\nContent: ${doc.extractedText}\nOutput valid JSON: {"slides": [{"title": "string", "content": "string", "layout": "string"}]} ` }],
        taskContext: null,
        toolId: 'ppt-generator'
      },
      files: []
    };
    let pptJsonStr = '';
    await callGrokChat(simulatedReq, {
      setHeader: () => {},
      write: (data) => {
        if (data.includes('data: {"content":')) {
          const content = JSON.parse(data.replace('data: ', '')).content;
          pptJsonStr += content;
        }
      },
      end: () => {}
    });
    let pptJson;
    try {
      pptJson = JSON.parse(pptJsonStr);
    } catch {
      throw new Error('Invalid JSON from Grok for PPT');
    }
    doc.pptJson = pptJson;
    await doc.save();
    // Update GrokChat
    if (doc.grokChatId) {
      await GrokChat.findByIdAndUpdate(doc.grokChatId, {
        $push: { messages: simulatedReq.body.messages.concat({ role: 'assistant', content: pptJsonStr }) }
      });
    }
    res.json({ success: true, pptJson });
  } catch (error) {
    console.error('Generate PPT error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to generate PPT', error: error.message });
  }
};

// Get document history for user (enhanced with more population)
export const getHistory = async (req, res) => {
  try {
    const histories = await Document.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate([
        { path: 'originalFileId', select: 'fileName cid type uploadedAt' },
        { path: 'templateFileId', select: 'fileName cid type uploadedAt' },
        { path: 'grokChatId', select: 'title summary createdAt' }
      ]);
    res.json({ success: true, histories });
  } catch (error) {
    console.error('Get history error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch history', error: error.message });
  }
};