// src/pages/DocumentConverter.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  Upload, FileText, Zap, Edit2, Image as ImageIcon, Eye, History as HistoryIcon,
  ArrowLeft, Sun, Moon, Loader2, Download, ChevronRight, ChevronLeft, AlertCircle, Plus
} from 'lucide-react';
import DocumentUpload from '../components/DocumentUpload';
import AIExtractionPanel from '../components/AIExtractionPanel';
import ExtractedTextEditor from '../components/ExtractedTextEditor';
import TemplateSelector from '../components/TemplateSelector';
import EditablePPTPreview from '../components/EditablePPTPreview';
import HistoryList from '../components/HistoryList';

// Professional Palette with dark mode
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
  const [step, setStep] = useState(1); // 1: Upload/Select, 2: Raw Extract, 3: Edit Full Text, 4: Meaningful Prompt, 5: Edit Meaningful, 6: Select Template, 7: Editable Preview & Save
  const [documentId, setDocumentId] = useState(null);
  const [fullText, setFullText] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [pptJson, setPptJson] = useState(null);
  const [templateId, setTemplateId] = useState(null);
  const [extractionPrompt, setExtractionPrompt] = useState('Extract key points, summaries, headings, tables, and meaningful insights from the full text.');
  const [pptPrompt, setPptPrompt] = useState('Generate a professional 10-20 page PPT summarizing the key points, with clear titles, bullets, and logical flow.');
  const [fileId, setFileId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConvertModal, setShowConvertModal] = useState(false);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/documents/history`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setHistory(res.data.histories || []);
    } catch (error) {
      toast.error('Failed to load history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDocumentReady = () => {
    setShowConvertModal(true);
  };

  const handleConfirmConvert = (convert) => {
    setShowConvertModal(false);
    if (convert) {
      handleRawExtract();
    } else {
      setStep(3);
    }
  };

  const handleSelectExisting = async (hist) => {
    setDocumentId(hist._id);
    setFileId(hist.originalFileId._id);
    setFullText(hist.fullText || '');
    setExtractedText(hist.extractedText || '');
    setPptJson(hist.pptJson || null);
    setTemplateId(hist.templateFileId?._id || null);
    setErrorMessage('');
    handleDocumentReady(); // Show modal
    toast.success('Selected existing document!');
  };

  const handleUploadSuccess = async (uploadedFileId) => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/documents`, { fileId: uploadedFileId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDocumentId(res.data.document._id);
      setFileId(uploadedFileId);
      fetchHistory(); // Refresh history
      toast.success('PDF uploaded successfully!');
      handleDocumentReady(); // Show modal after upload
    } catch (error) {
      toast.error('Failed to initialize document.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRawExtract = async () => {
    if (!documentId) return toast.error('No document selected.');
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/documents/raw-extract`, { documentId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.fullText.trim() === '') {
        setErrorMessage('No text extracted. The PDF may be scanned or image-based. Please use an OCR tool to make it searchable and re-upload.');
        toast.warning('Empty extraction - check error message.');
        setFullText('');
      } else {
        setFullText(res.data.fullText);
        setStep(3);
        toast.success('Full PDF text extracted successfully!');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Raw extraction failed. Please try again or check if PDF is searchable.');
      toast.error('Raw extraction failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFullText = (editedText) => {
    setFullText(editedText);
    setStep(4);
    toast.success('Full text saved! Proceed to meaningful extraction.');
  };

  const handleMeaningfulExtract = async () => {
    if (!documentId) return toast.error('No document selected.');
    if (!fullText.trim()) return toast.error('No full text available. Perform raw extraction first.');
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/documents/extract`, { documentId, prompt: extractionPrompt }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setExtractedText(res.data.extractedText);
      setStep(5);
      toast.success('Meaningful content extracted!');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Meaningful extraction failed.');
      toast.error('Meaningful extraction failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveExtracted = (editedText) => {
    setExtractedText(editedText);
    setStep(6);
    toast.success('Meaningful text saved! Select template.');
  };

  const handleTemplateSelect = (selectedTemplateId) => {
    setTemplateId(selectedTemplateId);
    setStep(7);
    toast.success('Template selected! Generate and adjust PPT.');
  };

  const handleGeneratePPT = async () => {
    if (!documentId) return toast.error('No document selected.');
    if (!extractedText.trim()) return toast.error('No meaningful text available. Perform extraction first.');
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/documents/generate-ppt`, { documentId, prompt: pptPrompt, templateId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPptJson(res.data.pptJson);
      toast.success('PPT generated! Adjust and save.');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'PPT generation failed.');
      toast.error('PPT generation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPPT = () => {
    if (!pptJson) return toast.error('No PPT to save.');
    import('pptxgenjs').then(PptxGenJS => {
      const pptx = new PptxGenJS.default();
      pptJson.slides.forEach((slide) => {
        const s = pptx.addSlide();
        s.addText(slide.title, { x: 0.5, y: 0.5, fontSize: 24, bold: true, color: '363636' });
        s.addText(slide.content, { x: 0.5, y: 1.5, fontSize: 18, color: '363636' });
      });
      pptx.writeFile({ fileName: 'generated_presentation.pptx' });
      toast.success('PPT saved and exported!');
    }).catch(error => {
      toast.error('Save failed.');
      console.error(error);
    });
  };

  const stepConfig = [
    { id: 1, icon: Upload, title: 'Upload / Select PDF' },
    { id: 2, icon: FileText, title: 'Raw PDF Extraction' },
    { id: 3, icon: Edit2, title: 'Edit Full Text' },
    { id: 4, icon: Zap, title: 'Meaningful Extraction Prompt' },
    { id: 5, icon: Edit2, title: 'Edit Meaningful Text' },
    { id: 6, icon: ImageIcon, title: 'Select Template' },
    { id: 7, icon: Eye, title: 'Preview & Adjust PPT' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen ${currentTheme.bg} flex flex-col p-6`}
    >
      <Toaster position="top-right" />
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <FileText className={`w-8 h-8 text-${currentTheme.primary}`} />
          <div>
            <h1 className={`text-2xl font-bold ${currentTheme.text}`}>Document Converter & PPT Generator</h1>
            <p className={`text-sm ${currentTheme.subText}`}>Upload PDF, extract full text, edit, extract meaningful content, generate PPT.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button onClick={() => navigate(-1)} className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${currentTheme.text}`}>
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        </div>
      </header>
      <nav className="flex flex-wrap gap-2 mb-8">
        {stepConfig.map(s => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${step === s.id ? `bg-${currentTheme.primary} text-white` : `bg-${currentTheme.cardBg} hover:bg-gray-200 dark:hover:bg-gray-700`}`}
          >
            <s.icon className="w-5 h-5" /> {s.title}
          </button>
        ))}
      </nav>
      <main className={`flex-1 ${currentTheme.cardBg} rounded-2xl p-6 shadow-lg`}>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              <p className="mt-4 text-lg">Processing...</p>
            </motion.div>
          ) : (
            <>
              {step === 1 && <DocumentUpload onSuccess={handleUploadSuccess} history={history} onSelectExisting={handleSelectExisting} />}
              {step === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Raw PDF Extraction</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click to convert the entire PDF to text using AI. This is required for further processing.</p>
                  <button
                    onClick={handleRawExtract}
                    className={`w-full p-3 bg-${currentTheme.primary} text-white rounded-lg flex items-center justify-center gap-2 hover:bg-${currentTheme.primary}/90`}
                  >
                    <FileText className="w-5 h-5" /> Convert PDF to Full Text
                  </button>
                  {errorMessage && (
                    <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-500 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
                    </div>
                  )}
                </motion.div>
              )}
              {step === 3 && <ExtractedTextEditor initialText={fullText} onSave={handleSaveFullText} title="Edit Full PDF Text" />}
              {step === 4 && <AIExtractionPanel onExtract={handleMeaningfulExtract} prompt={extractionPrompt} setPrompt={setExtractionPrompt} />}
              {step === 5 && <ExtractedTextEditor initialText={extractedText} onSave={handleSaveExtracted} title="Edit Meaningful Extracted Text" />}
              {step === 6 && <TemplateSelector onSelect={handleTemplateSelect} />}
              {step === 7 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h2 className="text-xl font-bold flex items-center gap-2"><Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Preview & Adjust PPT</h2>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${currentTheme.text}`}>PPT Generation Prompt (Re-generate if needed)</label>
                    <textarea
                      value={pptPrompt}
                      onChange={e => setPptPrompt(e.target.value)}
                      className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-transparent resize-none"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={handleGeneratePPT} className={`flex-1 p-3 bg-${currentTheme.primary} text-white rounded-lg flex items-center justify-center gap-2 hover:bg-${currentTheme.primary}/90`}>
                      <Plus className="w-5 h-5" /> Generate / Re-generate PPT
                    </button>
                    <button onClick={handleExportPPT} disabled={!pptJson} className={`flex-1 p-3 bg-${currentTheme.secondary} text-white rounded-lg flex items-center justify-center gap-2 hover:bg-${currentTheme.secondary}/90 disabled:opacity-50`}>
                      <Save className="w-5 h-5" /> Save & Export PPT
                    </button>
                  </div>
                  {pptJson ? (
                    <EditablePPTPreview pptJson={pptJson} setPptJson={setPptJson} />
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400">Generate PPT to preview and adjust.</p>
                  )}
                  {errorMessage && (
                    <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-500 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </main>
      {showConvertModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${currentTheme.cardBg} p-6 rounded-lg shadow-xl max-w-sm w-full`}
          >
            <h3 className="text-lg font-bold mb-4">Convert PDF to Text?</h3>
            <p className="text-sm mb-6">Do you want to convert this PDF to full text using Grok AI? This is recommended for extraction.</p>
            <div className="flex gap-4">
              <button onClick={() => handleConfirmConvert(true)} className={`flex-1 p-2 bg-${currentTheme.primary} text-white rounded hover:bg-${currentTheme.primary}/90`}>
                Yes, Convert
              </button>
              <button onClick={() => handleConfirmConvert(false)} className={`flex-1 p-2 bg-gray-500 text-white rounded hover:bg-gray-600`}>
                No, Skip
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DocumentConverter;