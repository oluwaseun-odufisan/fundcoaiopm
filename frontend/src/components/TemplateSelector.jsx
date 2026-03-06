// src/components/TemplateSelector.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Upload, Check, Loader2, FileText, Eye, Plus, Trash2, Edit2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import EditablePPTPreview from './EditablePPTPreview'; // Import for preview/edit

const TemplateSelector = ({ onSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [extractedTemplateJson, setExtractedTemplateJson] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [cleanedJson, setCleanedJson] = useState(null); // For cleaned template
  const [isCleaning, setIsCleaning] = useState(false);
  const fetchTemplates = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/files`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: { tags: JSON.stringify(['template']), type: 'pdf,jpg,jpeg,png,ppt,pptx' }
      });
      setTemplates(res.data.files || []);
    } catch (error) {
      toast.error('Failed to load templates.');
    }
  };
  useEffect(() => {
    fetchTemplates();
  }, []);
  const handleTemplateUpload = async () => {
    if (!templateFile) return toast.error('Select a file.');
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', templateFile);
      formData.append('tags', JSON.stringify(['template']));
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/files/pinFileToIPFS`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        await fetchTemplates();
        toast.success('Template uploaded successfully!');
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setTemplateFile(null);
    }
  };
  const handleSelect = (template) => {
    setSelected(template._id);
    setExtractedTemplateJson(null);
    setCleanedJson(null);
    const url = `https://gateway.pinata.cloud/ipfs/${template.cid}`;
    setPreviewUrl(url);
    setPreviewType(template.type);
    toast.success('Template selected! Preview below.');
  };
  const handleExtractStructure = async () => {
    if (!selected) return toast.error('Select a template first.');
    setIsExtracting(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/documents/extract-template-structure`, { templateId: selected }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setExtractedTemplateJson(res.data.extractedJson);
      toast.success('Template structure extracted! View and clean below.');
    } catch (error) {
      toast.error('Failed to extract template structure.');
    } finally {
      setIsExtracting(false);
    }
  };
  const handleCleanTemplate = async () => {
    if (!extractedTemplateJson) return toast.error('Extract structure first.');
    setIsCleaning(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/documents/clean-template`, { templateId: selected }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCleanedJson(res.data.cleanedJson);
      toast.success('Template cleaned successfully! All texts cleared.');
    } catch (error) {
      toast.error('Failed to clean template.');
    } finally {
      setIsCleaning(false);
    }
  };
  const handleCreatePPT = () => {
    if (!cleanedJson) return toast.error('Clean the template first.');
    onSelect({ templateId: selected, cleanedJson });
  };
  const renderPreview = () => {
    if (!previewUrl) return <p className="text-center text-gray-600 dark:text-gray-400">Select a template to preview.</p>;
    if (previewType.startsWith('image/')) {
      return <img src={previewUrl} alt="Template preview" className="max-w-full h-auto rounded-lg shadow-md" />;
    } else if (previewType === 'pdf') {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-96 border border-blue-200/50 dark:border-gray-700/50 rounded-lg"
          title="PDF Preview"
        />
      );
    } else if (previewType === 'ppt' || previewType === 'pptx') {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-white/95 dark:bg-gray-800/95 border border-blue-200/50 dark:border-gray-700/50 rounded-lg shadow-sm">
          <FileText className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">PPT/PPTX preview not supported in browser.</p>
          <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">Extract structure to view and edit slides.</p>
          <a href={previewUrl} download className="mt-4 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg flex items-center gap-1 hover:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-200">
            <Download className="w-4 h-4" /> Download Original
          </a>
        </div>
      );
    }
    return <p className="text-center text-gray-600 dark:text-gray-400">Preview not available for this file type.</p>;
  };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><ImageIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Select PPT Template</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">Upload a new template (image, PDF, PPT/PPTX) or choose from existing ones. Preview, clean, and create PPT.</p>
      <div className="space-y-4">
        <input
          type="file"
          accept="image/*,.pdf,.ppt,.pptx"
          onChange={e => setTemplateFile(e.target.files[0])}
          className="w-full bg-white dark:bg-gray-700 border border-blue-300/50 dark:border-gray-600/50 rounded-lg px-4 py-3 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition-all duration-200"
        />
        <button
          onClick={handleTemplateUpload}
          disabled={isUploading || !templateFile}
          className="w-full px-4 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-200 disabled:opacity-60"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />} Upload New Template
        </button>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6">Existing Templates</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
        {templates.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">No templates uploaded yet.</p>
        ) : (
          templates.map(t => (
            <div
              key={t._id}
              onClick={() => handleSelect(t)}
              className={`bg-white/95 dark:bg-gray-800/95 border border-blue-200/50 dark:border-gray-700/50 rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:shadow-md transition-all duration-200 ${selected === t._id ? 'bg-blue-100/50 dark:bg-blue-900/50 border-blue-500/50 dark:border-blue-400/50' : ''}`}
            >
              <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="flex-1 text-gray-900 dark:text-gray-100 truncate">{t.fileName}</span>
              {selected === t._id && <Check className="w-5 h-5 text-green-600 dark:text-green-400" />}
            </div>
          ))
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6">Template Preview & Edit</h3>
      <div className="bg-white/95 dark:bg-gray-800/95 border border-blue-200/50 dark:border-gray-700/50 rounded-xl p-4 min-h-[400px] flex items-center justify-center shadow-sm">
        {renderPreview()}
      </div>
      {selected && (
        <div className="space-y-4 mt-6">
          <button
            onClick={handleExtractStructure}
            disabled={isExtracting}
            className="w-full px-4 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-200 disabled:opacity-60"
          >
            {isExtracting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Edit2 className="w-5 h-5" />} Extract & Load Structure
          </button>
          {extractedTemplateJson && (
            <>
              <EditablePPTPreview pptJson={{ slides: extractedTemplateJson.slides }} setPptJson={(newJson) => setExtractedTemplateJson({ ...extractedTemplateJson, slides: newJson.slides })} templateStyles={extractedTemplateJson.templateStyles || {}} />
              <button
                onClick={handleCleanTemplate}
                disabled={isCleaning}
                className="w-full px-4 py-3 bg-green-500 dark:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 dark:hover:bg-green-500 transition-all duration-200 disabled:opacity-60"
              >
                {isCleaning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />} Clean All Texts
              </button>
              <button
                onClick={handleCreatePPT}
                className="w-full px-4 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-200"
              >
                <Plus className="w-5 h-5" /> Use This Template for PPT
              </button>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
};
export default TemplateSelector;