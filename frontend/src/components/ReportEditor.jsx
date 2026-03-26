// src/components/ReportEditor.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Download, Save, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

const ReportEditor = ({ user, tasks }) => {
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Clean Markdown symbols from AI-generated reports (asterisks, hashes, etc.)
  const cleanMarkdownForPDF = (text) => {
    return text
      .replace(/^#{1,6}\s*/gm, '')                    // Remove headings (#, ##, etc.)
      .replace(/\*\*(.*?)\*\*/g, '$1')                // Remove bold **
      .replace(/\*(.*?)\*/g, '$1')                    // Remove italic *
      .replace(/^\s*[-*+]\s+/gm, '• ')                // Convert bullets to •
      .replace(/^\s*\d+\.\s+/gm, '')                  // Remove numbered lists
      .replace(/`([^`]+)`/g, '$1')                    // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')        // Remove links
      .replace(/\n{3,}/g, '\n\n')                     // Normalize excessive newlines
      .trim();
  };

  const handleSaveDraft = async () => {
    if (!title.trim() || !content.trim()) {
      return toast.error('Title and content are required');
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('reportType', reportType);
    formData.append('periodStart', startDate || new Date().toISOString().split('T')[0]);
    formData.append('periodEnd', endDate || new Date().toISOString().split('T')[0]);
    formData.append('content', content);
    formData.append('aiGenerated', false);

    attachments.forEach((file) => formData.append('attachments', file));

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/reports`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Report saved as draft successfully! Check Report History.');
      setTitle('');
      setContent('');
      setAttachments([]);
    } catch (err) {
      console.error('Save draft error:', err);
      toast.error(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!content.trim()) return toast.error('Write some content before exporting');

    setIsExporting(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'letter',
      });

      const margin = 1;
      const pageWidth = doc.internal.pageSize.getWidth();
      const printableWidth = pageWidth - 2 * margin;
      let y = margin + 0.6;

      const addText = (text, fontSize, isBold = false, lineSpacing = 1.15) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, printableWidth);
        lines.forEach((line) => {
          if (y > 10) {
            doc.addPage();
            y = margin + 0.6;
          }
          doc.text(line, margin, y);
          y += (fontSize / 72) * lineSpacing;
        });
      };

      // Clean content (removes *, #, ** from AI reports)
      const cleanContent = cleanMarkdownForPDF(content);

      // Title
      addText(title || 'Progress Report', 18, true, 1.6);
      y += 0.4;

      // Date & Type
      addText(
        `${reportType.toUpperCase()} Report • ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`,
        12,
        false,
        1.2
      );
      y += 0.6;

      // Main content (clean paragraphs)
      const paragraphs = cleanContent
        .split('\n\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      paragraphs.forEach((paragraph) => {
        addText(paragraph, 12, false, 1.2);
        y += 0.3;
      });

      // Images
      if (attachments.length > 0) {
        y += 0.4;
        for (const file of attachments) {
          if (file.type.startsWith('image/')) {
            if (y > 9) {
              doc.addPage();
              y = margin + 0.6;
            }
            const base64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(file);
            });
            doc.addImage(base64, 'PNG', margin, y, printableWidth, 0);
            y += 3.5;
          }
        }
      }

      doc.save(`${(title || 'report').replace(/[^a-z0-9]/gi, '_')}.pdf`);
      toast.success('Clean, professional PDF exported!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-blue-100 dark:border-gray-700"
    >
      <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-6 flex items-center gap-3">
        <FileText className="w-7 h-7" />
        Manual Report Editor
      </h2>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Report Title (e.g. Weekly Progress Report)"
        className="w-full text-2xl font-semibold bg-transparent border-b border-blue-200 dark:border-gray-600 focus:border-blue-500 outline-none pb-3 mb-8"
      />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="p-4 rounded-2xl border border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="p-4 rounded-2xl border border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-700"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="p-4 rounded-2xl border border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-700"
        />
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your report here... Be detailed about what you completed and what is still pending."
        className="w-full h-96 p-6 text-lg resize-y border border-blue-200 dark:border-gray-600 rounded-3xl focus:ring-2 focus:ring-blue-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      />

      <div className="mt-8">
        <label className="flex items-center gap-2 text-blue-600 dark:text-blue-400 cursor-pointer mb-4">
          <Upload className="w-5 h-5" />
          <span className="font-medium">Attach Images / Files</span>
          <input type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
        </label>

        <div className="flex flex-wrap gap-4">
          {attachments.map((file, i) => (
            <div key={i} className="relative group border border-gray-200 dark:border-gray-600 rounded-2xl overflow-hidden">
              {file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(file)} alt="" className="w-24 h-24 object-cover" />
              ) : (
                <div className="w-24 h-24 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
              )}
              <button
                onClick={() => removeAttachment(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mt-10">
        <button
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? 'Saving Draft...' : 'Save as Draft'}
        </button>

        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all"
        >
          {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {isExporting ? 'Exporting PDF...' : 'Export as PDF'}
        </button>
      </div>
    </motion.div>
  );
};

export default ReportEditor;