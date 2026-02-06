import React, { useState, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Save, Upload, Download, Trash2, BarChart, Clock, Trophy, PieChart, TrendingUp, Calendar, Send, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
const GenerateReport = () => {
    const { user, tasks } = useOutletContext();
    const [reportContent, setReportContent] = useState('');
    const [attachedImages, setAttachedImages] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [periodFilter, setPeriodFilter] = useState('monthly');
    const fileInputRef = useRef(null);
    const reportPreviewRef = useRef(null);
    // Filter tasks by period
    const filteredTasks = useMemo(() => {
        const now = new Date();
        let startDate = new Date();
        if (periodFilter === 'daily') {
            startDate.setHours(0, 0, 0, 0);
        } else if (periodFilter === 'weekly') {
            startDate.setDate(now.getDate() - 7);
        } else {
            startDate.setDate(now.getDate() - 30);
        }
        return tasks.filter((task) => {
            const taskDate = task.createdAt ? new Date(task.createdAt) : new Date();
            return taskDate >= startDate && taskDate <= now;
        });
    }, [tasks, periodFilter]);
    // Metrics calculation
    const stats = useMemo(() => {
        const completedTasks = filteredTasks.filter(
            (task) => task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes')
        ).length;
        const totalCount = filteredTasks.length;
        const pendingCount = totalCount - completedTasks;
        const completionPercentage = totalCount ? Math.round((completedTasks / totalCount) * 100) : 0;
        const highPriorityCompleted = filteredTasks.filter(
            (task) =>
                (task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes')) &&
                task.priority?.toLowerCase() === 'high'
        ).length;
        const productivityScore = Math.min(100, completionPercentage + highPriorityCompleted * 5);
        const overdueCount = filteredTasks.filter((task) => task.dueDate && !task.completed && new Date(task.dueDate) < new Date()).length;
        return {
            totalCount,
            completedTasks,
            pendingCount,
            completionPercentage,
            productivityScore,
            overdueCount,
        };
    }, [filteredTasks]);
    // Handle image attachment
    const handleImageAttach = (e) => {
        const files = Array.from(e.target.files);
        const validImages = files.filter((file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024); // 5MB limit
        if (validImages.length + attachedImages.length > 5) {
            alert('You can attach up to 5 images.');
            return;
        }
        const newImages = validImages.map((file) => ({
            file,
            url: URL.createObjectURL(file),
            name: file.name,
        }));
        setAttachedImages([...attachedImages, ...newImages]);
        e.target.value = '';
    };
    // Remove attached image
    const removeImage = (index) => {
        const updatedImages = attachedImages.filter((_, i) => i !== index);
        if (attachedImages[index].url) URL.revokeObjectURL(attachedImages[index].url);
        setAttachedImages(updatedImages);
    };
    // Clear report content and images
    const clearReport = () => {
        setReportContent('');
        attachedImages.forEach((image) => image.url && URL.revokeObjectURL(image.url));
        setAttachedImages([]);
    };
    // Save report (simulated)
    const saveReport = async () => {
        try {
            setIsSaving(true);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            alert('Report saved successfully!');
        } catch (error) {
            console.error('Error saving report:', error);
            alert('Error saving report. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };
    // Submit report (simulated)
    const submitReport = async () => {
        try {
            setIsSubmitting(true);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            alert('Report submitted successfully!');
        } catch (error) {
            console.error('Error submitting report:', error);
            alert('Error submitting report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };
    // Export report to PDF
    const exportToPDF = async () => {
        try {
            setIsExporting(true);
            const preview = reportPreviewRef.current;
            if (!preview) throw new Error('Report preview not found');
            const tempContainer = document.createElement('div');
            tempContainer.style.width = '210mm';
            tempContainer.style.padding = '20mm';
            tempContainer.style.backgroundColor = '#fff';
            tempContainer.style.fontFamily = 'Helvetica, Arial, sans-serif';
            tempContainer.style.fontSize = '12px';
            tempContainer.style.lineHeight = '1.7';
            tempContainer.style.color = '#000';
            document.body.appendChild(tempContainer);
            const header = document.createElement('div');
            header.style.fontSize = '18px';
            header.style.fontWeight = 'bold';
            header.style.marginBottom = '15px';
            header.textContent = `Performance Report - ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
            tempContainer.appendChild(header);
            const contentDiv = document.createElement('div');
            contentDiv.style.marginBottom = '20px';
            contentDiv.innerHTML = reportContent.replace(/\n/g, '<br>');
            tempContainer.appendChild(contentDiv);
            if (attachedImages.length) {
                const imagesDiv = document.createElement('div');
                imagesDiv.style.marginTop = '20px';
                for (const image of attachedImages) {
                    const img = document.createElement('img');
                    img.src = image.url;
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.style.marginBottom = '8px';
                    img.style.borderRadius = '4px';
                    imagesDiv.appendChild(img);
                    const caption = document.createElement('div');
                    caption.textContent = image.name;
                    caption.style.fontStyle = 'italic';
                    caption.style.fontSize = '11px';
                    caption.style.textAlign = 'center';
                    caption.style.marginBottom = '15px';
                    caption.style.color = '#555';
                    imagesDiv.appendChild(caption);
                }
                tempContainer.appendChild(imagesDiv);
            }
            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#fff',
            });
            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 180;
            const pageHeight = 277;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 10;
            pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight, undefined, 'FAST');
                heightLeft -= pageHeight;
            }
            pdf.save(`report_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.removeChild(tempContainer);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error exporting PDF.');
        } finally {
            setIsExporting(false);
        }
    };
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans antialiased"
        >
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6 shadow-sm sticky top-0 z-20"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <BarChart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Generate Report</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Analyze performance and export reports</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <img
                            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=1e40af&color=fff&bold=true`}
                            alt="User Avatar"
                            className="w-11 h-11 rounded-full border-2 border-blue-100 dark:border-blue-900 shadow-sm"
                        />
                    </div>
                </div>
            </motion.div>
            {/* Main Content */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Metrics Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-7 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
                                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                Performance Metrics
                            </h2>
                            <select
                                value={periodFilter}
                                onChange={(e) => setPeriodFilter(e.target.value)}
                                className="px-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                                aria-label="Period filter"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div className="space-y-4 mb-6">
                            {[
                                { label: 'Total Tasks', value: stats.totalCount, icon: PieChart, color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-700' },
                                { label: 'Completed', value: stats.completedTasks, icon: Trophy, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
                                { label: 'Pending', value: stats.pendingCount, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
                                { label: 'Overdue', value: stats.overdueCount, icon: Clock, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
                                { label: 'Completion Rate', value: `${stats.completionPercentage}%`, icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
                                { label: 'Productivity Score', value: `${stats.productivityScore}%`, icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
                            ].map(({ label, value, icon: Icon, color, bg }, idx) => (
                                <motion.div
                                    key={`metric-${idx}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 * idx }}
                                    className={`flex items-center justify-between p-4 rounded-xl ${bg} border border-gray-200 dark:border-gray-600 hover:shadow-sm transition-all duration-200`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-lg ${bg}`}>
                                            <Icon className={`w-5 h-5 ${color}`} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                                    </div>
                                    <span className={`text-lg font-bold ${color}`}>{value}</span>
                                </motion.div>
                            ))}
                        </div>
                        <div className="mt-auto">
                            <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2.5 mb-3">
                                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                Recent Tasks
                            </h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                                {filteredTasks.slice(0, 5).map((task, idx) => (
                                    <motion.div
                                        key={task._id || `task-${idx}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.05 * idx }}
                                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                                    >
                                        <p className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">{task.title || 'Untitled'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'} • {task.priority || 'None'} •{' '}
                                            <span className={task.completed ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                                                {task.completed ? 'Completed' : 'Pending'}
                                            </span>
                                        </p>
                                    </motion.div>
                                ))}
                                {!filteredTasks.length && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No tasks in this period.</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                    {/* Report Editor */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-7 flex flex-col"
                    >
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2.5 mb-5">
                            <BarChart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            Write Your Report
                        </h2>
                        <textarea
                            value={reportContent}
                            onChange={(e) => setReportContent(e.target.value)}
                            placeholder="Start writing your detailed performance report..."
                            className="flex-1 w-full p-5 text-base text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800"
                            aria-label="Report content"
                        />
                        {/* Action Buttons */}
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2.5 px-5 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 cursor-pointer transition-all duration-200 hover:shadow-md text-sm font-medium">
                                <Upload className="w-5 h-5" />
                                Attach Images
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    ref={fileInputRef}
                                    onChange={handleImageAttach}
                                    className="hidden"
                                    aria-label="Attach images"
                                />
                            </label>
                            <button
                                onClick={saveReport}
                                disabled={isSaving || isExporting || isSubmitting || !reportContent.trim()}
                                className="flex items-center gap-2.5 px-5 py-2.5 bg-amber-600 dark:bg-amber-700 text-white rounded-xl hover:bg-amber-700 dark:hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md text-sm font-medium"
                                aria-label="Save report"
                            >
                                <Save className="w-5 h-5" />
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={exportToPDF}
                                disabled={isSaving || isExporting || isSubmitting || !reportContent.trim()}
                                className="flex items-center gap-2.5 px-5 py-2.5 bg-indigo-600 dark:bg-indigo-700 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md text-sm font-medium"
                                aria-label="Export to PDF"
                            >
                                <Download className="w-5 h-5" />
                                {isExporting ? 'Exporting...' : 'Export PDF'}
                            </button>
                            <button
                                onClick={submitReport}
                                disabled={isSaving || isExporting || isSubmitting || !reportContent.trim()}
                                className="flex items-center gap-2.5 px-5 py-2.5 bg-green-600 dark:bg-green-700 text-white rounded-xl hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md text-sm font-medium"
                                aria-label="Submit report"
                            >
                                <Send className="w-5 h-5" />
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                            <button
                                onClick={clearReport}
                                disabled={!reportContent.trim() && !attachedImages.length}
                                className="flex items-center gap-2.5 px-5 py-2.5 bg-red-600 dark:bg-red-700 text-white rounded-xl hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md text-sm font-medium ml-auto"
                                aria-label="Clear report"
                            >
                                <Trash2 className="w-5 h-5" />
                                Clear
                            </button>
                        </div>
                        {/* Attached Images Grid */}
                        <AnimatePresence>
                            {attachedImages.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                                >
                                    {attachedImages.map((image, idx) => (
                                        <motion.div
                                            key={`image-${idx}`}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200"
                                        >
                                            <img
                                                src={image.url}
                                                alt={image.name}
                                                className="w-full h-32 object-cover"
                                                loading="lazy"
                                            />
                                            <button
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-red-600 dark:text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm hover:bg-white dark:hover:bg-gray-700"
                                                aria-label={`Remove ${image.name}`}
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate px-2 py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">{image.name}</p>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
            {/* Hidden PDF Preview */}
            <div className="hidden" ref={reportPreviewRef}>
                <div className="p-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 font-sans">
                    <h1 className="text-2xl font-bold mb-6">Performance Report</h1>
                    <div className="text-justify whitespace-pre-wrap leading-relaxed">{reportContent}</div>
                    {attachedImages.map((image, idx) => (
                        <div key={`preview-image-${idx}`} className="mt-6 page-break-avoid">
                            <img src={image.url} alt={image.name} className="max-w-full h-auto rounded" />
                            <p className="text-center italic text-sm mt-2 text-gray-600 dark:text-gray-400">{image.name}</p>
                        </div>
                    ))}
                </div>
            </div>
            {/* Custom Scrollbar */}
            <style jsx>{`
                .scrollbar-thin {
                    scrollbar-width: thin;
                }
                .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 9999px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </motion.div>
    );
};
export default GenerateReport;