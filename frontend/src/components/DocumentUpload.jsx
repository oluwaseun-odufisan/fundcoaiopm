// src/components/DocumentUpload.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Loader2, FileText, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { format } from 'date-fns';

const DocumentUpload = ({ onSuccess, history, onSelectExisting }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.name.endsWith('.pdf')) {
      setFile(selected);
    } else {
      toast.error('Please select a PDF file.');
    }
  };
  const handleUpload = async () => {
    if (!file) return toast.error('No file selected.');
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/files/pinFileToIPFS`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        onSuccess(res.data.files[0]._id);
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <motion.div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Upload or Select PDF</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">Upload a new PDF or select from history. A modal will ask to convert to text after.</p>
      <div className="space-y-4">
        <input type="file" accept=".pdf" onChange={handleFileChange} className="w-full bg-white dark:bg-gray-700 border border-blue-300/50 dark:border-gray-600/50 rounded-lg px-4 py-3 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition-all duration-200" />
        <button
          onClick={handleUpload}
          disabled={isUploading || !file}
          className="w-full px-4 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-200 disabled:opacity-60"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />} Upload New PDF
        </button>
        {file && <p className="text-sm text-gray-600 dark:text-gray-400">Selected: {file.name}</p>}
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Previous PDFs</h3>
        <div className="max-h-64 overflow-y-auto space-y-3 custom-scrollbar">
          {history.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400">No previous PDFs uploaded.</p>
          ) : (
            history.map(hist => (
              <div
                key={hist._id}
                onClick={() => onSelectExisting(hist)}
                className="bg-white/95 dark:bg-gray-800/95 border border-blue-200/50 dark:border-gray-700/50 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">{hist.originalFileId.fileName}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{format(new Date(hist.createdAt), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                </div>
                <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};
export default DocumentUpload;