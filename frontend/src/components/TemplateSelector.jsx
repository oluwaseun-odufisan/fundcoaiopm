// src/components/TemplateSelector.jsx
import React, { useState, useEffect } from 'react';
import { ImageIcon, Upload, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';

const TemplateSelector = ({ onSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchTemplates = async () => {
    try {
      // Assume fetching user's uploaded templates (filter by tags or type)
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/files`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: { tags: JSON.stringify(['template']) } // Assume tagged as 'template'
      });
      setTemplates(res.data.files);
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
        fetchTemplates();
        toast.success('Template uploaded!');
      }
    } catch (error) {
      toast.error('Upload failed.');
    } finally {
      setIsUploading(false);
      setTemplateFile(null);
    }
  };

  const handleConfirm = () => {
    if (!selected) return toast.error('Select a template.');
    onSelect(selected);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2"><ImageIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Select PPT Template</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">Upload or choose a design template for your PPT.</p>
      <div className="space-y-2">
        <input type="file" accept="image/*,.pdf" onChange={e => setTemplateFile(e.target.files[0])} className="w-full p-3 border rounded-lg bg-transparent" />
        <button
          onClick={handleTemplateUpload}
          disabled={isUploading || !templateFile}
          className="w-full p-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-60"
        >
          {isUploading ? <Loader2 className="animate-spin" /> : <Upload />} Upload New Template
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin">
        {templates.map(t => (
          <div
            key={t._id}
            onClick={() => setSelected(t._id)}
            className={`p-3 border rounded-lg cursor-pointer flex items-center gap-3 ${selected === t._id ? 'bg-blue-100 dark:bg-blue-900 border-blue-500' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <ImageIcon className="w-5 h-5" />
            <span>{t.fileName}</span>
            {selected === t._id && <Check className="ml-auto text-green-500" />}
          </div>
        ))}
      </div>
      <button
        onClick={handleConfirm}
        className="w-full p-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-600"
      >
        <Check /> Confirm & Proceed
      </button>
    </motion.div>
  );
};

export default TemplateSelector;