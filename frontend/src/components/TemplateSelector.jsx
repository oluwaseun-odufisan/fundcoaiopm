// src/components/TemplateSelector.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Upload, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const TemplateSelector = ({ onSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/files`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: { tags: JSON.stringify(['template']), type: 'pdf,jpg,jpeg,png' }
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

  const handleConfirm = () => {
    if (!selected) return toast.error('Please select a template.');
    onSelect(selected);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2"><ImageIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Select PPT Template</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">Upload a new template or choose from existing ones for your PPT design.</p>
      <div className="space-y-2">
        <input 
          type="file" 
          accept="image/*,.pdf" 
          onChange={e => setTemplateFile(e.target.files[0])} 
          className="w-full p-3 border rounded-lg bg-transparent" 
        />
        <button
          onClick={handleTemplateUpload}
          disabled={isUploading || !templateFile}
          className="w-full p-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-60"
        >
          {isUploading ? <Loader2 className="animate-spin w-5 h-5" /> : <Upload className="w-5 h-5" />} Upload New Template
        </button>
      </div>
      <h3 className="text-lg font-semibold mt-6">Existing Templates</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
        {templates.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">No templates uploaded yet.</p>
        ) : (
          templates.map(t => (
            <div
              key={t._id}
              onClick={() => setSelected(t._id)}
              className={`p-3 border rounded-lg cursor-pointer flex items-center gap-3 transition-all ${selected === t._id ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 dark:border-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="flex-1 truncate">{t.fileName}</span>
              {selected === t._id && <Check className="w-5 h-5 text-green-500 dark:text-green-400" />}
            </div>
          ))
        )}
      </div>
      <button
        onClick={handleConfirm}
        disabled={!selected}
        className="w-full p-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-60 mt-4"
      >
        <Check className="w-5 h-5" /> Confirm Selection & Proceed
      </button>
    </motion.div>
  );
};

export default TemplateSelector;