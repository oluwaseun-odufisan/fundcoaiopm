import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';

const DocumentUpload = ({ onSuccess }) => {
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2"><Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Upload PDF Document</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">Select a PDF to convert and generate PPT from.</p>
      <input type="file" accept=".pdf" onChange={handleFileChange} className="w-full p-3 border rounded-lg bg-transparent" />
      <button
        onClick={handleUpload}
        disabled={isUploading || !file}
        className="w-full p-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-60"
      >
        {isUploading ? <Loader2 className="animate-spin" /> : <Upload />} Upload PDF
      </button>
      {file && <p className="text-sm text-gray-600 dark:text-gray-400">Selected: {file.name}</p>}
    </motion.div>
  );
};

export default DocumentUpload;