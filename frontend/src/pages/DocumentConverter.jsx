// src/pages/DocumentConverter.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  Upload, FileText, Zap, Edit2, Image as ImageIcon, Eye, History as HistoryIcon,
  ArrowLeft, Sun, Moon, Loader2, Download, ChevronRight, ChevronLeft
} from 'lucide-react';
import DocumentUpload from '../components/DocumentUpload';
import AIExtractionPanel from '../components/AIExtractionPanel';
import ExtractedTextEditor from '../components/ExtractedTextEditor';
import TemplateSelector from '../components/TemplateSelector';
import PPTPreview from '../components/PPTPreview';
import HistoryList from '../components/HistoryList';

// Professional Palette with dark mode (matching AiTools.jsx and fileStorage.jsx)
const LIGHT_THEME = {
  primary: '#1E40AF',
  secondary: '#16A34A',
  accent: '#F59E0B',
  danger: '#DC2626',
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    500: '#6B7280',
    700: '#374151',
    900: '#111827',
    border: '#E5E7EB'
  },
  bg: 'bg-gray-50',
  cardBg: 'bg-white',
  text: 'text-gray-900',
  subText: 'text-gray-500'
};
const DARK_THEME = {
  primary: '#60A5FA',
  secondary: '#4ADE80',
  accent: '#FBBF24',
  danger: '#EF4444',
  neutral: {
    50: '#111827',
    100: '#1F2937',
    200: '#374151',
    300: '#4B5563',
    500: '#9CA3AF',
    700: '#D1D5DB',
    900: '#F3F4F6',
    border: '#374151'
  },
  bg: 'bg-gray-900',
  cardBg: 'bg-gray-800',
  text: 'text-gray-100',
  subText: 'text-gray-400'
};

const DocumentConverter = () => {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const currentTheme = theme === 'light' ? LIGHT_THEME : DARK_THEME;
  const [step, setStep] = useState(1); // 1: Upload, 2: Extract, 3: Edit, 4: Template, 5: Generate/Preview, 6: History
  const [documentId, setDocumentId] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [pptJson, setPptJson] = useState(null);
  const [templateId, setTemplateId] = useState(null);
  const [prompt, setPrompt] = useState('Generate a 10-page PPT summarizing the key points.');
  const [fileId, setFileId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/documents/history`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setHistory(res.data.histories);
    } catch (error) {
      toast.error('Failed to load history.');
    }
  }, []);

  useEffect(() => {
    if (step === 6) fetchHistory();
  }, [step, fetchHistory]);

  const handleUploadSuccess = async (uploadedFileId) => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/documents`, { fileId: uploadedFileId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDocumentId(res.data.document._id);
      setFileId(uploadedFileId);
      setStep(2);
      toast.success('PDF uploaded successfully!');
    } catch (error) {
      toast.error('Failed to initialize document.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtract = async (extractionPrompt) => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/documents/extract`, { documentId, prompt: extractionPrompt }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setExtractedText(res.data.extractedText);
      setStep(3);
      toast.success('Content extracted successfully!');
    } catch (error) {
      toast.error('Extraction failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = (editedText) => {
    setExtractedText(editedText);
    setStep(4);
    toast.success('Text saved successfully!');
  };

  const handleTemplateSelect = async (selectedTemplateId) => {
    setTemplateId(selectedTemplateId);
    setStep(5);
    toast.success('Template selected!');
  };

  const handleGeneratePPT = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/documents/generate-ppt`, { documentId, prompt, templateId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPptJson(res.data.pptJson);
      toast.success('PPT generated successfully!');
    } catch (error) {
      toast.error('PPT generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPPT = () => {
    if (!pptJson) return toast.error('No PPT to export.');
    import('pptxgenjs').then(PptxGenJS => {
      const pptx = new PptxGenJS.default();
      pptJson.slides.forEach(slide => {
        const s = pptx.addSlide();
        s.addText(slide.title, { x: 0.5, y: 0.5, fontSize: 24, bold: true, color: '363636' });
        s.addText(slide.content, { x: 0.5, y: 1.5, fontSize: 18, color: '363636' });
        // Basic template application (e.g., background color from template, but simplified)
      });
      pptx.writeFile({ fileName: 'generated_presentation.pptx' });
      toast.success('PPT exported successfully!');
    }).catch(error => {
      toast.error('Failed to export PPT.');
      console.error(error);
    });
  };

  const steps = [
    { id: 1, icon: Upload, title: 'Upload PDF' },
    { id: 2, icon: Zap, title: 'AI Extract' },
    { id: 3, icon: Edit2, title: 'Edit Text' },
    { id: 4, icon: ImageIcon, title: 'Select Template' },
    { id: 5, icon: Eye, title: 'Preview & Generate' },
    { id: 6, icon: HistoryIcon, title: 'History' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen ${currentTheme.bg} dark:${DARK_THEME.bg} flex flex-col p-6`}
    >
      <Toaster position="top-right" />
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <FileText className={`w-8 h-8 text-${currentTheme.primary} dark:text-${DARK_THEME.primary}`} />
          <div>
            <h1 className={`text-2xl font-bold ${currentTheme.text} dark:${DARK_THEME.text}`}>Document Converter & PPT Generator</h1>
            <p className={`text-sm ${currentTheme.subText} dark:${DARK_THEME.subText}`}>Upload PDF, extract with AI, edit, apply template, generate PPT.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button onClick={() => navigate(-1)} className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${currentTheme.text} dark:${DARK_THEME.text}`}>
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        </div>
      </header>
      <nav className="flex flex-wrap gap-2 mb-8">
        {steps.map(s => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${step === s.id ? `bg-${currentTheme.primary} text-white` : `bg-${currentTheme.cardBg} dark:bg-${DARK_THEME.cardBg} hover:bg-gray-200 dark:hover:bg-gray-700`}`}
          >
            <s.icon className="w-5 h-5" /> {s.title}
          </button>
        ))}
      </nav>
      <main className={`flex-1 ${currentTheme.cardBg} dark:${DARK_THEME.cardBg} rounded-2xl p-6 shadow-lg`}>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              <p className="mt-4 text-lg">Processing...</p>
            </motion.div>
          ) : (
            <>
              {step === 1 && <DocumentUpload onSuccess={handleUploadSuccess} />}
              {step === 2 && <AIExtractionPanel onExtract={handleExtract} />}
              {step === 3 && <ExtractedTextEditor initialText={extractedText} onSave={handleSaveEdit} />}
              {step === 4 && <TemplateSelector onSelect={handleTemplateSelect} />}
              {step === 5 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">PPT Generation Prompt</label>
                    <input
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-${currentTheme.primary} dark:focus:ring-${DARK_THEME.primary} bg-transparent`}
                    />
                  </div>
                  <button onClick={handleGeneratePPT} className={`w-full p-3 bg-${currentTheme.primary} dark:bg-${DARK_THEME.primary} text-white rounded-lg flex items-center justify-center gap-2 hover:opacity-90`}>
                    <Zap className="w-5 h-5" /> Generate PPT
                  </button>
                  {pptJson && <PPTPreview pptJson={pptJson} />}
                  {pptJson && (
                    <button onClick={handleExportPPT} className={`w-full p-3 bg-${currentTheme.secondary} dark:bg-${DARK_THEME.secondary} text-white rounded-lg flex items-center justify-center gap-2 hover:opacity-90`}>
                      <Download className="w-5 h-5" /> Export PPT
                    </button>
                  )}
                </motion.div>
              )}
              {step === 6 && <HistoryList histories={history} onSelect={(hist) => {
                setDocumentId(hist._id);
                setExtractedText(hist.extractedText);
                setPptJson(hist.pptJson);
                setStep(5);
              }} />}
            </>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
};

export default DocumentConverter;